-- =========================================================
-- CATEGORIAS
-- =========================================================

INSERT INTO categories (id, name, parent_id) VALUES
('10000000-0000-0000-0000-000000000001', 'Polos', NULL),
('10000000-0000-0000-0000-000000000002', 'Poleras', NULL),
('10000000-0000-0000-0000-000000000003', 'Camisas', NULL),
('10000000-0000-0000-0000-000000000004', 'Pantalones', NULL),
('10000000-0000-0000-0000-000000000005', 'Chamarras', NULL),

('10000000-0000-0000-0000-000000000006', 'Polos Texturizados', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000007', 'Poleras Oversize', '10000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000008', 'Camisas Slim Fit', '10000000-0000-0000-0000-000000000003'),
('10000000-0000-0000-0000-000000000009', 'Joggers', '10000000-0000-0000-0000-000000000004'),
('10000000-0000-0000-0000-000000000010', 'Chamarras Urbanas', '10000000-0000-0000-0000-000000000005');

-- =========================================================
-- TIPOS DE PRODUCTOS
-- =========================================================

INSERT INTO product_types (id, name) VALUES
('20000000-0000-0000-0000-000000000001', 'POLOS BASICOS REGULAR FIT'),
('20000000-0000-0000-0000-000000000002', 'POLOS TEXTURIZADOS RIB'),
('20000000-0000-0000-0000-000000000003', 'POLERAS BASICAS OVERSIZE'),
('20000000-0000-0000-0000-000000000004', 'POLERAS WAFFLE PREMIUM'),
('20000000-0000-0000-0000-000000000005', 'CAMISAS SLIM FIT MANGA LARGA'),
('20000000-0000-0000-0000-000000000006', 'JOGGERS CARGO STREETWEAR'),
('20000000-0000-0000-0000-000000000007', 'CHAMARRAS DENIM URBAN'),
('20000000-0000-0000-0000-000000000008', 'POLOS ACANALADOS PREMIUM'),
('20000000-0000-0000-0000-000000000009', 'POLERAS OJUELA HEAVYWEIGHT');

-- =========================================================
-- SUCURSALES
-- =========================================================

INSERT INTO branches (id, name, phone) VALUES
('30000000-0000-0000-0000-000000000001', 'Sucursal Central', '72511111'),
('30000000-0000-0000-0000-000000000002', 'Sucursal Sur', '72522222'),
('30000000-0000-0000-0000-000000000003', 'Sucursal Norte', '72533333');

-- =========================================================
-- ATRIBUTOS
-- =========================================================

INSERT INTO attributes (id, name) VALUES
('40000000-0000-0000-0000-000000000001', 'Color'),
('40000000-0000-0000-0000-000000000002', 'Material'),
('40000000-0000-0000-0000-000000000003', 'Fit');

-- =========================================================
-- VALORES DE ATRIBUTOS
-- =========================================================

INSERT INTO attribute_values (id, attribute_id, value) VALUES
('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Negro'),
('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Blanco'),
('41000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 'Arena'),
('41000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001', 'Perla'),
('41000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000001', 'Pomelo'),
('41000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000002', 'Algodon'),
('41000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000002', 'RIB'),
('41000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000002', 'Waffle'),
('41000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000003', 'Oversize'),
('41000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000003', 'Slim Fit');

-- =========================================================
-- TALLAS
-- =========================================================

INSERT INTO sizes (id, name, description) VALUES
('50000000-0000-0000-0000-000000000001', 'S', 'Small'),
('50000000-0000-0000-0000-000000000002', 'M', 'Medium'),
('50000000-0000-0000-0000-000000000003', 'L', 'Large'),
('50000000-0000-0000-0000-000000000004', 'XL', 'Extra Large');

-- =========================================================
-- FITS
-- =========================================================

INSERT INTO fits (id, name) VALUES
('60000000-0000-0000-0000-000000000001', 'Regular'),
('60000000-0000-0000-0000-000000000002', 'Oversize'),
('60000000-0000-0000-0000-000000000003', 'Slim Fit');

-- =========================================================
-- TIPOS DE MEDIDAS
-- =========================================================

INSERT INTO measurement_types (id, name) VALUES
('70000000-0000-0000-0000-000000000001', 'Pecho'),
('70000000-0000-0000-0000-000000000002', 'Largo'),
('70000000-0000-0000-0000-000000000003', 'Manga');

-- =========================================================
-- RELACION PRODUCT TYPE - MEDIDAS
-- =========================================================

INSERT INTO product_type_measurements (id, product_type_id, measurement_type_id) VALUES

('71000000-0000-0000-0000-000000000001',
'20000000-0000-0000-0000-000000000001',
'70000000-0000-0000-0000-000000000001'),

('71000000-0000-0000-0000-000000000002',
'20000000-0000-0000-0000-000000000001',
'70000000-0000-0000-0000-000000000002'),

('71000000-0000-0000-0000-000000000003',
'20000000-0000-0000-0000-000000000003',
'70000000-0000-0000-0000-000000000001');

-- =========================================================
-- PRODUCTOS
-- =========================================================

INSERT INTO products (
    id,
    owner_id,
    category_id,
    product_type_id,
    name,
    description,
    slug,
    base_price,
    views
) VALUES

(
'80000000-0000-0000-0000-000000000001',
'e3eb807f-9267-46d7-a568-8490faa735b5',
'10000000-0000-0000-0000-000000000006',
'20000000-0000-0000-0000-000000000002',
'Polo RIB Negro Premium',
'Polo texturizado RIB urbano premium',
'polo-rib-negro-premium',
89.90,
120
),

(
'80000000-0000-0000-0000-000000000002',
'e3eb807f-9267-46d7-a568-8490faa735b5',
'10000000-0000-0000-0000-000000000007',
'20000000-0000-0000-0000-000000000003',
'Polera Oversize Perla',
'Polera oversize heavyweight color perla',
'polera-oversize-perla',
145.00,
80
),

(
'80000000-0000-0000-0000-000000000003',
'a15d3942-2f7b-43d6-a77e-87b2ad7fec52',
'10000000-0000-0000-0000-000000000003',
'20000000-0000-0000-0000-000000000005',
'Camisa Slim Blanca',
'Camisa slim fit manga larga elegante',
'camisa-slim-blanca',
170.00,
50
),

(
'80000000-0000-0000-0000-000000000004',
'a15d3942-2f7b-43d6-a77e-87b2ad7fec52',
'10000000-0000-0000-0000-000000000009',
'20000000-0000-0000-0000-000000000006',
'Jogger Cargo Arena',
'Jogger cargo streetwear premium',
'jogger-cargo-arena',
185.00,
65
),

(
'80000000-0000-0000-0000-000000000005',
'e3eb807f-9267-46d7-a568-8490faa735b5',
'10000000-0000-0000-0000-000000000010',
'20000000-0000-0000-0000-000000000007',
'Chamarra Denim Black',
'Chamarra urbana denim negra',
'chamarra-denim-black',
320.00,
35
);

-- =========================================================
-- VARIANTES
-- =========================================================

INSERT INTO product_variants (
    id,
    product_id,
    sku,
    barcode,
    weight,
    price,
    cost
) VALUES

(
'90000000-0000-0000-0000-000000000001',
'80000000-0000-0000-0000-000000000001',
'RIB-BLK-M',
'100000000001',
0.40,
89.90,
45.00
),

(
'90000000-0000-0000-0000-000000000002',
'80000000-0000-0000-0000-000000000001',
'RIB-BLK-L',
'100000000002',
0.42,
89.90,
45.00
),

(
'90000000-0000-0000-0000-000000000003',
'80000000-0000-0000-0000-000000000002',
'OVR-PRL-M',
'100000000003',
0.70,
145.00,
80.00
),

(
'90000000-0000-0000-0000-000000000004',
'80000000-0000-0000-0000-000000000003',
'CS-BLC-L',
'100000000004',
0.50,
170.00,
95.00
),

(
'90000000-0000-0000-0000-000000000005',
'80000000-0000-0000-0000-000000000004',
'JGR-ARN-M',
'100000000005',
0.80,
185.00,
100.00
);

-- =========================================================
-- RELACION VARIANTES - ATRIBUTOS
-- =========================================================

INSERT INTO variant_attribute_values (variant_id, attribute_value_id) VALUES
('90000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001'),
('90000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000007'),
('90000000-0000-0000-0000-000000000002', '41000000-0000-0000-0000-000000000001'),
('90000000-0000-0000-0000-000000000002', '41000000-0000-0000-0000-000000000007'),
('90000000-0000-0000-0000-000000000003', '41000000-0000-0000-0000-000000000004'),
('90000000-0000-0000-0000-000000000003', '41000000-0000-0000-0000-000000000009');

-- =========================================================
-- RELACION VARIANTE - TALLAS
-- =========================================================

INSERT INTO variant_sizes (variant_id, size_id, fit_id) VALUES

('90000000-0000-0000-0000-000000000001',
'50000000-0000-0000-0000-000000000002',
'60000000-0000-0000-0000-000000000001'),

('90000000-0000-0000-0000-000000000002',
'50000000-0000-0000-0000-000000000003',
'60000000-0000-0000-0000-000000000001'),

('90000000-0000-0000-0000-000000000003',
'50000000-0000-0000-0000-000000000002',
'60000000-0000-0000-0000-000000000002');

-- =========================================================
-- MEDIDAS POR VARIANTE
-- =========================================================

INSERT INTO variant_measurements (
    id,
    variant_id,
    size_id,
    measurement_type_id,
    value
) VALUES

(
'91000000-0000-0000-0000-000000000001',
'90000000-0000-0000-0000-000000000001',
'50000000-0000-0000-0000-000000000002',
'70000000-0000-0000-0000-000000000001',
54.00
),

(
'91000000-0000-0000-0000-000000000002',
'90000000-0000-0000-0000-000000000001',
'50000000-0000-0000-0000-000000000002',
'70000000-0000-0000-0000-000000000002',
72.00
);

-- =========================================================
-- IMAGENES DE PRODUCTOS
-- =========================================================

INSERT INTO product_images (
    id,
    product_id,
    url,
    is_main
) VALUES

(
'92000000-0000-0000-0000-000000000001',
'80000000-0000-0000-0000-000000000001',
'https://cdn.tienda.com/products/polo-rib-negro.jpg',
TRUE
),

(
'92000000-0000-0000-0000-000000000002',
'80000000-0000-0000-0000-000000000002',
'https://cdn.tienda.com/products/polera-oversize-perla.jpg',
TRUE
);

-- =========================================================
-- IMAGENES DE VARIANTES
-- =========================================================

INSERT INTO variant_images (
    id,
    variant_id,
    url
) VALUES

(
'93000000-0000-0000-0000-000000000001',
'90000000-0000-0000-0000-000000000001',
'https://cdn.tienda.com/variants/rib-black-m.jpg'
),

(
'93000000-0000-0000-0000-000000000002',
'90000000-0000-0000-0000-000000000003',
'https://cdn.tienda.com/variants/oversize-perla-m.jpg'
);

-- =========================================================
-- INVENTARIOS
-- =========================================================

INSERT INTO inventories (
    id,
    branch_id,
    variant_id,
    stock,
    min_stock
) VALUES

(
'94000000-0000-0000-0000-000000000001',
'30000000-0000-0000-0000-000000000001',
'90000000-0000-0000-0000-000000000001',
20,
5
),

(
'94000000-0000-0000-0000-000000000002',
'30000000-0000-0000-0000-000000000002',
'90000000-0000-0000-0000-000000000002',
15,
5
),

(
'94000000-0000-0000-0000-000000000003',
'30000000-0000-0000-0000-000000000003',
'90000000-0000-0000-0000-000000000003',
12,
3
);






-- =========================================
-- 1. ELIMINAR TABLA variant_sizes
-- =========================================

DROP TABLE IF EXISTS variant_sizes CASCADE;



-- =========================================
-- 2. MODIFICAR product_variants
-- =========================================

ALTER TABLE product_variants
ADD COLUMN size_id UUID REFERENCES sizes(id),
ADD COLUMN fit_id UUID REFERENCES fits(id);



-- =========================================
-- 3. ELIMINAR UNIQUE ACTUAL DE sku
-- (porque usarás soft delete)
-- =========================================

ALTER TABLE product_variants
DROP CONSTRAINT IF EXISTS product_variants_sku_key;



-- =========================================
-- 4. CREAR UNIQUE INDEX PARA SKU ACTIVOS
-- =========================================

CREATE UNIQUE INDEX idx_product_variants_sku_active
ON product_variants(sku)
WHERE deleted_at IS NULL;



-- =========================================
-- 5. MODIFICAR variant_measurements
-- =========================================

-- Eliminar constraint UNIQUE antiguo
ALTER TABLE variant_measurements
DROP CONSTRAINT IF EXISTS variant_measurements_variant_id_size_id_measurement_type_key;

-- Eliminar columna size_id
ALTER TABLE variant_measurements
DROP COLUMN IF EXISTS size_id;

-- Crear nuevo UNIQUE
ALTER TABLE variant_measurements
ADD CONSTRAINT uq_variant_measurements
UNIQUE (variant_id, measurement_type_id);



-- =========================================
-- 6. MEJORAR inventory_movements
-- =========================================

ALTER TABLE inventory_movements
RENAME COLUMN type TO movement_type;



ALTER TABLE inventory_movements
ADD COLUMN stock_before INT,
ADD COLUMN stock_after INT,
ADD COLUMN reference_type VARCHAR(50),
ADD COLUMN reference_id UUID,
ADD COLUMN notes TEXT,
ADD COLUMN created_by UUID REFERENCES users(id);



-- =========================================
-- 7. CAMBIAR CHECK DE movement_type
-- =========================================

ALTER TABLE inventory_movements
DROP CONSTRAINT IF EXISTS inventory_movements_type_check;



ALTER TABLE inventory_movements
ADD CONSTRAINT inventory_movements_movement_type_check
CHECK (
    movement_type IN (
        'purchase',
        'sale',
        'return',
        'adjustment',
        'transfer_in',
        'transfer_out'
    )
);



-- =========================================
-- 8. AGREGAR CHECKS IMPORTANTES
-- =========================================

ALTER TABLE inventory_movements
ADD CONSTRAINT chk_inventory_quantity_positive
CHECK (quantity > 0);



-- =========================================
-- 9. ÍNDICES IMPORTANTES
-- =========================================

CREATE INDEX idx_inventory_movements_variant
ON inventory_movements(variant_id);

CREATE INDEX idx_inventory_movements_branch
ON inventory_movements(branch_id);

CREATE INDEX idx_inventory_movements_reference
ON inventory_movements(reference_type, reference_id);



-- =========================================
-- 10. UNIQUE OPCIONAL PARA EVITAR
-- DUPLICADOS BÁSICOS
-- =========================================

CREATE UNIQUE INDEX idx_variant_unique_combination
ON product_variants (
    product_id,
    size_id,
    fit_id,
    sku
)
WHERE deleted_at IS NULL;













-- =========================================
-- ATTRIBUTES
-- =========================================

INSERT INTO attributes (name)
VALUES
('Color'),
('Material'),
('Gender'),
('Style'),
('Season');



-- =========================================
-- ATTRIBUTE VALUES
-- =========================================

-- COLOR
INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Negro'
FROM attributes
WHERE name = 'Color';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Blanco'
FROM attributes
WHERE name = 'Color';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Rojo'
FROM attributes
WHERE name = 'Color';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Azul'
FROM attributes
WHERE name = 'Color';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Verde'
FROM attributes
WHERE name = 'Color';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Gris'
FROM attributes
WHERE name = 'Color';



-- MATERIAL
INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Algodón'
FROM attributes
WHERE name = 'Material';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Poliéster'
FROM attributes
WHERE name = 'Material';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Jean'
FROM attributes
WHERE name = 'Material';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Lana'
FROM attributes
WHERE name = 'Material';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Cuero'
FROM attributes
WHERE name = 'Material';



-- GENDER
INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Hombre'
FROM attributes
WHERE name = 'Gender';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Mujer'
FROM attributes
WHERE name = 'Gender';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Unisex'
FROM attributes
WHERE name = 'Gender';



-- STYLE
INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Casual'
FROM attributes
WHERE name = 'Style';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Oversize'
FROM attributes
WHERE name = 'Style';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Deportivo'
FROM attributes
WHERE name = 'Style';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Formal'
FROM attributes
WHERE name = 'Style';



-- SEASON
INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Invierno'
FROM attributes
WHERE name = 'Season';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Verano'
FROM attributes
WHERE name = 'Season';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Primavera'
FROM attributes
WHERE name = 'Season';

INSERT INTO attribute_values (attribute_id, value)
SELECT id, 'Otoño'
FROM attributes
WHERE name = 'Season';



-- =========================================
-- SIZES
-- =========================================

INSERT INTO sizes (name, description)
VALUES
('XS', 'Extra Small'),
('S', 'Small'),
('M', 'Medium'),
('L', 'Large'),
('XL', 'Extra Large'),
('XXL', 'Double Extra Large');



-- =========================================
-- FITS
-- =========================================

INSERT INTO fits (name)
VALUES
('Slim'),
('Regular'),
('Oversize'),
('Relaxed'),
('Skinny');



-- =========================================
-- MEASUREMENT TYPES
-- =========================================

INSERT INTO measurement_types (name)
VALUES
('Pecho'),
('Cintura'),
('Cadera'),
('Largo'),
('Manga'),
('Hombro'),
('Muslo'),
('Tobillo');



-- =========================================
-- PRODUCT TYPE MEASUREMENTS
-- =========================================

-- POLO
INSERT INTO product_type_measurements (
    product_type_id,
    measurement_type_id
)
SELECT
    pt.id,
    mt.id
FROM product_types pt
JOIN measurement_types mt
ON mt.name IN (
    'Pecho',
    'Largo',
    'Manga',
    'Hombro'
)
WHERE pt.name = 'Polo';



-- HOODIE
INSERT INTO product_type_measurements (
    product_type_id,
    measurement_type_id
)
SELECT
    pt.id,
    mt.id
FROM product_types pt
JOIN measurement_types mt
ON mt.name IN (
    'Pecho',
    'Largo',
    'Manga',
    'Hombro'
)
WHERE pt.name = 'Hoodie';



-- JEANS
INSERT INTO product_type_measurements (
    product_type_id,
    measurement_type_id
)
SELECT
    pt.id,
    mt.id
FROM product_types pt
JOIN measurement_types mt
ON mt.name IN (
    'Cintura',
    'Cadera',
    'Largo',
    'Muslo',
    'Tobillo'
)
WHERE pt.name = 'Jeans';



-- PANTALÓN
INSERT INTO product_type_measurements (
    product_type_id,
    measurement_type_id
)
SELECT
    pt.id,
    mt.id
FROM product_types pt
JOIN measurement_types mt
ON mt.name IN (
    'Cintura',
    'Cadera',
    'Largo'
)
WHERE pt.name = 'Pantalón';