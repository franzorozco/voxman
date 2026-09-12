--
-- PostgreSQL database dump
--

\restrict Wu9zCzIMiJkhPyMFAPHzj9DcD26mqcBvpcSdLnJlsy0Ue9JWjGhSzB6kAUfE8yw

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-06-23 16:55:03

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 30723)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 6055 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 1152 (class 1247 OID 48850)
-- Name: delivery_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.delivery_type AS ENUM (
    'pickup',
    'home_delivery',
    'external',
    'scheduled_point'
);


ALTER TYPE public.delivery_type OWNER TO admin;

--
-- TOC entry 969 (class 1247 OID 31260)
-- Name: movement_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.movement_type AS ENUM (
    'income',
    'expense'
);


ALTER TYPE public.movement_type OWNER TO postgres;

--
-- TOC entry 966 (class 1247 OID 31252)
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'completed',
    'failed'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- TOC entry 1119 (class 1247 OID 48650)
-- Name: purchase_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.purchase_status AS ENUM (
    'pending',
    'received',
    'cancelled'
);


ALTER TYPE public.purchase_status OWNER TO admin;

--
-- TOC entry 1140 (class 1247 OID 48790)
-- Name: reception_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.reception_status AS ENUM (
    'pending',
    'partial',
    'completed'
);


ALTER TYPE public.reception_status OWNER TO admin;

--
-- TOC entry 963 (class 1247 OID 31242)
-- Name: sale_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.sale_status AS ENUM (
    'pending',
    'paid',
    'cancelled',
    'refunded'
);


ALTER TYPE public.sale_status OWNER TO postgres;

--
-- TOC entry 960 (class 1247 OID 31236)
-- Name: sale_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.sale_type AS ENUM (
    'store',
    'online'
);


ALTER TYPE public.sale_type OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 276 (class 1259 OID 48733)
-- Name: accounts_payable; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.accounts_payable (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    supplier_id uuid,
    purchase_id uuid,
    total_amount numeric(10,2),
    paid_amount numeric(10,2) DEFAULT 0,
    balance numeric(10,2),
    due_date date,
    status character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT accounts_payable_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'partial'::character varying, 'paid'::character varying])::text[])))
);


ALTER TABLE public.accounts_payable OWNER TO admin;

--
-- TOC entry 232 (class 1259 OID 30883)
-- Name: addresses; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.addresses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid,
    branch_id uuid,
    address_type character varying(20),
    country character varying(100) DEFAULT 'Bolivia'::character varying,
    state character varying(100),
    city character varying(100),
    zone character varying(150),
    street character varying(150),
    reference text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    latitude numeric(10,8),
    longitude numeric(11,8),
    zone_id uuid,
    CONSTRAINT addresses_address_type_check CHECK (((address_type)::text = ANY ((ARRAY['shipping'::character varying, 'billing'::character varying, 'branch'::character varying])::text[]))),
    CONSTRAINT chk_addresses_owner CHECK ((((customer_id IS NOT NULL) AND (branch_id IS NULL)) OR ((customer_id IS NULL) AND (branch_id IS NOT NULL))))
);


ALTER TABLE public.addresses OWNER TO admin;

--
-- TOC entry 299 (class 1259 OID 66853)
-- Name: attribute_value_images; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.attribute_value_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    attribute_value_id uuid,
    product_id uuid,
    url text NOT NULL,
    is_main boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.attribute_value_images OWNER TO admin;

--
-- TOC entry 237 (class 1259 OID 30969)
-- Name: attribute_values; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.attribute_values (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    attribute_id uuid,
    value character varying(100) NOT NULL,
    hex_code character varying(7)
);


ALTER TABLE public.attribute_values OWNER TO admin;

--
-- TOC entry 236 (class 1259 OID 30961)
-- Name: attributes; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.attributes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    is_fixed boolean DEFAULT false
);


ALTER TABLE public.attributes OWNER TO admin;

--
-- TOC entry 265 (class 1259 OID 31555)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    action character varying(100),
    table_name character varying(100),
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO admin;

--
-- TOC entry 300 (class 1259 OID 83566)
-- Name: branch_images; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.branch_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    image_url character varying(255) NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.branch_images OWNER TO admin;

--
-- TOC entry 231 (class 1259 OID 30874)
-- Name: branches; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.branches (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(150) NOT NULL,
    phone character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.branches OWNER TO admin;

--
-- TOC entry 302 (class 1259 OID 83615)
-- Name: brands; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.brands (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    logo_url character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.brands OWNER TO admin;

--
-- TOC entry 301 (class 1259 OID 83614)
-- Name: brands_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.brands_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.brands_id_seq OWNER TO admin;

--
-- TOC entry 6056 (class 0 OID 0)
-- Dependencies: 301
-- Name: brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.brands_id_seq OWNED BY public.brands.id;


--
-- TOC entry 311 (class 1259 OID 83879)
-- Name: bundle_items; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.bundle_items (
    id uuid NOT NULL,
    bundle_id uuid NOT NULL,
    product_id uuid,
    variant_id uuid,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.bundle_items OWNER TO admin;

--
-- TOC entry 310 (class 1259 OID 83867)
-- Name: bundles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.bundles (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    image_url character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


ALTER TABLE public.bundles OWNER TO admin;

--
-- TOC entry 270 (class 1259 OID 40301)
-- Name: cache; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration integer NOT NULL
);


ALTER TABLE public.cache OWNER TO admin;

--
-- TOC entry 271 (class 1259 OID 40312)
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration integer NOT NULL
);


ALTER TABLE public.cache_locks OWNER TO admin;

--
-- TOC entry 257 (class 1259 OID 31388)
-- Name: cart_items; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cart_id uuid,
    variant_id uuid,
    quantity integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    bundle_id uuid,
    bundle_group_id uuid,
    parent_id uuid
);


ALTER TABLE public.cart_items OWNER TO admin;

--
-- TOC entry 256 (class 1259 OID 31375)
-- Name: carts; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.carts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.carts OWNER TO admin;

--
-- TOC entry 261 (class 1259 OID 31467)
-- Name: cash_movements; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.cash_movements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cash_register_id uuid,
    movement_type public.movement_type NOT NULL,
    amount numeric(10,2) NOT NULL,
    reference_type character varying(50),
    reference_id uuid,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);


ALTER TABLE public.cash_movements OWNER TO admin;

--
-- TOC entry 259 (class 1259 OID 31419)
-- Name: cash_registers; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.cash_registers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid,
    employee_id uuid,
    opening_amount numeric(10,2) NOT NULL,
    closing_amount numeric(10,2),
    opened_at timestamp without time zone NOT NULL,
    closed_at timestamp without time zone,
    status character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    CONSTRAINT cash_registers_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'closed'::character varying])::text[])))
);


ALTER TABLE public.cash_registers OWNER TO admin;

--
-- TOC entry 233 (class 1259 OID 30906)
-- Name: categories; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(150) NOT NULL,
    parent_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);


ALTER TABLE public.categories OWNER TO admin;

--
-- TOC entry 223 (class 1259 OID 30783)
-- Name: customers; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.customers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    customer_code character varying(20) NOT NULL,
    points integer DEFAULT 0,
    total_purchases numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    is_active boolean DEFAULT true
);


ALTER TABLE public.customers OWNER TO admin;

--
-- TOC entry X (Custom)
-- Name: pos_customer_profiles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.pos_customer_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name_paternal character varying(100),
    last_name_maternal character varying(100),
    phone character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);

ALTER TABLE public.pos_customer_profiles OWNER TO admin;

--
-- TOC entry 284 (class 1259 OID 48898)
-- Name: delivery_drivers; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.delivery_drivers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    vehicle_type character varying(50),
    plate character varying(20),
    status character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT delivery_drivers_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'busy'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.delivery_drivers OWNER TO admin;

--
-- TOC entry 282 (class 1259 OID 48868)
-- Name: delivery_schedules; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.delivery_schedules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    shipment_id uuid,
    scheduled_date date NOT NULL,
    time_window character varying(50),
    status character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    driver_id uuid,
    meeting_point character varying(255),
    CONSTRAINT delivery_schedules_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'assigned'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.delivery_schedules OWNER TO admin;

--
-- TOC entry 285 (class 1259 OID 48917)
-- Name: delivery_zones; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.delivery_zones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100),
    city character varying(100),
    base_cost numeric(10,2),
    extra_cost_per_km numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.delivery_zones OWNER TO admin;

--
-- TOC entry 304 (class 1259 OID 83660)
-- Name: discount_branches; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.discount_branches (
    discount_id uuid NOT NULL,
    branch_id uuid NOT NULL
);


ALTER TABLE public.discount_branches OWNER TO admin;

--
-- TOC entry 307 (class 1259 OID 83717)
-- Name: discount_brands; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.discount_brands (
    discount_id uuid NOT NULL,
    brand_id bigint NOT NULL
);


ALTER TABLE public.discount_brands OWNER TO admin;

--
-- TOC entry 312 (class 1259 OID 83937)
-- Name: discount_bundles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.discount_bundles (
    discount_id uuid NOT NULL,
    bundle_id uuid NOT NULL
);


ALTER TABLE public.discount_bundles OWNER TO admin;

--
-- TOC entry 251 (class 1259 OID 31218)
-- Name: discount_categories; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.discount_categories (
    discount_id uuid NOT NULL,
    category_id uuid NOT NULL
);


ALTER TABLE public.discount_categories OWNER TO admin;

--
-- TOC entry 305 (class 1259 OID 83677)
-- Name: discount_customers; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.discount_customers (
    discount_id uuid NOT NULL,
    customer_id uuid NOT NULL
);


ALTER TABLE public.discount_customers OWNER TO admin;

--
-- TOC entry 306 (class 1259 OID 83694)
-- Name: discount_employees; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.discount_employees (
    discount_id uuid NOT NULL,
    employee_id uuid NOT NULL
);


ALTER TABLE public.discount_employees OWNER TO admin;

--
-- TOC entry 250 (class 1259 OID 31201)
-- Name: discount_products; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.discount_products (
    discount_id uuid NOT NULL,
    product_id uuid NOT NULL
);


ALTER TABLE public.discount_products OWNER TO admin;

--
-- TOC entry 303 (class 1259 OID 83643)
-- Name: discount_variants; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.discount_variants (
    discount_id uuid NOT NULL,
    variant_id uuid NOT NULL
);


ALTER TABLE public.discount_variants OWNER TO admin;

--
-- TOC entry 249 (class 1259 OID 31189)
-- Name: discounts; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.discounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(20),
    value numeric(10,2) NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    code character varying(50),
    is_automatic boolean DEFAULT true,
    min_purchase_amount numeric(10,2) DEFAULT 0,
    min_quantity integer DEFAULT 0,
    max_discount_amount numeric(10,2),
    usage_limit integer,
    used_count integer DEFAULT 0,
    CONSTRAINT discounts_type_check CHECK (((type)::text = ANY ((ARRAY['percentage'::character varying, 'fixed'::character varying])::text[])))
);


ALTER TABLE public.discounts OWNER TO admin;

--
-- TOC entry 316 (class 1259 OID 84104)
-- Name: employee_attendances; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.employee_attendances (
    id uuid NOT NULL,
    employee_id uuid NOT NULL,
    date date NOT NULL,
    check_in timestamp(0) without time zone,
    check_out timestamp(0) without time zone,
    status character varying(255) DEFAULT 'present'::character varying NOT NULL,
    notes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.employee_attendances OWNER TO admin;

--
-- TOC entry 294 (class 1259 OID 49068)
-- Name: employee_commissions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.employee_commissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid,
    sale_id uuid,
    commission_amount numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_commissions OWNER TO admin;

--
-- TOC entry 296 (class 1259 OID 49100)
-- Name: employee_payments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.employee_payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid,
    base_salary numeric(10,2),
    commissions numeric(10,2),
    bonuses numeric(10,2) DEFAULT 0,
    deductions numeric(10,2) DEFAULT 0,
    total_paid numeric(10,2),
    payment_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_payments OWNER TO admin;

--
-- TOC entry 295 (class 1259 OID 49087)
-- Name: employee_sales_summary; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.employee_sales_summary (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid,
    period_start date,
    period_end date,
    total_sales numeric(10,2),
    total_commissions numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_sales_summary OWNER TO admin;

--
-- TOC entry 293 (class 1259 OID 49044)
-- Name: employees; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.employees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    branch_id uuid,
    role character varying(50),
    base_salary numeric(10,2) DEFAULT 0,
    commission_percentage numeric(5,2) DEFAULT 0,
    hire_date date,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    is_active boolean DEFAULT true,
    employee_code character varying(50),
    phone character varying(20),
    emergency_contact character varying(100),
    max_discount_allowed numeric(5,2) DEFAULT 0,
    can_approve_returns boolean DEFAULT false,
    can_manage_inventory boolean DEFAULT false,
    contract_type character varying(50),
    last_promotion_date date,
    notes text
);


ALTER TABLE public.employees OWNER TO admin;

--
-- TOC entry 317 (class 1259 OID 84152)
-- Name: expense_splits; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.expense_splits (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    expense_id uuid,
    owner_id uuid,
    amount numeric(10,2) NOT NULL,
    percentage numeric(5,2) DEFAULT NULL::numeric,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    deducted_from_wallet boolean DEFAULT false NOT NULL,
    paid_at timestamp(0) without time zone,
    fund_source character varying(255)
);


ALTER TABLE public.expense_splits OWNER TO admin;

--
-- TOC entry 297 (class 1259 OID 49116)
-- Name: expenses; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.expenses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid,
    name character varying(150),
    amount numeric(10,2),
    expense_date date,
    type character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    split_type character varying(20) DEFAULT 'single_owner'::character varying,
    description text,
    category character varying(50) DEFAULT 'General'::character varying,
    status character varying(20) DEFAULT 'paid'::character varying,
    is_recurring boolean DEFAULT false NOT NULL,
    recurrence_interval character varying(20),
    fund_source character varying(20),
    deducted_from_wallet boolean DEFAULT true NOT NULL,
    CONSTRAINT expenses_split_type_check CHECK (((split_type)::text = ANY ((ARRAY['equal'::character varying, 'proportional'::character varying, 'custom'::character varying, 'single_owner'::character varying])::text[]))),
    CONSTRAINT expenses_type_check CHECK (((type)::text = ANY ((ARRAY['fixed'::character varying, 'variable'::character varying])::text[])))
);


ALTER TABLE public.expenses OWNER TO admin;

--
-- TOC entry 241 (class 1259 OID 31025)
-- Name: fits; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.fits (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.fits OWNER TO admin;

--
-- TOC entry 314 (class 1259 OID 84017)
-- Name: giftcard_transactions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.giftcard_transactions (
    id uuid NOT NULL,
    giftcard_id uuid NOT NULL,
    type character varying(20) NOT NULL,
    amount numeric(10,2) NOT NULL,
    sale_id uuid,
    notes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


ALTER TABLE public.giftcard_transactions OWNER TO admin;

--
-- TOC entry 313 (class 1259 OID 83987)
-- Name: giftcards; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.giftcards (
    id uuid NOT NULL,
    code character varying(50) NOT NULL,
    initial_balance numeric(10,2) NOT NULL,
    current_balance numeric(10,2) NOT NULL,
    customer_id uuid,
    purchaser_id uuid,
    sale_detail_id uuid,
    expires_at timestamp(0) without time zone,
    is_active boolean DEFAULT true NOT NULL,
    is_digitalized boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


ALTER TABLE public.giftcards OWNER TO admin;

--
-- TOC entry 247 (class 1259 OID 31139)
-- Name: inventories; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.inventories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid,
    variant_id uuid,
    stock integer DEFAULT 0,
    min_stock integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    CONSTRAINT inventories_stock_check CHECK ((stock >= 0))
);


ALTER TABLE public.inventories OWNER TO admin;

--
-- TOC entry 248 (class 1259 OID 31162)
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.inventory_movements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    variant_id uuid,
    branch_id uuid,
    employee_id uuid,
    movement_type character varying(20),
    quantity integer,
    reference text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    stock_before integer,
    stock_after integer,
    reference_type character varying(50),
    reference_id uuid,
    notes text,
    created_by uuid,
    CONSTRAINT chk_inventory_quantity_positive CHECK ((quantity > 0)),
    CONSTRAINT inventory_movements_movement_type_check CHECK (((movement_type)::text = ANY ((ARRAY['purchase'::character varying, 'sale'::character varying, 'return'::character varying, 'adjustment'::character varying, 'transfer_in'::character varying, 'transfer_out'::character varying])::text[]))),
    CONSTRAINT inventory_movements_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.inventory_movements OWNER TO admin;

--
-- TOC entry 309 (class 1259 OID 83761)
-- Name: issued_coupons; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.issued_coupons (
    id uuid NOT NULL,
    discount_id uuid NOT NULL,
    customer_id uuid,
    employee_id uuid,
    qr_code character varying(255) NOT NULL,
    is_used boolean DEFAULT false NOT NULL,
    used_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.issued_coupons OWNER TO admin;

--
-- TOC entry 242 (class 1259 OID 31056)
-- Name: measurement_types; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.measurement_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.measurement_types OWNER TO admin;

--
-- TOC entry 267 (class 1259 OID 31589)
-- Name: migrations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


ALTER TABLE public.migrations OWNER TO admin;

--
-- TOC entry 266 (class 1259 OID 31588)
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO admin;

--
-- TOC entry 6057 (class 0 OID 0)
-- Dependencies: 266
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- TOC entry 228 (class 1259 OID 30831)
-- Name: model_has_permissions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.model_has_permissions (
    permission_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id uuid NOT NULL
);


ALTER TABLE public.model_has_permissions OWNER TO admin;

--
-- TOC entry 229 (class 1259 OID 30844)
-- Name: model_has_roles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.model_has_roles (
    role_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id uuid NOT NULL
);


ALTER TABLE public.model_has_roles OWNER TO admin;

--
-- TOC entry 288 (class 1259 OID 48956)
-- Name: notifications; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    title character varying(150),
    message text,
    type character varying(50),
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO admin;

--
-- TOC entry 262 (class 1259 OID 31484)
-- Name: owner_payments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.owner_payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    owner_id uuid,
    total_amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    payment_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    type character varying(20) DEFAULT 'withdrawal'::character varying,
    fund_source character varying(20),
    notes text,
    reference_number character varying(255),
    payment_method character varying(255),
    CONSTRAINT owner_payments_type_check CHECK (((type)::text = ANY ((ARRAY['withdrawal'::character varying, 'deposit'::character varying])::text[])))
);


ALTER TABLE public.owner_payments OWNER TO admin;

--
-- TOC entry 222 (class 1259 OID 30768)
-- Name: owners; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.owners (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    is_active boolean DEFAULT true
);


ALTER TABLE public.owners OWNER TO admin;

--
-- TOC entry 258 (class 1259 OID 31409)
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.payment_methods (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.payment_methods OWNER TO admin;

--
-- TOC entry 260 (class 1259 OID 31440)
-- Name: payments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sale_id uuid,
    cash_register_id uuid,
    payment_method_id uuid,
    amount numeric(10,2) NOT NULL,
    currency character varying(10) DEFAULT 'BOB'::character varying,
    status public.payment_status DEFAULT 'completed'::public.payment_status,
    transaction_reference character varying(150),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    gift_card_id uuid,
    CONSTRAINT payments_amount_check CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.payments OWNER TO admin;

--
-- TOC entry 227 (class 1259 OID 30818)
-- Name: permissions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.permissions (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);


ALTER TABLE public.permissions OWNER TO admin;

--
-- TOC entry 226 (class 1259 OID 30817)
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO admin;

--
-- TOC entry 6058 (class 0 OID 0)
-- Dependencies: 226
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- TOC entry 269 (class 1259 OID 31635)
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id uuid NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.personal_access_tokens OWNER TO admin;

--
-- TOC entry 268 (class 1259 OID 31634)
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.personal_access_tokens_id_seq OWNER TO admin;

--
-- TOC entry 6059 (class 0 OID 0)
-- Dependencies: 268
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- TOC entry 245 (class 1259 OID 31106)
-- Name: product_images; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.product_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid,
    url text NOT NULL,
    is_main boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_images OWNER TO admin;

--
-- TOC entry 263 (class 1259 OID 31518)
-- Name: product_price_history; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.product_price_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    variant_id uuid,
    old_price numeric(10,2),
    new_price numeric(10,2),
    changed_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_price_history OWNER TO admin;

--
-- TOC entry 290 (class 1259 OID 48991)
-- Name: product_reviews; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.product_reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid,
    customer_id uuid,
    rating integer,
    comment text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT product_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.product_reviews OWNER TO admin;

--
-- TOC entry 243 (class 1259 OID 31064)
-- Name: product_type_measurements; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.product_type_measurements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_type_id uuid,
    measurement_type_id uuid
);


ALTER TABLE public.product_type_measurements OWNER TO admin;

--
-- TOC entry 234 (class 1259 OID 30921)
-- Name: product_types; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.product_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);


ALTER TABLE public.product_types OWNER TO admin;

--
-- TOC entry 238 (class 1259 OID 30982)
-- Name: product_variants; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.product_variants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid,
    sku character varying(100) NOT NULL,
    barcode character varying(100),
    weight numeric(10,2),
    price numeric(10,2),
    cost numeric(10,2),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    size_id uuid,
    fit_id uuid
);


ALTER TABLE public.product_variants OWNER TO admin;

--
-- TOC entry 235 (class 1259 OID 30930)
-- Name: products; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    owner_id uuid,
    category_id uuid,
    product_type_id uuid,
    name character varying(200) NOT NULL,
    description text,
    slug character varying(255),
    base_price numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true,
    views integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    brand_id bigint,
    is_bundle boolean DEFAULT false
);


ALTER TABLE public.products OWNER TO admin;

--
-- TOC entry 274 (class 1259 OID 48686)
-- Name: purchase_details; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.purchase_details (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    purchase_id uuid,
    variant_id uuid,
    quantity integer NOT NULL,
    unit_cost numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT purchase_details_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.purchase_details OWNER TO admin;

--
-- TOC entry 278 (class 1259 OID 48771)
-- Name: purchase_price_history; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.purchase_price_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    variant_id uuid,
    purchase_id uuid,
    cost numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.purchase_price_history OWNER TO admin;

--
-- TOC entry 280 (class 1259 OID 48818)
-- Name: purchase_reception_details; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.purchase_reception_details (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    reception_id uuid,
    variant_id uuid,
    expected_quantity integer,
    received_quantity integer,
    damaged_quantity integer DEFAULT 0,
    wrong_quantity integer DEFAULT 0,
    extra_quantity integer DEFAULT 0,
    accepted_quantity integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.purchase_reception_details OWNER TO admin;

--
-- TOC entry 279 (class 1259 OID 48797)
-- Name: purchase_receptions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.purchase_receptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    purchase_id uuid,
    employee_id uuid,
    status public.reception_status DEFAULT 'pending'::public.reception_status,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.purchase_receptions OWNER TO admin;

--
-- TOC entry 273 (class 1259 OID 48657)
-- Name: purchases; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.purchases (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    supplier_id uuid,
    branch_id uuid,
    employee_id uuid,
    status public.purchase_status DEFAULT 'pending'::public.purchase_status,
    subtotal numeric(10,2) DEFAULT 0,
    tax numeric(10,2) DEFAULT 0,
    total numeric(10,2) DEFAULT 0,
    invoice_number character varying(50),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);


ALTER TABLE public.purchases OWNER TO admin;

--
-- TOC entry 315 (class 1259 OID 84047)
-- Name: quarantine_items; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.quarantine_items (
    id uuid NOT NULL,
    purchase_reception_id uuid NOT NULL,
    variant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    reason character varying(255) DEFAULT 'damaged'::character varying NOT NULL,
    quantity integer NOT NULL,
    resolved_quantity integer DEFAULT 0 NOT NULL,
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    notes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT quarantine_items_reason_check CHECK (((reason)::text = ANY ((ARRAY['damaged'::character varying, 'wrong'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT quarantine_items_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'partially_resolved'::character varying, 'resolved'::character varying])::text[])))
);


ALTER TABLE public.quarantine_items OWNER TO admin;

--
-- TOC entry 254 (class 1259 OID 31333)
-- Name: returns; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.returns (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sale_detail_id uuid,
    quantity integer,
    reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT returns_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.returns OWNER TO admin;

--
-- TOC entry 230 (class 1259 OID 30857)
-- Name: role_has_permissions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.role_has_permissions (
    permission_id bigint NOT NULL,
    role_id bigint NOT NULL
);


ALTER TABLE public.role_has_permissions OWNER TO admin;

--
-- TOC entry 225 (class 1259 OID 30804)
-- Name: roles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    is_employee boolean DEFAULT false NOT NULL,
    is_customer boolean DEFAULT false NOT NULL,
    CONSTRAINT check_roles_types CHECK ((NOT ((is_employee = true) AND (is_customer = true))))
);


ALTER TABLE public.roles OWNER TO admin;

--
-- TOC entry 224 (class 1259 OID 30803)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO admin;

--
-- TOC entry 6060 (class 0 OID 0)
-- Dependencies: 224
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 308 (class 1259 OID 83734)
-- Name: sale_applied_discounts; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.sale_applied_discounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sale_id uuid,
    sale_detail_id uuid,
    discount_id uuid,
    discount_amount numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sale_applied_discounts OWNER TO admin;

--
-- TOC entry 253 (class 1259 OID 31302)
-- Name: sale_details; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.sale_details (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sale_id uuid,
    variant_id uuid,
    owner_id uuid,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    discount numeric(10,2) DEFAULT 0,
    final_price numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    gift_card_id uuid,
    bundle_id uuid,
    bundle_group_id uuid,
    parent_id uuid,
    CONSTRAINT sale_details_final_price_check CHECK ((final_price >= (0)::numeric)),
    CONSTRAINT sale_details_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT sale_details_subtotal_check CHECK ((subtotal >= (0)::numeric))
);


ALTER TABLE public.sale_details OWNER TO admin;

--
-- TOC entry 289 (class 1259 OID 48972)
-- Name: sale_status_history; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.sale_status_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sale_id uuid,
    old_status public.sale_status,
    new_status public.sale_status,
    changed_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sale_status_history OWNER TO admin;

--
-- TOC entry 252 (class 1259 OID 31265)
-- Name: sales; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.sales (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid,
    branch_id uuid,
    user_id uuid,
    sale_type public.sale_type NOT NULL,
    status public.sale_status DEFAULT 'pending'::public.sale_status,
    source character varying(50),
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    discount_total numeric(10,2) DEFAULT 0,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    invoice_number character varying(50),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    employee_id uuid,
    CONSTRAINT sales_source_check CHECK (((source)::text = ANY ((ARRAY['web'::character varying, 'mobile'::character varying, 'store'::character varying])::text[]))),
    CONSTRAINT sales_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT sales_total_check CHECK ((total >= (0)::numeric))
);


ALTER TABLE public.sales OWNER TO admin;

--
-- TOC entry 298 (class 1259 OID 49165)
-- Name: sessions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


ALTER TABLE public.sessions OWNER TO admin;

--
-- TOC entry 286 (class 1259 OID 48930)
-- Name: shipment_cost_details; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.shipment_cost_details (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    shipment_id uuid,
    base_cost numeric(10,2),
    distance_cost numeric(10,2),
    extra_cost numeric(10,2),
    total numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shipment_cost_details OWNER TO admin;

--
-- TOC entry 287 (class 1259 OID 48943)
-- Name: shipment_locations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.shipment_locations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    shipment_id uuid,
    latitude numeric(10,8),
    longitude numeric(11,8),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shipment_locations OWNER TO admin;

--
-- TOC entry 283 (class 1259 OID 48883)
-- Name: shipment_tracking; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.shipment_tracking (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    shipment_id uuid,
    status character varying(50),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shipment_tracking OWNER TO admin;

--
-- TOC entry 264 (class 1259 OID 31536)
-- Name: shipments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.shipments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sale_id uuid,
    address_id uuid,
    status character varying(50) DEFAULT 'pending'::character varying,
    tracking_code character varying(100),
    shipped_at timestamp without time zone,
    delivered_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    delivery_type public.delivery_type DEFAULT 'pickup'::public.delivery_type NOT NULL,
    pickup_branch_id uuid,
    shipping_cost numeric(10,2) DEFAULT 0,
    scheduled_at timestamp without time zone,
    external_company character varying(150),
    external_guide character varying(150),
    shipping_payment_type character varying(20),
    delivery_code character varying(10),
    delivery_code_expires_at timestamp without time zone,
    delivery_confirmed boolean DEFAULT false,
    delivery_confirmed_at timestamp without time zone,
    delivery_attempts integer DEFAULT 0,
    CONSTRAINT chk_delivery_code_required CHECK (((delivery_type = 'external'::public.delivery_type) OR ((delivery_type <> 'external'::public.delivery_type) AND (delivery_code IS NOT NULL)))),
    CONSTRAINT shipments_shipping_payment_type_check CHECK (((shipping_payment_type)::text = ANY ((ARRAY['paid'::character varying, 'collect'::character varying])::text[])))
);


ALTER TABLE public.shipments OWNER TO admin;

--
-- TOC entry 240 (class 1259 OID 31016)
-- Name: sizes; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.sizes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(20) NOT NULL,
    description character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


ALTER TABLE public.sizes OWNER TO admin;

--
-- TOC entry 255 (class 1259 OID 31349)
-- Name: stock_reservations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.stock_reservations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    variant_id uuid,
    branch_id uuid,
    sale_id uuid,
    quantity integer NOT NULL,
    status character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT stock_reservations_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT stock_reservations_status_check CHECK (((status)::text = ANY ((ARRAY['reserved'::character varying, 'released'::character varying, 'confirmed'::character varying])::text[])))
);


ALTER TABLE public.stock_reservations OWNER TO admin;

--
-- TOC entry 277 (class 1259 OID 48753)
-- Name: stock_transfers; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.stock_transfers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    from_branch_id uuid,
    to_branch_id uuid,
    status character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.stock_transfers OWNER TO admin;

--
-- TOC entry 275 (class 1259 OID 48708)
-- Name: supplier_payments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.supplier_payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    supplier_id uuid,
    purchase_id uuid,
    amount numeric(10,2) NOT NULL,
    payment_method_id uuid,
    status character varying(20) DEFAULT 'completed'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.supplier_payments OWNER TO admin;

--
-- TOC entry 281 (class 1259 OID 48839)
-- Name: supplier_returns; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.supplier_returns (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    supplier_id uuid,
    purchase_id uuid,
    reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    variant_id uuid,
    quantity integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.supplier_returns OWNER TO admin;

--
-- TOC entry 272 (class 1259 OID 48632)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(150) NOT NULL,
    contact_name character varying(150),
    phone character varying(20),
    email character varying(150),
    address_id uuid,
    company_name character varying(150),
    tax_id character varying(50),
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);


ALTER TABLE public.suppliers OWNER TO admin;

--
-- TOC entry 221 (class 1259 OID 30752)
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    first_name character varying(100) NOT NULL,
    last_name_paternal character varying(100),
    last_name_maternal character varying(100),
    phone character varying(20),
    birthdate date,
    gender character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);


ALTER TABLE public.user_profiles OWNER TO admin;

--
-- TOC entry 220 (class 1259 OID 30734)
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(150) NOT NULL,
    username character varying(100),
    password text NOT NULL,
    last_login timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO admin;

--
-- TOC entry 6061 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN users.username; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.users.username IS 'comment';


--
-- TOC entry 239 (class 1259 OID 30999)
-- Name: variant_attribute_values; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.variant_attribute_values (
    variant_id uuid NOT NULL,
    attribute_value_id uuid NOT NULL
);


ALTER TABLE public.variant_attribute_values OWNER TO admin;

--
-- TOC entry 246 (class 1259 OID 31123)
-- Name: variant_images; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.variant_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    variant_id uuid,
    url text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.variant_images OWNER TO admin;

--
-- TOC entry 244 (class 1259 OID 31081)
-- Name: variant_measurements; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.variant_measurements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    variant_id uuid,
    measurement_type_id uuid,
    value numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.variant_measurements OWNER TO admin;

--
-- TOC entry 292 (class 1259 OID 49025)
-- Name: wishlist_items; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.wishlist_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    wishlist_id uuid,
    product_id uuid
);


ALTER TABLE public.wishlist_items OWNER TO admin;

--
-- TOC entry 291 (class 1259 OID 49012)
-- Name: wishlists; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.wishlists (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.wishlists OWNER TO admin;

--
-- TOC entry 5350 (class 2604 OID 83618)
-- Name: brands id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.brands ALTER COLUMN id SET DEFAULT nextval('public.brands_id_seq'::regclass);


--
-- TOC entry 5263 (class 2604 OID 31592)
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- TOC entry 5175 (class 2604 OID 30821)
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- TOC entry 5264 (class 2604 OID 31638)
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- TOC entry 5172 (class 2604 OID 30807)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 5565 (class 2606 OID 48742)
-- Name: accounts_payable accounts_payable_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.accounts_payable
    ADD CONSTRAINT accounts_payable_pkey PRIMARY KEY (id);


--
-- TOC entry 5440 (class 2606 OID 30895)
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- TOC entry 5619 (class 2606 OID 66865)
-- Name: attribute_value_images attribute_value_images_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.attribute_value_images
    ADD CONSTRAINT attribute_value_images_pkey PRIMARY KEY (id);


--
-- TOC entry 5456 (class 2606 OID 30976)
-- Name: attribute_values attribute_values_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.attribute_values
    ADD CONSTRAINT attribute_values_pkey PRIMARY KEY (id);


--
-- TOC entry 5454 (class 2606 OID 30968)
-- Name: attributes attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.attributes
    ADD CONSTRAINT attributes_pkey PRIMARY KEY (id);


--
-- TOC entry 5541 (class 2606 OID 31564)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5621 (class 2606 OID 83583)
-- Name: branch_images branch_images_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.branch_images
    ADD CONSTRAINT branch_images_pkey PRIMARY KEY (id);


--
-- TOC entry 5438 (class 2606 OID 30882)
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- TOC entry 5623 (class 2606 OID 83624)
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- TOC entry 5641 (class 2606 OID 83902)
-- Name: bundle_items bundle_items_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.bundle_items
    ADD CONSTRAINT bundle_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5639 (class 2606 OID 83878)
-- Name: bundles bundles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.bundles
    ADD CONSTRAINT bundles_pkey PRIMARY KEY (id);


--
-- TOC entry 5555 (class 2606 OID 40321)
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- TOC entry 5552 (class 2606 OID 40310)
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- TOC entry 5518 (class 2606 OID 83909)
-- Name: cart_items cart_items_bundle_unique; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_bundle_unique UNIQUE (cart_id, variant_id, bundle_group_id);


--
-- TOC entry 5520 (class 2606 OID 31396)
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5516 (class 2606 OID 31382)
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- TOC entry 5531 (class 2606 OID 31478)
-- Name: cash_movements cash_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cash_movements
    ADD CONSTRAINT cash_movements_pkey PRIMARY KEY (id);


--
-- TOC entry 5526 (class 2606 OID 31429)
-- Name: cash_registers cash_registers_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cash_registers
    ADD CONSTRAINT cash_registers_pkey PRIMARY KEY (id);


--
-- TOC entry 5443 (class 2606 OID 30914)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5417 (class 2606 OID 30797)
-- Name: customers customers_customer_code_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_customer_code_key UNIQUE (customer_code);


--
-- TOC entry 5419 (class 2606 OID 30793)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- TOC entry 5421 (class 2606 OID 30795)
-- Name: customers customers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_user_id_key UNIQUE (user_id);


--
-- TOC entry 5581 (class 2606 OID 48906)
-- Name: delivery_drivers delivery_drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.delivery_drivers
    ADD CONSTRAINT delivery_drivers_pkey PRIMARY KEY (id);


--
-- TOC entry 5577 (class 2606 OID 48877)
-- Name: delivery_schedules delivery_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.delivery_schedules
    ADD CONSTRAINT delivery_schedules_pkey PRIMARY KEY (id);


--
-- TOC entry 5583 (class 2606 OID 48924)
-- Name: delivery_zones delivery_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.delivery_zones
    ADD CONSTRAINT delivery_zones_pkey PRIMARY KEY (id);


--
-- TOC entry 5627 (class 2606 OID 83666)
-- Name: discount_branches discount_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_branches
    ADD CONSTRAINT discount_branches_pkey PRIMARY KEY (discount_id, branch_id);


--
-- TOC entry 5633 (class 2606 OID 83723)
-- Name: discount_brands discount_brands_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_brands
    ADD CONSTRAINT discount_brands_pkey PRIMARY KEY (discount_id, brand_id);


--
-- TOC entry 5643 (class 2606 OID 83943)
-- Name: discount_bundles discount_bundles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_bundles
    ADD CONSTRAINT discount_bundles_pkey PRIMARY KEY (discount_id, bundle_id);


--
-- TOC entry 5501 (class 2606 OID 31224)
-- Name: discount_categories discount_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_categories
    ADD CONSTRAINT discount_categories_pkey PRIMARY KEY (discount_id, category_id);


--
-- TOC entry 5629 (class 2606 OID 83683)
-- Name: discount_customers discount_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_customers
    ADD CONSTRAINT discount_customers_pkey PRIMARY KEY (discount_id, customer_id);


--
-- TOC entry 5631 (class 2606 OID 83700)
-- Name: discount_employees discount_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_employees
    ADD CONSTRAINT discount_employees_pkey PRIMARY KEY (discount_id, employee_id);


--
-- TOC entry 5499 (class 2606 OID 31207)
-- Name: discount_products discount_products_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_products
    ADD CONSTRAINT discount_products_pkey PRIMARY KEY (discount_id, product_id);


--
-- TOC entry 5625 (class 2606 OID 83649)
-- Name: discount_variants discount_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_variants
    ADD CONSTRAINT discount_variants_pkey PRIMARY KEY (discount_id, variant_id);


--
-- TOC entry 5495 (class 2606 OID 83716)
-- Name: discounts discounts_code_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT discounts_code_key UNIQUE (code);


--
-- TOC entry 5497 (class 2606 OID 31200)
-- Name: discounts discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT discounts_pkey PRIMARY KEY (id);


--
-- TOC entry 5656 (class 2606 OID 84120)
-- Name: employee_attendances employee_attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employee_attendances
    ADD CONSTRAINT employee_attendances_pkey PRIMARY KEY (id);


--
-- TOC entry 5607 (class 2606 OID 49075)
-- Name: employee_commissions employee_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employee_commissions
    ADD CONSTRAINT employee_commissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5611 (class 2606 OID 49109)
-- Name: employee_payments employee_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employee_payments
    ADD CONSTRAINT employee_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5609 (class 2606 OID 49094)
-- Name: employee_sales_summary employee_sales_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employee_sales_summary
    ADD CONSTRAINT employee_sales_summary_pkey PRIMARY KEY (id);


--
-- TOC entry 5601 (class 2606 OID 49182)
-- Name: employees employees_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_code_key UNIQUE (employee_code);


--
-- TOC entry 5603 (class 2606 OID 49055)
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- TOC entry 5605 (class 2606 OID 49057)
-- Name: employees employees_user_id_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_key UNIQUE (user_id);


--
-- TOC entry 5658 (class 2606 OID 84161)
-- Name: expense_splits expense_splits_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.expense_splits
    ADD CONSTRAINT expense_splits_pkey PRIMARY KEY (id);


--
-- TOC entry 5613 (class 2606 OID 49124)
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- TOC entry 5469 (class 2606 OID 31032)
-- Name: fits fits_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.fits
    ADD CONSTRAINT fits_pkey PRIMARY KEY (id);


--
-- TOC entry 5649 (class 2606 OID 84037)
-- Name: giftcard_transactions giftcard_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.giftcard_transactions
    ADD CONSTRAINT giftcard_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5645 (class 2606 OID 84016)
-- Name: giftcards giftcards_code_unique; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.giftcards
    ADD CONSTRAINT giftcards_code_unique UNIQUE (code);


--
-- TOC entry 5647 (class 2606 OID 84014)
-- Name: giftcards giftcards_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.giftcards
    ADD CONSTRAINT giftcards_pkey PRIMARY KEY (id);


--
-- TOC entry 5486 (class 2606 OID 31151)
-- Name: inventories inventories_branch_id_variant_id_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT inventories_branch_id_variant_id_key UNIQUE (branch_id, variant_id);


--
-- TOC entry 5488 (class 2606 OID 31149)
-- Name: inventories inventories_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT inventories_pkey PRIMARY KEY (id);


--
-- TOC entry 5493 (class 2606 OID 31173)
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- TOC entry 5637 (class 2606 OID 83785)
-- Name: issued_coupons issued_coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.issued_coupons
    ADD CONSTRAINT issued_coupons_pkey PRIMARY KEY (id);


--
-- TOC entry 5471 (class 2606 OID 31063)
-- Name: measurement_types measurement_types_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.measurement_types
    ADD CONSTRAINT measurement_types_pkey PRIMARY KEY (id);


--
-- TOC entry 5543 (class 2606 OID 31597)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 5432 (class 2606 OID 30838)
-- Name: model_has_permissions model_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_pkey PRIMARY KEY (permission_id, model_id, model_type);


--
-- TOC entry 5434 (class 2606 OID 30851)
-- Name: model_has_roles model_has_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.model_has_roles
    ADD CONSTRAINT model_has_roles_pkey PRIMARY KEY (role_id, model_id, model_type);


--
-- TOC entry 5589 (class 2606 OID 48966)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5534 (class 2606 OID 31493)
-- Name: owner_payments owner_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.owner_payments
    ADD CONSTRAINT owner_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5413 (class 2606 OID 30775)
-- Name: owners owners_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.owners
    ADD CONSTRAINT owners_pkey PRIMARY KEY (id);


--
-- TOC entry 5415 (class 2606 OID 30777)
-- Name: owners owners_user_id_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.owners
    ADD CONSTRAINT owners_user_id_key UNIQUE (user_id);


--
-- TOC entry 5522 (class 2606 OID 31418)
-- Name: payment_methods payment_methods_name_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_name_key UNIQUE (name);


--
-- TOC entry 5524 (class 2606 OID 31416)
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- TOC entry 5529 (class 2606 OID 31451)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5428 (class 2606 OID 30830)
-- Name: permissions permissions_name_guard_name_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_guard_name_key UNIQUE (name, guard_name);


--
-- TOC entry 5430 (class 2606 OID 30828)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5546 (class 2606 OID 31647)
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 5548 (class 2606 OID 31650)
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- TOC entry 5479 (class 2606 OID 31117)
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- TOC entry 5536 (class 2606 OID 31525)
-- Name: product_price_history product_price_history_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_price_history
    ADD CONSTRAINT product_price_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5593 (class 2606 OID 49001)
-- Name: product_reviews product_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 5473 (class 2606 OID 31070)
-- Name: product_type_measurements product_type_measurements_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_type_measurements
    ADD CONSTRAINT product_type_measurements_pkey PRIMARY KEY (id);


--
-- TOC entry 5446 (class 2606 OID 30929)
-- Name: product_types product_types_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT product_types_pkey PRIMARY KEY (id);


--
-- TOC entry 5462 (class 2606 OID 30991)
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- TOC entry 5450 (class 2606 OID 30943)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 5452 (class 2606 OID 30945)
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- TOC entry 5561 (class 2606 OID 48697)
-- Name: purchase_details purchase_details_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchase_details
    ADD CONSTRAINT purchase_details_pkey PRIMARY KEY (id);


--
-- TOC entry 5569 (class 2606 OID 48778)
-- Name: purchase_price_history purchase_price_history_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchase_price_history
    ADD CONSTRAINT purchase_price_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5573 (class 2606 OID 48828)
-- Name: purchase_reception_details purchase_reception_details_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchase_reception_details
    ADD CONSTRAINT purchase_reception_details_pkey PRIMARY KEY (id);


--
-- TOC entry 5571 (class 2606 OID 48807)
-- Name: purchase_receptions purchase_receptions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchase_receptions
    ADD CONSTRAINT purchase_receptions_pkey PRIMARY KEY (id);


--
-- TOC entry 5559 (class 2606 OID 48670)
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- TOC entry 5652 (class 2606 OID 84081)
-- Name: quarantine_items quarantine_items_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.quarantine_items
    ADD CONSTRAINT quarantine_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5512 (class 2606 OID 31343)
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (id);


--
-- TOC entry 5436 (class 2606 OID 30863)
-- Name: role_has_permissions role_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_pkey PRIMARY KEY (permission_id, role_id);


--
-- TOC entry 5424 (class 2606 OID 30816)
-- Name: roles roles_name_guard_name_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_guard_name_key UNIQUE (name, guard_name);


--
-- TOC entry 5426 (class 2606 OID 30814)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5635 (class 2606 OID 83742)
-- Name: sale_applied_discounts sale_applied_discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sale_applied_discounts
    ADD CONSTRAINT sale_applied_discounts_pkey PRIMARY KEY (id);


--
-- TOC entry 5510 (class 2606 OID 31317)
-- Name: sale_details sale_details_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sale_details
    ADD CONSTRAINT sale_details_pkey PRIMARY KEY (id);


--
-- TOC entry 5591 (class 2606 OID 48979)
-- Name: sale_status_history sale_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sale_status_history
    ADD CONSTRAINT sale_status_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5505 (class 2606 OID 31286)
-- Name: sales sales_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_invoice_number_key UNIQUE (invoice_number);


--
-- TOC entry 5507 (class 2606 OID 31284)
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- TOC entry 5616 (class 2606 OID 49174)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5585 (class 2606 OID 48937)
-- Name: shipment_cost_details shipment_cost_details_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.shipment_cost_details
    ADD CONSTRAINT shipment_cost_details_pkey PRIMARY KEY (id);


--
-- TOC entry 5587 (class 2606 OID 48950)
-- Name: shipment_locations shipment_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.shipment_locations
    ADD CONSTRAINT shipment_locations_pkey PRIMARY KEY (id);


--
-- TOC entry 5579 (class 2606 OID 48892)
-- Name: shipment_tracking shipment_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.shipment_tracking
    ADD CONSTRAINT shipment_tracking_pkey PRIMARY KEY (id);


--
-- TOC entry 5539 (class 2606 OID 31544)
-- Name: shipments shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_pkey PRIMARY KEY (id);


--
-- TOC entry 5467 (class 2606 OID 31024)
-- Name: sizes sizes_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sizes
    ADD CONSTRAINT sizes_pkey PRIMARY KEY (id);


--
-- TOC entry 5514 (class 2606 OID 31359)
-- Name: stock_reservations stock_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_pkey PRIMARY KEY (id);


--
-- TOC entry 5567 (class 2606 OID 48760)
-- Name: stock_transfers stock_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_pkey PRIMARY KEY (id);


--
-- TOC entry 5563 (class 2606 OID 48717)
-- Name: supplier_payments supplier_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5575 (class 2606 OID 48848)
-- Name: supplier_returns supplier_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.supplier_returns
    ADD CONSTRAINT supplier_returns_pkey PRIMARY KEY (id);


--
-- TOC entry 5557 (class 2606 OID 48643)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 5475 (class 2606 OID 57461)
-- Name: variant_measurements uq_variant_measurements; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.variant_measurements
    ADD CONSTRAINT uq_variant_measurements UNIQUE (variant_id, measurement_type_id);


--
-- TOC entry 5409 (class 2606 OID 30760)
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 5411 (class 2606 OID 30762)
-- Name: user_profiles user_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);


--
-- TOC entry 5402 (class 2606 OID 30748)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5404 (class 2606 OID 30746)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5406 (class 2606 OID 48496)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5465 (class 2606 OID 31005)
-- Name: variant_attribute_values variant_attribute_values_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.variant_attribute_values
    ADD CONSTRAINT variant_attribute_values_pkey PRIMARY KEY (variant_id, attribute_value_id);


--
-- TOC entry 5481 (class 2606 OID 31133)
-- Name: variant_images variant_images_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.variant_images
    ADD CONSTRAINT variant_images_pkey PRIMARY KEY (id);


--
-- TOC entry 5477 (class 2606 OID 31088)
-- Name: variant_measurements variant_measurements_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.variant_measurements
    ADD CONSTRAINT variant_measurements_pkey PRIMARY KEY (id);


--
-- TOC entry 5597 (class 2606 OID 49031)
-- Name: wishlist_items wishlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5599 (class 2606 OID 49033)
-- Name: wishlist_items wishlist_items_wishlist_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_wishlist_id_product_id_key UNIQUE (wishlist_id, product_id);


--
-- TOC entry 5595 (class 2606 OID 49019)
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- TOC entry 5550 (class 1259 OID 40311)
-- Name: cache_expiration_index; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX cache_expiration_index ON public.cache USING btree (expiration);


--
-- TOC entry 5553 (class 1259 OID 40322)
-- Name: cache_locks_expiration_index; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX cache_locks_expiration_index ON public.cache_locks USING btree (expiration);


--
-- TOC entry 5398 (class 1259 OID 49159)
-- Name: idx_active_users; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_active_users ON public.users USING btree (id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5441 (class 1259 OID 57442)
-- Name: idx_addresses_customer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_addresses_customer ON public.addresses USING btree (customer_id);


--
-- TOC entry 5444 (class 1259 OID 30920)
-- Name: idx_categories_name_parent; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX idx_categories_name_parent ON public.categories USING btree (lower((name)::text), parent_id);


--
-- TOC entry 5422 (class 1259 OID 31574)
-- Name: idx_customers_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_customers_code ON public.customers USING btree (customer_code);


--
-- TOC entry 5482 (class 1259 OID 31572)
-- Name: idx_inventories_branch; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_inventories_branch ON public.inventories USING btree (branch_id);


--
-- TOC entry 5483 (class 1259 OID 31579)
-- Name: idx_inventory_branch_variant; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_inventory_branch_variant ON public.inventories USING btree (branch_id, variant_id);


--
-- TOC entry 5532 (class 1259 OID 31581)
-- Name: idx_inventory_movements; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_inventory_movements ON public.cash_movements USING btree (cash_register_id);


--
-- TOC entry 5489 (class 1259 OID 57470)
-- Name: idx_inventory_movements_branch; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_inventory_movements_branch ON public.inventory_movements USING btree (branch_id);


--
-- TOC entry 5490 (class 1259 OID 57471)
-- Name: idx_inventory_movements_reference; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_inventory_movements_reference ON public.inventory_movements USING btree (reference_type, reference_id);


--
-- TOC entry 5491 (class 1259 OID 57469)
-- Name: idx_inventory_movements_variant; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_inventory_movements_variant ON public.inventory_movements USING btree (variant_id);


--
-- TOC entry 5484 (class 1259 OID 31586)
-- Name: idx_inventory_variant; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_inventory_variant ON public.inventories USING btree (variant_id);


--
-- TOC entry 5527 (class 1259 OID 31585)
-- Name: idx_payments_method; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_payments_method ON public.payments USING btree (payment_method_id);


--
-- TOC entry 5457 (class 1259 OID 57459)
-- Name: idx_product_variants_sku_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX idx_product_variants_sku_active ON public.product_variants USING btree (sku) WHERE (deleted_at IS NULL);


--
-- TOC entry 5447 (class 1259 OID 31577)
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- TOC entry 5448 (class 1259 OID 31570)
-- Name: idx_products_owner; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_products_owner ON public.products USING btree (owner_id);


--
-- TOC entry 5407 (class 1259 OID 31575)
-- Name: idx_profiles_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_profiles_user ON public.user_profiles USING btree (user_id);


--
-- TOC entry 5508 (class 1259 OID 31571)
-- Name: idx_sale_details_owner; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_sale_details_owner ON public.sale_details USING btree (owner_id);


--
-- TOC entry 5502 (class 1259 OID 31584)
-- Name: idx_sales_branch; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_sales_branch ON public.sales USING btree (branch_id);


--
-- TOC entry 5503 (class 1259 OID 31580)
-- Name: idx_sales_customer; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_sales_customer ON public.sales USING btree (customer_id);


--
-- TOC entry 5537 (class 1259 OID 49158)
-- Name: idx_unique_active_delivery_code; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX idx_unique_active_delivery_code ON public.shipments USING btree (delivery_code) WHERE (delivery_confirmed = false);


--
-- TOC entry 5399 (class 1259 OID 31573)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 5400 (class 1259 OID 30751)
-- Name: idx_users_email_unique_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX idx_users_email_unique_active ON public.users USING btree (email) WHERE (deleted_at IS NULL);


--
-- TOC entry 5463 (class 1259 OID 31582)
-- Name: idx_variant_attr; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_variant_attr ON public.variant_attribute_values USING btree (variant_id);


--
-- TOC entry 5458 (class 1259 OID 31583)
-- Name: idx_variant_sku; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_variant_sku ON public.product_variants USING btree (sku);


--
-- TOC entry 5459 (class 1259 OID 57472)
-- Name: idx_variant_unique_combination; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX idx_variant_unique_combination ON public.product_variants USING btree (product_id, size_id, fit_id, sku) WHERE (deleted_at IS NULL);


--
-- TOC entry 5460 (class 1259 OID 31578)
-- Name: idx_variants_product; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_variants_product ON public.product_variants USING btree (product_id);


--
-- TOC entry 5544 (class 1259 OID 31651)
-- Name: personal_access_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);


--
-- TOC entry 5549 (class 1259 OID 31652)
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- TOC entry 5650 (class 1259 OID 84084)
-- Name: quarantine_items_branch_id_index; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX quarantine_items_branch_id_index ON public.quarantine_items USING btree (branch_id);


--
-- TOC entry 5653 (class 1259 OID 84082)
-- Name: quarantine_items_purchase_reception_id_index; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX quarantine_items_purchase_reception_id_index ON public.quarantine_items USING btree (purchase_reception_id);


--
-- TOC entry 5654 (class 1259 OID 84083)
-- Name: quarantine_items_variant_id_index; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX quarantine_items_variant_id_index ON public.quarantine_items USING btree (variant_id);


--
-- TOC entry 5614 (class 1259 OID 49176)
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- TOC entry 5617 (class 1259 OID 49175)
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- TOC entry 5736 (class 2606 OID 48748)
-- Name: accounts_payable accounts_payable_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.accounts_payable
    ADD CONSTRAINT accounts_payable_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id);


--
-- TOC entry 5737 (class 2606 OID 48743)
-- Name: accounts_payable accounts_payable_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.accounts_payable
    ADD CONSTRAINT accounts_payable_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- TOC entry 5666 (class 2606 OID 30901)
-- Name: addresses addresses_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- TOC entry 5667 (class 2606 OID 57416)
-- Name: addresses addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- TOC entry 5668 (class 2606 OID 48925)
-- Name: addresses addresses_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.delivery_zones(id);


--
-- TOC entry 5770 (class 2606 OID 66866)
-- Name: attribute_value_images attribute_value_images_attribute_value_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.attribute_value_images
    ADD CONSTRAINT attribute_value_images_attribute_value_id_fkey FOREIGN KEY (attribute_value_id) REFERENCES public.attribute_values(id) ON DELETE CASCADE;


--
-- TOC entry 5771 (class 2606 OID 66871)
-- Name: attribute_value_images attribute_value_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.attribute_value_images
    ADD CONSTRAINT attribute_value_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5674 (class 2606 OID 30977)
-- Name: attribute_values attribute_values_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.attribute_values
    ADD CONSTRAINT attribute_values_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.attributes(id) ON DELETE CASCADE;


--
-- TOC entry 5726 (class 2606 OID 31565)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5772 (class 2606 OID 83577)
-- Name: branch_images branch_images_branch_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.branch_images
    ADD CONSTRAINT branch_images_branch_id_foreign FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- TOC entry 5789 (class 2606 OID 83979)
-- Name: bundle_items bundle_items_bundle_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.bundle_items
    ADD CONSTRAINT bundle_items_bundle_id_foreign FOREIGN KEY (bundle_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5790 (class 2606 OID 83891)
-- Name: bundle_items bundle_items_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.bundle_items
    ADD CONSTRAINT bundle_items_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 5791 (class 2606 OID 83896)
-- Name: bundle_items bundle_items_variant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.bundle_items
    ADD CONSTRAINT bundle_items_variant_id_foreign FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 5710 (class 2606 OID 83903)
-- Name: cart_items cart_items_bundle_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_bundle_id_foreign FOREIGN KEY (bundle_id) REFERENCES public.bundles(id) ON DELETE CASCADE;


--
-- TOC entry 5711 (class 2606 OID 31399)
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE;


--
-- TOC entry 5712 (class 2606 OID 83968)
-- Name: cart_items cart_items_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.cart_items(id) ON DELETE CASCADE;


--
-- TOC entry 5713 (class 2606 OID 31404)
-- Name: cart_items cart_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 5709 (class 2606 OID 57406)
-- Name: carts carts_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- TOC entry 5719 (class 2606 OID 31479)
-- Name: cash_movements cash_movements_cash_register_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cash_movements
    ADD CONSTRAINT cash_movements_cash_register_id_fkey FOREIGN KEY (cash_register_id) REFERENCES public.cash_registers(id);


--
-- TOC entry 5714 (class 2606 OID 31430)
-- Name: cash_registers cash_registers_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cash_registers
    ADD CONSTRAINT cash_registers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- TOC entry 5715 (class 2606 OID 57411)
-- Name: cash_registers cash_registers_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cash_registers
    ADD CONSTRAINT cash_registers_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 5669 (class 2606 OID 30915)
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id);


--
-- TOC entry 5661 (class 2606 OID 30798)
-- Name: customers customers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

--
-- TOC entry X (Custom FK)
-- Name: pos_customer_profiles pos_customer_profiles_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pos_customer_profiles
    ADD CONSTRAINT pos_customer_profiles_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- TOC entry 5752 (class 2606 OID 48907)
-- Name: delivery_drivers delivery_drivers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.delivery_drivers
    ADD CONSTRAINT delivery_drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5749 (class 2606 OID 48912)
-- Name: delivery_schedules delivery_schedules_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.delivery_schedules
    ADD CONSTRAINT delivery_schedules_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.delivery_drivers(id);


--
-- TOC entry 5750 (class 2606 OID 48878)
-- Name: delivery_schedules delivery_schedules_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.delivery_schedules
    ADD CONSTRAINT delivery_schedules_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id) ON DELETE CASCADE;


--
-- TOC entry 5775 (class 2606 OID 83672)
-- Name: discount_branches discount_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_branches
    ADD CONSTRAINT discount_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- TOC entry 5776 (class 2606 OID 83667)
-- Name: discount_branches discount_branches_discount_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_branches
    ADD CONSTRAINT discount_branches_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(id) ON DELETE CASCADE;


--
-- TOC entry 5781 (class 2606 OID 83729)
-- Name: discount_brands discount_brands_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_brands
    ADD CONSTRAINT discount_brands_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- TOC entry 5782 (class 2606 OID 83724)
-- Name: discount_brands discount_brands_discount_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_brands
    ADD CONSTRAINT discount_brands_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(id) ON DELETE CASCADE;


--
-- TOC entry 5792 (class 2606 OID 83949)
-- Name: discount_bundles discount_bundles_bundle_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_bundles
    ADD CONSTRAINT discount_bundles_bundle_id_foreign FOREIGN KEY (bundle_id) REFERENCES public.bundles(id) ON DELETE CASCADE;


--
-- TOC entry 5793 (class 2606 OID 83944)
-- Name: discount_bundles discount_bundles_discount_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_bundles
    ADD CONSTRAINT discount_bundles_discount_id_foreign FOREIGN KEY (discount_id) REFERENCES public.discounts(id) ON DELETE CASCADE;


--
-- TOC entry 5694 (class 2606 OID 31230)
-- Name: discount_categories discount_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_categories
    ADD CONSTRAINT discount_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- TOC entry 5695 (class 2606 OID 31225)
-- Name: discount_categories discount_categories_discount_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_categories
    ADD CONSTRAINT discount_categories_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(id) ON DELETE CASCADE;


--
-- TOC entry 5777 (class 2606 OID 83689)
-- Name: discount_customers discount_customers_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_customers
    ADD CONSTRAINT discount_customers_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- TOC entry 5778 (class 2606 OID 83684)
-- Name: discount_customers discount_customers_discount_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_customers
    ADD CONSTRAINT discount_customers_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(id) ON DELETE CASCADE;


--
-- TOC entry 5779 (class 2606 OID 83701)
-- Name: discount_employees discount_employees_discount_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_employees
    ADD CONSTRAINT discount_employees_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(id) ON DELETE CASCADE;


--
-- TOC entry 5780 (class 2606 OID 83706)
-- Name: discount_employees discount_employees_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_employees
    ADD CONSTRAINT discount_employees_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- TOC entry 5692 (class 2606 OID 31208)
-- Name: discount_products discount_products_discount_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_products
    ADD CONSTRAINT discount_products_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(id) ON DELETE CASCADE;


--
-- TOC entry 5693 (class 2606 OID 31213)
-- Name: discount_products discount_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_products
    ADD CONSTRAINT discount_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5773 (class 2606 OID 83650)
-- Name: discount_variants discount_variants_discount_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_variants
    ADD CONSTRAINT discount_variants_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(id) ON DELETE CASCADE;


--
-- TOC entry 5774 (class 2606 OID 83655)
-- Name: discount_variants discount_variants_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.discount_variants
    ADD CONSTRAINT discount_variants_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- TOC entry 5802 (class 2606 OID 84114)
-- Name: employee_attendances employee_attendances_employee_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employee_attendances
    ADD CONSTRAINT employee_attendances_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- TOC entry 5765 (class 2606 OID 49076)
-- Name: employee_commissions employee_commissions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employee_commissions
    ADD CONSTRAINT employee_commissions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 5766 (class 2606 OID 49081)
-- Name: employee_commissions employee_commissions_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employee_commissions
    ADD CONSTRAINT employee_commissions_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- TOC entry 5768 (class 2606 OID 49110)
-- Name: employee_payments employee_payments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employee_payments
    ADD CONSTRAINT employee_payments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 5767 (class 2606 OID 49095)
-- Name: employee_sales_summary employee_sales_summary_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employee_sales_summary
    ADD CONSTRAINT employee_sales_summary_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 5763 (class 2606 OID 49063)
-- Name: employees employees_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- TOC entry 5764 (class 2606 OID 49058)
-- Name: employees employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5803 (class 2606 OID 84162)
-- Name: expense_splits expense_splits_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.expense_splits
    ADD CONSTRAINT expense_splits_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE;


--
-- TOC entry 5804 (class 2606 OID 84167)
-- Name: expense_splits expense_splits_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.expense_splits
    ADD CONSTRAINT expense_splits_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.owners(id) ON DELETE CASCADE;


--
-- TOC entry 5769 (class 2606 OID 49125)
-- Name: expenses expenses_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- TOC entry 5797 (class 2606 OID 84026)
-- Name: giftcard_transactions giftcard_transactions_giftcard_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.giftcard_transactions
    ADD CONSTRAINT giftcard_transactions_giftcard_id_foreign FOREIGN KEY (giftcard_id) REFERENCES public.giftcards(id) ON DELETE CASCADE;


--
-- TOC entry 5798 (class 2606 OID 84031)
-- Name: giftcard_transactions giftcard_transactions_sale_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.giftcard_transactions
    ADD CONSTRAINT giftcard_transactions_sale_id_foreign FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE SET NULL;


--
-- TOC entry 5794 (class 2606 OID 83998)
-- Name: giftcards giftcards_customer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.giftcards
    ADD CONSTRAINT giftcards_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- TOC entry 5795 (class 2606 OID 84003)
-- Name: giftcards giftcards_purchaser_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.giftcards
    ADD CONSTRAINT giftcards_purchaser_id_foreign FOREIGN KEY (purchaser_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- TOC entry 5796 (class 2606 OID 84008)
-- Name: giftcards giftcards_sale_detail_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.giftcards
    ADD CONSTRAINT giftcards_sale_detail_id_foreign FOREIGN KEY (sale_detail_id) REFERENCES public.sale_details(id) ON DELETE SET NULL;


--
-- TOC entry 5686 (class 2606 OID 31152)
-- Name: inventories inventories_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT inventories_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- TOC entry 5687 (class 2606 OID 31157)
-- Name: inventories inventories_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT inventories_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 5688 (class 2606 OID 31179)
-- Name: inventory_movements inventory_movements_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- TOC entry 5689 (class 2606 OID 57462)
-- Name: inventory_movements inventory_movements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 5690 (class 2606 OID 57401)
-- Name: inventory_movements inventory_movements_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 5691 (class 2606 OID 31174)
-- Name: inventory_movements inventory_movements_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 5786 (class 2606 OID 83774)
-- Name: issued_coupons issued_coupons_customer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.issued_coupons
    ADD CONSTRAINT issued_coupons_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- TOC entry 5787 (class 2606 OID 83769)
-- Name: issued_coupons issued_coupons_discount_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.issued_coupons
    ADD CONSTRAINT issued_coupons_discount_id_foreign FOREIGN KEY (discount_id) REFERENCES public.discounts(id) ON DELETE CASCADE;


--
-- TOC entry 5788 (class 2606 OID 83779)
-- Name: issued_coupons issued_coupons_employee_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.issued_coupons
    ADD CONSTRAINT issued_coupons_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- TOC entry 5662 (class 2606 OID 30839)
-- Name: model_has_permissions model_has_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 5663 (class 2606 OID 30852)
-- Name: model_has_roles model_has_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.model_has_roles
    ADD CONSTRAINT model_has_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 5755 (class 2606 OID 48967)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5720 (class 2606 OID 31494)
-- Name: owner_payments owner_payments_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.owner_payments
    ADD CONSTRAINT owner_payments_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.owners(id);


--
-- TOC entry 5660 (class 2606 OID 30778)
-- Name: owners owners_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.owners
    ADD CONSTRAINT owners_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5716 (class 2606 OID 31457)
-- Name: payments payments_cash_register_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_cash_register_id_fkey FOREIGN KEY (cash_register_id) REFERENCES public.cash_registers(id);


--
-- TOC entry 5717 (class 2606 OID 31462)
-- Name: payments payments_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);


--
-- TOC entry 5718 (class 2606 OID 31452)
-- Name: payments payments_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- TOC entry 5684 (class 2606 OID 31118)
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5721 (class 2606 OID 31531)
-- Name: product_price_history product_price_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_price_history
    ADD CONSTRAINT product_price_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- TOC entry 5722 (class 2606 OID 31526)
-- Name: product_price_history product_price_history_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_price_history
    ADD CONSTRAINT product_price_history_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 5758 (class 2606 OID 49007)
-- Name: product_reviews product_reviews_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- TOC entry 5759 (class 2606 OID 49002)
-- Name: product_reviews product_reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 5680 (class 2606 OID 31076)
-- Name: product_type_measurements product_type_measurements_measurement_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_type_measurements
    ADD CONSTRAINT product_type_measurements_measurement_type_id_fkey FOREIGN KEY (measurement_type_id) REFERENCES public.measurement_types(id);


--
-- TOC entry 5681 (class 2606 OID 31071)
-- Name: product_type_measurements product_type_measurements_product_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_type_measurements
    ADD CONSTRAINT product_type_measurements_product_type_id_fkey FOREIGN KEY (product_type_id) REFERENCES public.product_types(id);


--
-- TOC entry 5675 (class 2606 OID 57454)
-- Name: product_variants product_variants_fit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_fit_id_fkey FOREIGN KEY (fit_id) REFERENCES public.fits(id);


--
-- TOC entry 5676 (class 2606 OID 30994)
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5677 (class 2606 OID 57449)
-- Name: product_variants product_variants_size_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_size_id_fkey FOREIGN KEY (size_id) REFERENCES public.sizes(id);


--
-- TOC entry 5670 (class 2606 OID 83625)
-- Name: products products_brand_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_brand_id_foreign FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;


--
-- TOC entry 5671 (class 2606 OID 30951)
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 5672 (class 2606 OID 30946)
-- Name: products products_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.owners(id);


--
-- TOC entry 5673 (class 2606 OID 30956)
-- Name: products products_product_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_product_type_id_fkey FOREIGN KEY (product_type_id) REFERENCES public.product_types(id);


--
-- TOC entry 5731 (class 2606 OID 48698)
-- Name: purchase_details purchase_details_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchase_details
    ADD CONSTRAINT purchase_details_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;


--
-- TOC entry 5732 (class 2606 OID 48703)
-- Name: purchase_details purchase_details_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchase_details
    ADD CONSTRAINT purchase_details_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 5740 (class 2606 OID 48784)
-- Name: purchase_price_history purchase_price_history_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchase_price_history
    ADD CONSTRAINT purchase_price_history_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id);


--
-- TOC entry 5741 (class 2606 OID 48779)
-- Name: purchase_price_history purchase_price_history_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchase_price_history
    ADD CONSTRAINT purchase_price_history_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 5744 (class 2606 OID 48829)
-- Name: purchase_reception_details purchase_reception_details_reception_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchase_reception_details
    ADD CONSTRAINT purchase_reception_details_reception_id_fkey FOREIGN KEY (reception_id) REFERENCES public.purchase_receptions(id) ON DELETE CASCADE;


--
-- TOC entry 5745 (class 2606 OID 48834)
-- Name: purchase_reception_details purchase_reception_details_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchase_reception_details
    ADD CONSTRAINT purchase_reception_details_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 5742 (class 2606 OID 57427)
-- Name: purchase_receptions purchase_receptions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchase_receptions
    ADD CONSTRAINT purchase_receptions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 5743 (class 2606 OID 48808)
-- Name: purchase_receptions purchase_receptions_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchase_receptions
    ADD CONSTRAINT purchase_receptions_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id);


--
-- TOC entry 5728 (class 2606 OID 48676)
-- Name: purchases purchases_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- TOC entry 5729 (class 2606 OID 57422)
-- Name: purchases purchases_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 5730 (class 2606 OID 48671)
-- Name: purchases purchases_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- TOC entry 5799 (class 2606 OID 84075)
-- Name: quarantine_items quarantine_items_branch_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.quarantine_items
    ADD CONSTRAINT quarantine_items_branch_id_foreign FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- TOC entry 5800 (class 2606 OID 84065)
-- Name: quarantine_items quarantine_items_purchase_reception_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.quarantine_items
    ADD CONSTRAINT quarantine_items_purchase_reception_id_foreign FOREIGN KEY (purchase_reception_id) REFERENCES public.purchase_receptions(id) ON DELETE CASCADE;


--
-- TOC entry 5801 (class 2606 OID 84070)
-- Name: quarantine_items quarantine_items_variant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.quarantine_items
    ADD CONSTRAINT quarantine_items_variant_id_foreign FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- TOC entry 5705 (class 2606 OID 31344)
-- Name: returns returns_sale_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_sale_detail_id_fkey FOREIGN KEY (sale_detail_id) REFERENCES public.sale_details(id);


--
-- TOC entry 5664 (class 2606 OID 30864)
-- Name: role_has_permissions role_has_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 5665 (class 2606 OID 30869)
-- Name: role_has_permissions role_has_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 5783 (class 2606 OID 83753)
-- Name: sale_applied_discounts sale_applied_discounts_discount_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sale_applied_discounts
    ADD CONSTRAINT sale_applied_discounts_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(id) ON DELETE CASCADE;


--
-- TOC entry 5784 (class 2606 OID 83954)
-- Name: sale_applied_discounts sale_applied_discounts_sale_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sale_applied_discounts
    ADD CONSTRAINT sale_applied_discounts_sale_detail_id_fkey FOREIGN KEY (sale_detail_id) REFERENCES public.sale_details(id) ON DELETE CASCADE;


--
-- TOC entry 5785 (class 2606 OID 83743)
-- Name: sale_applied_discounts sale_applied_discounts_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sale_applied_discounts
    ADD CONSTRAINT sale_applied_discounts_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- TOC entry 5700 (class 2606 OID 83910)
-- Name: sale_details sale_details_bundle_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sale_details
    ADD CONSTRAINT sale_details_bundle_id_foreign FOREIGN KEY (bundle_id) REFERENCES public.bundles(id);


--
-- TOC entry 5701 (class 2606 OID 31328)
-- Name: sale_details sale_details_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sale_details
    ADD CONSTRAINT sale_details_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.owners(id);


--
-- TOC entry 5702 (class 2606 OID 83973)
-- Name: sale_details sale_details_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sale_details
    ADD CONSTRAINT sale_details_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.sale_details(id) ON DELETE CASCADE;


--
-- TOC entry 5703 (class 2606 OID 31318)
-- Name: sale_details sale_details_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sale_details
    ADD CONSTRAINT sale_details_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- TOC entry 5704 (class 2606 OID 83821)
-- Name: sale_details sale_details_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sale_details
    ADD CONSTRAINT sale_details_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 5756 (class 2606 OID 48985)
-- Name: sale_status_history sale_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sale_status_history
    ADD CONSTRAINT sale_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- TOC entry 5757 (class 2606 OID 48980)
-- Name: sale_status_history sale_status_history_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sale_status_history
    ADD CONSTRAINT sale_status_history_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- TOC entry 5696 (class 2606 OID 31292)
-- Name: sales sales_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- TOC entry 5697 (class 2606 OID 31287)
-- Name: sales sales_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- TOC entry 5698 (class 2606 OID 49148)
-- Name: sales sales_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 5699 (class 2606 OID 31297)
-- Name: sales sales_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5753 (class 2606 OID 48938)
-- Name: shipment_cost_details shipment_cost_details_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.shipment_cost_details
    ADD CONSTRAINT shipment_cost_details_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id);


--
-- TOC entry 5754 (class 2606 OID 48951)
-- Name: shipment_locations shipment_locations_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.shipment_locations
    ADD CONSTRAINT shipment_locations_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id);


--
-- TOC entry 5751 (class 2606 OID 48893)
-- Name: shipment_tracking shipment_tracking_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.shipment_tracking
    ADD CONSTRAINT shipment_tracking_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id) ON DELETE CASCADE;


--
-- TOC entry 5723 (class 2606 OID 31550)
-- Name: shipments shipments_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id);


--
-- TOC entry 5724 (class 2606 OID 48860)
-- Name: shipments shipments_pickup_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_pickup_branch_id_fkey FOREIGN KEY (pickup_branch_id) REFERENCES public.branches(id);


--
-- TOC entry 5725 (class 2606 OID 31545)
-- Name: shipments shipments_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- TOC entry 5706 (class 2606 OID 31365)
-- Name: stock_reservations stock_reservations_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- TOC entry 5707 (class 2606 OID 31370)
-- Name: stock_reservations stock_reservations_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- TOC entry 5708 (class 2606 OID 31360)
-- Name: stock_reservations stock_reservations_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- TOC entry 5738 (class 2606 OID 48761)
-- Name: stock_transfers stock_transfers_from_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_from_branch_id_fkey FOREIGN KEY (from_branch_id) REFERENCES public.branches(id);


--
-- TOC entry 5739 (class 2606 OID 48766)
-- Name: stock_transfers stock_transfers_to_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_to_branch_id_fkey FOREIGN KEY (to_branch_id) REFERENCES public.branches(id);


--
-- TOC entry 5733 (class 2606 OID 48728)
-- Name: supplier_payments supplier_payments_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);


--
-- TOC entry 5734 (class 2606 OID 48723)
-- Name: supplier_payments supplier_payments_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id);


--
-- TOC entry 5735 (class 2606 OID 48718)
-- Name: supplier_payments supplier_payments_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.supplier_payments
    ADD CONSTRAINT supplier_payments_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- TOC entry 5746 (class 2606 OID 57437)
-- Name: supplier_returns supplier_returns_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.supplier_returns
    ADD CONSTRAINT supplier_returns_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id);


--
-- TOC entry 5747 (class 2606 OID 57432)
-- Name: supplier_returns supplier_returns_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.supplier_returns
    ADD CONSTRAINT supplier_returns_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- TOC entry 5748 (class 2606 OID 84090)
-- Name: supplier_returns supplier_returns_variant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.supplier_returns
    ADD CONSTRAINT supplier_returns_variant_id_foreign FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- TOC entry 5727 (class 2606 OID 48644)
-- Name: suppliers suppliers_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id);


--
-- TOC entry 5659 (class 2606 OID 30763)
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5678 (class 2606 OID 31011)
-- Name: variant_attribute_values variant_attribute_values_attribute_value_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.variant_attribute_values
    ADD CONSTRAINT variant_attribute_values_attribute_value_id_fkey FOREIGN KEY (attribute_value_id) REFERENCES public.attribute_values(id) ON DELETE CASCADE;


--
-- TOC entry 5679 (class 2606 OID 31006)
-- Name: variant_attribute_values variant_attribute_values_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.variant_attribute_values
    ADD CONSTRAINT variant_attribute_values_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- TOC entry 5685 (class 2606 OID 31134)
-- Name: variant_images variant_images_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.variant_images
    ADD CONSTRAINT variant_images_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- TOC entry 5682 (class 2606 OID 31101)
-- Name: variant_measurements variant_measurements_measurement_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.variant_measurements
    ADD CONSTRAINT variant_measurements_measurement_type_id_fkey FOREIGN KEY (measurement_type_id) REFERENCES public.measurement_types(id);


--
-- TOC entry 5683 (class 2606 OID 31091)
-- Name: variant_measurements variant_measurements_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.variant_measurements
    ADD CONSTRAINT variant_measurements_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- TOC entry 5761 (class 2606 OID 49039)
-- Name: wishlist_items wishlist_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 5762 (class 2606 OID 49034)
-- Name: wishlist_items wishlist_items_wishlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_wishlist_id_fkey FOREIGN KEY (wishlist_id) REFERENCES public.wishlists(id) ON DELETE CASCADE;


--
-- TOC entry 5760 (class 2606 OID 57396)
-- Name: wishlists wishlists_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


-- Completed on 2026-06-23 16:55:06

--
-- PostgreSQL database dump complete
--

\unrestrict Wu9zCzIMiJkhPyMFAPHzj9DcD26mqcBvpcSdLnJlsy0Ue9JWjGhSzB6kAUfE8yw

