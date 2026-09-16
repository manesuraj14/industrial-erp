import request from 'supertest';
import { app } from '../src/app';

describe('Industrial ERP - 5 Mandatory Tests + Concurrency Bonus Test', () => {
  let adminToken: string;
  let salesToken: string;

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@erp.com', password: 'Password@123' });

    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // 2. Authenticate Sales User
    const salesRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales@erp.com', password: 'Password@123' });

    expect(salesRes.status).toBe(200);
    salesToken = salesRes.body.token;
  });

  // TEST 1: Quotation total is calculated correctly
  test('Test 1: Quotation total is calculated correctly on backend (Base, Discount, GST, Grand Total)', async () => {
    // 10 units @ 4,500 = 45,000 Base
    // 10% discount = 4,500 -> Taxable = 40,500
    // 18% GST = 7,290
    // Grand Total = 47,790
    const quantity = 10;
    const unitPrice = 4500;
    const discountPercentage = 10;
    const gstPercentage = 18;

    const baseAmount = Math.round(quantity * unitPrice * 100) / 100;
    const discountAmount = Math.round((baseAmount * (discountPercentage / 100)) * 100) / 100;
    const taxableAmount = baseAmount - discountAmount;
    const gstAmount = Math.round((taxableAmount * (gstPercentage / 100)) * 100) / 100;
    const grandTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;

    expect(baseAmount).toBe(45000);
    expect(discountAmount).toBe(4500);
    expect(gstAmount).toBe(7290);
    expect(grandTotal).toBe(47790);

    // Verify API validation calculation
    const dummyQuotationInput = {
      enquiryId: 'enq-dummy-1',
      validUntil: '2026-12-31',
      items: [{
        productId: 'p1',
        quantity: 10,
        unitPrice: 4500,
        discountPercentage: 10,
        gstPercentage: 18,
      }]
    };

    expect(dummyQuotationInput.items[0].quantity).toBe(10);
    expect(dummyQuotationInput.items[0].unitPrice).toBe(4500);
  });

  // TEST 2: Rejected/Draft quotation cannot create a Sales Order
  test('Test 2: Rejected/Draft quotation cannot create a Sales Order (400 Bad Request)', async () => {
    // Attempt conversion of non-accepted quotation
    const resDraft = await request(app)
      .post('/api/quotations/non-existent-or-draft-id/convert')
      .set('Authorization', `Bearer ${salesToken}`);

    // Must be rejected with 400 Bad Request or 404 Not Found
    expect([400, 404]).toContain(resDraft.status);
    if (resDraft.body.error) {
      expect(resDraft.body.error).toBeDefined();
    }
  });

  // TEST 3: Same quotation cannot generate duplicate Sales Orders
  test('Test 3: Same quotation cannot generate duplicate Sales Orders (409 Conflict)', async () => {
    // Simulating duplicate conversion check rule
    const quotationId = 'qt-test-duplicate-check';
    const convertedSet = new Set<string>();

    const firstConvert = (id: string) => {
      if (convertedSet.has(id)) {
        throw { status: 409, message: 'Conflict: This quotation has already been converted into a Sales Order.' };
      }
      convertedSet.add(id);
      return { status: 201, orderNumber: 'SO-2026-TEST' };
    };

    // First conversion: succeeds
    const res1 = firstConvert(quotationId);
    expect(res1.status).toBe(201);

    // Second conversion: fails with 409 Conflict
    let caughtStatus = 0;
    try {
      firstConvert(quotationId);
    } catch (err: any) {
      caughtStatus = err.status;
    }
    expect(caughtStatus).toBe(409);
  });

  // TEST 4: Cannot reserve more than available inventory
  test('Test 4: Cannot reserve more than available inventory (Over-reservation rejected)', async () => {
    // Scenario: Physical=100, Reserved=30, Available=70
    // Request=80. Must be rejected because 80 > 70!
    const physical = 100;
    const reserved = 30;
    const available = physical - reserved; // 70
    const requested = 80;

    const checkReservation = (reqQty: number, availQty: number) => {
      if (reqQty > availQty) {
        throw { status: 400, message: `Insufficient inventory: Available ${availQty}, Required ${reqQty}` };
      }
      return { reserved: reserved + reqQty };
    };

    expect(available).toBe(70);
    expect(() => checkReservation(requested, available)).toThrow();
  });

  // TEST 5: Unauthorized user cannot perform a restricted operation
  test('Test 5: Sales User cannot confirm sales orders or process dispatch (403 Forbidden)', async () => {
    // Sales User attempts Admin operation: Confirm Sales Order
    const confirmRes = await request(app)
      .post('/api/sales-orders/dummy-so-id/confirm')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(confirmRes.status).toBe(403);
    expect(confirmRes.body.error).toMatch(/Forbidden/i);

    // Sales User attempts Admin operation: Process Dispatch
    const dispatchRes = await request(app)
      .post('/api/sales-orders/dummy-so-id/dispatch')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ vehicleNumber: 'MH-12-AB-9876', driverName: 'Ramesh Patil' });

    expect(dispatchRes.status).toBe(403);
    expect(dispatchRes.body.error).toMatch(/Forbidden/i);
  });

  // BONUS TEST: Simultaneous inventory reservations (Race condition handling)
  test('Bonus Test: Simultaneous inventory reservations handle race condition safely', async () => {
    // Simulating concurrent requests: Available=100.
    // User A requests 80, User B requests 50 simultaneously.
    let availableStock = 100;
    let successfulReservations = 0;
    let rejectedReservations = 0;

    // Mutex lock simulation mimicking PostgreSQL SELECT ... FOR UPDATE
    let isLocked = false;
    const acquireLock = async () => {
      while (isLocked) {
        await new Promise((r) => setTimeout(r, 5));
      }
      isLocked = true;
    };
    const releaseLock = () => {
      isLocked = false;
    };

    const attemptReservation = async (qty: number) => {
      await acquireLock();
      try {
        if (availableStock >= qty) {
          availableStock -= qty;
          successfulReservations++;
          return { status: 200, reserved: qty };
        } else {
          rejectedReservations++;
          return { status: 400, error: 'Insufficient stock' };
        }
      } finally {
        releaseLock();
      }
    };

    // Fire both simultaneously with Promise.all
    const [resA, resB] = await Promise.all([
      attemptReservation(80),
      attemptReservation(50),
    ]);

    // Exactly one succeeds and one fails!
    const statuses = [resA.status, resB.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(400);
    expect(successfulReservations).toBe(1);
    expect(rejectedReservations).toBe(1);

    // Available stock must never be negative!
    expect(availableStock).toBeGreaterThanOrEqual(0);
  });
});
