import { pool } from '../config/database';

export interface CreateEnquiryInput {
  customerId?: string;
  customerData?: {
    companyName: string;
    contactPerson: string;
    mobile: string;
    email: string;
    city: string;
  };
  requiredDate: string;
  notes?: string;
  items: { productId: string; quantity: number }[];
}

export async function createCustomerAndEnquiry(input: CreateEnquiryInput, userId: string) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let customerId = input.customerId;

    // 1. Create customer if new
    if (!customerId && input.customerData) {
      const custRes = await client.query(
        `INSERT INTO customers (company_name, contact_person, mobile, email, city)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          input.customerData.companyName,
          input.customerData.contactPerson,
          input.customerData.mobile,
          input.customerData.email,
          input.customerData.city,
        ]
      );
      customerId = custRes.rows[0].id;
    }

    if (!customerId) {
      throw { status: 400, message: 'Valid customerId or customerData is required.' };
    }

    // 2. Generate enquiry number
    const countRes = await client.query(`SELECT COUNT(*) FROM enquiries`);
    const nextSeq = parseInt(countRes.rows[0].count) + 1;
    const enquiryNumber = `ENQ-${new Date().getFullYear()}-${String(nextSeq).padStart(3, '0')}`;

    // 3. Create enquiry
    const enqRes = await client.query(
      `INSERT INTO enquiries (enquiry_number, customer_id, required_date, notes, status, created_by)
       VALUES ($1, $2, $3, $4, 'NEW', $5)
       RETURNING *`,
      [enquiryNumber, customerId, input.requiredDate, input.notes || '', userId]
    );
    const enquiry = enqRes.rows[0];

    // 4. Create enquiry items
    for (const it of input.items) {
      await client.query(
        `INSERT INTO enquiry_items (enquiry_id, product_id, quantity)
         VALUES ($1, $2, $3)`,
        [enquiry.id, it.productId, it.quantity]
      );
    }

    await client.query('COMMIT');
    return enquiry;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listEnquiries() {
  const res = await pool.query(`
    SELECT 
      e.*,
      c.company_name,
      c.contact_person,
      c.mobile,
      c.email,
      c.city,
      COALESCE(
        json_agg(
          json_build_object(
            'id', ei.id,
            'productId', p.id,
            'productCode', p.product_code,
            'productName', p.product_name,
            'unit', p.unit,
            'quantity', ei.quantity
          )
        ) FILTER (WHERE ei.id IS NOT NULL), '[]'
      ) as items
    FROM enquiries e
    JOIN customers c ON e.customer_id = c.id
    LEFT JOIN enquiry_items ei ON e.id = ei.enquiry_id
    LEFT JOIN products p ON ei.product_id = p.id
    GROUP BY e.id, c.id
    ORDER BY e.created_at DESC
  `);

  return res.rows;
}
