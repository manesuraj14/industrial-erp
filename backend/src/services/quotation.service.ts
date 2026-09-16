import { pool } from '../config/database';

export interface CreateQuotationItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  gstPercentage?: number;
}

export interface CreateQuotationInput {
  enquiryId: string;
  validUntil: string;
  items: CreateQuotationItemInput[];
}

export async function createQuotation(input: CreateQuotationInput, userId: string) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch enquiry and customer
    const enqRes = await client.query(`SELECT * FROM enquiries WHERE id = $1`, [input.enquiryId]);
    if (enqRes.rows.length === 0) {
      throw { status: 404, message: 'Referenced Enquiry not found.' };
    }
    const enquiry = enqRes.rows[0];

    // 2. Perform exact backend price and tax calculation
    let totalBase = 0;
    let totalDiscount = 0;
    let totalGst = 0;
    let grandTotal = 0;

    const calculatedItems = input.items.map((it) => {
      const discountPct = it.discountPercentage ?? 0;
      const gstPct = it.gstPercentage ?? 18;

      const lineBase = Math.round(it.quantity * it.unitPrice * 100) / 100;
      const lineDiscount = Math.round((lineBase * (discountPct / 100)) * 100) / 100;
      const taxable = lineBase - lineDiscount;
      const lineGst = Math.round((taxable * (gstPct / 100)) * 100) / 100;
      const lineTotal = Math.round((taxable + lineGst) * 100) / 100;

      totalBase += lineBase;
      totalDiscount += lineDiscount;
      totalGst += lineGst;
      grandTotal += lineTotal;

      return {
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountPercentage: discountPct,
        gstPercentage: gstPct,
        lineBaseAmount: lineBase,
        lineDiscountAmount: lineDiscount,
        lineGstAmount: lineGst,
        lineTotal,
      };
    });

    totalBase = Math.round(totalBase * 100) / 100;
    totalDiscount = Math.round(totalDiscount * 100) / 100;
    totalGst = Math.round(totalGst * 100) / 100;
    grandTotal = Math.round(grandTotal * 100) / 100;

    // 3. Generate quotation number
    const countRes = await client.query(`SELECT COUNT(*) FROM quotations`);
    const nextSeq = parseInt(countRes.rows[0].count) + 1;
    const quotationNumber = `QT-${new Date().getFullYear()}-${String(nextSeq).padStart(3, '0')}`;

    // 4. Insert quotation (Starts in DRAFT)
    const qRes = await client.query(
      `INSERT INTO quotations (
        quotation_number, enquiry_id, customer_id, 
        total_base_amount, total_discount_amount, total_gst_amount, grand_total, 
        valid_until, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT', $9)
      RETURNING *`,
      [
        quotationNumber,
        enquiry.id,
        enquiry.customer_id,
        totalBase,
        totalDiscount,
        totalGst,
        grandTotal,
        input.validUntil,
        userId,
      ]
    );
    const quotation = qRes.rows[0];

    // 5. Insert quotation items
    for (const it of calculatedItems) {
      await client.query(
        `INSERT INTO quotation_items (
          quotation_id, product_id, quantity, unit_price,
          discount_percentage, gst_percentage,
          line_base_amount, line_discount_amount, line_gst_amount, line_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          quotation.id,
          it.productId,
          it.quantity,
          it.unitPrice,
          it.discountPercentage,
          it.gstPercentage,
          it.lineBaseAmount,
          it.lineDiscountAmount,
          it.lineGstAmount,
          it.lineTotal,
        ]
      );
    }

    // 6. Update enquiry status to QUOTED
    await client.query(`UPDATE enquiries SET status = 'QUOTED' WHERE id = $1`, [enquiry.id]);

    await client.query('COMMIT');
    return {
      ...quotation,
      totalBaseAmount: totalBase,
      totalDiscountAmount: totalDiscount,
      totalGstAmount: totalGst,
      grandTotal,
      items: calculatedItems,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateQuotationStatus(quotationId: string, status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED') {
  const res = await pool.query(
    `UPDATE quotations SET status = $1 WHERE id = $2 RETURNING *`,
    [status, quotationId]
  );
  if (res.rows.length === 0) {
    throw { status: 404, message: 'Quotation not found' };
  }
  return res.rows[0];
}

export async function listQuotations() {
  const res = await pool.query(`
    SELECT 
      q.*,
      c.company_name,
      c.contact_person,
      e.enquiry_number,
      EXISTS(SELECT 1 FROM sales_orders so WHERE so.quotation_id = q.id) as is_converted,
      COALESCE(
        json_agg(
          json_build_object(
            'id', qi.id,
            'productId', p.id,
            'productCode', p.product_code,
            'productName', p.product_name,
            'unit', p.unit,
            'quantity', qi.quantity,
            'unitPrice', qi.unit_price,
            'discountPercentage', qi.discount_percentage,
            'gstPercentage', qi.gst_percentage,
            'lineBaseAmount', qi.line_base_amount,
            'lineDiscountAmount', qi.line_discount_amount,
            'lineGstAmount', qi.line_gst_amount,
            'lineTotal', qi.line_total
          )
        ) FILTER (WHERE qi.id IS NOT NULL), '[]'
      ) as items
    FROM quotations q
    JOIN customers c ON q.customer_id = c.id
    JOIN enquiries e ON q.enquiry_id = e.id
    LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
    LEFT JOIN products p ON qi.product_id = p.id
    GROUP BY q.id, c.id, e.id
    ORDER BY q.created_at DESC
  `);

  return res.rows;
}
