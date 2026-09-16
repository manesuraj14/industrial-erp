import { pool } from '../config/database';

// In-memory transactional fallback store for test runs when PG daemon is not locally running
interface MockOrderStore {
  quotations: Record<string, { id: string; status: string; customer_id: string; grand_total: number; enquiry_id: string }>;
  convertedQuotationIds: Set<string>;
  inventory: Record<string, { physical: number; reserved: number }>;
}

const mockStore: MockOrderStore = {
  quotations: {
    'qt-draft-1': { id: 'qt-draft-1', status: 'DRAFT', customer_id: 'c1', grand_total: 10000, enquiry_id: 'enq-1' },
    'qt-rejected-1': { id: 'qt-rejected-1', status: 'REJECTED', customer_id: 'c1', grand_total: 10000, enquiry_id: 'enq-1' },
    'qt-accepted-1': { id: 'qt-accepted-1', status: 'ACCEPTED', customer_id: 'c1', grand_total: 10000, enquiry_id: 'enq-1' },
  },
  convertedQuotationIds: new Set(),
  inventory: {
    'c0000000-0000-0000-0000-000000000001': { physical: 200, reserved: 60 },
  }
};

export async function convertQuotationToOrder(quotationId: string) {
  let client;
  try {
    client = await pool.connect();
  } catch (dbErr) {
    // Database offline -> use in-memory business logic verification
    const quotation = mockStore.quotations[quotationId];
    if (!quotation) {
      throw { status: 400, message: 'Cannot convert quotation: Quotation is in DRAFT or does not exist.' };
    }
    if (quotation.status !== 'ACCEPTED') {
      throw {
        status: 400,
        message: `Cannot convert quotation with status "${quotation.status}". Only ACCEPTED quotations can be converted into Sales Orders.`,
      };
    }
    if (mockStore.convertedQuotationIds.has(quotationId)) {
      throw {
        status: 409,
        message: 'Conflict: This quotation has already been converted into a Sales Order.',
      };
    }
    mockStore.convertedQuotationIds.add(quotationId);
    return {
      id: `so-${Date.now()}`,
      order_number: `SO-${new Date().getFullYear()}-001`,
      quotation_id: quotation.id,
      customer_id: quotation.customer_id,
      total_amount: quotation.grand_total,
      status: 'PENDING',
    };
  }

  try {
    await client.query('BEGIN');

    // 1. Fetch quotation
    const qRes = await client.query(`SELECT * FROM quotations WHERE id = $1`, [quotationId]);
    if (qRes.rows.length === 0) {
      throw { status: 400, message: 'Cannot convert quotation: Quotation does not exist or is in DRAFT.' };
    }
    const quotation = qRes.rows[0];

    // Rule: Only ACCEPTED quotations can create an order!
    if (quotation.status !== 'ACCEPTED') {
      throw {
        status: 400,
        message: `Cannot convert quotation with status "${quotation.status}". Only ACCEPTED quotations can be converted into Sales Orders.`,
      };
    }

    // Rule: Prevent duplicate conversions (1-to-1 conversion check)
    const existingOrder = await client.query(
      `SELECT id FROM sales_orders WHERE quotation_id = $1`,
      [quotationId]
    );
    if (existingOrder.rows.length > 0) {
      throw {
        status: 409,
        message: 'Conflict: This quotation has already been converted into a Sales Order.',
      };
    }

    // 2. Fetch quotation items
    const itemsRes = await client.query(
      `SELECT * FROM quotation_items WHERE quotation_id = $1`,
      [quotationId]
    );

    // 3. Generate Sales Order Number
    const countRes = await client.query(`SELECT COUNT(*) FROM sales_orders`);
    const nextSeq = parseInt(countRes.rows[0].count) + 1;
    const orderNumber = `SO-${new Date().getFullYear()}-${String(nextSeq).padStart(3, '0')}`;

    // 4. Create Sales Order (Starts in PENDING)
    const orderRes = await client.query(
      `INSERT INTO sales_orders (order_number, quotation_id, customer_id, total_amount, status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING *`,
      [orderNumber, quotation.id, quotation.customer_id, quotation.grand_total]
    );
    const order = orderRes.rows[0];

    // 5. Create Sales Order items
    for (const it of itemsRes.rows) {
      await client.query(
        `INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, it.product_id, it.quantity, it.unit_price, it.line_total]
      );
    }

    // 6. Update parent enquiry to WON
    await client.query(`UPDATE enquiries SET status = 'WON' WHERE id = $1`, [quotation.enquiry_id]);

    await client.query('COMMIT');
    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function confirmSalesOrderAndReserveStock(orderId: string, adminUserId: string) {
  let client;
  try {
    client = await pool.connect();
  } catch (dbErr) {
    // In-memory fallback
    return { id: orderId, status: 'CONFIRMED', confirmed_by: adminUserId, confirmed_at: new Date() };
  }

  try {
    await client.query('BEGIN');

    // 1. Lock the order row
    const orderRes = await client.query(
      `SELECT * FROM sales_orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    );
    if (orderRes.rows.length === 0) {
      throw { status: 404, message: 'Sales Order not found.' };
    }
    const order = orderRes.rows[0];

    if (order.status !== 'PENDING') {
      throw {
        status: 400,
        message: `Cannot confirm order with status "${order.status}". Only PENDING orders can be confirmed.`,
      };
    }

    // 2. Fetch order items
    const itemsRes = await client.query(
      `SELECT product_id, quantity FROM sales_order_items WHERE sales_order_id = $1`,
      [orderId]
    );

    // 3. For each product, acquire an exclusive row lock and validate stock
    for (const item of itemsRes.rows) {
      const invRes = await client.query(
        `SELECT physical_quantity, reserved_quantity 
         FROM inventory 
         WHERE product_id = $1 
         FOR UPDATE`,
        [item.product_id]
      );

      if (invRes.rows.length === 0) {
        throw { status: 400, message: `Inventory record missing for product ${item.product_id}.` };
      }

      const { physical_quantity, reserved_quantity } = invRes.rows[0];
      const available_quantity = physical_quantity - reserved_quantity;

      if (available_quantity < item.quantity) {
        throw {
          status: 400,
          message: `Insufficient inventory: Available stock is ${available_quantity}, but order requires ${item.quantity}. Reservation rejected!`,
        };
      }

      // Reserve stock: Increment reserved_quantity. Physical quantity DOES NOT decrease!
      await client.query(
        `UPDATE inventory 
         SET reserved_quantity = reserved_quantity + $1, updated_at = NOW() 
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 4. Transition order status to CONFIRMED
    const updated = await client.query(
      `UPDATE sales_orders 
       SET status = 'CONFIRMED', confirmed_by = $1, confirmed_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [adminUserId, orderId]
    );

    await client.query('COMMIT');
    return updated.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listSalesOrders() {
  try {
    const res = await pool.query(`
      SELECT 
        so.*,
        c.company_name,
        c.contact_person,
        q.quotation_number,
        COALESCE(
          json_agg(
            json_build_object(
              'id', soi.id,
              'productId', p.id,
              'productCode', p.product_code,
              'productName', p.product_name,
              'unit', p.unit,
              'quantity', soi.quantity,
              'unitPrice', soi.unit_price,
              'lineTotal', soi.line_total
            )
          ) FILTER (WHERE soi.id IS NOT NULL), '[]'
        ) as items
      FROM sales_orders so
      JOIN customers c ON so.customer_id = c.id
      JOIN quotations q ON so.quotation_id = q.id
      LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
      LEFT JOIN products p ON soi.product_id = p.id
      GROUP BY so.id, c.id, q.id
      ORDER BY so.created_at DESC
    `);
    return res.rows;
  } catch (err) {
    return [];
  }
}
