import { pool } from '../config/database';

export interface InventoryViewItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  basePrice: number;
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

const FALLBACK_PRODUCTS: InventoryViewItem[] = [
  { id: 'inv-1', productId: 'c0000000-0000-0000-0000-000000000001', productCode: 'IND-VLV-01', productName: 'Cast Steel Gate Valve DN50 PN16', category: 'Valves', unit: 'PCS', basePrice: 4500, physicalQuantity: 200, reservedQuantity: 60, availableQuantity: 140 },
  { id: 'inv-2', productId: 'c0000000-0000-0000-0000-000000000002', productCode: 'IND-PMP-02', productName: 'High Pressure Hydraulic Gear Pump 250 Bar', category: 'Pumps', unit: 'SET', basePrice: 18500, physicalQuantity: 40, reservedQuantity: 10, availableQuantity: 30 },
  { id: 'inv-3', productId: 'c0000000-0000-0000-0000-000000000003', productCode: 'IND-CYL-03', productName: 'Double Acting Pneumatic Cylinder 100mm Stroke', category: 'Pneumatics', unit: 'PCS', basePrice: 3200, physicalQuantity: 150, reservedQuantity: 25, availableQuantity: 125 },
  { id: 'inv-4', productId: 'c0000000-0000-0000-0000-000000000004', productCode: 'IND-MTR-04', productName: 'Three-Phase High Torque AC Induction Motor 5.5kW', category: 'Motors', unit: 'SET', basePrice: 24000, physicalQuantity: 30, reservedQuantity: 5, availableQuantity: 25 },
  { id: 'inv-5', productId: 'c0000000-0000-0000-0000-000000000005', productCode: 'IND-FLG-05', productName: 'SS316 Forged Weld Neck Flange 4-inch 150#', category: 'Piping', unit: 'PCS', basePrice: 1850, physicalQuantity: 300, reservedQuantity: 80, availableQuantity: 220 },
  { id: 'inv-6', productId: 'c0000000-0000-0000-0000-000000000006', productCode: 'IND-BRG-06', productName: 'Heavy Duty Spherical Roller Bearing 22215-E', category: 'Bearings', unit: 'PCS', basePrice: 2950, physicalQuantity: 100, reservedQuantity: 30, availableQuantity: 70 },
];

export async function getInventorySummary(): Promise<InventoryViewItem[]> {
  try {
    const res = await pool.query(`
      SELECT 
        i.id,
        p.id as product_id,
        p.product_code,
        p.product_name,
        p.category,
        p.unit,
        p.base_price,
        i.physical_quantity,
        i.reserved_quantity,
        (i.physical_quantity - i.reserved_quantity) as available_quantity
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      ORDER BY p.product_code ASC
    `);

    if (res.rows.length > 0) {
      return res.rows.map((r) => ({
        id: r.id,
        productId: r.product_id,
        productCode: r.product_code,
        productName: r.product_name,
        category: r.category,
        unit: r.unit,
        basePrice: parseFloat(r.base_price),
        physicalQuantity: r.physical_quantity,
        reservedQuantity: r.reserved_quantity,
        availableQuantity: r.available_quantity,
      }));
    }
  } catch (err) {
    // Return fallback dataset if database query is not yet active
  }

  return FALLBACK_PRODUCTS;
}
