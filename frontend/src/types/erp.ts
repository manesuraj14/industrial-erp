export type Role = 'ADMIN' | 'SALES';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  city: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  basePrice: number;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number; // calculated: physicalQuantity - reservedQuantity
}

export type EnquiryStatus = 'NEW' | 'QUOTED' | 'WON' | 'LOST';

export interface EnquiryItem {
  id?: string;
  productId: string;
  productCode?: string;
  productName?: string;
  unit?: string;
  quantity: number;
}

export interface Enquiry {
  id: string;
  enquiryNumber: string;
  customerId: string;
  customer?: Customer;
  enquiryDate: string;
  requiredDate: string;
  notes: string;
  status: EnquiryStatus;
  items: EnquiryItem[];
  createdBy?: string;
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';

export interface QuotationItem {
  id?: string;
  productId: string;
  productCode?: string;
  productName?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  gstPercentage: number;
  lineBaseAmount: number;
  lineDiscountAmount: number;
  lineGstAmount: number;
  lineTotal: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  enquiryId: string;
  enquiryNumber?: string;
  customerId: string;
  customer?: Customer;
  totalBaseAmount: number;
  totalDiscountAmount: number;
  totalGstAmount: number;
  grandTotal: number;
  validUntil: string;
  status: QuotationStatus;
  items: QuotationItem[];
  isConvertedToOrder?: boolean;
  createdBy?: string;
}

export type SalesOrderStatus = 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'CANCELLED';

export interface SalesOrderItem {
  id?: string;
  productId: string;
  productCode?: string;
  productName?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  quotationId: string;
  quotationNumber?: string;
  customerId: string;
  customer?: Customer;
  orderDate: string;
  totalAmount: number;
  status: SalesOrderStatus;
  items: SalesOrderItem[];
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface DispatchItem {
  id?: string;
  productId: string;
  productCode?: string;
  productName?: string;
  quantity: number;
}

export interface Dispatch {
  id: string;
  dispatchNumber: string;
  salesOrderId: string;
  orderNumber?: string;
  dispatchDate: string;
  vehicleNumber: string;
  driverName: string;
  processedBy?: string;
  items: DispatchItem[];
}
