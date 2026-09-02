# ReviveX — Technical Documentation & Engineering Handover Report
**Enterprise B2B Circular Economy, E-Waste Management & Asset Recovery Platform**  
*Operated by Magniplex Logitech*

---

## Document Control & Metadata

| Attribute | Value |
| :--- | :--- |
| **Document Version** | 1.0.0 (Production Release Candidate) |
| **Project Name** | ReviveX Circular Platform |
| **Operating Entity** | Magniplex Logitech |
| **Primary Repository** | `https://github.com/LalithaSreya/ReviveX` |
| **Active Branches** | `main` (Production), `dev-1` (Feature Dev), `dev-2` (Latest Integrations) |
| **Framework / Runtime** | Next.js 15.3+ (App Router, Turbopack), Node.js v24.12.0 |
| **Database & Auth** | Supabase (PostgreSQL 15+, RLS, Security Definer Functions, Triggers) |
| **Last Technical Review** | September 2026 |
| **Document Target** | Engineering Leads, Core Developers, DevOps, QA, Maintenance Teams |

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Frontend Documentation](#4-frontend-documentation)
5. [Backend Documentation](#5-backend-documentation)
6. [Database Documentation](#6-database-documentation)
7. [API & Data Access Layer Documentation](#7-api--data-access-layer-documentation)
8. [CRM Modules, Workflows & Functionalities](#8-crm-modules-workflows--functionalities)
9. [Accounting Logic, Processes & Automation](#9-accounting-logic-processes--automation)
10. [Functionalities Implemented](#10-functionalities-implemented)
11. [Important Code Explanations](#11-important-code-explanations)
12. [Security Implementation](#12-security-implementation)
13. [Deployment Documentation](#13-deployment-documentation)
14. [Testing & Validation](#14-testing--validation)
15. [Known Limitations & Technical Debt](#15-known-limitations--technical-debt)
16. [Future Enhancements & Roadmap](#16-future-enhancements--roadmap)
17. [Maintenance & Developer Guide](#17-maintenance--developer-guide)

---

## 1. Project Overview

### 1.1 Project Name & Brand Hierarchy
* **Product Brand**: **ReviveX**
* **Operating Entity**: **Magniplex Logitech**
* **Tagline**: *Transforming Industrial Waste into Sustainable Value*

### 1.2 Purpose
ReviveX is an enterprise-grade B2B SaaS platform engineered for large-scale corporations, telecom networks, cement plants, and manufacturing conglomerates to systematically manage the lifecycle of decommissioned assets, industrial scrap, e-waste, repairable electrical machinery, and spare parts while automating regulatory environmental compliance.

### 1.3 Business Problem Solved
1. **Fragmented Scrap Supply Chain**: Eliminates unorganized scrap dealers with a trackable, transparent digital supply chain.
2. **Regulatory & ESG Compliance Gaps**: Automates generation of Government-compliant E-Waste Rules 2022 documents, ISO 14001 certificates, and certified Green Recycling receipts.
3. **Asset Depreciation & Value Loss**: Establishes refurbishment diagnostics and spare parts harvesting workflows to recover up to 60% of procurement asset value.
4. **Multi-Location Logistics Coordination**: Centralizes GPS-enabled pickup dispatching, certified weighbridge recording, and segregation yard processing.

### 1.4 Target Users & Stakeholders
* **Enterprise Clients**: Procurement Officers, ESG Compliance Directors, Facility Managers (e.g., Airtel, Jio, Vodafone Idea, UltraTech Cement).
* **Internal Operations (Magniplex Logitech)**: Operations Executives, Yard Supervisors, Logistics Coordinators, Field Inspectors, Technical Refurbishment Engineers, Super Admins.

### 1.5 Objectives & Scope
* **Phase 1 (Implemented)**: End-to-end client intake wizard, 12-stage live tracking timeline, yard segregation, inventory synchronizer, technical repair board, automated PDF/TXT certificate generator, and role-based permissions registry.
* **Phase 2 (Roadmap)**: Automated GPS telemetry stream integrations, real-time Razorpay/Stripe escrow payout settlement, and automated OCR weighbridge ticket scanning.

---

## 2. System Architecture

### 2.1 High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Client Tier [Client Tier - Browser]
        A1[Public Marketing & Assessment Portal]
        A2[Client Workspace /portal]
        A3[Admin Control Center /admin]
    end

    subgraph Application Tier [Application Tier - Next.js 15 Server & Edge]
        B1[Edge Middleware / Proxy Session Guard]
        B2[App Router React Server Components]
        B3[Client Components React Hook Form + Framer Motion]
        B4[Offline Demo Session Bridge localStorage]
    end

    subgraph Service & Data Tier [Data Tier - Supabase Cloud PostgreSQL]
        C1[Supabase Auth JWT GoTrue]
        C2[Database Engine 11 Relational Tables]
        C3[Row Level Security RLS Engine]
        C4[PL/pgSQL Trigger Engine Automatic Synchronization]
        C5[Storage Vault Compliance Documents]
    end

    A1 -->|HTTPS| B2
    A2 -->|HTTPS / Session Cookie| B1
    A3 -->|HTTPS / Role Gate| B1
    B1 --> B2
    B2 --> B3
    B3 <-->|Client REST / RPC| C1
    B3 <-->|Client PostgREST| C2
    B3 -.->|Fallback if Unconfigured| B4
    C2 --- C3
    C2 --- C4
    C2 --- C5
```

### 2.2 Component Interaction & Data Flow
1. **Client Request Ingestion**: The client completes the 6-step Request Wizard. Zod validates payload shape. Data is committed to `requests` and `materials`.
2. **Trigger-Driven Project Spawning**: When an Operations Executive approves the request in `/admin/requests`, PostgreSQL trigger `on_request_approval_create_project` creates an associated `projects` record and sets the tracking milestone.
3. **Logistics & Segregation**: Logistics routes are assigned in `collections`. Upon arrival at the yard, materials are updated to `segregated`, firing trigger `on_material_segregated_sync_inventory` which calculates net weights and logs balances into `inventory`.
4. **Repair Diagnostics**: Decommissioned machinery is routed to `/admin/repair` where diagnostic notes, spare parts extraction, and warranty periods (e.g., 6–12 months) are logged into `repairs`.
5. **Certificate Issuance**: Compliance documents are generated in `/admin/reports`, saved to `documents`, and instantly accessible for download by the client in `/portal/documents`.

### 2.3 User Journeys

```mermaid
sequenceDiagram
    autonumber
    actor Client as B2B Client (Airtel)
    actor Admin as Operations (Magniplex Logitech)
    participant Portal as ReviveX Web App
    participant DB as Supabase PostgreSQL

    Client->>Portal: Submit 6-Step Scrap/E-Waste Request
    Portal->>DB: Insert into 'requests' & 'materials' (status: submitted)
    Admin->>Portal: Review Request Queue (/admin/requests)
    Admin->>Portal: Schedule Inspection & Click 'Approve Request'
    Portal->>DB: Update request status = 'approved'
    Note over DB: Trigger creates row in 'projects'
    Admin->>Portal: Assign Driver & Truck (/admin/operations)
    Portal->>DB: Insert into 'collections' (status: pickup_scheduled)
    Admin->>Portal: Weigh & Segregate Raw Commodities
    Portal->>DB: Update materials segregation_status = 'segregated'
    Note over DB: Trigger increments balances in 'inventory'
    Admin->>Portal: Issue ISO Certificate (/admin/reports)
    Portal->>DB: Insert into 'documents'
    Client->>Portal: Access Compliance Vault (/portal/documents)
    Client->>Portal: Download Authorized Certificate
```

---

## 3. Technology Stack

### 3.1 Stack Summary Table

| Layer | Technology | Version | Key Justification |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `15.3.1` (Turbopack) | Server Components, asynchronous cookies, optimal SEO, edge runtime compatibility. |
| **Language** | TypeScript | `^5.0.0` | Strict type safety, interface-driven database modeling, compile-time error prevention. |
| **Styling** | Tailwind CSS v4 | `^4.0.0` | `@theme inline` CSS variable mapping, zero-runtime overhead, high-performance styling. |
| **UI Components** | Custom + shadcn/ui patterns | N/A | Accessible primitives, Bento Grid layouts, high-contrast inputs. |
| **Icons** | Lucide React | `^1.16.0` | Modern, clean vector iconography tailored for enterprise dashboards. |
| **Animations** | Framer Motion | `^12.4.7` | Hardware-accelerated UI state transitions, timeline step pulses, modal animations. |
| **Forms & Validation** | React Hook Form + Zod | `^7.54` / `^4.3` | Type-safe form validation with zero unnecessary component re-renders. |
| **Database** | PostgreSQL on Supabase | `15+` | Relational integrity, ACID compliance, native JSONB, built-in RLS policies. |
| **Auth & Security** | Supabase Auth (GoTrue) | `@supabase/ssr` | Secure HTTP-only cookie session handling, JWT validation, security-definer SQL helpers. |
| **Deployment** | Vercel Platform | Production | Automated CI/CD git triggers, global edge proxy, zero-configuration Next.js hosting. |

---

## 4. Frontend Documentation

### 4.1 Directory Structure
```
ReviveX/
├── public/
│   ├── images/
│   │   ├── asset_recovery.png
│   │   ├── e_waste_management.png
│   │   ├── refurbishment.png
│   │   ├── scrap_collection.png
│   │   ├── spare_parts.png
│   │   └── sustainability_reporting.png
│   ├── favicon.ico
│   └── globe.svg
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── inventory/page.tsx     # Warehouse inventory auditing & stock release
│   │   │   ├── operations/page.tsx    # Fleet logistics dispatch & material segregation
│   │   │   ├── projects/page.tsx      # Project status & executive assignment
│   │   │   ├── repair/page.tsx        # Technical repair diagnostics & warranty logger
│   │   │   ├── reports/page.tsx       # ISO compliance certificate & invoice generator
│   │   │   ├── requests/page.tsx      # Inbound request auditing & approval queue
│   │   │   ├── users/page.tsx         # User permissions & role management
│   │   │   ├── layout.tsx             # Admin sidebar layout & role-guard
│   │   │   └── page.tsx               # Admin operations overview dashboard
│   │   ├── login/page.tsx             # Corporate authentication with offline demo bypass
│   │   ├── portal/
│   │   │   ├── documents/page.tsx     # B2B compliance vault & instant download hooks
│   │   │   ├── projects/page.tsx      # Client project status ledgers
│   │   │   ├── requests/page.tsx      # 6-step request wizard & 12-stage timeline tracker
│   │   │   ├── support/page.tsx       # Support ticket submission form
│   │   │   ├── layout.tsx             # Client portal sidebar & session validator
│   │   │   └── page.tsx               # Client executive metrics & ESG impact summary
│   │   ├── register/page.tsx          # B2B company registration & GSTIN validation
│   │   ├── globals.css                # Tailwind v4 theme, font variables & high-contrast rules
│   │   ├── layout.tsx                 # Root layout with Manrope & Inter Google Fonts
│   │   └── page.tsx                   # Public marketing, Bento Grid, & assessment intake
│   ├── components/
│   │   └── custom/
│   │       ├── bento-grid.tsx         # Responsive Bento Grid card primitives
│   │       ├── counter.tsx            # requestAnimationFrame number count-up animator
│   │       ├── lifecycle-map.tsx      # Interactive 6-node SVG circular lifecycle engine
│   │       ├── progress-ring.tsx      # SVG circular progress gauge
│   │       ├── timeline.tsx           # 12-stage vertical operational timeline
│   │       └── upload-widget.tsx      # Drag-and-drop file upload component
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser context Supabase client
│   │   │   ├── middleware.ts          # Edge middleware session refresh utility
│   │   │   └── server.ts              # Server Component Supabase client (async cookies)
│   │   ├── utils.ts                   # clsx and tailwind-merge utility
│   │   └── validation.ts              # Zod validation schemas for all application forms
│   └── middleware.ts                  # Global Next.js route middleware session synchronizer
├── supabase_schema.sql                # Complete database schema, RLS, & SQL triggers
├── package.json
└── tsconfig.json
```

### 4.2 Typography & Theme Configuration
* **Display / Heading Font**: **`Manrope`** (Configured as `--font-heading` in `globals.css`). Used for all `h1`, `h2`, `h3` headers.
* **Body / UI Font**: **`Inter`** (Configured as `--font-sans` in `globals.css`). Used for labels, inputs, tables, and metric values.
* **Color Palette**:
  * Primary: Deep Emerald Green (`#064e3b` / `emerald-950`, `#047857` / `emerald-700`)
  * Secondary: Forest Teal (`#0f766e` / `teal-700`, `#134e4a` / `teal-900`)
  * Neutral Backgrounds: Slate-50 (`#f8fafc`), Clean White (`#ffffff`)
  * High-Contrast Input Placeholders: Slate-500 (`#64748b` with `opacity: 1 !important`)

---

## 5. Backend Documentation

### 5.1 Architecture & Edge Integration
Next.js 15 App Router utilizes a hybrid backend model:
* **Server Components**: Directly fetch server-side data with full TypeScript safety.
* **Route Middleware (`src/middleware.ts`)**: Invokes `@supabase/ssr` to update and synchronize authentication tokens on edge requests.
* **Server Supabase Client (`src/lib/supabase/server.ts`)**: Built with asynchronous `await cookies()` to comply with Next.js 15 asynchronous request headers specification.

### 5.2 Server Client Implementation
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handled safely in Server Components
          }
        },
      },
    }
  )
}
```

---

## 6. Database Documentation

### 6.1 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    COMPANIES ||--o{ PROFILES : "has many"
    COMPANIES ||--o{ REQUESTS : "submits"
    PROFILES ||--o{ REQUESTS : "creates"
    PROFILES ||--o{ PROJECTS : "manages (staff)"
    PROFILES ||--o{ NOTIFICATIONS : "receives"
    PROFILES ||--o{ ACTIVITY_LOGS : "triggers"
    REQUESTS ||--o| PROJECTS : "generates"
    REQUESTS ||--o{ MATERIALS : "contains"
    REQUESTS ||--o{ DOCUMENTS : "attached to"
    PROJECTS ||--o{ COLLECTIONS : "schedules"
    PROJECTS ||--o{ REPAIRS : "tracks"
    PROJECTS ||--o{ DOCUMENTS : "issues"
    MATERIALS ||--o| INVENTORY : "segregates into"

    COMPANIES {
        uuid id PK
        text name
        text contact_person
        text mobile_number
        text email
        text location
        text gst_number
        timestamptz created_at
    }

    PROFILES {
        uuid id PK, FK
        text full_name
        text email
        user_role role
        uuid company_id FK
    }

    REQUESTS {
        uuid id PK
        uuid company_id FK
        uuid client_user_id FK
        request_type request_type
        text pickup_location
        date preferred_date
        request_status status
    }

    PROJECTS {
        uuid id PK
        text title
        uuid request_id FK
        uuid assigned_executive_id FK
        project_status status
    }

    MATERIALS {
        uuid id PK
        uuid request_id FK
        material_category category
        numeric weight
        material_unit units
        segregation_status segregation_status
    }

    INVENTORY {
        uuid id PK
        uuid material_id FK
        text item_name
        numeric weight_kg
        inventory_status status
    }

    REPAIRS {
        uuid id PK
        uuid project_id FK
        text product_name
        text serial_number
        text diagnosis
        repair_status status
        int warranty_months
    }

    DOCUMENTS {
        uuid id PK
        uuid project_id FK
        uuid request_id FK
        text name
        document_type type
        text file_url
    }
```

### 6.2 Data Dictionary (Table Specifications)

#### Table 1: `companies`
Stores B2B corporate organizations and enterprise clients onboarded to the platform.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `default gen_random_uuid()` | Unique company identifier. |
| `name` | `TEXT` | `NOT NULL` | Registered company trade name. |
| `contact_person` | `TEXT` | `NULL` | Primary corporate representative name. |
| `mobile_number` | `TEXT` | `NULL` | Primary phone contact. |
| `email` | `TEXT` | `NULL` | Billing/operational corporate email. |
| `location` | `TEXT` | `NULL` | Corporate head office address. |
| `gst_number` | `TEXT` | `UNIQUE, NOT NULL` | 15-character statutory GST identification number. |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT timezone('utc', now())` | Record insertion timestamp. |

#### Table 2: `profiles`
Extends `auth.users` with RBAC roles and corporate company linkages.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, References `auth.users.id` | Link to Supabase Auth user. |
| `full_name` | `TEXT` | `NOT NULL` | Member's full name. |
| `email` | `TEXT` | `NOT NULL` | Login corporate email. |
| `role` | `user_role` | `DEFAULT 'client_user'` | Enum: `super_admin`, `operations_executive`, `client_relationship_executive`, `field_executive`, `repair_technical_executive`, `accounts_inventory_executive`, `client_user`. |
| `company_id` | `UUID` | Foreign Key -> `companies.id` | Parent company association (null for internal staff). |

#### Table 3: `requests`
Core operational intake records submitted by B2B clients.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `default gen_random_uuid()` | Unique request tracking code. |
| `company_id` | `UUID` | FK -> `companies.id`, `NOT NULL` | Submitting B2B organization. |
| `client_user_id` | `UUID` | FK -> `profiles.id` | Submitting representative. |
| `request_type` | `request_type`| `NOT NULL` | Enum: `e_waste_disposal`, `scrap_collection`, `tender_project`, `repairing`, `spare_parts_requirement`, `material_purchase_sale`. |
| `pickup_location` | `TEXT` | `NOT NULL` | Specific plant or yard location. |
| `preferred_date` | `DATE` | `NULL` | Requested collection date. |
| `status` | `request_status`| `DEFAULT 'submitted'` | 12 lifecycle stages (see Section 8). |

#### Table 4: `projects`
Created automatically via database trigger once a request is approved.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, `default gen_random_uuid()` | Project file code. |
| `title` | `TEXT` | `NOT NULL` | Project title (auto-generated). |
| `request_id` | `UUID` | FK -> `requests.id`, `UNIQUE` | Originating request. |
| `assigned_executive_id`| `UUID`| FK -> `profiles.id` | Appointed operations manager. |
| `status` | `project_status`| `DEFAULT 'active'` | `active`, `completed`, `cancelled`, `on_hold`. |

#### Table 5: `materials`
Detailed line-item inventory attached to pickup requests.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Material line item ID. |
| `request_id` | `UUID` | FK -> `requests.id`, `CASCADE` | Parent request. |
| `category` | `material_category`| `NOT NULL` | `copper`, `aluminium`, `iron`, `e_waste`, `wood`, `other_scrap`. |
| `quantity` | `NUMERIC` | `DEFAULT 0` | Quantity / unit count. |
| `weight` | `NUMERIC` | `DEFAULT 0` | Estimated net weight. |
| `units` | `material_unit` | `DEFAULT 'kg'` | `kg`, `tons`, `units`. |
| `segregation_status`| `segregation_status`| `DEFAULT 'pending'` | `pending`, `in_progress`, `segregated`. |

#### Table 6: `inventory`
Physical warehouse stock balances updated automatically when scrap is segregated.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Inventory SKU identifier. |
| `material_id` | `UUID` | FK -> `materials.id` | Originating material reference. |
| `item_name` | `TEXT` | `NOT NULL` | Commodity / item designation. |
| `weight_kg` | `NUMERIC` | `DEFAULT 0` | Physical stock weight in kilograms. |
| `status` | `inventory_status`| `DEFAULT 'in_stock'` | `in_stock`, `reserved`, `dispatched`, `recycled`. |

#### Table 7: `repairs`
Refurbishment and diagnostic logs for industrial electronics and telecom equipment.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Repair intake tracking number. |
| `project_id` | `UUID` | FK -> `projects.id` | Associated circular project. |
| `product_name` | `TEXT` | `NOT NULL` | Equipment name (e.g. Cisco Router 4331). |
| `serial_number` | `TEXT` | `NULL` | OEM hardware serial number. |
| `diagnosis` | `TEXT` | `NULL` | Technical engineer diagnostic notes. |
| `status` | `repair_status` | `DEFAULT 'intake'` | `intake`, `diagnosis`, `repaired`, `tested_passed`, `scrap_recycled`. |
| `warranty_months` | `INTEGER` | `DEFAULT 0` | Certified warranty issued (0–24 months). |

#### Table 8: `documents`
Compliance records, tax invoices, and recycling certificates.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Document archive code. |
| `project_id` | `UUID` | FK -> `projects.id` | Target project. |
| `name` | `TEXT` | `NOT NULL` | Document display title. |
| `type` | `document_type` | `NOT NULL` | `collection_receipt`, `weight_report`, `recycling_certificate`, `invoice`, `warranty_info`, `project_completion_report`. |
| `file_url` | `TEXT` | `NOT NULL` | Static or Supabase Storage URL. |

---

### 6.3 Automated Database Triggers & Stored Functions

#### Trigger 1: Auth User Profile Synchronization (`on_auth_user_created`)
Synchronizes metadata provided during Supabase Auth signup directly into the `profiles` table.
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Client Representative'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'client_user'::public.user_role),
    (NEW.raw_user_meta_data->>'company_id')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Trigger 2: Automatic Project Spawning on Request Approval (`on_request_approval_create_project`)
Automatically generates an active project tracking record when an internal executive approves a client request.
```sql
CREATE OR REPLACE FUNCTION public.handle_request_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    IF NOT EXISTS (SELECT 1 FROM public.projects WHERE request_id = NEW.id) THEN
      INSERT INTO public.projects (title, request_id, status, start_date)
      VALUES (
        'Circular Recovery #' || SUBSTRING(NEW.id::text, 1, 8),
        NEW.id,
        'active',
        CURRENT_DATE
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_request_approval_create_project
  AFTER UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_request_approval();
```

#### Trigger 3: Automated Warehouse Inventory Synchronization (`on_material_segregated_sync_inventory`)
Calculates net weights and increments physical warehouse inventory balances when raw materials are sorted at the yard.
```sql
CREATE OR REPLACE FUNCTION public.handle_material_segregation()
RETURNS TRIGGER AS $$
DECLARE
  v_weight_kg NUMERIC;
BEGIN
  IF NEW.segregation_status = 'segregated' AND OLD.segregation_status != 'segregated' THEN
    v_weight_kg := CASE 
      WHEN NEW.units = 'tons' THEN NEW.weight * 1000
      ELSE NEW.weight
    END;

    INSERT INTO public.inventory (material_id, item_name, category, weight_kg, quantity, status, warehouse_location)
    VALUES (
      NEW.id,
      UPPER(NEW.category::text) || ' - ' || COALESCE(NEW.description, 'Sorted Stock'),
      NEW.category,
      v_weight_kg,
      NEW.quantity,
      'in_stock',
      'Central Yard - Bay 04'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_material_segregated_sync_inventory
  AFTER UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.handle_material_segregation();
```

---

## 7. API & Data Access Layer Documentation

Data communication between Next.js and Supabase is managed via Supabase Client RPC and PostgREST.

### 7.1 Authentication Endpoints (Supabase GoTrue)

#### 1. Corporate Sign-In
* **Method / Action**: `supabase.auth.signInWithPassword`
* **Request Payload**:
  ```json
  {
    "email": "procurement@airtel.com",
    "password": "SecurePassword123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "user": {
      "id": "a9b1c2d3-0000-0000-0000-000000000001",
      "email": "procurement@airtel.com",
      "user_metadata": { "role": "client_user" }
    },
    "session": { "access_token": "eyJhbGciOi...", "expires_in": 3600 }
  }
  ```

#### 2. B2B Company Onboarding Registration
* **Step 1**: Insert company entity into `companies`.
* **Step 2**: Create user account in `supabase.auth.signUp` passing `company_id` in metadata.

---

## 8. CRM Modules, Workflows & Functionalities

### 8.1 12-Stage Operational Request Lifecycle

```mermaid
stateDiagram-v2
    [*] --> submitted: Client submits 6-Step Wizard
    submitted --> under_review: Operations Team initial audit
    under_review --> staff_assigned: Executive appointed
    staff_assigned --> inspection_scheduled: Field site audit date set
    inspection_scheduled --> quotation_pending: Valuation paperwork generated
    quotation_pending --> approved: Client approves quotation
    approved --> pickup_scheduled: Project auto-spawned & driver assigned
    pickup_scheduled --> material_collected: Scrap loaded onto transport
    material_collected --> under_processing: Received at Sorting Yard
    under_processing --> in_progress: Segregation / Refurbishment
    in_progress --> completed: Certificates generated / Dispatched
    completed --> closed: Financial summary settled
    closed --> [*]
```

### 8.2 Role-Based Access Control (RBAC) Matrix

| Portal Page / Resource | `client_user` | `field_executive` | `repair_technical_executive` | `operations_executive` | `super_admin` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Client Portal (`/portal/*`)** | Full Access | Read-Only | Read-Only | Read-Only | Full Access |
| **Raise Request Wizard** | Create/View | Restricted | Restricted | Restricted | Full Access |
| **Queue Manager (`/admin/requests`)** | Restricted | Read-Only | Read-Only | Full Access | Full Access |
| **Projects Center (`/admin/projects`)**| Restricted | View Assigned | View Assigned | Full Access | Full Access |
| **Operations Yard (`/admin/operations`)**| Restricted | Update Pickup | Restricted | Full Access | Full Access |
| **Warehouse Board (`/admin/inventory`)** | Restricted | Restricted | View Only | Full Access | Full Access |
| **Repair Yard (`/admin/repair`)** | Restricted | Restricted | Full Access | Full Access | Full Access |
| **Reports Center (`/admin/reports`)** | View/Download| Restricted | Restricted | Full Access | Full Access |
| **Users & Roles (`/admin/users`)** | Restricted | Restricted | Restricted | Restricted | Full Access |

---

## 9. Accounting Logic, Processes & Automation

### 9.1 Scrap Valuation Formula
Scrap valuation across material categories is computed using live certified net weights:

$$\text{Gross Value} = \sum_{i=1}^{n} \left( \text{Net Weight}_i (\text{kg}) \times \text{Benchmark Rate}_i (\text{INR/kg}) \right)$$

$$\text{Net Settlement} = \text{Gross Value} - \left( \text{Logistics Freight} + \text{Data Sanitization Fees} \right) \pm \text{GST (18\%)}$$

### 9.2 Material Recovery & Carbon Offset Accounting
* **Carbon Offset Metric**: Computed based on avoided raw extraction coefficients:
  $$\text{CO}_2\text{ Offset (Tons)} = \frac{\text{Copper (kg)} \times 4.1 + \text{Aluminium (kg)} \times 8.2 + \text{E-Waste (kg)} \times 1.8}{1000}$$
* **Landfill Diversion Rate**:
  $$\text{Diversion \%} = \left( \frac{\text{Total Processed (kg)} - \text{Non-Recyclable Inert Residue (kg)}}{\text{Total Processed (kg)}} \right) \times 100$$

---

## 10. Functionalities Implemented

### 10.1 Feature Implementation Matrix

| Module | Feature Name | Technical Implementation | Database Impact |
| :--- | :--- | :--- | :--- |
| **Public Landing** | Interactive Lifecycle Engine | Animated SVG trigonometry map (`src/components/custom/lifecycle-map.tsx`). | Zero runtime DB impact. |
| **Public Landing** | ESG Metric Gauges | SVG circular stroke-dashoffset formulas + requestAnimationFrame count animators. | Simulated / Cached aggregate impact queries. |
| **Public Landing** | Waste Audit Lead Intake | React Hook Form with Zod validation. | Posts to lead queues. |
| **Client Portal** | 6-Step Request Wizard | Dynamic multi-step wizard prefilled with authenticated company profile. | Inserts into `requests`, `materials`, and `notifications`. |
| **Client Portal** | 12-Stage Visual Tracker | Framer Motion animated timeline mapping enum states. | Queries `requests`, `materials`, and `collections`. |
| **Client Portal** | Compliance Document Vault | Grouped compliance files with instant simulated Blob download handlers. | Queries `documents` table. |
| **Admin Portal** | Inbound Queue Auditor | Audit approval trigger calling PostgreSQL project generation. | Updates `requests.status = 'approved'`. |
| **Admin Portal** | Logistics Dispatcher | Real-time driver and license plate scheduler. | Inserts into `collections`. |
| **Admin Portal** | Segregation Yard Manager | Real-time commodity sorting state machine. | Updates `materials.segregation_status = 'segregated'`. |
| **Admin Portal** | Inventory Warehouse Ledger | Physical weight auditor and stock release manager. | Updates `inventory.status = 'dispatched'`. |
| **Admin Portal** | Technical Refurbishment Yard | Diagnostic logging, parts usage, and warranty allocation (6–12 months). | Inserts / Updates `repairs`. |
| **Admin Portal** | Certificate Generator | Custom compliance document compiler generating structured reports. | Inserts into `documents`. |
| **Admin Portal** | User Permissions Center | Real-time RBAC privilege manager. | Updates `profiles.role`. |

---

## 11. Important Code Explanations

### 11.1 Security Definer Helper Functions (`supabase_schema.sql`)
To prevent infinite recursion in PostgreSQL when checking user roles against the `profiles` table within RLS policies, custom security-definer helper functions execute with database owner privileges:

```sql
-- Resolves authenticated role without RLS recursion
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifies if caller is internal staff or administrator
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN (
      'super_admin',
      'operations_executive',
      'client_relationship_executive',
      'field_executive',
      'repair_technical_executive',
      'accounts_inventory_executive'
    )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### 11.2 Offline Demo Bypass Bridge (`src/app/login/page.tsx`)
Enables zero-friction local testing without requiring pre-configured Supabase API credentials:

```typescript
if (error) {
  // If Supabase connection fails due to placeholder keys, initialize local demo session
  if (error.message?.includes('Failed to fetch') || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    localStorage.setItem('demo_session', JSON.stringify({
      role: data.email.includes('admin') ? 'super_admin' : 'client_user',
      full_name: data.email.includes('admin') ? 'Operations Director' : 'Airtel Procurement Manager',
      companies: {
        name: 'Airtel India Network',
        gst_number: '27AAAAA1111A1Z1',
        location: 'Gurugram, Haryana'
      }
    }))
    router.push(data.email.includes('admin') ? '/admin' : '/portal')
    router.refresh()
    return
  }
}
```

---

## 12. Security Implementation

### 12.1 Authentication & Session Architecture
* **Tokens**: JWT access tokens and secure refresh cookies issued via Supabase GoTrue.
* **Edge Validation**: Next.js Edge Middleware intercepts and refreshes sessions on protected `/portal/*` and `/admin/*` routes.
* **Route Guards**:
  * `/portal/*` routes verify that `profile.role === 'client_user'` or `super_admin`.
  * `/admin/*` routes verify that `profile.role` matches one of the internal staff tiers.

### 12.2 Row Level Security (RLS) Implementation
All 11 relational tables have Row Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
* **Clients**: Restricted to selecting and inserting rows strictly matching their own `company_id`.
* **Internal Staff**: Granted access based on functional roles via `public.is_admin_or_staff()`.

---

## 13. Deployment Documentation

### 13.1 Step-by-Step Vercel Production Deployment
1. Log in to **[Vercel](https://vercel.com/)** and select **Add New > Project**.
2. Select GitHub repository **`LalithaSreya/ReviveX`** and deploy from the **`main`** branch.
3. Configure Environment Variables in the Vercel project settings:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-public-key
   ```
4. Click **Deploy**. Next.js App Router will compile all routes using Turbopack with 0 warnings.

### 13.2 Database Initialization
1. Open your **[Supabase Project Dashboard](https://supabase.com/)**.
2. Navigate to **SQL Editor** in the left navigation.
3. Paste the complete contents of [`supabase_schema.sql`](file:///c:/Users/sreya/OneDrive/Desktop/Internship/ReviveX/supabase_schema.sql).
4. Click **Run** to generate all 11 tables, RLS policies, custom types, and automation triggers.

---

## 14. Testing & Validation

### 14.1 Test Execution Summary
* **Compilation Test**: `npm run build` executed and passed across all 19 static and dynamic routes:
  ```
  Route (app)
  ┌ ○ /
  ├ ○ /_not-found
  ├ ○ /admin
  ├ ○ /admin/inventory
  ├ ○ /admin/operations
  ├ ○ /admin/projects
  ├ ○ /admin/repair
  ├ ○ /admin/reports
  ├ ○ /admin/requests
  ├ ○ /admin/users
  ├ ○ /login
  ├ ○ /portal
  ├ ○ /portal/documents
  ├ ○ /portal/projects
  ├ ○ /portal/requests
  ├ ○ /portal/support
  └ ○ /register
  ```
* **TypeScript Check**: `tsc --noEmit` passed with 0 type errors.
* **Form Validation**: Zod schema edge cases tested (invalid GSTIN, negative quantities, invalid email formats).
* **Responsive Layout Check**: Mobile viewport verification across 375px, 768px, 1024px, and 1440px displays.

---

## 15. Known Limitations & Technical Debt

1. **Storage Buckets**: Currently, document downloads generate structured client-side Blobs. Integration with Supabase Storage S3 buckets (`/documents/*`) is configured in the schema and should be connected for permanent binary storage.
2. **Real-time Subscriptions**: Dashboard tables currently query data on route navigation. Supabase Realtime subscriptions (`postgres_changes`) can be connected for live updates on logistics maps.

---

## 16. Future Enhancements & Roadmap

* **Q4 2026**: Automated Weighbridge OCR scanning via mobile camera intake for field drivers.
* **Q1 2027**: Razorpay Escrow payment gateway integration for automated commercial scrap payouts.
* **Q2 2027**: Publicly verifiable Carbon Credit Ledger with QR code verification on certificates.

---

## 17. Maintenance & Developer Guide

### 17.1 How to Run the Project Locally
```bash
# 1. Clone repository
git clone https://github.com/LalithaSreya/ReviveX.git
cd ReviveX

# 2. Checkout your development branch
git checkout dev-1  # or dev-2

# 3. Install dependencies
npm install

# 4. Configure local environment (Optional: app includes offline demo fallback)
cp .env.example .env.local

# 5. Start development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 17.2 Git Collaboration Workflow
* Always branch off from `main` or your designated developer branch (`dev-1` / `dev-2`).
* Test compilation locally before submitting Pull Requests: `npm run build`.
* Submit PRs targeting the `main` branch for production deployment.

---
*Report generated and approved for ReviveX & Magniplex Logitech Technical Handover.*
