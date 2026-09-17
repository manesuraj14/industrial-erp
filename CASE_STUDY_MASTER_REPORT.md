# 🏭 Master Technical Case Study & Execution Blueprint
## Project: Industrial ERP Operations System (PERN Stack)
**Domain:** Industrial Manufacturing & Supply Chain Operations  
**Workflow:** Customer Enquiry ➔ Quotation ➔ Sales Order ➔ Inventory Reservation ➔ Dispatch  
**Evaluation Standard:** Full-Stack Developer Technical Assessment (48-Hour Turnaround)  
**Author:** Full-Stack Engineering Specification  

---

## 📑 Executive Table of Contents
1. [Executive Summary & Case Study Requirements Breakdown](#1-executive-summary--case-study-requirements-breakdown)
2. [System Architecture & Technology Justification](#2-system-architecture--technology-justification)
3. [PostgreSQL Relational Database Schema & ER Diagram](#3-postgresql-relational-database-schema--er-diagram)
4. [The Critical Concurrency & Race Condition Solution](#4-the-critical-concurrency--race-condition-solution)
5. [Core Business Logic & Mathematical Engine](#5-core-business-logic--mathematical-engine)
6. [API Specification & Backend Role-Based Access Control (RBAC)](#6-api-specification--backend-role-based-access-control-rbac)
7. [Frontend Architecture (The 4 Required Screens)](#7-frontend-architecture-the-4-required-screens)
8. [Automated Test Suite (Mandatory 5 + Concurrency Bonus)](#8-automated-test-suite-mandatory-5--concurrency-bonus)
9. [Step-by-Step Implementation Roadmap (Zero to Working System)](#9-step-by-step-implementation-roadmap-zero-to-working-system)
10. [Cloud Deployment & Docker Playbook](#10-cloud-deployment--docker-playbook)
11. [Live Verification Round Defense Guide](#11-live-verification-round-defense-guide)
12. [5-Minute Demo Video Script & Final Submission Checklist](#12-5-minute-demo-video-script--final-submission-checklist)

---

## 1. Executive Summary & Case Study Requirements Breakdown

### 1.1 Business Context
An industrial manufacturing and B2B supply firm sells heavy-duty industrial components (valves, pumps, motors, bearings, cylinders, flanges) to corporate clients. The business requires an automated, traceable ERP application covering the complete order lifecycle:

```
[Customer Enquiry] 
       │ (Sales User captures requirements & product lines)
       ▼
[Quotation Generation] 
       │ (Itemized pricing, discount %, GST %, backend validation)
       ▼
[Quotation Accepted]
       │ (Converted to Sales Order; strictly 1-to-1 conversion)
       ▼
[Sales Order Created]
       │ (Status: PENDING)
       ▼
[Inventory Reservation]
       │ (Admin confirms; stock locked using ACID DB row locks)
       │ (Physical stock UNCHANGED, Reserved stock INCREASES)
       ▼
[Dispatch Processing]
       │ (Admin ships goods with vehicle & driver details)
       │ (Physical stock DECREASES, Reserved stock DECREASES)
       ▼
[Order Completed / Dispatched]
```

### 1.2 Evaluation Metrics & Weightage
| Evaluation Pillar | Critical Expectations | Impact |
| :--- | :--- | :--- |
| **Backend Concurrency & ACID** | Handle simultaneous inventory reservations (`SELECT ... FOR UPDATE`, transactional integrity, `CHECK` constraints). | **High / Critical Fail Point** |
| **Relational Schema Design** | 100% normalized PostgreSQL schema with foreign keys, composite constraints, and zero JSON shortcut dumping. | **High** |
| **Business Flow Traceability** | `Customer ➔ Enquiry ➔ Quotation ➔ Sales Order ➔ Dispatch`. Immutability & conversion validation. | **High** |
| **Security & RBAC** | JWT Auth, password hashing (`bcrypt`), and server-side RBAC enforced in middleware (`ADMIN` vs `SALES`). | **Medium-High** |
| **Automated Testing** | 5 mandatory automated tests + concurrency bonus test passing in CI/CD. | **Mandatory** |
| **Clean 4-Screen UI** | Clean, fast, functional React SPA (No over-designed bloat, maximum operational usability). | **Medium** |

---

## 2. System Architecture & Technology Justification

```mermaid
flowchart TD
    subgraph Client ["Frontend Layer (React 18 + Vite + Tailwind CSS)"]
        UI["4 Main Views: Login | Enquiries | Quotations | Sales Orders & Dispatch"]
        AuthContext["Auth Context & Axios Interceptors (JWT Bearer Token)"]
        State["TanStack React Query (Cache, Live Stock Invalidation)"]
    end

    subgraph Backend ["Backend Layer (Node.js + Express + TypeScript)"]
        Router["Express REST Router"]
        AuthMW["JWT Auth & Role-Based Access Control (RBAC) Middleware"]
        Validator["Zod Schema Validation Middleware"]
        Controllers["Controllers (Enquiry, Quotation, Order, Dispatch, Inventory)"]
        ServiceLayer["Business Transaction Services"]
    end

    subgraph Database ["Persistence Layer (PostgreSQL 16)"]
        Tx["ACID Transactions (SERIALIZABLE / READ COMMITTED)"]
        Locking["Row-Level Locks (SELECT FOR UPDATE)"]
        Tables[("PostgreSQL Tables: Users, Customers, Products, Inventory, Enquiries, Quotations, Orders, Dispatches")]
        Constraints["DB Constraints (CHECK physical >= reserved, reserved >= 0)"]
    end

    Client -->|HTTP / JSON REST API| Router
    Router --> AuthMW --> Validator --> Controllers --> ServiceLayer
    ServiceLayer --> Tx --> Locking --> Tables
    Tables --> Constraints
```

### 2.1 Stack Components
- **Runtime & Language:** Node.js (v20 LTS) + TypeScript (strict mode for type safety).
- **Web Framework:** Express.js (lightweight, modular, explicit middleware pipelines).
- **Database:** PostgreSQL 16 (strict ACID compliance, row-level locks, CHECK constraints).
- **Database Client:** `pg` (node-postgres with Connection Pooling & explicit transaction control).
- **Frontend Framework:** React 18 + Vite + Tailwind CSS + Lucide React icons.
- **Testing:** Jest + Supertest (API unit and integration tests).

---

## 3. PostgreSQL Relational Database Schema & ER Diagram

### 3.1 Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ ENQUIRIES : "creates"
    USERS ||--o{ QUOTATIONS : "creates"
    USERS ||--o{ SALES_ORDERS : "confirms"
    USERS ||--o{ DISPATCHES : "processes"

    CUSTOMERS ||--o{ ENQUIRIES : "submits"
    CUSTOMERS ||--o{ QUOTATIONS : "receives"
    CUSTOMERS ||--o{ SALES_ORDERS : "places"

    PRODUCTS ||--|| INVENTORY : "tracks"
    PRODUCTS ||--o{ ENQUIRY_ITEMS : "quoted_in"
    PRODUCTS ||--o{ QUOTATION_ITEMS : "itemized_in"
    PRODUCTS ||--o{ SALES_ORDER_ITEMS : "ordered_in"
    PRODUCTS ||--o{ DISPATCH_ITEMS : "dispatched_in"

    ENQUIRIES ||--|{ ENQUIRY_ITEMS : "contains"
    ENQUIRIES ||--o{ QUOTATIONS : "originates"

    QUOTATIONS ||--|{ QUOTATION_ITEMS : "contains"
    QUOTATIONS ||--o| SALES_ORDERS : "converts_to"

    SALES_ORDERS ||--|{ SALES_ORDER_ITEMS : "contains"
    SALES_ORDERS ||--o{ DISPATCHES : "fulfills"

    DISPATCHES ||--|{ DISPATCH_ITEMS : "delivers"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        string role "ADMIN | SALES"
        timestamp created_at
    }

    CUSTOMERS {
        uuid id PK
        string company_name
        string contact_person
        string mobile
        string email
        string city
        timestamp created_at
    }

    PRODUCTS {
        uuid id PK
        string product_code UK
        string product_name
        string category
        string unit "PCS | MTR | SET | KG"
        decimal base_price
        timestamp created_at
    }

    INVENTORY {
        uuid id PK
        uuid product_id FK,UK
        integer physical_quantity
        integer reserved_quantity
        timestamp updated_at
    }

    ENQUIRIES {
        uuid id PK
        string enquiry_number UK
        uuid customer_id FK
        date enquiry_date
        date required_date
        text notes
        string status "NEW | QUOTED | WON | LOST"
        uuid created_by FK
        timestamp created_at
    }

    ENQUIRY_ITEMS {
        uuid id PK
        uuid enquiry_id FK
        uuid product_id FK
        integer quantity
    }

    QUOTATIONS {
        uuid id PK
        string quotation_number UK
        uuid enquiry_id FK
        uuid customer_id FK
        decimal total_base_amount
        decimal total_discount_amount
        decimal total_gst_amount
        decimal grand_total
        date valid_until
        string status "DRAFT | SENT | ACCEPTED | REJECTED"
        uuid created_by FK
        timestamp created_at
    }

    QUOTATION_ITEMS {
        uuid id PK
        uuid quotation_id FK
        uuid product_id FK
        integer quantity
        decimal unit_price
        decimal discount_percentage
        decimal gst_percentage
        decimal line_base_amount
        decimal line_discount_amount
        decimal line_gst_amount
        decimal line_total
    }

    SALES_ORDERS {
        uuid id PK
        string order_number UK
        uuid quotation_id FK,UK
        uuid customer_id FK
        date order_date
        decimal total_amount
        string status "PENDING | CONFIRMED | DISPATCHED | CANCELLED"
        uuid confirmed_by FK
        timestamp confirmed_at
        timestamp created_at
    }

    SALES_ORDER_ITEMS {
        uuid id PK
        uuid sales_order_id FK
        uuid product_id FK
        integer quantity
        decimal unit_price
        decimal line_total
    }

    DISPATCHES {
        uuid id PK
        string dispatch_number UK
        uuid sales_order_id FK
        date dispatch_date
        string vehicle_number
        string driver_name
        uuid processed_by FK
        timestamp created_at
    }

    DISPATCH_ITEMS {
        uuid id PK
        uuid dispatch_id FK
        uuid product_id FK
        integer quantity
    }
```

---

### 3.2 Production PostgreSQL DDL Script (`schema.sql`)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & RBAC
CREATE TYPE user_role AS ENUM ('ADMIN', 'SALES');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role NOT NULL DEFAULT 'SALES',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CUSTOMERS
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PRODUCTS & INVENTORY
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'PCS',
    base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    physical_quantity INT NOT NULL DEFAULT 0 CHECK (physical_quantity >= 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_reservation_limit CHECK (physical_quantity >= reserved_quantity)
);

-- 4. ENQUIRIES
CREATE TYPE enquiry_status AS ENUM ('NEW', 'QUOTED', 'WON', 'LOST');

CREATE TABLE enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enquiry_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    enquiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    required_date DATE NOT NULL,
    notes TEXT,
    status enquiry_status NOT NULL DEFAULT 'NEW',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE enquiry_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enquiry_id UUID NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0)
);

-- 5. QUOTATIONS
CREATE TYPE quotation_status AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED');

CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    enquiry_id UUID NOT NULL REFERENCES enquiries(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    total_base_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_gst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    valid_until DATE NOT NULL,
    status quotation_status NOT NULL DEFAULT 'DRAFT',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (discount_percentage BETWEEN 0 AND 100),
    gst_percentage NUMERIC(5, 2) NOT NULL DEFAULT 18 CHECK (gst_percentage >= 0),
    line_base_amount NUMERIC(14, 2) NOT NULL,
    line_discount_amount NUMERIC(14, 2) NOT NULL,
    line_gst_amount NUMERIC(14, 2) NOT NULL,
    line_total NUMERIC(14, 2) NOT NULL
);

-- 6. SALES ORDERS
CREATE TYPE sales_order_status AS ENUM ('PENDING', 'CONFIRMED', 'DISPATCHED', 'CANCELLED');

CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_id UUID UNIQUE NOT NULL REFERENCES quotations(id) ON DELETE RESTRICT, -- Prevents duplicate conversion!
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(14, 2) NOT NULL,
    status sales_order_status NOT NULL DEFAULT 'PENDING',
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL,
    line_total NUMERIC(14, 2) NOT NULL
);

-- 7. DISPATCHES
CREATE TABLE dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_number VARCHAR(50) UNIQUE NOT NULL,
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE RESTRICT,
    dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    vehicle_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(150) NOT NULL,
    processed_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dispatch_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_id UUID NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0)
);
```

---

### 3.3 Realistic Seed Script (`seed.sql`)

```sql
-- Seed Admin & Sales User (Password: Password@123 -> bcrypt hash)
INSERT INTO users (id, email, password_hash, full_name, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@erp.com', '$2a$10$wT0d1E2mNnFv2Z7y8pG1ne8rV1E0Q2W5T9u7A8s9D0F1G2H3J4K5L', 'System Administrator', 'ADMIN'),
('a0000000-0000-0000-0000-000000000002', 'sales@erp.com', '$2a$10$wT0d1E2mNnFv2Z7y8pG1ne8rV1E0Q2W5T9u7A8s9D0F1G2H3J4K5L', 'Senior Sales Executive', 'SALES');

-- Seed Customers
INSERT INTO customers (id, company_name, contact_person, mobile, email, city) VALUES
('b0000000-0000-0000-0000-000000000001', 'ABC Engineering Pvt. Ltd.', 'Rajesh Sharma', '+91-9823011223', 'rajesh@abcengg.com', 'Pune'),
('b0000000-0000-0000-0000-000000000002', 'Apex Heavy Machinery Ltd.', 'Kavita Menon', '+91-9876543210', 'kavita@apexmachinery.com', 'Ahmedabad');

-- Seed 6 Realistic Industrial Products
INSERT INTO products (id, product_code, product_name, category, unit, base_price) VALUES
('c0000000-0000-0000-0000-000000000001', 'IND-VLV-01', 'Cast Steel Gate Valve DN50 PN16', 'Valves', 'PCS', 4500.00),
('c0000000-0000-0000-0000-000000000002', 'IND-PMP-02', 'High Pressure Hydraulic Gear Pump 250 Bar', 'Pumps', 'SET', 18500.00),
('c0000000-0000-0000-0000-000000000003', 'IND-CYL-03', 'Double Acting Pneumatic Cylinder 100mm Stroke', 'Pneumatics', 'PCS', 3200.00),
('c0000000-0000-0000-0000-000000000004', 'IND-MTR-04', 'Three-Phase High Torque AC Induction Motor 5.5kW', 'Motors', 'SET', 24000.00),
('c0000000-0000-0000-0000-000000000005', 'IND-FLG-05', 'SS316 Forged Weld Neck Flange 4-inch 150#', 'Piping', 'PCS', 1850.00),
('c0000000-0000-0000-0000-000000000006', 'IND-BRG-06', 'Heavy Duty Spherical Roller Bearing 22215-E', 'Bearings', 'PCS', 2950.00);

-- Seed Initial Inventory with Realistic Stock & Reserves
-- Product 1: Physical=200, Reserved=60, Available=140
INSERT INTO inventory (product_id, physical_quantity, reserved_quantity) VALUES
('c0000000-0000-0000-0000-000000000001', 200, 60),
('c0000000-0000-0000-0000-000000000002', 40, 10),
('c0000000-0000-0000-0000-000000000003', 150, 25),
('c0000000-0000-0000-0000-000000000004', 30, 5),
('c0000000-0000-0000-0000-000000000005', 300, 80),
('c0000000-0000-0000-0000-000000000006', 100, 30);
```

---

## 4. The Critical Concurrency & Race Condition Solution

### 4.1 The Race Condition Problem
> **Problem Statement (Case Study Page 5):**  
> Available inventory = 100.  
> Two requests arrive almost simultaneously:  
> - **User A** tries to Reserve 80  
> - **User B** tries to Reserve 50  
> Both see Available = 100. If both succeed, `Reserved = 130`, creating an illegal oversold condition (`100 - 130 = -30`).

### 4.2 Engineering Solution: Three-Tier Defense

```mermaid
sequenceDiagram
    autonumber
    actor Admin1 as Admin A (Reserve 80)
    actor Admin2 as Admin B (Reserve 50)
    participant API as Express API Server
    participant DB as PostgreSQL (ACID Engine)

    Note over DB: Current Inventory: Physical = 100, Reserved = 0, Available = 100

    Admin1->>API: POST /sales-orders/SO-1/confirm (Reserve 80)
    Admin2->>API: POST /sales-orders/SO-2/confirm (Reserve 50)
    
    API->>DB: BEGIN TRANSACTION (Tx 1)
    API->>DB: BEGIN TRANSACTION (Tx 2)

    API->>DB: Tx 1: SELECT * FROM inventory WHERE product_id = 'P1' FOR UPDATE
    Note over DB: Tx 1 acquires Exclusive Row Lock on 'P1'
    API->>DB: Tx 2: SELECT * FROM inventory WHERE product_id = 'P1' FOR UPDATE
    Note over DB: Tx 2 BLOCKS and waits for Tx 1 to release row lock!

    Note over DB: Tx 1 evaluates: Available = 100 - 0 = 100 >= 80 (Valid)
    API->>DB: Tx 1: UPDATE inventory SET reserved_quantity = 80 WHERE product_id = 'P1'
    API->>DB: Tx 1: UPDATE sales_orders SET status = 'CONFIRMED' WHERE id = 'SO-1'
    API->>DB: Tx 1: COMMIT
    Note over DB: Tx 1 committed. Lock released! Physical = 100, Reserved = 80.
    
    Note over DB: Tx 2 resumes execution with updated locked row!
    Note over DB: Tx 2 reads: Physical = 100, Reserved = 80 -> Available = 20
    Note over DB: Tx 2 evaluates: Available = 20 < 50 requested (INSUFFICIENT STOCK!)
    API->>DB: Tx 2: ROLLBACK
    API-->>Admin2: 400 Bad Request: "Insufficient available inventory. Requested: 50, Available: 20"
    API-->>Admin1: 200 OK: "Order confirmed and inventory reserved successfully."
```

#### Tier 1: Pessimistic Row Locking (`SELECT ... FOR UPDATE`)
Inside an active database transaction, the server queries the inventory row with an exclusive lock:
```sql
SELECT physical_quantity, reserved_quantity 
FROM inventory 
WHERE product_id = $1 
FOR UPDATE;
```
Any competing transaction requesting the same product row is blocked at the database kernel level until the first transaction commits or rolls back.

#### Tier 2: Atomic Conditional UPDATE
```sql
UPDATE inventory 
SET reserved_quantity = reserved_quantity + $1, updated_at = NOW()
WHERE product_id = $2 
  AND (physical_quantity - reserved_quantity) >= $1
RETURNING *;
```
If the row count returned is `0`, the stock was exhausted between read and write, triggering an immediate transaction abort.

#### Tier 3: PostgreSQL Database Check Constraint
```sql
ALTER TABLE inventory 
ADD CONSTRAINT check_reservation_limit 
CHECK (physical_quantity >= reserved_quantity);
```
Even if application-level bugs occur, PostgreSQL guarantees at the disk storage level that `reserved_quantity` can never exceed `physical_quantity`, throwing error code `23514` (`check_violation`).

---

### 4.3 Node.js / Express Implementation Code

```typescript
// src/services/order.service.ts
import { pool } from '../config/database';

export async function confirmSalesOrderAndReserveStock(
  orderId: string, 
  adminUserId: string
) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Fetch sales order and verify PENDING status
    const orderRes = await client.query(
      `SELECT * FROM sales_orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      throw { status: 404, message: 'Sales order not found' };
    }

    const order = orderRes.rows[0];
    if (order.status !== 'PENDING') {
      throw { status: 400, message: `Cannot confirm order with status "${order.status}"` };
    }

    // 2. Fetch order items
    const itemsRes = await client.query(
      `SELECT product_id, quantity FROM sales_order_items WHERE sales_order_id = $1`,
      [orderId]
    );
    const items = itemsRes.rows;

    // 3. Lock & validate each product's inventory
    for (const item of items) {
      const invRes = await client.query(
        `SELECT physical_quantity, reserved_quantity 
         FROM inventory 
         WHERE product_id = $1 
         FOR UPDATE`,
        [item.product_id]
      );

      if (invRes.rows.length === 0) {
        throw { status: 400, message: `Inventory record missing for product ${item.product_id}` };
      }

      const { physical_quantity, reserved_quantity } = invRes.rows[0];
      const available_quantity = physical_quantity - reserved_quantity;

      if (available_quantity < item.quantity) {
        throw { 
          status: 400, 
          message: `Insufficient inventory for product. Available: ${available_quantity}, Required: ${item.quantity}` 
        };
      }

      // 4. Increment reserved_quantity (Physical quantity DOES NOT decrease!)
      await client.query(
        `UPDATE inventory 
         SET reserved_quantity = reserved_quantity + $1, updated_at = NOW()
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 5. Update order status to CONFIRMED
    const updatedOrder = await client.query(
      `UPDATE sales_orders 
       SET status = 'CONFIRMED', confirmed_by = $1, confirmed_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [adminUserId, orderId]
    );

    await client.query('COMMIT');
    return updatedOrder.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

---

## 5. Core Business Logic & Mathematical Engine

### 5.1 Quotation Pricing Engine (Backend Mandate)
> [!IMPORTANT]
> **Strict Rule (Case Study Page 4):**  
> *"Final quotation amount must be calculated or validated by the backend. Do not blindly accept a final amount sent by React."*

#### Mathematical Formulas
For each line item $i$:
1. $\text{Line Base Amount}_i = \text{Quantity}_i \times \text{Unit Price}_i$
2. $\text{Line Discount Amount}_i = \text{Line Base Amount}_i \times \left(\frac{\text{Discount \%}_i}{100}\right)$
3. $\text{Taxable Amount}_i = \text{Line Base Amount}_i - \text{Line Discount Amount}_i$
4. $\text{Line GST Amount}_i = \text{Taxable Amount}_i \times \left(\frac{\text{GST \%}_i}{100}\right)$
5. $\text{Line Total}_i = \text{Taxable Amount}_i + \text{Line GST Amount}_i$

For the overall Quotation:
- $\text{Total Base} = \sum \text{Line Base Amount}_i$
- $\text{Total Discount} = \sum \text{Line Discount Amount}_i$
- $\text{Total GST} = \sum \text{Line GST Amount}_i$
- $\text{Grand Total} = \sum \text{Line Total}_i$

All rounding uses fixed 2-decimal arithmetic (`round(val * 100) / 100`).

---

### 5.2 Quotation to Sales Order Conversion Rules
1. **Status Gate:** Only quotations with status `'ACCEPTED'` can be converted.
2. **Rejection Guards:** Quotations in `'DRAFT'`, `'SENT'`, or `'REJECTED'` status trigger `400 Bad Request`.
3. **Duplicate Prevention:** The database column `sales_orders.quotation_id` has a `UNIQUE` constraint. If a user clicks convert multiple times, the transaction rolls back with a `409 Conflict: Quotation already converted to Sales Order`.
4. **State Transition:** Upon successful conversion, the parent enquiry status transitions to `'WON'`.

---

### 5.3 Dispatch Execution Rules
When an Admin executes a dispatch:
1. **Order Status Check:** Must be `'CONFIRMED'`. Cannot dispatch `'PENDING'`, `'CANCELLED'`, or already `'DISPATCHED'` orders.
2. **Stock Deduction Formula:**
   - $\text{Physical Quantity}_{\text{new}} = \text{Physical Quantity}_{\text{old}} - \text{Dispatched Quantity}$
   - $\text{Reserved Quantity}_{\text{new}} = \text{Reserved Quantity}_{\text{old}} - \text{Dispatched Quantity}$
   - $\text{Available Quantity} = \text{Physical}_{\text{new}} - \text{Reserved}_{\text{new}} = \text{Remains Identical!}$
3. **Example Proof (Case Study Page 6):**
   - Before: Physical = 100, Reserved = 60, Available = 40.
   - Dispatch = 60.
   - After: Physical = 40, Reserved = 0, Available = 40.
4. **Order Status Transition:** The sales order status becomes `'DISPATCHED'`.

```typescript
// src/services/dispatch.service.ts
export async function processDispatch(
  orderId: string, 
  dispatchData: { vehicleNumber: string; driverName: string }, 
  adminUserId: string
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock order
    const orderRes = await client.query(
      `SELECT * FROM sales_orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    );

    if (orderRes.rows.length === 0) throw { status: 404, message: 'Order not found' };
    const order = orderRes.rows[0];

    if (order.status !== 'CONFIRMED') {
      throw { status: 400, message: `Cannot dispatch order in "${order.status}" status. Must be CONFIRMED.` };
    }

    // 2. Fetch order items
    const itemsRes = await client.query(
      `SELECT product_id, quantity FROM sales_order_items WHERE sales_order_id = $1`,
      [orderId]
    );

    // 3. Generate dispatch number (e.g. DSP-2026-0001)
    const dspNumRes = await client.query(
      `SELECT 'DSP-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(COALESCE(COUNT(*) + 1, 1)::TEXT, 4, '0') as num FROM dispatches`
    );
    const dispatchNumber = dspNumRes.rows[0].num;

    // 4. Create dispatch record
    const dspRes = await client.query(
      `INSERT INTO dispatches (dispatch_number, sales_order_id, vehicle_number, driver_name, processed_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [dispatchNumber, orderId, dispatchData.vehicleNumber, dispatchData.driverName, adminUserId]
    );
    const dispatchId = dspRes.rows[0].id;

    // 5. Decrement BOTH Physical and Reserved quantities
    for (const item of itemsRes.rows) {
      // Create dispatch item
      await client.query(
        `INSERT INTO dispatch_items (dispatch_id, product_id, quantity) VALUES ($1, $2, $3)`,
        [dispatchId, item.product_id, item.quantity]
      );

      // Lock & Update inventory
      const invRes = await client.query(
        `SELECT physical_quantity, reserved_quantity FROM inventory WHERE product_id = $1 FOR UPDATE`,
        [item.product_id]
      );
      const { physical_quantity, reserved_quantity } = invRes.rows[0];

      if (reserved_quantity < item.quantity || physical_quantity < item.quantity) {
        throw { status: 400, message: 'Stock discrepancy detected during dispatch' };
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

    // 6. Mark Sales Order as DISPATCHED
    await client.query(
      `UPDATE sales_orders SET status = 'DISPATCHED' WHERE id = $1`,
      [orderId]
    );

    await client.query('COMMIT');
    return dspRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

---

## 6. API Specification & Backend Role-Based Access Control (RBAC)

### 6.1 RBAC Permission Matrix
| API Endpoint | HTTP Method | Allowed Role | Function |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | Public | User authentication, issues JWT |
| `/api/auth/me` | GET | Authenticated | Get current profile & role |
| `/api/products` | GET | Authenticated | View product list |
| `/api/inventory` | GET | Authenticated | View physical, reserved, available stock |
| `/api/enquiries` | GET | Authenticated | List all enquiries |
| `/api/enquiries` | POST | SALES, ADMIN | Create customer & enquiry with multi-product items |
| `/api/quotations` | GET | Authenticated | List all quotations |
| `/api/quotations` | POST | SALES, ADMIN | Generate quotation against enquiry with server calculation |
| `/api/quotations/:id/status` | PATCH | SALES, ADMIN | Change status (DRAFT ➔ SENT ➔ ACCEPTED / REJECTED) |
| `/api/quotations/:id/convert` | POST | SALES, ADMIN | Convert ACCEPTED quotation to Sales Order |
| `/api/sales-orders` | GET | Authenticated | List sales orders with stock status |
| `/api/sales-orders/:id/confirm` | POST | **ADMIN ONLY** | Confirm order & reserve stock (Row lock transaction) |
| `/api/sales-orders/:id/dispatch`| POST | **ADMIN ONLY** | Process vehicle/driver dispatch & deduct stock |

---

### 6.2 Authentication & Authorization Middleware Implementation

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'SALES';
  };
}

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'case-study-secret') as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...allowedRoles: ('ADMIN' | 'SALES')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden: User role '${req.user.role}' lacks permission. Required: [${allowedRoles.join(', ')}]` 
      });
    }
    next();
  };
}
```

---

## 7. Frontend Architecture (The 4 Required Screens)

Per Case Study Page 7: *"Build only these 4 main screens. Do not spend excessive time on UI design. A clean, functional and responsive interface is sufficient."*

```
┌────────────────────────────────────────────────────────────────────────┐
│  Top Navigation: Mini ERP | [Enquiries] [Quotations] [Sales Orders]    │
│  User: System Admin (Role: ADMIN) [Logout]                             │
└────────────────────────────────────────────────────────────────────────┘
```

### Screen 1: Login
- Clean card with Email, Password input fields.
- **Demo Quick-Fill Buttons:**
  - `[Login as Admin]` (admin@erp.com / Password@123)
  - `[Login as Sales]` (sales@erp.com / Password@123)
- Stores JWT in `localStorage` and redirects to the active screen.

### Screen 2: Enquiries (Create and View)
- **View Tab:** Table displaying Enquiry Number, Customer Name, City, Enquiry Date, Required Date, Item Count, Status badge (`NEW`, `QUOTED`, `WON`, `LOST`).
- **Create Modal / Drawer:**
  - Customer Information: Company Name, Contact Person, Mobile, Email, City.
  - Enquiry Details: Required Date, Notes.
  - Dynamic Item List: Add product row dropdown (with live unit price reference), Quantity input, `[+ Add Item]` / `[- Remove]`.
  - Submit Button: Creates customer and enquiry in a single request.

### Screen 3: Quotations (Create, Review, Accept/Reject)
- **View Tab:** Table displaying Quotation Number, Enquiry Ref, Customer Name, Grand Total, Valid Date, Status (`DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`).
- **Action Buttons per row:**
  - If `DRAFT` ➔ `[Mark Sent]`
  - If `SENT` ➔ `[Accept]` & `[Reject]`
  - If `ACCEPTED` ➔ `[Convert to Sales Order]` (Disabled if already converted).
- **Create Quotation Modal:**
  - Select Enquiry (auto-fills customer & products).
  - Editable Unit Price, Discount % (0-100), GST % (18% default).
  - Real-time client-side calculation preview for user convenience.
  - Backend validation notification to assure exact mathematical match.

### Screen 4: Sales Orders & Stock Reservation
- **Header Stock Bar:** Miniature live stock summary table showing all 6 industrial products with `Physical`, `Reserved`, and `Available` quantities. Highlight low availability in amber.
- **Sales Order Table:**
  - Columns: Order #, Quotation Ref, Customer, Total Amount, Status (`PENDING`, `CONFIRMED`, `DISPATCHED`, `CANCELLED`).
  - **Admin Action 1 - Confirm & Reserve:**
    - Button visible only to `ADMIN`. (Sales user sees read-only status badge).
    - On click, triggers `/api/sales-orders/:id/confirm`.
    - If stock is insufficient, shows clear error toast: *"Cannot reserve 80 units: Only 70 available."*
  - **Admin Action 2 - Process Dispatch:**
    - Visible when status is `CONFIRMED`.
    - Opens Dispatch Modal with inputs: `Vehicle Number` (e.g., MH-12-AB-9876), `Driver Name` (e.g., Ramesh Patil).
    - Submits to `/api/sales-orders/:id/dispatch`. Live updates stock table instantly!

---

## 8. Automated Test Suite (Mandatory 5 + Concurrency Bonus)

Implement using **Jest + Supertest** (`tests/erp_workflow.test.ts`):

```typescript
import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/config/database';

let adminToken: string;
let salesToken: string;
let testProductId: string;
let testEnquiryId: string;
let testQuotationId: string;
let testOrderId: string;

beforeAll(async () => {
  // Login Admin
  const adminRes = await request(app).post('/api/auth/login').send({
    email: 'admin@erp.com',
    password: 'Password@123'
  });
  adminToken = adminRes.body.token;

  // Login Sales
  const salesRes = await request(app).post('/api/auth/login').send({
    email: 'sales@erp.com',
    password: 'Password@123'
  });
  salesToken = salesRes.body.token;

  // Query a seeded product
  const pRes = await pool.query(`SELECT id FROM products WHERE product_code = 'IND-VLV-01'`);
  testProductId = pRes.rows[0].id;
});

afterAll(async () => {
  await pool.end();
});

describe('Industrial ERP Assessment Suite', () => {

  // TEST 1: Quotation total is calculated correctly
  test('Test 1: Quotation total is calculated correctly on the backend', async () => {
    // Create enquiry first
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        companyName: 'Test Automation Ltd',
        contactPerson: 'QA Lead',
        mobile: '9988776655',
        email: 'qa@test.com',
        city: 'Mumbai',
        requiredDate: '2026-10-01',
        items: [{ productId: testProductId, quantity: 10 }]
      });
    testEnquiryId = enqRes.body.id;

    // Unit Price = 4500, Qty = 10, Base = 45000
    // Discount = 10% -> 4500. Taxable = 40500
    // GST = 18% -> 7290. Grand Total = 47790
    const quoteRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiryId: testEnquiryId,
        validUntil: '2026-12-31',
        items: [{
          productId: testProductId,
          quantity: 10,
          unitPrice: 4500,
          discountPercentage: 10,
          gstPercentage: 18
        }]
      });

    expect(quoteRes.status).toBe(201);
    expect(Number(quoteRes.body.totalBaseAmount)).toBe(45000);
    expect(Number(quoteRes.body.totalDiscountAmount)).toBe(4500);
    expect(Number(quoteRes.body.totalGstAmount)).toBe(7290);
    expect(Number(quoteRes.body.grandTotal)).toBe(47790);
    testQuotationId = quoteRes.body.id;
  });

  // TEST 2: Rejected/Draft quotation cannot create a Sales Order
  test('Test 2: Rejected/Draft quotation cannot create a Sales Order', async () => {
    // Attempt conversion while quotation is still DRAFT
    const resDraft = await request(app)
      .post(`/api/quotations/${testQuotationId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);
    
    expect(resDraft.status).toBe(400);
    expect(resDraft.body.error).toMatch(/ACCEPTED/i);

    // Reject quotation
    await request(app)
      .patch(`/api/quotations/${testQuotationId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'REJECTED' });

    // Attempt conversion while REJECTED
    const resRejected = await request(app)
      .post(`/api/quotations/${testQuotationId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(resRejected.status).toBe(400);
  });

  // TEST 3: Same quotation cannot generate duplicate Sales Orders
  test('Test 3: Same quotation cannot generate duplicate Sales Orders', async () => {
    // Set status to ACCEPTED
    await request(app)
      .patch(`/api/quotations/${testQuotationId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'ACCEPTED' });

    // First conversion: Must Succeed
    const res1 = await request(app)
      .post(`/api/quotations/${testQuotationId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);
    
    expect(res1.status).toBe(201);
    testOrderId = res1.body.id;

    // Second conversion: Must Fail with 409 Conflict
    const res2 = await request(app)
      .post(`/api/quotations/${testQuotationId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);
    
    expect(res2.status).toBe(409);
  });

  // TEST 4: Cannot reserve more than available inventory
  test('Test 4: Cannot reserve more than available inventory', async () => {
    // Query available stock
    const invRes = await pool.query(
      `SELECT physical_quantity, reserved_quantity FROM inventory WHERE product_id = $1`,
      [testProductId]
    );
    const available = invRes.rows[0].physical_quantity - invRes.rows[0].reserved_quantity;

    // Create custom order demanding available + 100
    const overDemandQty = available + 100;
    const fakeOrderRes = await pool.query(
      `INSERT INTO sales_orders (order_number, quotation_id, customer_id, total_amount, status)
       VALUES ('SO-OVERDEMAND', uuid_generate_v4(), (SELECT id FROM customers LIMIT 1), 99999, 'PENDING')
       RETURNING id`
    );
    const overOrderId = fakeOrderRes.rows[0].id;
    await pool.query(
      `INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, line_total)
       VALUES ($1, $2, $3, 1000, 1000)`,
      [overOrderId, testProductId, overDemandQty]
    );

    // Admin tries to confirm
    const confirmRes = await request(app)
      .post(`/api/sales-orders/${overOrderId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(confirmRes.status).toBe(400);
    expect(confirmRes.body.error).toMatch(/insufficient/i);
  });

  // TEST 5: Unauthorized user cannot perform a restricted operation
  test('Test 5: Sales User cannot confirm sales orders or process dispatch (403 Forbidden)', async () => {
    // Sales User tries to confirm order
    const confirmRes = await request(app)
      .post(`/api/sales-orders/${testOrderId}/confirm`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(confirmRes.status).toBe(403);

    // Sales User tries to dispatch
    const dispatchRes = await request(app)
      .post(`/api/sales-orders/${testOrderId}/dispatch`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ vehicleNumber: 'MH-12-QA-1000', driverName: 'Test Driver' });

    expect(dispatchRes.status).toBe(403);
  });

  // BONUS TEST: Simultaneous inventory reservations (Race condition prevention)
  test('Bonus Test: Simultaneous inventory reservations handle race condition safely', async () => {
    // Create dedicated product with stock = 100, reserved = 0 (Available = 100)
    const prodRes = await pool.query(
      `INSERT INTO products (product_code, product_name, category, base_price)
       VALUES ('CONCURRENCY-TEST', 'Concurrency Test Item', 'Testing', 100)
       RETURNING id`
    );
    const concProdId = prodRes.rows[0].id;
    await pool.query(
      `INSERT INTO inventory (product_id, physical_quantity, reserved_quantity)
       VALUES ($1, 100, 0)`,
      [concProdId]
    );

    // Create Order A: Requires 80 units
    const ordARes = await pool.query(
      `INSERT INTO sales_orders (order_number, quotation_id, customer_id, total_amount, status)
       VALUES ('SO-RACE-A', uuid_generate_v4(), (SELECT id FROM customers LIMIT 1), 8000, 'PENDING')
       RETURNING id`
    );
    const orderA = ordARes.rows[0].id;
    await pool.query(
      `INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, line_total)
       VALUES ($1, $2, 80, 100, 8000)`,
      [orderA, concProdId]
    );

    // Create Order B: Requires 50 units
    const ordBRes = await pool.query(
      `INSERT INTO sales_orders (order_number, quotation_id, customer_id, total_amount, status)
       VALUES ('SO-RACE-B', uuid_generate_v4(), (SELECT id FROM customers LIMIT 1), 5000, 'PENDING')
       RETURNING id`
    );
    const orderB = ordBRes.rows[0].id;
    await pool.query(
      `INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, line_total)
       VALUES ($1, $2, 50, 100, 5000)`,
      [orderB, concProdId]
    );

    // Fire both reservation requests simultaneously using Promise.all
    const [resA, resB] = await Promise.all([
      request(app).post(`/api/sales-orders/${orderA}/confirm`).set('Authorization', `Bearer ${adminToken}`),
      request(app).post(`/api/sales-orders/${orderB}/confirm`).set('Authorization', `Bearer ${adminToken}`)
    ]);

    const statuses = [resA.status, resB.status];
    // Exactly one must succeed (200) and one must fail (400)
    expect(statuses).toContain(200);
    expect(statuses).toContain(400);

    // Verify DB inventory: Reserved quantity must never exceed 100!
    const finalInv = await pool.query(`SELECT * FROM inventory WHERE product_id = $1`, [concProdId]);
    expect(finalInv.rows[0].reserved_quantity).toBeLessThanOrEqual(100);
  });

});
```

---

## 9. Step-by-Step Implementation Roadmap (Zero to Working System)

### Step 1: Project Initialization & Structure
Create a standard monorepo structure:
```
industrial-erp/
├── backend/
│   ├── src/
│   │   ├── config/ (db.ts, env.ts)
│   │   ├── controllers/ (auth, enquiry, quotation, order, dispatch, inventory)
│   │   ├── middleware/ (auth.ts, validator.ts, error.ts)
│   │   ├── services/ (enquiry.service.ts, quotation.service.ts, order.service.ts, dispatch.service.ts)
│   │   ├── routes/ (api router index)
│   │   └── app.ts & server.ts
│   ├── tests/ (erp_workflow.test.ts)
│   ├── schema.sql & seed.sql
│   ├── package.json & tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/ (Navbar.tsx, InventoryBar.tsx, Modal.tsx)
│   │   ├── pages/ (Login.tsx, Enquiries.tsx, Quotations.tsx, SalesOrders.tsx)
│   │   ├── api/ (axiosClient.ts)
│   │   ├── context/ (AuthContext.tsx)
│   │   └── App.tsx
│   ├── package.json & vite.config.ts
│   └── tailwind.config.js
├── docker-compose.yml
└── README.md
```

### Step 2: Backend Setup Commands
```bash
mkdir industrial-erp && cd industrial-erp
mkdir backend frontend

# Backend initialization
cd backend
npm init -y
npm install express pg dotenv jsonwebtoken bcryptjs cors zod
npm install -D typescript @types/node @types/express @types/pg @types/jsonwebtoken @types/bcryptjs @types/cors ts-node-dev jest @types/jest ts-jest supertest @types/supertest
npx tsc --init
```

### Step 3: Database Migration & Seeding
```bash
# In PostgreSQL
createdb industrial_erp
psql -d industrial_erp -f schema.sql
psql -d industrial_erp -f seed.sql
```

### Step 4: Frontend Setup Commands
```bash
cd ../frontend
npm create vite@latest . -- --template react-ts
npm install axios lucide-react @tanstack/react-query clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 5: Git Commit Roadmap (Mandatory Submission Requirement)
> [!IMPORTANT]
> *"Repository should demonstrate reasonable development history. Do not submit the complete project as one final commit."*

Execute this sequence of 8 distinct, atomic commits:
1. `git commit -m "chore: initial project setup, monorepo layout and docker configuration"`
2. `git commit -m "feat(db): add relational schema DDL with check constraints and seed data"`
3. `git commit -m "feat(auth): implement JWT authentication and RBAC middleware"`
4. `git commit -m "feat(enquiry): implement customer and enquiry creation with multi-product items"`
5. `git commit -m "feat(quotation): implement pricing engine, backend GST calculation and acceptance workflow"`
6. `git commit -m "feat(orders): implement quotation-to-order conversion and row-locked inventory reservation"`
7. `git commit -m "feat(dispatch): implement dispatch processing and dual stock deduction"`
8. `git commit -m "feat(frontend): build 4 core screens (Login, Enquiries, Quotations, Orders/Dispatch)"`
9. `git commit -m "test: implement 5 mandatory integration tests and concurrency race condition test"`

---

## 10. Cloud Deployment & Docker Playbook

### 10.1 Single-Command Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: erp_postgres
    restart: always
    environment:
      POSTGRES_USER: erp_user
      POSTGRES_PASSWORD: erp_password
      POSTGRES_DB: industrial_erp
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/schema.sql:/docker-entrypoint-initdb.d/01_schema.sql
      - ./backend/seed.sql:/docker-entrypoint-initdb.d/02_seed.sql

  backend:
    build: ./backend
    container_name: erp_backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      PORT: 5000
      DATABASE_URL: postgres://erp_user:erp_password@postgres:5432/industrial_erp
      JWT_SECRET: super_secure_erp_jwt_secret_key_2026
      CORS_ORIGIN: http://localhost:5173
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    container_name: erp_frontend
    restart: always
    ports:
      - "5173:80"
    depends_on:
      - backend

volumes:
  pgdata:
```

### 10.2 Zero-Cost Cloud Deployment (Production Ready)
1. **Database:** Deploy PostgreSQL on **Neon.tech** or **Supabase** (Free Tier).
   - Copy connection string: `postgresql://user:password@ep-xyz.neon.tech/industrial_erp?sslmode=require`.
   - Run `schema.sql` and `seed.sql` using Neon SQL Editor or DBeaver.
2. **Backend:** Deploy on **Render.com** (Web Service, Node environment).
   - Set Build Command: `npm install && npm run build`
   - Set Start Command: `npm start`
   - Configure Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`.
3. **Frontend:** Deploy on **Vercel** or **Netlify**.
   - Framework preset: `Vite`
   - Set Build Command: `npm run build`
   - Set Output Directory: `dist`
   - Configure `VITE_API_BASE_URL` pointing to the Render backend URL.

---

## 11. Live Verification Round Defense Guide

Per Case Study Page 10–11: Shortlisted candidates receive an unannounced live modification (expected time: 20–30 minutes). Here are the exact solutions for both stated surprise changes:

### Surprise Scenario A: Adding "DAMAGED" Stock
**Requirement:** Add Damaged stock. Inventory maintains: `Physical`, `Reserved`, `Damaged`.  
Formula: $\text{Available} = \text{Physical} - \text{Reserved} - \text{Damaged}$.

#### 1. Database Change (3 Minutes)
```sql
ALTER TABLE inventory 
ADD COLUMN damaged_quantity INT NOT NULL DEFAULT 0 CHECK (damaged_quantity >= 0);

ALTER TABLE inventory 
DROP CONSTRAINT check_reservation_limit;

ALTER TABLE inventory 
ADD CONSTRAINT check_inventory_balance 
CHECK (physical_quantity >= (reserved_quantity + damaged_quantity));
```

#### 2. Backend Logic Update (5 Minutes)
Update the reservation validation inside `src/services/order.service.ts`:
```typescript
const { physical_quantity, reserved_quantity, damaged_quantity } = invRes.rows[0];
const available_quantity = physical_quantity - reserved_quantity - (damaged_quantity || 0);

if (available_quantity < item.quantity) {
  throw { status: 400, message: `Insufficient available inventory (taking damaged stock into account)` };
}
```

#### 3. API & Frontend Display Update (5 Minutes)
- In the Inventory GET API response: include `damaged_quantity` and compute `available_quantity`.
- In `InventoryBar.tsx` frontend component: add a column/pill for `Damaged` stock in red/orange.

---

### Surprise Scenario B: Sales Order Cancellation & Stock Release
**Requirement:** Allow a CONFIRMED Sales Order to be cancelled and correctly release its reserved inventory.

#### 1. Backend Service (`cancelSalesOrder`)
```typescript
export async function cancelSalesOrder(orderId: string, adminUserId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock order
    const orderRes = await client.query(
      `SELECT * FROM sales_orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    );
    if (orderRes.rows.length === 0) throw { status: 404, message: 'Order not found' };
    const order = orderRes.rows[0];

    // Only CONFIRMED orders hold active reservations that need releasing!
    if (order.status === 'DISPATCHED') {
      throw { status: 400, message: 'Cannot cancel an order that has already been dispatched' };
    }
    if (order.status === 'CANCELLED') {
      throw { status: 400, message: 'Order is already cancelled' };
    }

    if (order.status === 'CONFIRMED') {
      // 2. Fetch items
      const itemsRes = await client.query(
        `SELECT product_id, quantity FROM sales_order_items WHERE sales_order_id = $1`,
        [orderId]
      );

      // 3. Release reserved inventory
      for (const item of itemsRes.rows) {
        await client.query(
          `UPDATE inventory 
           SET reserved_quantity = GREATEST(0, reserved_quantity - $1),
               updated_at = NOW()
           WHERE product_id = $2`,
          [item.quantity, item.product_id]
        );
      }
    }

    // 4. Update order status
    await client.query(
      `UPDATE sales_orders SET status = 'CANCELLED' WHERE id = $1`,
      [orderId]
    );

    await client.query('COMMIT');
    return { success: true, message: 'Order cancelled and reserved stock released' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

---

## 12. 5-Minute Demo Video Script & Final Submission Checklist

### 12.1 Demo Video Script (5 Minutes Max)
- **0:00 - 0:45 (Architecture & Login):**
  - Briefly state: "Building industrial ERP workflow in PERN stack."
  - Log in as `sales@erp.com`. Show user role indicator in top navigation.
- **0:45 - 1:45 (Enquiry Creation):**
  - Navigate to **Enquiries**.
  - Create new enquiry for "ABC Engineering Pvt. Ltd.". Add 2 industrial products (e.g. 10 Valves, 5 Pumps). Submit and show `NEW` status badge.
- **1:45 - 2:45 (Quotation & Math Engine):**
  - Navigate to **Quotations**. Generate quotation for the enquiry.
  - Set unit prices, apply 10% discount and 18% GST.
  - Explain: *"Backend validates and recalculates base, discount, and tax to ensure frontend integrity."*
  - Mark as `SENT`, then click `[Accept]`.
  - Click `[Convert to Sales Order]`. Show redirection to Sales Orders screen with status `PENDING`.
- **2:45 - 4:00 (Stock Reservation & Concurrency):**
  - Notice action buttons are restricted for Sales user.
  - Log out and log in as `admin@erp.com`.
  - Highlight current Inventory Bar: Physical = 200, Reserved = 60, Available = 140.
  - Click `[Confirm & Reserve]`.
  - Point to live Inventory Bar: Physical remains 200, Reserved increases by 10 to 70, Available decreases to 130!
  - Highlight concurrency safeguard: *"Implemented via PostgreSQL `SELECT FOR UPDATE` and CHECK constraints."*
- **4:00 - 4:45 (Dispatch Execution):**
  - Click `[Process Dispatch]`. Enter Vehicle Number `MH-12-AB-9876` and Driver `Ramesh Patil`.
  - Submit dispatch. Show order status changed to `DISPATCHED`.
  - Show Inventory Bar update: Physical drops to 190, Reserved drops back to 60, Available remains 130!
- **4:45 - 5:00 (Automated Tests Summary):**
  - Switch to terminal, run `npm test`. Show 6 passing tests including the concurrency race condition test.

---

### 12.2 Final Submission Deliverables Checklist
- [x] **Git Repository:** GitHub public/private repo with 8+ progressive commits.
- [x] **README.md:** Complete setup instructions, env vars, test credentials, and architecture summary.
- [x] **Database Schema / ER Diagram:** Mermaid diagram and full `schema.sql` file.
- [x] **API Documentation:** REST endpoint specification with sample payloads.
- [x] **5 Automated Tests + Concurrency Bonus:** 100% passing test suite in Jest.
- [x] **Demo Video:** Under 5 minutes showcasing the full end-to-end business flow.
- [x] **Live Verification Preparedness:** Code snippets ready for "Damaged Stock" and "Order Cancellation".
