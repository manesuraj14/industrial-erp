import type {
  Customer,
  Product,
  InventoryItem,
  Enquiry,
  EnquiryItem,
  Quotation,
  SalesOrder,
  Dispatch,
  QuotationItem,
  QuotationStatus,
} from '../types/erp';

// Seed Products
const SEED_PRODUCTS: Product[] = [
  { id: 'p1', productCode: 'IND-VLV-01', productName: 'Cast Steel Gate Valve DN50 PN16', category: 'Valves', unit: 'PCS', basePrice: 4500 },
  { id: 'p2', productCode: 'IND-PMP-02', productName: 'High Pressure Hydraulic Gear Pump 250 Bar', category: 'Pumps', unit: 'SET', basePrice: 18500 },
  { id: 'p3', productCode: 'IND-CYL-03', productName: 'Double Acting Pneumatic Cylinder 100mm Stroke', category: 'Pneumatics', unit: 'PCS', basePrice: 3200 },
  { id: 'p4', productCode: 'IND-MTR-04', productName: 'Three-Phase High Torque AC Induction Motor 5.5kW', category: 'Motors', unit: 'SET', basePrice: 24000 },
  { id: 'p5', productCode: 'IND-FLG-05', productName: 'SS316 Forged Weld Neck Flange 4-inch 150#', category: 'Piping', unit: 'PCS', basePrice: 1850 },
  { id: 'p6', productCode: 'IND-BRG-06', productName: 'Heavy Duty Spherical Roller Bearing 22215-E', category: 'Bearings', unit: 'PCS', basePrice: 2950 },
];

// Seed Inventory (Product 1: Physical=200, Reserved=60, Available=140)
const SEED_INVENTORY: Record<string, { physical: number; reserved: number }> = {
  p1: { physical: 200, reserved: 60 },
  p2: { physical: 40, reserved: 10 },
  p3: { physical: 150, reserved: 25 },
  p4: { physical: 30, reserved: 5 },
  p5: { physical: 300, reserved: 80 },
  p6: { physical: 100, reserved: 30 },
};

const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    companyName: 'ABC Engineering Pvt. Ltd.',
    contactPerson: 'Rajesh Sharma',
    mobile: '+91-9823011223',
    email: 'rajesh@abcengg.com',
    city: 'Pune',
    createdAt: '2026-09-01',
  },
  {
    id: 'c2',
    companyName: 'Apex Heavy Machinery Ltd.',
    contactPerson: 'Kavita Menon',
    mobile: '+91-9876543210',
    email: 'kavita@apexmachinery.com',
    city: 'Ahmedabad',
    createdAt: '2026-09-05',
  },
];

const SEED_ENQUIRIES: Enquiry[] = [
  {
    id: 'enq-1',
    enquiryNumber: 'ENQ-2026-001',
    customerId: 'c1',
    customer: SEED_CUSTOMERS[0],
    enquiryDate: '2026-09-10',
    requiredDate: '2026-09-25',
    notes: 'Urgent requirement for plant expansion project.',
    status: 'QUOTED',
    items: [
      { id: 'ei-1', productId: 'p1', productCode: 'IND-VLV-01', productName: 'Cast Steel Gate Valve DN50 PN16', unit: 'PCS', quantity: 100 },
      { id: 'ei-2', productId: 'p2', productCode: 'IND-PMP-02', productName: 'High Pressure Hydraulic Gear Pump 250 Bar', unit: 'SET', quantity: 40 },
    ],
    createdBy: 'Senior Sales Executive',
  },
  {
    id: 'enq-2',
    enquiryNumber: 'ENQ-2026-002',
    customerId: 'c2',
    customer: SEED_CUSTOMERS[1],
    enquiryDate: '2026-09-12',
    requiredDate: '2026-09-30',
    notes: 'Standard quarterly maintenance parts.',
    status: 'NEW',
    items: [
      { id: 'ei-3', productId: 'p3', productCode: 'IND-CYL-03', productName: 'Double Acting Pneumatic Cylinder 100mm Stroke', unit: 'PCS', quantity: 20 },
      { id: 'ei-4', productId: 'p6', productCode: 'IND-BRG-06', productName: 'Heavy Duty Spherical Roller Bearing 22215-E', unit: 'PCS', quantity: 50 },
    ],
    createdBy: 'Senior Sales Executive',
  }
];

class MockErpStore {
  products: Product[] = [...SEED_PRODUCTS];
  inventory: Record<string, { physical: number; reserved: number }> = JSON.parse(JSON.stringify(SEED_INVENTORY));
  customers: Customer[] = [...SEED_CUSTOMERS];
  enquiries: Enquiry[] = JSON.parse(JSON.stringify(SEED_ENQUIRIES));
  quotations: Quotation[] = [];
  salesOrders: SalesOrder[] = [];
  dispatches: Dispatch[] = [];

  constructor() {
    this.initSeedQuotation();
  }

  private initSeedQuotation() {
    const qItems: QuotationItem[] = [
      {
        id: 'qi-1',
        productId: 'p1',
        productCode: 'IND-VLV-01',
        productName: 'Cast Steel Gate Valve DN50 PN16',
        unit: 'PCS',
        quantity: 20,
        unitPrice: 4500,
        discountPercentage: 10,
        gstPercentage: 18,
        lineBaseAmount: 90000,
        lineDiscountAmount: 9000,
        lineGstAmount: 14580,
        lineTotal: 95580,
      }
    ];

    this.quotations.push({
      id: 'qt-1',
      quotationNumber: 'QT-2026-001',
      enquiryId: 'enq-1',
      enquiryNumber: 'ENQ-2026-001',
      customerId: 'c1',
      customer: this.customers[0],
      totalBaseAmount: 90000,
      totalDiscountAmount: 9000,
      totalGstAmount: 14580,
      grandTotal: 95580,
      validUntil: '2026-10-15',
      status: 'SENT',
      items: qItems,
      isConvertedToOrder: false,
      createdBy: 'Senior Sales Executive',
    });
  }

  // --- Products & Inventory ---
  getProducts(): Product[] {
    return [...this.products];
  }

  getInventory(): InventoryItem[] {
    return this.products.map((p) => {
      const inv = this.inventory[p.id] || { physical: 0, reserved: 0 };
      return {
        id: `inv-${p.id}`,
        productId: p.id,
        productCode: p.productCode,
        productName: p.productName,
        category: p.category,
        unit: p.unit,
        physicalQuantity: inv.physical,
        reservedQuantity: inv.reserved,
        availableQuantity: inv.physical - inv.reserved,
      };
    });
  }

  // --- Customers ---
  getCustomers(): Customer[] {
    return [...this.customers];
  }

  createCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const newCustomer: Customer = {
      id: `c-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }

  // --- Enquiries ---
  getEnquiries(): Enquiry[] {
    return [...this.enquiries];
  }

  createEnquiry(payload: {
    customerData?: Omit<Customer, 'id' | 'createdAt'>;
    customerId?: string;
    requiredDate: string;
    notes: string;
    items: { productId: string; quantity: number }[];
    createdBy?: string;
  }): Enquiry {
    let customer: Customer;
    if (payload.customerId) {
      const existing = this.customers.find((c) => c.id === payload.customerId);
      if (!existing) throw new Error('Customer not found');
      customer = existing;
    } else if (payload.customerData) {
      customer = this.createCustomer(payload.customerData);
    } else {
      throw new Error('Customer details are required');
    }

    const enquiryNumber = `ENQ-2026-${String(this.enquiries.length + 1).padStart(3, '0')}`;
    const mappedItems: EnquiryItem[] = payload.items.map((it, idx) => {
      const product = this.products.find((p) => p.id === it.productId);
      return {
        id: `ei-${Date.now()}-${idx}`,
        productId: it.productId,
        productCode: product?.productCode,
        productName: product?.productName,
        unit: product?.unit,
        quantity: it.quantity,
      };
    });

    const newEnquiry: Enquiry = {
      id: `enq-${Date.now()}`,
      enquiryNumber,
      customerId: customer.id,
      customer,
      enquiryDate: new Date().toISOString().split('T')[0],
      requiredDate: payload.requiredDate,
      notes: payload.notes,
      status: 'NEW',
      items: mappedItems,
      createdBy: payload.createdBy || 'Sales User',
    };

    this.enquiries.unshift(newEnquiry);
    return newEnquiry;
  }

  // --- Quotations ---
  getQuotations(): Quotation[] {
    return [...this.quotations];
  }

  createQuotation(payload: {
    enquiryId: string;
    validUntil: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
      discountPercentage: number;
      gstPercentage: number;
    }[];
    createdBy?: string;
  }): Quotation {
    const enquiry = this.enquiries.find((e) => e.id === payload.enquiryId);
    if (!enquiry) throw new Error('Enquiry not found');

    let totalBase = 0;
    let totalDiscount = 0;
    let totalGst = 0;
    let grandTotal = 0;

    const items: QuotationItem[] = payload.items.map((it, idx) => {
      const product = this.products.find((p) => p.id === it.productId);
      const lineBaseAmount = Math.round(it.quantity * it.unitPrice * 100) / 100;
      const lineDiscountAmount = Math.round((lineBaseAmount * (it.discountPercentage / 100)) * 100) / 100;
      const taxable = lineBaseAmount - lineDiscountAmount;
      const lineGstAmount = Math.round((taxable * (it.gstPercentage / 100)) * 100) / 100;
      const lineTotal = Math.round((taxable + lineGstAmount) * 100) / 100;

      totalBase += lineBaseAmount;
      totalDiscount += lineDiscountAmount;
      totalGst += lineGstAmount;
      grandTotal += lineTotal;

      return {
        id: `qi-${Date.now()}-${idx}`,
        productId: it.productId,
        productCode: product?.productCode,
        productName: product?.productName,
        unit: product?.unit,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountPercentage: it.discountPercentage,
        gstPercentage: it.gstPercentage,
        lineBaseAmount,
        lineDiscountAmount,
        lineGstAmount,
        lineTotal,
      };
    });

    const quotationNumber = `QT-2026-${String(this.quotations.length + 1).padStart(3, '0')}`;

    const newQuotation: Quotation = {
      id: `qt-${Date.now()}`,
      quotationNumber,
      enquiryId: enquiry.id,
      enquiryNumber: enquiry.enquiryNumber,
      customerId: enquiry.customerId,
      customer: enquiry.customer,
      totalBaseAmount: Math.round(totalBase * 100) / 100,
      totalDiscountAmount: Math.round(totalDiscount * 100) / 100,
      totalGstAmount: Math.round(totalGst * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      validUntil: payload.validUntil,
      status: 'DRAFT',
      items,
      isConvertedToOrder: false,
      createdBy: payload.createdBy || 'Sales User',
    };

    enquiry.status = 'QUOTED';
    this.quotations.unshift(newQuotation);
    return newQuotation;
  }

  updateQuotationStatus(id: string, status: QuotationStatus): Quotation {
    const q = this.quotations.find((item) => item.id === id);
    if (!q) throw new Error('Quotation not found');
    q.status = status;
    return q;
  }

  // --- Quotation -> Sales Order ---
  convertQuotationToOrder(quotationId: string): SalesOrder {
    const quotation = this.quotations.find((q) => q.id === quotationId);
    if (!quotation) throw new Error('Quotation not found');

    if (quotation.status !== 'ACCEPTED') {
      throw new Error(`Cannot convert quotation with status "${quotation.status}". Only ACCEPTED quotations can create an order.`);
    }

    if (quotation.isConvertedToOrder) {
      throw new Error('This quotation has already been converted into a Sales Order.');
    }

    const orderNumber = `SO-2026-${String(this.salesOrders.length + 1).padStart(3, '0')}`;
    const orderItems = quotation.items.map((item) => ({
      productId: item.productId,
      productCode: item.productCode,
      productName: item.productName,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    }));

    const newOrder: SalesOrder = {
      id: `so-${Date.now()}`,
      orderNumber,
      quotationId: quotation.id,
      quotationNumber: quotation.quotationNumber,
      customerId: quotation.customerId,
      customer: quotation.customer,
      orderDate: new Date().toISOString().split('T')[0],
      totalAmount: quotation.grandTotal,
      status: 'PENDING',
      items: orderItems,
    };

    quotation.isConvertedToOrder = true;

    // Update parent enquiry status to WON
    const enquiry = this.enquiries.find((e) => e.id === quotation.enquiryId);
    if (enquiry) {
      enquiry.status = 'WON';
    }

    this.salesOrders.unshift(newOrder);
    return newOrder;
  }

  // --- Sales Orders & Stock Reservation ---
  getSalesOrders(): SalesOrder[] {
    return [...this.salesOrders];
  }

  confirmSalesOrder(orderId: string, role: string): SalesOrder {
    if (role !== 'ADMIN') {
      throw new Error('Permission denied: Only ADMIN can confirm Sales Orders and reserve inventory.');
    }

    const order = this.salesOrders.find((o) => o.id === orderId);
    if (!order) throw new Error('Sales order not found');

    if (order.status !== 'PENDING') {
      throw new Error(`Cannot confirm order in status "${order.status}". Only PENDING orders can be confirmed.`);
    }

    // Check inventory availability for all items
    for (const item of order.items) {
      const inv = this.inventory[item.productId];
      if (!inv) {
        throw new Error(`Inventory record missing for product ${item.productCode || item.productId}`);
      }
      const available = inv.physical - inv.reserved;
      if (available < item.quantity) {
        throw new Error(
          `Insufficient inventory for "${item.productName || item.productCode}". Available: ${available} ${item.unit || 'PCS'}, Required: ${item.quantity} ${item.unit || 'PCS'}. Reservation cannot proceed!`
        );
      }
    }

    // Reserve stock: Physical quantity DOES NOT decrease! Reserved quantity increases.
    for (const item of order.items) {
      this.inventory[item.productId].reserved += item.quantity;
    }

    order.status = 'CONFIRMED';
    order.confirmedBy = 'System Administrator';
    order.confirmedAt = new Date().toISOString();

    return order;
  }

  // --- Dispatch ---
  processDispatch(
    orderId: string,
    dispatchData: { vehicleNumber: string; driverName: string },
    role: string
  ): Dispatch {
    if (role !== 'ADMIN') {
      throw new Error('Permission denied: Only ADMIN can process dispatches.');
    }

    const order = this.salesOrders.find((o) => o.id === orderId);
    if (!order) throw new Error('Sales order not found');

    if (order.status !== 'CONFIRMED') {
      throw new Error(`Cannot dispatch order in "${order.status}" status. Order must be CONFIRMED.`);
    }

    // Decrement BOTH Physical Quantity and Reserved Quantity
    for (const item of order.items) {
      const inv = this.inventory[item.productId];
      if (!inv || inv.physical < item.quantity || inv.reserved < item.quantity) {
        throw new Error(`Stock error during dispatch for ${item.productName}`);
      }
      inv.physical -= item.quantity;
      inv.reserved -= item.quantity;
    }

    order.status = 'DISPATCHED';

    const dispatchNumber = `DSP-2026-${String(this.dispatches.length + 1).padStart(3, '0')}`;
    const newDispatch: Dispatch = {
      id: `dsp-${Date.now()}`,
      dispatchNumber,
      salesOrderId: order.id,
      orderNumber: order.orderNumber,
      dispatchDate: new Date().toISOString().split('T')[0],
      vehicleNumber: dispatchData.vehicleNumber,
      driverName: dispatchData.driverName,
      processedBy: 'System Administrator',
      items: order.items.map((i) => ({
        productId: i.productId,
        productCode: i.productCode,
        productName: i.productName,
        quantity: i.quantity,
      })),
    };

    this.dispatches.unshift(newDispatch);
    return newDispatch;
  }

  // Reset to initial state for testing
  reset() {
    this.products = [...SEED_PRODUCTS];
    this.inventory = JSON.parse(JSON.stringify(SEED_INVENTORY));
    this.customers = [...SEED_CUSTOMERS];
    this.enquiries = JSON.parse(JSON.stringify(SEED_ENQUIRIES));
    this.quotations = [];
    this.salesOrders = [];
    this.dispatches = [];
    this.initSeedQuotation();
  }
}

export const mockErp = new MockErpStore();
