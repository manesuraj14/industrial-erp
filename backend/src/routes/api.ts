import { Router, Response } from 'express';
import { authenticateJWT, requireRole, AuthRequest } from '../middleware/auth';
import { loginUser } from '../services/auth.service';
import { getInventorySummary } from '../services/inventory.service';
import { createCustomerAndEnquiry, listEnquiries } from '../services/enquiry.service';
import { createQuotation, updateQuotationStatus, listQuotations } from '../services/quotation.service';
import { convertQuotationToOrder, confirmSalesOrderAndReserveStock, listSalesOrders } from '../services/order.service';
import { processDispatch } from '../services/dispatch.service';

const router = Router();

// --- AUTHENTICATION ---
router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const data = await loginUser(email, password);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/auth/me', authenticateJWT, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// --- INVENTORY ---
router.get('/inventory', authenticateJWT, async (_req, res, next) => {
  try {
    const items = await getInventorySummary();
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// --- ENQUIRIES ---
router.get('/enquiries', authenticateJWT, async (_req, res, next) => {
  try {
    const enquiries = await listEnquiries();
    res.json(enquiries);
  } catch (err) {
    next(err);
  }
});

router.post('/enquiries', authenticateJWT, async (req: AuthRequest, res, next) => {
  try {
    const { customerId, customerData, requiredDate, notes, items } = req.body;
    if (!requiredDate || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Required date and at least one item are mandatory.' });
    }
    const enquiry = await createCustomerAndEnquiry(
      { customerId, customerData, requiredDate, notes, items },
      req.user!.id
    );
    res.status(201).json(enquiry);
  } catch (err) {
    next(err);
  }
});

// --- QUOTATIONS ---
router.get('/quotations', authenticateJWT, async (_req, res, next) => {
  try {
    const quotations = await listQuotations();
    res.json(quotations);
  } catch (err) {
    next(err);
  }
});

router.post('/quotations', authenticateJWT, async (req: AuthRequest, res, next) => {
  try {
    const { enquiryId, validUntil, items } = req.body;
    if (!enquiryId || !validUntil || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'EnquiryId, validUntil, and items are mandatory.' });
    }
    const quotation = await createQuotation(
      { enquiryId, validUntil, items },
      req.user!.id
    );
    res.status(201).json(quotation);
  } catch (err) {
    next(err);
  }
});

router.patch('/quotations/:id/status', authenticateJWT, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }
    const updated = await updateQuotationStatus(req.params.id, status);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.post('/quotations/:id/convert', authenticateJWT, async (req, res, next) => {
  try {
    const order = await convertQuotationToOrder(req.params.id);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// --- SALES ORDERS ---
router.get('/sales-orders', authenticateJWT, async (_req, res, next) => {
  try {
    const orders = await listSalesOrders();
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// ADMIN-ONLY: Confirm Sales Order & Row-Locked Inventory Reservation
router.post(
  '/sales-orders/:id/confirm',
  authenticateJWT,
  requireRole('ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const order = await confirmSalesOrderAndReserveStock(req.params.id, req.user!.id);
      res.json({ message: 'Order confirmed and inventory reserved successfully.', order });
    } catch (err) {
      next(err);
    }
  }
);

// ADMIN-ONLY: Process Dispatch
router.post(
  '/sales-orders/:id/dispatch',
  authenticateJWT,
  requireRole('ADMIN'),
  async (req: AuthRequest, res, next) => {
    try {
      const { vehicleNumber, driverName } = req.body;
      if (!vehicleNumber || !driverName) {
        return res.status(400).json({ error: 'Vehicle number and driver name are required for dispatch.' });
      }
      const dispatch = await processDispatch(req.params.id, { vehicleNumber, driverName }, req.user!.id);
      res.status(201).json({ message: 'Dispatch completed successfully.', dispatch });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
