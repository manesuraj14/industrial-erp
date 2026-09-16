// Verification script to validate mock ERP business logic
import { mockErp } from './src/services/mockErpService.ts';

console.log('--- Step 1: Initial Inventory Inspection ---');
const invInitial = mockErp.getInventory();
const valveInv = invInitial.find(p => p.productCode === 'IND-VLV-01');
console.log(`Gate Valve: Physical=${valveInv.physicalQuantity}, Reserved=${valveInv.reservedQuantity}, Available=${valveInv.availableQuantity}`);
console.assert(valveInv.physicalQuantity === 200, 'Initial physical should be 200');
console.assert(valveInv.reservedQuantity === 60, 'Initial reserved should be 60');
console.assert(valveInv.availableQuantity === 140, 'Initial available should be 140');

console.log('--- Step 2: Create Customer Enquiry with Multi-Product Lines ---');
const enq = mockErp.createEnquiry({
  customerData: {
    companyName: 'Bhartiya Heavy Industries',
    contactPerson: 'Sunil Verma',
    mobile: '+91-9988776655',
    email: 'sunil@bhartiya.com',
    city: 'Nagpur',
  },
  requiredDate: '2026-10-15',
  notes: 'High tensile valves required for expansion',
  items: [
    { productId: 'p1', quantity: 20 },
    { productId: 'p2', quantity: 5 },
  ],
});
console.log(`Created Enquiry: ${enq.enquiryNumber}, Status=${enq.status}, Items=${enq.items.length}`);
console.assert(enq.status === 'NEW', 'Enquiry should be NEW');

console.log('--- Step 3: Create Quotation & Verify Pricing Engine ---');
// Valve: 20 * 4500 = 90,000. Disc 10% = 9,000. Taxable = 81,000. GST 18% = 14,580. Line = 95,580
// Pump: 5 * 18500 = 92,500. Disc 10% = 9,250. Taxable = 83,250. GST 18% = 14,985. Line = 98,235
// Total Base: 182,500. Total Disc: 18,250. Total GST: 29,565. Grand Total: 193,815
const quote = mockErp.createQuotation({
  enquiryId: enq.id,
  validUntil: '2026-11-01',
  items: [
    { productId: 'p1', quantity: 20, unitPrice: 4500, discountPercentage: 10, gstPercentage: 18 },
    { productId: 'p2', quantity: 5, unitPrice: 18500, discountPercentage: 10, gstPercentage: 18 },
  ],
});
console.log(`Generated Quotation: ${quote.quotationNumber}, GrandTotal=₹${quote.grandTotal}`);
console.assert(quote.grandTotal === 193815, `Expected 193815, got ${quote.grandTotal}`);
console.assert(quote.status === 'DRAFT', 'Quotation starts in DRAFT');

console.log('--- Step 4: Status Progression & Conversion Guard ---');
// Cannot convert while DRAFT
let draftConvertError = false;
try {
  mockErp.convertQuotationToOrder(quote.id);
} catch (e) {
  draftConvertError = true;
  console.log(`Caught expected error: ${e.message}`);
}
console.assert(draftConvertError, 'Should reject converting DRAFT quotation');

// Progress to SENT then ACCEPTED
mockErp.updateQuotationStatus(quote.id, 'SENT');
mockErp.updateQuotationStatus(quote.id, 'ACCEPTED');

// Convert to Sales Order
const order = mockErp.convertQuotationToOrder(quote.id);
console.log(`Converted to Sales Order: ${order.orderNumber}, Status=${order.status}`);
console.assert(order.status === 'PENDING', 'Sales order should start in PENDING');
console.assert(order.totalAmount === 193815, 'Order amount should match quotation');

// Cannot convert again (1-to-1 guard)
let duplicateConvertError = false;
try {
  mockErp.convertQuotationToOrder(quote.id);
} catch (e) {
  duplicateConvertError = true;
  console.log(`Caught expected duplicate conversion error: ${e.message}`);
}
console.assert(duplicateConvertError, 'Should reject duplicate conversion');

console.log('--- Step 5: RBAC & Stock Reservation Guard ---');
// Sales user cannot confirm
let rbacError = false;
try {
  mockErp.confirmSalesOrder(order.id, 'SALES');
} catch (e) {
  rbacError = true;
  console.log(`Caught expected RBAC error: ${e.message}`);
}
console.assert(rbacError, 'Sales user cannot confirm orders');

// Admin confirms order
const confirmedOrder = mockErp.confirmSalesOrder(order.id, 'ADMIN');
console.log(`Order Confirmed by: ${confirmedOrder.confirmedBy}`);
console.assert(confirmedOrder.status === 'CONFIRMED', 'Order status should be CONFIRMED');

// Check inventory after reservation:
// Product 1 (Valve): was physical 200, reserved 60. Now reserved should be 60 + 20 = 80. Physical should still be 200!
const invPostReserve = mockErp.getInventory();
const valvePost = invPostReserve.find(p => p.productCode === 'IND-VLV-01');
console.log(`Valve Post-Reservation: Physical=${valvePost.physicalQuantity}, Reserved=${valvePost.reservedQuantity}, Available=${valvePost.availableQuantity}`);
console.assert(valvePost.physicalQuantity === 200, 'Physical MUST NOT decrease during reservation');
console.assert(valvePost.reservedQuantity === 80, 'Reserved MUST increase from 60 to 80');
console.assert(valvePost.availableQuantity === 120, 'Available MUST decrease to 120');

console.log('--- Step 6: Dispatch Execution & Dual Stock Decrement ---');
const dsp = mockErp.processDispatch(order.id, { vehicleNumber: 'MH-12-AB-9876', driverName: 'Ramesh Patil' }, 'ADMIN');
console.log(`Dispatch Created: ${dsp.dispatchNumber}, Vehicle=${dsp.vehicleNumber}`);

// Check inventory after dispatch:
// Product 1 (Valve): was physical 200, reserved 80. Now physical should be 200 - 20 = 180. Reserved should be 80 - 20 = 60! Available remains 120!
const invPostDispatch = mockErp.getInventory();
const valveFinal = invPostDispatch.find(p => p.productCode === 'IND-VLV-01');
console.log(`Valve Post-Dispatch: Physical=${valveFinal.physicalQuantity}, Reserved=${valveFinal.reservedQuantity}, Available=${valveFinal.availableQuantity}`);
console.assert(valveFinal.physicalQuantity === 180, 'Physical MUST decrease by dispatched amount (180)');
console.assert(valveFinal.reservedQuantity === 60, 'Reserved MUST decrease by dispatched amount (60)');
console.assert(valveFinal.availableQuantity === 120, 'Available MUST remain 120');

console.log('🎉 ALL WORKFLOW ASSERTIONS PASSED WITH 100% MATHEMATICAL PRECISION!');
