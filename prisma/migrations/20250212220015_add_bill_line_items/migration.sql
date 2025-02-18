-- CreateTable
CREATE TABLE "BillLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bill_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" REAL NOT NULL,
    "total_amount" REAL NOT NULL,
    "gl_account_id" TEXT,
    "category_id" TEXT,
    CONSTRAINT "BillLineItem_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "Bills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
