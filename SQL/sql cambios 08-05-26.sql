ALTER TABLE wishlists
DROP CONSTRAINT wishlists_user_id_fkey;

ALTER TABLE wishlists
RENAME COLUMN user_id TO customer_id;

ALTER TABLE wishlists
ADD CONSTRAINT wishlists_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES customers(id);




ALTER TABLE inventory_movements
DROP CONSTRAINT inventory_movements_user_id_fkey;

ALTER TABLE inventory_movements
RENAME COLUMN user_id TO employee_id;

ALTER TABLE inventory_movements
ADD CONSTRAINT inventory_movements_employee_id_fkey
FOREIGN KEY (employee_id)
REFERENCES employees(id);




ALTER TABLE carts
DROP CONSTRAINT carts_user_id_fkey;

ALTER TABLE carts
RENAME COLUMN user_id TO customer_id;

ALTER TABLE carts
ADD CONSTRAINT carts_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES customers(id);






ALTER TABLE cash_registers
DROP CONSTRAINT cash_registers_user_id_fkey;

ALTER TABLE cash_registers
RENAME COLUMN user_id TO employee_id;

ALTER TABLE cash_registers
ADD CONSTRAINT cash_registers_employee_id_fkey
FOREIGN KEY (employee_id)
REFERENCES employees(id);



ALTER TABLE addresses
DROP CONSTRAINT addresses_user_id_fkey;



ALTER TABLE addresses
RENAME COLUMN user_id TO customer_id;


ALTER TABLE addresses
ADD CONSTRAINT addresses_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES customers(id)
ON DELETE CASCADE;

SELECT conname
FROM pg_constraint
WHERE conrelid = 'addresses'::regclass;



ALTER TABLE addresses
DROP CONSTRAINT addresses_check;




ALTER TABLE addresses
ADD CONSTRAINT chk_addresses_owner
CHECK (
    (customer_id IS NOT NULL AND branch_id IS NULL)
    OR
    (customer_id IS NULL AND branch_id IS NOT NULL)
);




ALTER TABLE purchases
DROP CONSTRAINT purchases_user_id_fkey;

ALTER TABLE purchases
RENAME COLUMN user_id TO employee_id;

ALTER TABLE purchases
ADD CONSTRAINT purchases_employee_id_fkey
FOREIGN KEY (employee_id)
REFERENCES employees(id);



ALTER TABLE purchase_receptions
DROP CONSTRAINT purchase_receptions_user_id_fkey;

ALTER TABLE purchase_receptions
RENAME COLUMN user_id TO employee_id;

ALTER TABLE purchase_receptions
ADD CONSTRAINT purchase_receptions_employee_id_fkey
FOREIGN KEY (employee_id)
REFERENCES employees(id);




ALTER TABLE supplier_returns
ADD CONSTRAINT supplier_returns_supplier_id_fkey
FOREIGN KEY (supplier_id)
REFERENCES suppliers(id);

ALTER TABLE supplier_returns
ADD CONSTRAINT supplier_returns_purchase_id_fkey
FOREIGN KEY (purchase_id)
REFERENCES purchases(id);





DROP INDEX IF EXISTS idx_addresses_user;




CREATE INDEX idx_addresses_customer
ON addresses(customer_id);