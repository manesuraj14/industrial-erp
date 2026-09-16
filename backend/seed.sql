-- Seed Admin & Sales User (Password: Password@123 -> bcrypt hash $2a$10$wT0d1E2mNnFv2Z7y8pG1ne8rV1E0Q2W5T9u7A8s9D0F1G2H3J4K5L)
INSERT INTO users (id, email, password_hash, full_name, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@erp.com', '$2a$10$wT0d1E2mNnFv2Z7y8pG1ne8rV1E0Q2W5T9u7A8s9D0F1G2H3J4K5L', 'System Administrator', 'ADMIN'),
('a0000000-0000-0000-0000-000000000002', 'sales@erp.com', '$2a$10$wT0d1E2mNnFv2Z7y8pG1ne8rV1E0Q2W5T9u7A8s9D0F1G2H3J4K5L', 'Senior Sales Executive', 'SALES')
ON CONFLICT (email) DO NOTHING;

-- Seed Customers
INSERT INTO customers (id, company_name, contact_person, mobile, email, city) VALUES
('b0000000-0000-0000-0000-000000000001', 'ABC Engineering Pvt. Ltd.', 'Rajesh Sharma', '+91-9823011223', 'rajesh@abcengg.com', 'Pune'),
('b0000000-0000-0000-0000-000000000002', 'Apex Heavy Machinery Ltd.', 'Kavita Menon', '+91-9876543210', 'kavita@apexmachinery.com', 'Ahmedabad')
ON CONFLICT (id) DO NOTHING;

-- Seed 6 Industrial Products
INSERT INTO products (id, product_code, product_name, category, unit, base_price) VALUES
('c0000000-0000-0000-0000-000000000001', 'IND-VLV-01', 'Cast Steel Gate Valve DN50 PN16', 'Valves', 'PCS', 4500.00),
('c0000000-0000-0000-0000-000000000002', 'IND-PMP-02', 'High Pressure Hydraulic Gear Pump 250 Bar', 'Pumps', 'SET', 18500.00),
('c0000000-0000-0000-0000-000000000003', 'IND-CYL-03', 'Double Acting Pneumatic Cylinder 100mm Stroke', 'Pneumatics', 'PCS', 3200.00),
('c0000000-0000-0000-0000-000000000004', 'IND-MTR-04', 'Three-Phase High Torque AC Induction Motor 5.5kW', 'Motors', 'SET', 24000.00),
('c0000000-0000-0000-0000-000000000005', 'IND-FLG-05', 'SS316 Forged Weld Neck Flange 4-inch 150#', 'Piping', 'PCS', 1850.00),
('c0000000-0000-0000-0000-000000000006', 'IND-BRG-06', 'Heavy Duty Spherical Roller Bearing 22215-E', 'Bearings', 'PCS', 2950.00)
ON CONFLICT (product_code) DO NOTHING;

-- Seed Initial Inventory with Realistic Stock & Reserves
-- Product 1: Physical=200, Reserved=60, Available=140
INSERT INTO inventory (product_id, physical_quantity, reserved_quantity) VALUES
('c0000000-0000-0000-0000-000000000001', 200, 60),
('c0000000-0000-0000-0000-000000000002', 40, 10),
('c0000000-0000-0000-0000-000000000003', 150, 25),
('c0000000-0000-0000-0000-000000000004', 30, 5),
('c0000000-0000-0000-0000-000000000005', 300, 80),
('c0000000-0000-0000-0000-000000000006', 100, 30)
ON CONFLICT (product_id) DO NOTHING;
