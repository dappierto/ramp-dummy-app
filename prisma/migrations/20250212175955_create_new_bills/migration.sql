-- CreateTable
CREATE TABLE "Bills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_number" TEXT NOT NULL,
    "invoice_currency" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "vendor_contact_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "due_date" DATETIME NOT NULL,
    "issue_date" DATETIME NOT NULL
);
