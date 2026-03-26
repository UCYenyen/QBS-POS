-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "tier" "PlanTier" NOT NULL DEFAULT 'FREE',
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'IDR',
    "interval" VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
    "maxBranches" INTEGER NOT NULL DEFAULT 1,
    "maxUsers" INTEGER NOT NULL DEFAULT 1,
    "features" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_subscriptions" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'TRIAL',
    "xendit_customer_id" TEXT,
    "xendit_subscription_id" TEXT,
    "current_period_start" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_period_end" TIMESTAMPTZ NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "store_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_stores" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pos_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_store_members" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'CASHIER',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pos_store_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_customers" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "points" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pos_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_providers" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "address" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pos_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_store_branches" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "location" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pos_store_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_warehouses" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "branch_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pos_warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_products" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "sku" VARCHAR(100),
    "name" VARCHAR(255) NOT NULL,
    "cost_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "current_price" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pos_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_product_providers" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "catalog_cost" DECIMAL(15,2),
    "provider_sku" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pos_product_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_product_transactions" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "provider_id" UUID,
    "transaction_type" VARCHAR(50) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_cost" DECIMAL(15,2),
    "reference_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_product_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_orders" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "customer_id" UUID,
    "fulfillment_status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "payment_status" VARCHAR(50) NOT NULL DEFAULT 'UNPAID',
    "total_amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pos_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_order_lines" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "product_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_payments" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "payment_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_subscriptions_store_id_key" ON "store_subscriptions"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_subscriptions_xendit_subscription_id_key" ON "store_subscriptions"("xendit_subscription_id");

-- CreateIndex
CREATE INDEX "pos_store_members_user_id_idx" ON "pos_store_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_store_members_store_id_user_id_key" ON "pos_store_members"("store_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_product_providers_product_id_provider_id_key" ON "pos_product_providers"("product_id", "provider_id");

-- AddForeignKey
ALTER TABLE "store_subscriptions" ADD CONSTRAINT "store_subscriptions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "pos_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_subscriptions" ADD CONSTRAINT "store_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_store_members" ADD CONSTRAINT "pos_store_members_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "pos_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_store_members" ADD CONSTRAINT "pos_store_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_customers" ADD CONSTRAINT "pos_customers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "pos_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_providers" ADD CONSTRAINT "pos_providers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "pos_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_store_branches" ADD CONSTRAINT "pos_store_branches_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "pos_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_warehouses" ADD CONSTRAINT "pos_warehouses_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "pos_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_warehouses" ADD CONSTRAINT "pos_warehouses_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "pos_store_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_products" ADD CONSTRAINT "pos_products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "pos_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_product_providers" ADD CONSTRAINT "pos_product_providers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "pos_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_product_providers" ADD CONSTRAINT "pos_product_providers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "pos_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_product_providers" ADD CONSTRAINT "pos_product_providers_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "pos_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_product_transactions" ADD CONSTRAINT "pos_product_transactions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "pos_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_product_transactions" ADD CONSTRAINT "pos_product_transactions_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "pos_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_product_transactions" ADD CONSTRAINT "pos_product_transactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "pos_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_product_transactions" ADD CONSTRAINT "pos_product_transactions_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "pos_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_orders" ADD CONSTRAINT "pos_orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "pos_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_orders" ADD CONSTRAINT "pos_orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "pos_store_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_orders" ADD CONSTRAINT "pos_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "pos_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_order_lines" ADD CONSTRAINT "pos_order_lines_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "pos_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_order_lines" ADD CONSTRAINT "pos_order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "pos_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_order_lines" ADD CONSTRAINT "pos_order_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "pos_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_payments" ADD CONSTRAINT "pos_payments_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "pos_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_payments" ADD CONSTRAINT "pos_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "pos_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
