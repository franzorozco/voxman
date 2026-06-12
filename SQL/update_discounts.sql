
ALTER TABLE discounts 
ADD COLUMN code VARCHAR(50) UNIQUE,
ADD COLUMN is_automatic BOOLEAN DEFAULT TRUE,
ADD COLUMN min_purchase_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN min_quantity INT DEFAULT 0,
ADD COLUMN max_discount_amount DECIMAL(10,2),
ADD COLUMN usage_limit INT,
ADD COLUMN used_count INT DEFAULT 0;

CREATE TABLE discount_brands (
    discount_id UUID REFERENCES discounts(id) ON DELETE CASCADE,
    brand_id BIGINT REFERENCES brands(id) ON DELETE CASCADE,
    PRIMARY KEY (discount_id, brand_id)
);

CREATE TABLE sale_applied_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    sale_detail_id UUID REFERENCES sale_details(id) ON DELETE CASCADE,
    discount_id UUID REFERENCES discounts(id) ON DELETE CASCADE,
    discount_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

