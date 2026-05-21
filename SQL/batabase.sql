CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password TEXT NOT NULL,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_email_unique_active
ON users(email)
WHERE deleted_at IS NULL;


CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name_paternal VARCHAR(100),
    last_name_maternal VARCHAR(100),
    phone VARCHAR(20),
    birthdate DATE,
    gender VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);


CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    customer_code VARCHAR(20) UNIQUE NOT NULL,
    points INT DEFAULT 0,
    total_purchases DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);


CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    role VARCHAR(50) CHECK (role IN ('seller','delivery','admin','manager','cashier')),
    employee_code VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    emergency_contact VARCHAR(100),
    base_salary DECIMAL(10,2) DEFAULT 0,
    commission_percentage DECIMAL(5,2) DEFAULT 0,
    max_discount_allowed DECIMAL(5,2) DEFAULT 0, 
    can_approve_returns BOOLEAN DEFAULT false,
    can_manage_inventory BOOLEAN DEFAULT false,
    hire_date DATE,
    contract_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active', 
    is_active BOOLEAN DEFAULT true,
    last_promotion_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE employee_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    sale_id UUID REFERENCES sales(id),
    commission_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_sales_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    period_start DATE,
    period_end DATE,
    total_sales DECIMAL(10,2),
    total_commissions DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    employee_id UUID REFERENCES employees(id),

    base_salary DECIMAL(10,2),
    commissions DECIMAL(10,2),
    bonuses DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    total_paid DECIMAL(10,2),
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    guard_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(name, guard_name)
);

CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    guard_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(name, guard_name)
);

CREATE TABLE model_has_permissions (
    permission_id BIGINT REFERENCES permissions(id) ON DELETE CASCADE,
    model_type VARCHAR(255) NOT NULL,
    model_id UUID NOT NULL,
    PRIMARY KEY(permission_id, model_id, model_type)
);

CREATE TABLE model_has_roles (
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    model_type VARCHAR(255) NOT NULL,
    model_id UUID NOT NULL,
    PRIMARY KEY(role_id, model_id, model_type)
);

CREATE TABLE role_has_permissions (
    permission_id BIGINT REFERENCES permissions(id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY(permission_id, role_id)
);

-- =========================================
-- SUCURSALES
-- =========================================
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    parent_id UUID REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX idx_categories_name_parent 
ON categories (LOWER(name), parent_id);

-- TIPOS DE PRODUCTO (POLO, CAMISA, etc.)
CREATE TABLE product_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- Polo, Camisa, Pantalón
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- PRODUCTOS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES owners(id),
    category_id UUID REFERENCES categories(id),
    product_type_id UUID REFERENCES product_types(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE,
    base_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ATRIBUTOS (COLOR, MATERIAL, ETC)
CREATE TABLE attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL -- color, material, fit
);

CREATE TABLE attribute_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attribute_id UUID REFERENCES attributes(id) ON DELETE CASCADE,
    hex_code VARCHAR(7),
    value VARCHAR(100) NOT NULL
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    size_id UUID REFERENCES sizes(id),
    fit_id UUID REFERENCES fits(id),
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    weight DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE variant_attribute_values (
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    attribute_value_id UUID REFERENCES attribute_values(id) ON DELETE CASCADE,
    PRIMARY KEY (variant_id, attribute_value_id)
);

CREATE TABLE sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(20) NOT NULL, -- S, M, L
    description VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- TIPOS DE CORTE (FIT)
CREATE TABLE fits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL
);

-- MEDIDAS DEFINIBLES (PECHO, LARGO, etc.)
CREATE TABLE measurement_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL -- pecho, largo, manga
);

-- Medidas por tipo de producto
CREATE TABLE product_type_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_type_id UUID REFERENCES product_types(id),
    measurement_type_id UUID REFERENCES measurement_types(id)
);

-- Medidas reales por variante + talla
CREATE TABLE variant_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    measurement_type_id UUID REFERENCES measurement_types(id),
    value DECIMAL(10,2),
    UNIQUE (variant_id, measurement_type_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IMÁGENES (MULTIPLES Y POR VARIANTE)
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE variant_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INVENTARIO POR SUCURSAL
CREATE TABLE inventories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id),
    variant_id UUID REFERENCES product_variants(id),
    stock INT DEFAULT 0,
    CHECK (stock >= 0),
    min_stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(branch_id, variant_id)
);

-- MOVIMIENTOS DE INVENTARIO (PRO)
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID REFERENCES product_variants(id),
    branch_id UUID REFERENCES branches(id),
    movement_type VARCHAR(20)
    CHECK (movement_type IN (
        'purchase',
        'sale',
        'return',
        'adjustment',
        'transfer_in',
        'transfer_out'
    )),
    quantity INT NOT NULL,
    stock_before INT,
    stock_after INT,
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DESCUENTOS
CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('percentage','fixed')),
    value DECIMAL(10,2) NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Aplicación flexible de descuentos
CREATE TABLE discount_products (
    discount_id UUID REFERENCES discounts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (discount_id, product_id)
);

CREATE TABLE discount_categories (
    discount_id UUID REFERENCES discounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (discount_id, category_id)
);

-- HISTORIAL DE PRECIOS (MEJORADO)
CREATE TABLE product_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID REFERENCES product_variants(id),
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2),
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reseñas de productos
CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    customer_id UUID REFERENCES customers(id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lista de deseos
CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Articulos de la lista de deseos
CREATE TABLE wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),

    UNIQUE (wishlist_id, product_id)
);
CREATE TYPE sale_type AS ENUM ('store', 'online');
CREATE TYPE sale_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE movement_type AS ENUM ('income', 'expense');


-- =========================================
-- VENTAS
-- =========================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    branch_id UUID REFERENCES branches(id),
    customer_id UUID REFERENCES customers(id),
    employee_id UUID REFERENCES employees(id),

    sale_type sale_type NOT NULL,
    status sale_status DEFAULT 'pending',
    source VARCHAR(50) CHECK (source IN ('web','mobile','store')),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_total DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    CHECK (total >= 0),
    CHECK (subtotal >= 0),
    invoice_number VARCHAR(50),
    notes TEXT,
    UNIQUE (invoice_number),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- DETALLE DE VENTAS
CREATE TABLE sale_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    owner_id UUID REFERENCES owners(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL,
    CHECK (final_price >= 0),
    subtotal DECIMAL(10,2) NOT NULL,
    CHECK (subtotal >= 0),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE sale_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id),
    old_status sale_status,
    new_status sale_status,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RESERVAS DE STOCK (PRO)
CREATE TABLE stock_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID REFERENCES product_variants(id),
    branch_id UUID REFERENCES branches(id),
    sale_id UUID REFERENCES sales(id),
    quantity INT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('reserved','released','confirmed')),
    CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    quantity INT NOT NULL,
    UNIQUE (cart_id, variant_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PAGOS (MULTIPLES POR VENTA)
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id),
    cash_register_id UUID REFERENCES cash_registers(id),
    payment_method_id UUID REFERENCES payment_methods(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BOB',
    CHECK (amount > 0),
    status payment_status DEFAULT 'completed',
    transaction_reference VARCHAR(150), -- QR, banco, etc
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- DEVOLUCIONES
CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_detail_id UUID REFERENCES sale_details(id),
    quantity INT,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- CAJA
-- =========================================
CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id),
    employee_id UUID REFERENCES employees(id),
    opening_amount DECIMAL(10,2) NOT NULL,
    closing_amount DECIMAL(10,2),
    opened_at TIMESTAMP NOT NULL,
    closed_at TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- MOVIMIENTOS DE CAJA
CREATE TABLE cash_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cash_register_id UUID REFERENCES cash_registers(id),
    movement_type movement_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- =========================================
-- PAGOS A DUEÑOS
-- =========================================
CREATE TABLE owner_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES owners(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE owner_payment_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_payment_id UUID REFERENCES owner_payments(id) ON DELETE CASCADE,
    sale_detail_id UUID REFERENCES sale_details(id),
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- ENVÍOS
-- =========================================
CREATE TYPE delivery_type AS ENUM (
    'pickup',        -- recoger en sucursal
    'home_delivery', -- entrega a domicilio
    'external',      -- bus / avión
    'scheduled_point'
);

CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id),
    address_id UUID REFERENCES addresses(id),
    delivery_type delivery_type NOT NULL DEFAULT 'pickup',
    pickup_branch_id UUID REFERENCES branches(id),
    status VARCHAR(50) DEFAULT 'pending',
    tracking_code VARCHAR(100),
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    scheduled_at TIMESTAMP,
    external_company VARCHAR(150),
    external_guide VARCHAR(150),
    shipping_payment_type VARCHAR(20)
        CHECK (shipping_payment_type IN ('paid','collect')),
    delivery_code VARCHAR(10),
    delivery_code_expires_at TIMESTAMP,
    delivery_confirmed BOOLEAN DEFAULT FALSE,
    delivery_confirmed_at TIMESTAMP,
    delivery_attempts INT DEFAULT 0,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT chk_delivery_code_required
    CHECK (
        delivery_type = 'external'
        OR delivery_code IS NOT NULL
    )
);

CREATE UNIQUE INDEX idx_unique_active_delivery_code 
ON shipments (delivery_code)
WHERE delivery_confirmed = FALSE AND delivery_code IS NOT NULL;

CREATE TABLE delivery_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    time_window VARCHAR(50),
    driver_id UUID REFERENCES delivery_drivers(id),
    meeting_point VARCHAR(255),
    status VARCHAR(20) 
        CHECK (status IN ('pending','assigned','completed','failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shipment_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,

    status VARCHAR(50),
    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE delivery_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    employee_id UUID REFERENCES employees(id),
    vehicle_type VARCHAR(50), -- moto, auto
    plate VARCHAR(20),
    status VARCHAR(20) CHECK (status IN ('available','busy','inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100),
    city VARCHAR(100),
    base_cost DECIMAL(10,2),
    extra_cost_per_km DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shipment_cost_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id),
    base_cost DECIMAL(10,2),
    distance_cost DECIMAL(10,2),
    extra_cost DECIMAL(10,2),
    total DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shipment_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- DIRECCIONES
-- =========================================

CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    address_type VARCHAR(20) 
        CHECK (address_type IN ('shipping','billing','branch')),
    country VARCHAR(100) DEFAULT 'Bolivia',
    state VARCHAR(100),
    city VARCHAR(100),
    zone VARCHAR(150),
    zone_id UUID REFERENCES delivery_zones(id),
    street VARCHAR(150),
    reference TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    CHECK (
        (user_id IS NOT NULL AND branch_id IS NULL)
        OR
        (user_id IS NULL AND branch_id IS NOT NULL)
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- =========================================
-- AUDITORÍA
-- =========================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID REFERENCES users(id),
    action VARCHAR(100),
    table_name VARCHAR(100),
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    customer_id UUID REFERENCES customers(id),
    title VARCHAR(150),
    message TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- COMPRAS Y PROVEEDORES
-- =========================================
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(150),
    address_id UUID REFERENCES addresses(id),
    company_name VARCHAR(150),
    tax_id VARCHAR(50), -- NIT
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TYPE purchase_status AS ENUM ('pending','received','cancelled');
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    supplier_id UUID REFERENCES suppliers(id),
    branch_id UUID REFERENCES branches(id),
    employee_id UUID REFERENCES employees(id),
    status purchase_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    invoice_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE purchase_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE supplier_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    supplier_id UUID REFERENCES suppliers(id),
    purchase_id UUID REFERENCES purchases(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method_id UUID REFERENCES payment_methods(id),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts_payable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    supplier_id UUID REFERENCES suppliers(id),
    purchase_id UUID REFERENCES purchases(id),
    total_amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2),
    due_date DATE,
    status VARCHAR(20) CHECK (status IN ('pending','partial','paid')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    from_branch_id UUID REFERENCES branches(id),
    to_branch_id UUID REFERENCES branches(id),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    variant_id UUID REFERENCES product_variants(id),
    purchase_id UUID REFERENCES purchases(id),
    cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE reception_status AS ENUM ('pending','partial','completed');

CREATE TABLE purchase_receptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    purchase_id UUID REFERENCES purchases(id),
    employee_id UUID REFERENCES employees(id),
    status reception_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_reception_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    reception_id UUID REFERENCES purchase_receptions(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    expected_quantity INT,
    received_quantity INT,
    damaged_quantity INT DEFAULT 0,
    wrong_quantity INT DEFAULT 0, -- color/talla incorrecta
    extra_quantity INT DEFAULT 0,
    accepted_quantity INT, -- lo que entra al inventario
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE supplier_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id),
    purchase_id UUID REFERENCES purchases(id),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- Admistracion de la tienda
-- =========================================

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    branch_id UUID REFERENCES branches(id),

    name VARCHAR(150), -- alquiler, luz, internet
    amount DECIMAL(10,2),

    expense_date DATE,

    type VARCHAR(50) CHECK (type IN ('fixed','variable')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE owner_expense_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    expense_id UUID REFERENCES expenses(id),
    owner_id UUID REFERENCES owners(id),

    percentage DECIMAL(5,2), -- 80%, 20%
    amount DECIMAL(10,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- ÍNDICES IMPORTANTES
-- =========================================
CREATE INDEX idx_products_owner ON products(owner_id);
CREATE INDEX idx_sale_details_owner ON sale_details(owner_id);
CREATE INDEX idx_inventories_branch ON inventories(branch_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_profiles_user ON user_profiles(user_id);
CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_inventory_branch_variant ON inventories(branch_id, variant_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_inventory_movements ON cash_movements(cash_register_id);
CREATE INDEX idx_variant_attr ON variant_attribute_values(variant_id);
CREATE INDEX idx_variant_sku ON product_variants(sku);
CREATE INDEX idx_sales_branch ON sales(branch_id);
CREATE INDEX idx_payments_method ON payments(payment_method_id);
CREATE INDEX idx_inventory_variant ON inventories(variant_id);
CREATE INDEX idx_active_users ON users(id) WHERE deleted_at IS NULL;