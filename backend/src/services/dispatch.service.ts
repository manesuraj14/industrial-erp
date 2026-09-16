import { pool } from '../config/database';

export interface ProcessDispatchInput {
  vehicleNumber: string;
  driverName: string;
}

export async function processDispatch(orderId: string, input: ProcessDispatchInput, adminUserId: string) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Lock the order row and verify CONFIRMED status
    const orderRes = await client.query(
      `SELECT * FROM sales_orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      throw { status: 404, message: 'Sales Order not found.' };
    }
    const order = orderRes.rows[0];

    if (order.status !== 'CONFIRMED') {
      throw {
        status: 400,
        message: `Cannot dispatch order with status "${order.status}". Only CONFIRMED orders can be dispatched.`,
      };
    }

    // 2. Fetch order items
    const itemsRes = await client.query(
      `SELECT product_id, quantity FROM sales_order_items WHERE sales_order_id = $1`,
      [orderId]
    );

    // 3. Generate Dispatch Number
    const countRes = await client.query(`SELECT COUNT(*) FROM dispatches`);
    const nextSeq = parseInt(countRes.rows[0].count) + 1;
    const dispatchNumber = `DSP-${new Date().getFullYear()}-${String(nextSeq).padStart(3, '0')}`;

    // 4. Create dispatch record
    const dspRes = await client.query(
      `INSERT INTO dispatches (dispatch_number, sales_order_id, vehicle_number, driver_name, processed_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [dispatchNumber, orderId, input.vehicleNumber, input.driverName, adminUserId]
    );
    const dispatch = dspRes.rows[0];

    // 5. Decrement BOTH Physical Quantity and Reserved Quantity
    for (const item of itemsRes.rows) {
      // Create dispatch item
      await client.query(
        `INSERT INTO dispatch_items (dispatch_id, product_id, quantity)
         VALUES ($1, $2, $3)`,
        [dispatch.id, item.product_id, item.quantity]
      );

      // Lock and update inventory
      const invRes = await client.query(
        `SELECT physical_quantity, reserved_quantity 
         FROM inventory 
         WHERE product_id = $1 
         FOR UPDATE`,
        [item.product_id]
      );

      if (invRes.rows.length === 0) {
        throw { status: 400, message: 'Inventory record missing.' };
      }

      const { physical_quantity, reserved_quantity } = invRes.rows[0];

      if (physical_quantity < item.quantity || reserved_quantity < item.quantity) {
        throw {
          status: 400,
          message: 'Stock discrepancy detected during dispatch: cannot dispatch beyond physical or reserved stock.',
        };
      }

      await client.query(
        `UPDATE inventory 
         SET physical_quantity = physical_quantity - $1,
             reserved_quantity = reserved_quantity - $1,
             updated_at = NOW()
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 6. Transition order status to DISPATCHED
    await client.query(
      `UPDATE sales_orders SET status = 'DISPATCHED' WHERE id = $1`,
      [orderId]
    );

    await client.query('COMMIT');
    return dispatch;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
