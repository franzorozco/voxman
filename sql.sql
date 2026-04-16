te entiendo, entonces podrías darme el código para mapear toda mi base de datos por favor, de toda mi base de datos, de todo y los siguientes pasos para generar los modelos y generar los modelos con reliese
 -- =========================================
-- EXTENSIONES
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- TABLA USERS (BASE PARA TODO)
-- =========================================
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
-- =========================================
-- PERFILES DE USUARIO (NORMALIZADO)
-- =========================================
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



-- =========================================
-- OWNERS (DUEÑOS)
-- =========================================
CREATE TABLE owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- =========================================
-- CLIENTES
-- =========================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    customer_code VARCHAR(20) UNIQUE NOT NULL,

    points INT DEFAULT 0,
    total_purchases DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- =========================================
-- SPATIE PERMISSIONS (OFICIAL)
-- =========================================

-- ROLES
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    guard_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(name, guard_name)
);

-- PERMISSIONS
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    guard_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(name, guard_name)
);

-- MODEL HAS PERMISSIONS
CREATE TABLE model_has_permissions (
    permission_id BIGINT REFERENCES permissions(id) ON DELETE CASCADE,
    model_type VARCHAR(255) NOT NULL,
    model_id UUID NOT NULL,
    PRIMARY KEY(permission_id, model_id, model_type)
);

-- MODEL HAS ROLES
CREATE TABLE model_has_roles (
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    model_type VARCHAR(255) NOT NULL,
    model_id UUID NOT NULL,
    PRIMARY KEY(role_id, model_id, model_type)
);

-- ROLE HAS PERMISSIONS
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

-- =========================================
-- DIRECCIONES (REUTILIZABLE)
-- =========================================
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,

    address_type VARCHAR(20) CHECK (address_type IN ('shipping','billing','branch')),

    country VARCHAR(100) DEFAULT 'Bolivia',
    state VARCHAR(100),
    city VARCHAR(100),
    zone VARCHAR(150),
    street VARCHAR(150),
    reference TEXT,
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
-- CATEGORÍAS (ARBOL)
-- =========================================
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

-- =========================================
-- TIPOS DE PRODUCTO (POLO, CAMISA, etc.)
-- =========================================
CREATE TABLE product_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- Polo, Camisa, Pantalón

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- =========================================
-- PRODUCTOS (GENÉRICO)
-- =========================================
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

-- =========================================
-- ATRIBUTOS (COLOR, MATERIAL, ETC)
-- =========================================
CREATE TABLE attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL -- color, material, fit
);

CREATE TABLE attribute_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attribute_id UUID REFERENCES attributes(id) ON DELETE CASCADE,
    value VARCHAR(100) NOT NULL
);

-- =========================================
-- VARIANTES (COMBINACIÓN REAL)
-- =========================================
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,

    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    weight DECIMAL(10,2),
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);


-- Relación variante - atributos (MUY IMPORTANTE)
CREATE TABLE variant_attribute_values (
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    attribute_value_id UUID REFERENCES attribute_values(id) ON DELETE CASCADE,
    PRIMARY KEY (variant_id, attribute_value_id)
);

-- =========================================
-- SISTEMA DE TALLAS (NORMALIZADO)
-- =========================================
CREATE TABLE sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(20) NOT NULL, -- S, M, L
    description VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- =========================================
-- TIPOS DE CORTE (FIT)
-- =========================================
CREATE TABLE fits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL -- slim fit, oversize, regular
);

-- =========================================
-- RELACIÓN VARIANTE CON TALLA Y FIT
-- =========================================
CREATE TABLE variant_sizes (
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    size_id UUID REFERENCES sizes(id),
    fit_id UUID REFERENCES fits(id),

    PRIMARY KEY (variant_id, size_id, fit_id)
);

-- =========================================
-- MEDIDAS DEFINIBLES (PECHO, LARGO, etc.)
-- =========================================
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
    size_id UUID REFERENCES sizes(id),
    measurement_type_id UUID REFERENCES measurement_types(id),
    
    value DECIMAL(10,2), -- cm
    UNIQUE (variant_id, size_id, measurement_type_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- IMÁGENES (MULTIPLES Y POR VARIANTE)
-- =========================================
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

-- =========================================
-- INVENTARIO POR SUCURSAL
-- =========================================
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

-- =========================================
-- MOVIMIENTOS DE INVENTARIO (PRO)
-- =========================================
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID REFERENCES product_variants(id),
    branch_id UUID REFERENCES branches(id),
    user_id UUID REFERENCES users(id),
    type VARCHAR(20) CHECK (type IN ('in', 'out', 'adjustment')),
    quantity INT,
    reference TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- DESCUENTOS
-- =========================================
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


CREATE TYPE sale_type AS ENUM ('store', 'online');
CREATE TYPE sale_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');

CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE movement_type AS ENUM ('income', 'expense');

-- =========================================
-- VENTAS (CABECERA)
-- =========================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    customer_id UUID REFERENCES customers(id),
    branch_id UUID REFERENCES branches(id),
    user_id UUID REFERENCES users(id),

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

-- =========================================
-- DETALLE DE VENTAS
-- =========================================
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
    CHECK (subtotal >= 0),
    subtotal DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);


-- =========================================
-- DEVOLUCIONES (PRO)
-- =========================================
CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    sale_detail_id UUID REFERENCES sale_details(id),

    quantity INT,
    reason TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- RESERVAS DE STOCK (PRO)
-- =========================================
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
    user_id UUID REFERENCES users(id),

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



-- =========================================
-- PAGOS (MULTIPLES POR VENTA)
-- =========================================
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

-- =========================================
-- CAJA
-- =========================================
CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    branch_id UUID REFERENCES branches(id),
    user_id UUID REFERENCES users(id),

    opening_amount DECIMAL(10,2) NOT NULL,
    closing_amount DECIMAL(10,2),

    opened_at TIMESTAMP NOT NULL,
    closed_at TIMESTAMP,

    status VARCHAR(20) CHECK (status IN ('open', 'closed')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- =========================================
-- MOVIMIENTOS DE CAJA
-- =========================================
CREATE TABLE cash_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    cash_register_id UUID REFERENCES cash_registers(id),

    movement_type movement_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,

    reference_type VARCHAR(50), -- payment, manual, expense
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

-- =========================================
-- DETALLE PAGOS A DUEÑOS
-- =========================================
CREATE TABLE owner_payment_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    owner_payment_id UUID REFERENCES owner_payments(id) ON DELETE CASCADE,
    sale_detail_id UUID REFERENCES sale_details(id),

    amount DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- HISTORIAL DE PRECIOS (MEJORADO)
-- =========================================
CREATE TABLE product_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    variant_id UUID REFERENCES product_variants(id),

    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2),

    changed_by UUID REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- ENVÍOS (NORMALIZADO)
-- =========================================
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    sale_id UUID REFERENCES sales(id),

    address_id UUID REFERENCES addresses(id),

    status VARCHAR(50) DEFAULT 'pending',

    tracking_code VARCHAR(100),

    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- =========================================
-- AUDITORÍA (PRO)
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

-- =========================================
-- ÍNDICES IMPORTANTES (RENDIMIENTO)
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
que falta que le agrego que esta mal etc