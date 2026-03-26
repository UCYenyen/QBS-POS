@AGENTS.md

# Project Overview: SaaS Point of Sale (POS) System

## 1. System Description
This project is a highly scalable, multi-tenant Software-as-a-Service (SaaS) Point of Sale platform. It is designed to serve multiple subscribing businesses (Tenants/Stores), allowing them to manage physical branches, inventory, suppliers, customers, and checkout transactions. 

## 2. Tech Stack & Key Libraries
* **Framework:** Next.js (App Router)
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Authentication:** Better Auth (Auth.js standards)
* **UI Components:** Shadcn UI + Tailwind CSS
* **Payment Gateway:** Xendit (used for B2B SaaS Subscriptions)

## 3. Core Architectural Principles
* **Multi-Tenancy:** The system uses a logical multi-tenant architecture. The `Store` model acts as the root Tenant. Almost every domain model requires a `storeId` foreign key to facilitate Row-Level Security (RLS) or strict application-level isolation.
* **Offline-Friendly IDs:** Primary keys strictly use UUIDs (`@default(uuid())`) or CUIDs. Sequential integers are forbidden to allow distributed POS terminals to generate records offline and sync them safely without ID collisions.
* **Immutable Inventory:** Stock is never managed by a simple `quantity` integer column on the Product table. All inventory movements are tracked via an immutable ledger (`ProductTransaction` table) to prevent race conditions during concurrent checkouts.
* **Financial Snapshotting:** To maintain accurate Cost of Goods Sold (COGS) and profit calculations over time, historical prices and product details are frozen inside `OrderLine` records at the time of checkout via `unitCost`, `unitPrice`, and a `productSnapshot` JSON field.

## 4. Database Domain Design

### Domain A: Identity & Access (Better Auth)
* `User`: Global identity. A user is independent of a specific business until linked.
* `Session`, `Account`, `Verification`: Standard Better Auth models handling OAuth, magic links, and session persistence.

### Domain B: SaaS & Subscriptions
* `SubscriptionPlan`: Defines the pricing tiers (FREE, PRO, ENTERPRISE) and infrastructure limits (e.g., `maxBranches`, `maxUsers`).
* `StoreSubscription`: Links a Tenant (`Store`) to a Plan, tracking Xendit payment references and billing periods.

### Domain C: Tenant Isolation & RBAC
* `Store`: The Tenant. Represents the subscribing B2B company.
* `StoreMember`: The crucial pivot table mapping a `User` to a `Store` with specific roles (`OWNER`, `MANAGER`, `CASHIER`). 

### Domain D: Physical & Supply Chain
* `StoreBranch`: Physical retail locations belonging to a Store.
* `Warehouse`: Storage locations (can be attached to a Branch or standalone).
* `Provider`: Suppliers/Vendors where the Store purchases inventory.

### Domain E: Inventory & Catalog
* `Product`: The item being sold, tracking current retail price and current base cost.
* `ProductProvider`: A many-to-many pivot acting as a "Supplier Catalog," tracking the specific wholesale price a Provider charges for a Product.
* `ProductTransaction`: The immutable ledger recording `STOCK_IN`, `SALE`, and `ADJUSTMENT`.

### Domain F: Checkout & Financials
* `Customer`: The Store's end-consumers (Membership system tracking loyalty `points`).
* `Order`: The primary transaction header tracking `fulfillmentStatus` and `paymentStatus`.
* `OrderLine`: Individual items in the cart.
* `Payment`: Records of actual money movements, supporting split payments (e.g., partial cash, partial card) directly linked to the Order.

## 5. Agent Development Directives
When generating code, components, or database queries for this project, you MUST adhere to the following rules:
1.  **Always Enforce Tenant Context:** Never write a Prisma query for domain data without explicitly scoping it to the current user's active `storeId`.
2.  **UI Consistency:** Always default to using Shadcn UI components. Do not write custom raw HTML/CSS buttons or modals if a Shadcn equivalent exists.
3.  **Server Actions over API Routes:** Prefer Next.js Server Actions for data mutations, ensuring they are properly protected by Better Auth session checks and RBAC (Role-Based Access Control) verifications via `StoreMember`.
4.  **Financial Math:** Always handle monetary calculations carefully, keeping in mind that Prisma returns `Decimal` types which must be serialized properly before passing to Client Components.