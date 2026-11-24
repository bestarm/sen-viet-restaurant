--
-- PostgreSQL database dump
--

\restrict fZp1MibpZKtxFQYaSFvXdxeZtsTGgDVdvh60OV7RiNOlKhEW7VfQK0Zjgj9BgIc

-- Dumped from database version 16.16
-- Dumped by pg_dump version 16.16

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: fill_user_role_name(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fill_user_role_name() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.role_name IS NULL AND NEW.role_id IS NOT NULL THEN
        SELECT role_name INTO NEW.role_name FROM roles WHERE id = NEW.role_id;
    END IF;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attendances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendances (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    branch_id bigint NOT NULL,
    attendance_date date NOT NULL,
    shift_name character varying(50) DEFAULT 'CA_SANG'::character varying NOT NULL,
    check_in_time timestamp with time zone NOT NULL,
    check_in_selfie_url text,
    check_in_latitude numeric(10,7),
    check_in_longitude numeric(10,7),
    check_in_distance_meters numeric(10,2) DEFAULT 0,
    is_valid_location boolean DEFAULT true NOT NULL,
    late_minutes integer DEFAULT 0 NOT NULL,
    check_out_time timestamp with time zone,
    check_out_selfie_url text,
    check_out_latitude numeric(10,7),
    check_out_longitude numeric(10,7),
    check_out_distance_meters numeric(10,2) DEFAULT 0,
    early_minutes integer DEFAULT 0 NOT NULL,
    work_shift_hours numeric(4,2) DEFAULT 8.00,
    actual_hours numeric(4,2) DEFAULT 0,
    status character varying(50) DEFAULT 'DANG_LAM'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: attendances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendances_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attendances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendances_id_seq OWNED BY public.attendances.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    user_id bigint,
    action character varying(100) NOT NULL,
    target_entity character varying(100) NOT NULL,
    target_id bigint,
    details text,
    ip_address character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id bigint NOT NULL,
    branch_code character varying(50) NOT NULL,
    branch_name character varying(255) NOT NULL,
    address character varying(500),
    phone character varying(50),
    latitude numeric(10,7),
    longitude numeric(10,7),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: branches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.branches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: branches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.branches_id_seq OWNED BY public.branches.id;


--
-- Name: cukcuk_sales_imports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cukcuk_sales_imports (
    id bigint NOT NULL,
    branch_id bigint NOT NULL,
    import_date date NOT NULL,
    shift_type character varying(20) DEFAULT 'CA_NGAY'::character varying NOT NULL,
    file_name character varying(255) NOT NULL,
    total_revenue numeric(15,2) DEFAULT 0 NOT NULL,
    adult_guest_count integer DEFAULT 0 NOT NULL,
    child_guest_count integer DEFAULT 0 NOT NULL,
    total_guest_count integer DEFAULT 0 NOT NULL,
    standard_buffet_count integer DEFAULT 0 NOT NULL,
    vip_buffet_count integer DEFAULT 0 NOT NULL,
    imported_by_user_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cukcuk_sales_imports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cukcuk_sales_imports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cukcuk_sales_imports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cukcuk_sales_imports_id_seq OWNED BY public.cukcuk_sales_imports.id;


--
-- Name: daily_reconciliations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_reconciliations (
    id bigint NOT NULL,
    branch_id bigint NOT NULL,
    item_id bigint NOT NULL,
    recon_date date NOT NULL,
    shift_type character varying(20) DEFAULT 'CA_NGAY'::character varying NOT NULL,
    exported_qty numeric(12,3) DEFAULT 0 NOT NULL,
    guest_consumption_qty numeric(12,3) DEFAULT 0 NOT NULL,
    processing_loss_qty numeric(12,3) DEFAULT 0 NOT NULL,
    reported_damage_qty numeric(12,3) DEFAULT 0 NOT NULL,
    unexplained_loss_qty numeric(12,3) DEFAULT 0 NOT NULL,
    unexplained_loss_amount numeric(15,2) DEFAULT 0 NOT NULL,
    unexplained_loss_rate numeric(5,2) DEFAULT 0 NOT NULL,
    actual_consumption_per_guest numeric(8,4) DEFAULT 0 NOT NULL,
    is_over_threshold boolean DEFAULT false NOT NULL,
    responsible_user_name character varying(100),
    status character varying(50) DEFAULT 'CHUA_CHOT'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: daily_reconciliations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_reconciliations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_reconciliations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_reconciliations_id_seq OWNED BY public.daily_reconciliations.id;


--
-- Name: daily_waste_confirmations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_waste_confirmations (
    id bigint NOT NULL,
    branch_id bigint NOT NULL,
    item_id bigint NOT NULL,
    waste_date date NOT NULL,
    shift character varying(20) DEFAULT 'CA_NGAY'::character varying NOT NULL,
    quantity numeric(12,3) NOT NULL,
    unit character varying(20) DEFAULT 'KG'::character varying NOT NULL,
    confirmed_by_user_id bigint,
    status character varying(50) DEFAULT 'DA_XAC_NHAN'::character varying NOT NULL,
    note character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: daily_waste_confirmations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_waste_confirmations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_waste_confirmations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_waste_confirmations_id_seq OWNED BY public.daily_waste_confirmations.id;


--
-- Name: damage_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.damage_reports (
    id bigint NOT NULL,
    branch_id bigint NOT NULL,
    item_id bigint NOT NULL,
    supplier_code character varying(100),
    batch_number character varying(100),
    quantity numeric(12,3) NOT NULL,
    estimated_value numeric(15,2) DEFAULT 0 NOT NULL,
    reason character varying(100) NOT NULL,
    image_urls text,
    status character varying(50) DEFAULT 'TU_DONG_DUYET'::character varying NOT NULL,
    reported_by_user_id bigint NOT NULL,
    approved_by_user_id bigint,
    approved_at timestamp with time zone,
    note character varying(500),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    batch_id bigint,
    supplier_id bigint
);


--
-- Name: damage_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.damage_reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: damage_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.damage_reports_id_seq OWNED BY public.damage_reports.id;


--
-- Name: exam_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_questions (
    id bigint NOT NULL,
    "position" character varying(50) NOT NULL,
    question_text text NOT NULL,
    option_a text NOT NULL,
    option_b text NOT NULL,
    option_c text NOT NULL,
    option_d text NOT NULL,
    correct_option character varying(5) NOT NULL,
    points integer DEFAULT 10 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: exam_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exam_questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exam_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exam_questions_id_seq OWNED BY public.exam_questions.id;


--
-- Name: exam_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_submissions (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    branch_id bigint NOT NULL,
    exam_quarter character varying(20) DEFAULT 'Q4_2026'::character varying NOT NULL,
    started_at timestamp with time zone NOT NULL,
    submitted_at timestamp with time zone NOT NULL,
    duration_seconds integer DEFAULT 0 NOT NULL,
    theory_score numeric(5,2) DEFAULT 0 NOT NULL,
    practical_score numeric(5,2) DEFAULT NULL::numeric,
    total_score numeric(5,2) DEFAULT 0,
    graded_by_user_id bigint,
    practical_comment text,
    status character varying(50) DEFAULT 'DA_NOP_LY_THUYET'::character varying NOT NULL,
    is_passed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: exam_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exam_submissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exam_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exam_submissions_id_seq OWNED BY public.exam_submissions.id;


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


--
-- Name: import_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.import_batches (
    id bigint NOT NULL,
    batch_code character varying(100) NOT NULL,
    supplier_id bigint NOT NULL,
    item_id bigint NOT NULL,
    branch_id bigint NOT NULL,
    import_date date NOT NULL,
    expiry_date date,
    initial_quantity numeric(12,3) NOT NULL,
    current_stock numeric(12,3) NOT NULL,
    unit_price numeric(15,2) DEFAULT 0 NOT NULL,
    unit character varying(20) DEFAULT 'KG'::character varying NOT NULL,
    status character varying(50) DEFAULT 'CON_HANG'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: import_batches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.import_batches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: import_batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.import_batches_id_seq OWNED BY public.import_batches.id;


--
-- Name: inventory_check_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_check_items (
    id bigint NOT NULL,
    check_id bigint NOT NULL,
    item_id bigint NOT NULL,
    batch_id bigint,
    system_stock numeric(12,3) DEFAULT 0 NOT NULL,
    actual_stock numeric(12,3) DEFAULT 0 NOT NULL,
    difference numeric(12,3) DEFAULT 0 NOT NULL,
    reason character varying(255)
);


--
-- Name: inventory_check_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_check_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_check_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_check_items_id_seq OWNED BY public.inventory_check_items.id;


--
-- Name: inventory_checks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_checks (
    id bigint NOT NULL,
    check_code character varying(100) NOT NULL,
    branch_id bigint NOT NULL,
    shift character varying(20) DEFAULT 'CA_NGAY'::character varying NOT NULL,
    check_date date NOT NULL,
    checked_by_user_id bigint,
    status character varying(50) DEFAULT 'HOAN_THANH'::character varying NOT NULL,
    note character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inventory_checks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_checks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_checks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_checks_id_seq OWNED BY public.inventory_checks.id;


--
-- Name: inventory_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_snapshots (
    id bigint NOT NULL,
    branch_id bigint NOT NULL,
    item_id bigint NOT NULL,
    snapshot_date date NOT NULL,
    shift_type character varying(20) DEFAULT 'CA_NGAY'::character varying NOT NULL,
    opening_stock numeric(12,3) DEFAULT 0 NOT NULL,
    in_stock numeric(12,3) DEFAULT 0 NOT NULL,
    closing_stock numeric(12,3) DEFAULT 0 NOT NULL,
    unit character varying(20) DEFAULT 'KG'::character varying NOT NULL,
    checked_by_user_id bigint,
    note character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inventory_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_snapshots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_snapshots_id_seq OWNED BY public.inventory_snapshots.id;


--
-- Name: inventory_stocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_stocks (
    id bigint NOT NULL,
    branch_id bigint NOT NULL,
    item_id bigint NOT NULL,
    batch_id bigint,
    quantity numeric(12,3) DEFAULT 0 NOT NULL,
    last_updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inventory_stocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_stocks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_stocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_stocks_id_seq OWNED BY public.inventory_stocks.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id bigint NOT NULL,
    item_code character varying(50) NOT NULL,
    barcode character varying(100),
    item_name character varying(255) NOT NULL,
    category character varying(50) NOT NULL,
    unit character varying(20) DEFAULT 'KG'::character varying NOT NULL,
    cost_price numeric(15,2) DEFAULT 0 NOT NULL,
    is_buffet_line boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_daily_only boolean DEFAULT false NOT NULL
);


--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: line_item_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.line_item_logs (
    id bigint NOT NULL,
    branch_id bigint NOT NULL,
    item_id bigint NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    request_id character varying(100),
    user_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: line_item_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.line_item_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: line_item_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.line_item_logs_id_seq OWNED BY public.line_item_logs.id;


--
-- Name: notification_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_logs (
    id bigint NOT NULL,
    branch_id bigint,
    channel character varying(50) DEFAULT 'ZALO_WEBHOOK'::character varying NOT NULL,
    recipient character varying(255),
    title character varying(255) NOT NULL,
    content text NOT NULL,
    status character varying(50) DEFAULT 'SENT'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notification_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_logs_id_seq OWNED BY public.notification_logs.id;


--
-- Name: payroll_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_periods (
    id bigint NOT NULL,
    period_month character varying(7) NOT NULL,
    branch_id bigint,
    status character varying(20) DEFAULT 'OPEN'::character varying NOT NULL,
    locked_at timestamp with time zone,
    locked_by bigint,
    unlock_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payroll_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payroll_periods_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payroll_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payroll_periods_id_seq OWNED BY public.payroll_periods.id;


--
-- Name: payrolls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payrolls (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    branch_id bigint NOT NULL,
    payroll_month character varying(7) NOT NULL,
    base_salary numeric(15,2) DEFAULT 0.00 NOT NULL,
    standard_work_days numeric(4,1) DEFAULT 26.0 NOT NULL,
    actual_work_days numeric(4,1) DEFAULT 0.0 NOT NULL,
    salary_raise numeric(15,2) DEFAULT 0.00 NOT NULL,
    allowance numeric(15,2) DEFAULT 0.00 NOT NULL,
    gross_salary numeric(15,2) DEFAULT 0.00 NOT NULL,
    advance_deduction numeric(15,2) DEFAULT 0.00 NOT NULL,
    penalty_deduction numeric(15,2) DEFAULT 0.00 NOT NULL,
    net_salary numeric(15,2) DEFAULT 0.00 NOT NULL,
    status character varying(50) DEFAULT 'CHO_DUYET'::character varying NOT NULL,
    is_abandoned boolean DEFAULT false NOT NULL,
    is_uniform_retained boolean DEFAULT false NOT NULL,
    bank_name character varying(100),
    bank_account_number character varying(50),
    bank_account_holder character varying(150),
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    excluded_from_cost boolean DEFAULT false NOT NULL,
    hold_reason character varying(500),
    locked_at timestamp with time zone,
    locked_by bigint
);


--
-- Name: payrolls_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payrolls_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payrolls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payrolls_id_seq OWNED BY public.payrolls.id;


--
-- Name: processing_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.processing_batches (
    id bigint NOT NULL,
    branch_id bigint NOT NULL,
    item_id bigint NOT NULL,
    recipe_id bigint,
    batch_code character varying(100) NOT NULL,
    input_weight numeric(12,3) NOT NULL,
    output_weight numeric(12,3),
    loss_rate numeric(5,2),
    standard_loss_rate numeric(5,2) DEFAULT 0.00 NOT NULL,
    is_over_standard boolean DEFAULT false NOT NULL,
    is_second_batch boolean DEFAULT false NOT NULL,
    status character varying(50) DEFAULT 'DANG_LAM'::character varying NOT NULL,
    started_by_user_id bigint NOT NULL,
    finished_by_user_id bigint,
    started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: processing_batches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.processing_batches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: processing_batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.processing_batches_id_seq OWNED BY public.processing_batches.id;


--
-- Name: recipe_ingredients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_ingredients (
    id bigint NOT NULL,
    recipe_id bigint NOT NULL,
    ingredient_item_id bigint NOT NULL,
    quantity numeric(12,3) NOT NULL,
    unit character varying(20) DEFAULT 'KG'::character varying NOT NULL,
    note character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: recipe_ingredients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recipe_ingredients_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recipe_ingredients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recipe_ingredients_id_seq OWNED BY public.recipe_ingredients.id;


--
-- Name: recipes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipes (
    id bigint NOT NULL,
    item_id bigint NOT NULL,
    recipe_name character varying(255) NOT NULL,
    standard_loss_rate numeric(5,2) DEFAULT 0.00 NOT NULL,
    description character varying(500),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: recipes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recipes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recipes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recipes_id_seq OWNED BY public.recipes.id;


--
-- Name: resignation_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resignation_requests (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    branch_id bigint NOT NULL,
    request_date date DEFAULT CURRENT_DATE NOT NULL,
    reason text NOT NULL,
    is_abandoned boolean DEFAULT false NOT NULL,
    status character varying(50) DEFAULT 'CHO_DUYET'::character varying NOT NULL,
    missing_uniform_details character varying(500),
    approved_by_user_id bigint,
    approved_at timestamp with time zone,
    manager_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    cancelled_by_user_id bigint,
    cancelled_at timestamp with time zone
);


--
-- Name: resignation_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resignation_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resignation_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resignation_requests_id_seq OWNED BY public.resignation_requests.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    role_name character varying(50) NOT NULL,
    description character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: salary_advances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_advances (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    branch_id bigint NOT NULL,
    request_date date DEFAULT CURRENT_DATE NOT NULL,
    requested_amount numeric(15,2) NOT NULL,
    reason text NOT NULL,
    disbursed_amount numeric(15,2) DEFAULT 0.00,
    deduction_month character varying(7),
    status character varying(50) DEFAULT 'CHO_DUYET'::character varying NOT NULL,
    approved_by_user_id bigint,
    approved_at timestamp with time zone,
    manager_note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT salary_advances_requested_amount_check CHECK ((requested_amount > (0)::numeric))
);


--
-- Name: salary_advances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.salary_advances_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: salary_advances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salary_advances_id_seq OWNED BY public.salary_advances.id;


--
-- Name: salary_increase_proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_increase_proposals (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    branch_id bigint NOT NULL,
    exam_quarter character varying(50) NOT NULL,
    exam_score numeric(5,2) NOT NULL,
    late_count integer DEFAULT 0 NOT NULL,
    unexcused_absence_count integer DEFAULT 0 NOT NULL,
    is_eligible boolean DEFAULT false NOT NULL,
    raise_amount numeric(15,2) DEFAULT 500000.00 NOT NULL,
    status character varying(50) DEFAULT 'CHO_DUYET'::character varying NOT NULL,
    evaluation_details text,
    approved_by_user_id bigint,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: salary_increase_proposals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.salary_increase_proposals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: salary_increase_proposals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salary_increase_proposals_id_seq OWNED BY public.salary_increase_proposals.id;


--
-- Name: salary_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_rules (
    id bigint NOT NULL,
    branch_id bigint,
    standard_work_days numeric(4,1) DEFAULT 26.0 NOT NULL,
    exam_raise_amount numeric(15,2) DEFAULT 500000.00 NOT NULL,
    max_advance_ratio numeric(5,2) DEFAULT 0.50 NOT NULL,
    late_penalty_per_minute numeric(15,2) DEFAULT 5000.00 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: salary_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.salary_rules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: salary_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salary_rules_id_seq OWNED BY public.salary_rules.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id bigint NOT NULL,
    supplier_code character varying(50) NOT NULL,
    supplier_name character varying(255) NOT NULL,
    phone character varying(50),
    address character varying(255),
    contact_person character varying(100),
    email character varying(100),
    tax_code character varying(50),
    status character varying(50) DEFAULT 'HOAT_DONG'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suppliers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: take_out_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.take_out_logs (
    id bigint NOT NULL,
    branch_id bigint NOT NULL,
    item_id bigint NOT NULL,
    quantity numeric(12,3) NOT NULL,
    unit character varying(20) NOT NULL,
    user_id bigint NOT NULL,
    note character varying(500),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: take_out_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.take_out_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: take_out_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.take_out_logs_id_seq OWNED BY public.take_out_logs.id;


--
-- Name: uniform_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uniform_allocations (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    branch_id bigint NOT NULL,
    uniform_item_id bigint NOT NULL,
    allocated_date date DEFAULT CURRENT_DATE NOT NULL,
    is_returned boolean DEFAULT false NOT NULL,
    returned_date date,
    received_by_user_id bigint,
    note character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: uniform_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.uniform_allocations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: uniform_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.uniform_allocations_id_seq OWNED BY public.uniform_allocations.id;


--
-- Name: uniform_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uniform_items (
    id bigint NOT NULL,
    item_name character varying(100) NOT NULL,
    deposit_value numeric(15,2) DEFAULT 100000.00 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: uniform_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.uniform_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: uniform_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.uniform_items_id_seq OWNED BY public.uniform_items.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id bigint NOT NULL,
    role_id bigint NOT NULL,
    role_name character varying(50),
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(150),
    phone character varying(50),
    branch_id bigint,
    status character varying(50) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    bank_name character varying(100),
    bank_account_number character varying(50),
    bank_account_holder character varying(150),
    base_salary numeric(15,2) DEFAULT 7500000.00,
    role character varying(50)
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: warehouse_document_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouse_document_items (
    id bigint NOT NULL,
    document_id bigint NOT NULL,
    item_id bigint NOT NULL,
    batch_id bigint,
    quantity numeric(12,3) NOT NULL,
    unit_price numeric(15,2) DEFAULT 0 NOT NULL,
    note character varying(255)
);


--
-- Name: warehouse_document_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.warehouse_document_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: warehouse_document_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.warehouse_document_items_id_seq OWNED BY public.warehouse_document_items.id;


--
-- Name: warehouse_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouse_documents (
    id bigint NOT NULL,
    doc_type character varying(50) NOT NULL,
    doc_code character varying(100) NOT NULL,
    branch_id bigint NOT NULL,
    supplier_id bigint,
    created_by_user_id bigint,
    status character varying(50) DEFAULT 'HOAN_THANH'::character varying NOT NULL,
    note character varying(500),
    total_amount numeric(15,2) DEFAULT 0 NOT NULL,
    image_urls text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: warehouse_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.warehouse_documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: warehouse_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.warehouse_documents_id_seq OWNED BY public.warehouse_documents.id;


--
-- Name: attendances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances ALTER COLUMN id SET DEFAULT nextval('public.attendances_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: branches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches ALTER COLUMN id SET DEFAULT nextval('public.branches_id_seq'::regclass);


--
-- Name: cukcuk_sales_imports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cukcuk_sales_imports ALTER COLUMN id SET DEFAULT nextval('public.cukcuk_sales_imports_id_seq'::regclass);


--
-- Name: daily_reconciliations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_reconciliations ALTER COLUMN id SET DEFAULT nextval('public.daily_reconciliations_id_seq'::regclass);


--
-- Name: daily_waste_confirmations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_waste_confirmations ALTER COLUMN id SET DEFAULT nextval('public.daily_waste_confirmations_id_seq'::regclass);


--
-- Name: damage_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports ALTER COLUMN id SET DEFAULT nextval('public.damage_reports_id_seq'::regclass);


--
-- Name: exam_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_questions ALTER COLUMN id SET DEFAULT nextval('public.exam_questions_id_seq'::regclass);


--
-- Name: exam_submissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_submissions ALTER COLUMN id SET DEFAULT nextval('public.exam_submissions_id_seq'::regclass);


--
-- Name: import_batches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_batches ALTER COLUMN id SET DEFAULT nextval('public.import_batches_id_seq'::regclass);


--
-- Name: inventory_check_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_check_items ALTER COLUMN id SET DEFAULT nextval('public.inventory_check_items_id_seq'::regclass);


--
-- Name: inventory_checks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_checks ALTER COLUMN id SET DEFAULT nextval('public.inventory_checks_id_seq'::regclass);


--
-- Name: inventory_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_snapshots ALTER COLUMN id SET DEFAULT nextval('public.inventory_snapshots_id_seq'::regclass);


--
-- Name: inventory_stocks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_stocks ALTER COLUMN id SET DEFAULT nextval('public.inventory_stocks_id_seq'::regclass);


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: line_item_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.line_item_logs ALTER COLUMN id SET DEFAULT nextval('public.line_item_logs_id_seq'::regclass);


--
-- Name: notification_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_logs ALTER COLUMN id SET DEFAULT nextval('public.notification_logs_id_seq'::regclass);


--
-- Name: payroll_periods id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_periods ALTER COLUMN id SET DEFAULT nextval('public.payroll_periods_id_seq'::regclass);


--
-- Name: payrolls id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls ALTER COLUMN id SET DEFAULT nextval('public.payrolls_id_seq'::regclass);


--
-- Name: processing_batches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_batches ALTER COLUMN id SET DEFAULT nextval('public.processing_batches_id_seq'::regclass);


--
-- Name: recipe_ingredients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_ingredients ALTER COLUMN id SET DEFAULT nextval('public.recipe_ingredients_id_seq'::regclass);


--
-- Name: recipes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes ALTER COLUMN id SET DEFAULT nextval('public.recipes_id_seq'::regclass);


--
-- Name: resignation_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resignation_requests ALTER COLUMN id SET DEFAULT nextval('public.resignation_requests_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: salary_advances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_advances ALTER COLUMN id SET DEFAULT nextval('public.salary_advances_id_seq'::regclass);


--
-- Name: salary_increase_proposals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_increase_proposals ALTER COLUMN id SET DEFAULT nextval('public.salary_increase_proposals_id_seq'::regclass);


--
-- Name: salary_rules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_rules ALTER COLUMN id SET DEFAULT nextval('public.salary_rules_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: take_out_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.take_out_logs ALTER COLUMN id SET DEFAULT nextval('public.take_out_logs_id_seq'::regclass);


--
-- Name: uniform_allocations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uniform_allocations ALTER COLUMN id SET DEFAULT nextval('public.uniform_allocations_id_seq'::regclass);


--
-- Name: uniform_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uniform_items ALTER COLUMN id SET DEFAULT nextval('public.uniform_items_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: warehouse_document_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_document_items ALTER COLUMN id SET DEFAULT nextval('public.warehouse_document_items_id_seq'::regclass);


--
-- Name: warehouse_documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_documents ALTER COLUMN id SET DEFAULT nextval('public.warehouse_documents_id_seq'::regclass);


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendances (id, user_id, branch_id, attendance_date, shift_name, check_in_time, check_in_selfie_url, check_in_latitude, check_in_longitude, check_in_distance_meters, is_valid_location, late_minutes, check_out_time, check_out_selfie_url, check_out_latitude, check_out_longitude, check_out_distance_meters, early_minutes, work_shift_hours, actual_hours, status, created_at) FROM stdin;
2	1	1	2026-11-23	CA_SANG	2026-11-23 07:55:00+07	\N	21.5927500	105.8442800	18.50	t	0	2026-11-23 16:00:00+07	\N	\N	\N	0.00	0	8.00	8.00	HOAN_THANH	2026-11-23 20:50:06.442739+07
3	2	1	2026-11-23	CA_SANG	2026-11-23 07:50:00+07	\N	21.5927200	105.8442400	12.00	t	0	2026-11-23 16:05:00+07	\N	\N	\N	0.00	0	8.00	8.00	HOAN_THANH	2026-11-23 20:50:06.442739+07
4	3	1	2026-11-23	CA_SANG	2026-11-23 07:58:00+07	\N	21.5928100	105.8443500	25.00	t	0	2026-11-23 16:00:00+07	\N	\N	\N	0.00	0	8.00	8.00	HOAN_THANH	2026-11-23 20:50:06.442739+07
5	8	1	2026-11-23	CA_TOI	2026-11-23 17:25:00+07	\N	21.5927400	105.8442600	22.00	t	25	\N	\N	\N	\N	0.00	0	8.00	0.00	DANG_LAM	2026-11-23 20:50:06.442739+07
6	5	2	2026-11-23	CA_SANG	2026-11-23 07:52:00+07	\N	21.1485600	106.1624500	15.00	t	0	2026-11-23 16:00:00+07	\N	\N	\N	0.00	0	8.00	8.00	HOAN_THANH	2026-11-23 20:50:06.442739+07
7	6	2	2026-11-23	CA_SANG	2026-11-23 07:45:00+07	\N	21.1486500	106.1625800	30.00	t	0	2026-11-23 16:00:00+07	\N	\N	\N	0.00	0	8.00	8.00	HOAN_THANH	2026-11-23 20:50:06.442739+07
8	7	2	2026-11-23	CA_SANG	2026-11-23 07:50:00+07	\N	21.1485200	106.1624300	10.50	t	0	2026-11-23 16:10:00+07	\N	\N	\N	0.00	0	8.00	8.00	HOAN_THANH	2026-11-23 20:50:06.442739+07
9	11	2	2026-11-23	CA_SANG	2026-11-23 08:05:00+07	\N	21.1501000	106.1639000	185.00	f	0	\N	\N	\N	\N	0.00	0	8.00	0.00	VI_PHAM_KHOANG_CACH	2026-11-23 20:50:06.442739+07
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, action, target_entity, target_id, details, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.branches (id, branch_code, branch_name, address, phone, latitude, longitude, is_active, created_at, updated_at) FROM stdin;
1	CN_THAI_NGUYEN	Sen Việt Buffet - Chi nhánh Thái Nguyên	Số 123 Đường Hoàng Văn Thụ, TP. Thái Nguyên, Tỉnh Thái Nguyên	02083888999	21.5927000	105.8442000	t	2026-11-23 20:50:06.129734+07	2026-11-23 20:50:06.129734+07
2	CN_QUE_VO	Sen Việt Buffet - Chi nhánh Quế Võ	Khu Đô Thị Mới Nam Sơn, TX. Quế Võ, Tỉnh Bắc Ninh	02223888777	21.1485000	106.1624000	t	2026-11-23 20:50:06.129734+07	2026-11-23 20:50:06.129734+07
\.


--
-- Data for Name: cukcuk_sales_imports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cukcuk_sales_imports (id, branch_id, import_date, shift_type, file_name, total_revenue, adult_guest_count, child_guest_count, total_guest_count, standard_buffet_count, vip_buffet_count, imported_by_user_id, created_at) FROM stdin;
1	1	2026-11-23	CA_NGAY	BaoCaoBanHang_CukCuk_20261117.xlsx	42500000.00	120	30	150	90	60	3	2026-11-23 20:50:06.195001+07
\.


--
-- Data for Name: daily_reconciliations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_reconciliations (id, branch_id, item_id, recon_date, shift_type, exported_qty, guest_consumption_qty, processing_loss_qty, reported_damage_qty, unexplained_loss_qty, unexplained_loss_amount, unexplained_loss_rate, actual_consumption_per_guest, is_over_threshold, responsible_user_name, status, created_at, updated_at) FROM stdin;
4	1	1	2026-11-23	CA_NGAY	50.000	30.000	10.000	3.500	6.500	2275000.00	13.00	0.2500	t	Nguyễn Văn Bếp (Thái Nguyên)	DA_CANH_BAO_ZALO	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
5	1	2	2026-11-23	CA_NGAY	25.000	20.000	4.500	0.000	0.500	140000.00	2.00	0.1667	f	Lê Kế Toán (Thái Nguyên)	DA_CHOT	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
6	1	11	2026-11-23	CA_NGAY	30.000	25.000	4.500	0.200	0.300	72000.00	1.00	0.2000	f	Lê Kế Toán (Thái Nguyên)	DA_CHOT	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
7	1	12	2026-11-23	CA_NGAY	40.000	35.000	4.200	0.000	0.800	156000.00	2.00	0.2667	f	Lê Kế Toán (Thái Nguyên)	DA_CHOT	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
8	2	1	2026-11-23	CA_NGAY	35.000	22.000	7.000	1.500	4.500	1575000.00	12.86	0.2800	t	Lê Văn Bếp (Quế Võ)	DA_CANH_BAO_ZALO	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
9	2	13	2026-11-23	CA_NGAY	20.000	16.500	3.200	0.000	0.300	54000.00	1.50	0.1800	f	Hoàng Nhân Viên (Quế Võ)	DA_CHOT	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
10	2	4	2026-11-23	CA_NGAY	15.000	14.000	0.800	0.000	0.200	9000.00	1.33	0.1500	f	Hoàng Nhân Viên (Quế Võ)	DA_CHOT	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
11	2	7	2026-11-23	CA_NGAY	18.000	16.000	1.500	0.300	0.200	11000.00	1.11	0.1700	f	Hoàng Nhân Viên (Quế Võ)	DA_CHOT	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
\.


--
-- Data for Name: daily_waste_confirmations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_waste_confirmations (id, branch_id, item_id, waste_date, shift, quantity, unit, confirmed_by_user_id, status, note, created_at) FROM stdin;
\.


--
-- Data for Name: damage_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.damage_reports (id, branch_id, item_id, supplier_code, batch_number, quantity, estimated_value, reason, image_urls, status, reported_by_user_id, approved_by_user_id, approved_at, note, created_at, updated_at, batch_id, supplier_id) FROM stdin;
1	1	1	NCC-QN01	LOT-202611-001	3.500	1225000.00	HẢI SẢN CHẾT / NGỢP	\N	CHO_DUYET	1	\N	\N	Cua chết do sục oxy bể hải sản gặp sự cố lúc rạng sáng; chờ Quản lý kiểm tra xác nhận	2026-11-23 18:50:06.442739+07	2026-11-23 20:50:06.442739+07	1	1
2	1	4	KHO_NOI_BO	KHO-KIMCHI	2.000	90000.00	RÁCH BAO BÌ / HƯ HỎNG BẢO QUẢN	\N	TU_DONG_DUYET	1	1	2026-11-23 16:50:06.442739+07	Thùng kim chi bị va đập góc khi bốc xếp, tự động duyệt do giá trị dưới ngưỡng 500.000 đ	2026-11-23 16:50:06.442739+07	2026-11-23 20:50:06.442739+07	\N	\N
\.


--
-- Data for Name: exam_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exam_questions (id, "position", question_text, option_a, option_b, option_c, option_d, correct_option, points, is_active, created_at) FROM stdin;
1	BEP	Định mức hao hụt chuẩn cho phép khi chế biến món Cua Cà Mau hấp là bao nhiêu %?	10%	15%	20%	30%	C	20	t	2026-11-23 20:50:06.22851+07
2	BEP	Quy tắc an toàn khi phát hiện mẻ chế biến thứ 2 cùng món đang dở dang là gì?	Tự ý mở mẻ mới bình thường	Cảnh báo đỏ và cần xác nhận để tránh che giấu hao hụt	Đổ chung 2 mẻ vào nhau	Không cần ghi chép	B	20	t	2026-11-23 20:50:06.22851+07
3	BEP	Nhiệt độ bảo quản tiêu chuẩn của tủ đông chứa hải sản tươi sống là bao nhiêu?	Từ 0°C đến 5°C	Từ -18°C đến -22°C	Từ 10°C đến 15°C	Nhiệt độ phòng	B	20	t	2026-11-23 20:50:06.22851+07
4	BEP	Thao tác cần làm ngay khi bấm nút Ra Line (+1) trên điện thoại di động là gì?	Bấm liên tục 5 lần	Chờ nút phản hồi xong và quan sát đèn trạng thái	Tắt kết nối wifi	Chụp ảnh gửi kế toán	B	20	t	2026-11-23 20:50:06.22851+07
5	BEP	Ngưỡng giá trị báo hỏng nguyên liệu tự động duyệt không cần Quản lý phê duyệt là bao nhiêu?	100,000 VNĐ	200,000 VNĐ	500,000 VNĐ	1,000,000 VNĐ	C	20	t	2026-11-23 20:50:06.22851+07
6	PHUC_VU	Khi khách hàng có trẻ em dưới 1m3, hệ thống Sen Việt Buffet áp dụng mức tính nào?	Miễn phí hoàn toàn	Áp dụng hệ số 50% suất người lớn	Tính 100% như người lớn	Không phục vụ	B	25	t	2026-11-23 20:50:06.22851+07
7	PHUC_VU	Thời gian tối đa để nhân viên phục vụ dọn đĩa trống tại bàn khách là bao lâu?	Trong vòng 3 phút	Trong vòng 15 phút	Khi khách rời khỏi nhà hàng	Không cần dọn	A	25	t	2026-11-23 20:50:06.22851+07
8	PHUC_VU	Khoảng cách GPS tối đa cho phép để ghi nhận chấm công hợp lệ tại nhà hàng là bao nhiêu?	20 mét	50 mét	100 mét	1000 mét	C	25	t	2026-11-23 20:50:06.22851+07
9	PHUC_VU	Điều kiện bắt buộc để nhân viên nghỉ việc được thanh toán khoản lương giữ lại là gì?	Chỉ cần xin phép bằng miệng	Đã hoàn tất bàn giao đầy đủ 100% đồng phục đã cấp	Bỏ việc tự ý sau 3 ngày	Không cần điều kiện	B	25	t	2026-11-23 20:50:06.22851+07
\.


--
-- Data for Name: exam_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exam_submissions (id, user_id, branch_id, exam_quarter, started_at, submitted_at, duration_seconds, theory_score, practical_score, total_score, graded_by_user_id, practical_comment, status, is_passed, created_at) FROM stdin;
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	init auth and master	SQL	V1__init_auth_and_master.sql	-491012847	senviet_user	2026-11-23 20:50:06.072534	28	t
2	2	seed branches and demo users	SQL	V2__seed_branches_and_demo_users.sql	-1920870694	senviet_user	2026-11-23 20:50:06.124003	6	t
3	3	kitchen and processing schema	SQL	V3__kitchen_and_processing_schema.sql	1843970366	senviet_user	2026-11-23 20:50:06.138382	41	t
4	4	reconciliation and cukcuk schema	SQL	V4__reconciliation_and_cukcuk_schema.sql	893112892	senviet_user	2026-11-23 20:50:06.18791	27	t
5	5	hr and attendance schema	SQL	V5__hr_and_attendance_schema.sql	-2008607795	senviet_user	2026-11-23 20:50:06.223639	34	t
6	6	payroll and advances schema	SQL	V6__payroll_and_advances_schema.sql	1503690277	senviet_user	2026-11-23 20:50:06.264313	30	t
7	7	warehouse lots and suppliers	SQL	V7__warehouse_lots_and_suppliers.sql	1472159341	senviet_user	2026-11-23 20:50:06.301227	67	t
8	8	kitchen rules and daily items	SQL	V8__kitchen_rules_and_daily_items.sql	1348916543	senviet_user	2026-11-23 20:50:06.376709	10	t
9	9	multi role user schema	SQL	V9__multi_role_user_schema.sql	1476595397	senviet_user	2026-11-23 20:50:06.391457	17	t
10	10	payroll enhancement and locks	SQL	V10__payroll_enhancement_and_locks.sql	85625660	senviet_user	2026-11-23 20:50:06.4151	15	t
11	11	comprehensive demo seed data	SQL	V11__comprehensive_demo_seed_data.sql	-926726794	senviet_user	2026-11-23 20:50:06.433635	37	t
12	12	seed real preprocessing inventory que vo	SQL	V12__seed_real_preprocessing_inventory_que_vo.sql	-123456789	senviet_user	2026-11-23 21:10:36.227273	25	t
\.


--
-- Data for Name: import_batches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.import_batches (id, batch_code, supplier_id, item_id, branch_id, import_date, expiry_date, initial_quantity, current_stock, unit_price, unit, status, created_at, updated_at) FROM stdin;
1	LOT-202611-001	1	1	1	2026-11-21	2026-11-28	100.000	85.000	350000.00	KG	CON_HANG	2026-11-23 20:50:06.307769+07	2026-11-23 20:50:06.307769+07
2	LOT-202611-002	2	2	1	2026-11-22	2026-11-27	80.000	65.000	280000.00	KG	CON_HANG	2026-11-23 20:50:06.307769+07	2026-11-23 20:50:06.307769+07
5	LOT-202611-003	1	11	1	2026-11-21	2026-11-27	120.000	90.000	240000.00	KG	CON_HANG	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
6	LOT-202611-004	3	12	1	2026-11-19	2026-12-13	150.000	110.000	195000.00	KG	CON_HANG	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
7	LOT-202611-005	1	13	2	2026-11-21	2026-11-28	90.000	75.000	180000.00	KG	CON_HANG	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
8	LOT-202611-006	2	1	2	2026-11-20	2026-11-27	70.000	50.000	350000.00	KG	CON_HANG	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
9	LOT-202611-007	4	7	2	2026-11-22	2026-11-25	50.000	40.000	55000.00	KG	CON_HANG	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
10	LOT-202611-008	9	18	2	2026-11-18	2026-12-18	200.000	160.000	50000.00	LIT	CON_HANG	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
11	LOT-QV-202611-QVBANHMY	16	19	2	2026-11-01	\N	50.000	50.000	12000.00	CÁI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
12	LOT-QV-202611-QVBANHXEO	20	20	2	2026-11-01	\N	50.000	50.000	40000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
13	LOT-QV-202611-QVBAP	10	21	2	2026-11-01	\N	50.000	50.000	187000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
14	LOT-QV-202611-QVBAPNGO	16	22	2	2026-11-01	\N	50.000	50.000	10000.00	BẮP	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
15	LOT-QV-202611-QVBBC	20	23	2	2026-11-01	\N	50.000	50.000	20000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
16	LOT-QV-202611-QVBBKS	14	24	2	2026-11-01	\N	50.000	50.000	4200.00	CÁI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
17	LOT-QV-202611-QVBCBT	10	25	2	2026-11-01	\N	50.000	50.000	198000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
18	LOT-QV-202611-QVBCHH	20	26	2	2026-11-01	\N	50.000	50.000	22000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
19	LOT-QV-202611-QVBCL	29	27	2	2026-11-01	\N	50.000	50.000	135000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
20	LOT-QV-202611-QVBCLNV	29	28	2	2026-11-01	\N	50.000	50.000	135000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
21	LOT-QV-202611-QVBCT	16	29	2	2026-11-01	\N	50.000	50.000	15000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
22	LOT-QV-202611-QVBCTR	16	30	2	2026-11-01	\N	50.000	50.000	15000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
23	LOT-QV-202611-QVBCX	20	31	2	2026-11-01	\N	50.000	50.000	55000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
24	LOT-QV-202611-QVBDS	11	32	2	2026-11-01	\N	50.000	50.000	170.00	CÁI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
25	LOT-QV-202611-QVBEBE	25	33	2	2026-11-01	\N	50.000	50.000	210000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
26	LOT-QV-202611-QVBICHUOI	16	34	2	2026-11-01	\N	50.000	50.000	15000.00	CÁI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
27	LOT-QV-202611-QVBM	20	35	2	2026-11-01	\N	50.000	50.000	21000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
28	LOT-QV-202611-QVBOTCANH	20	36	2	2026-11-01	\N	50.000	50.000	20000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
29	LOT-QV-202611-QVBOTNANG	20	37	2	2026-11-01	\N	50.000	50.000	24000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
30	LOT-QV-202611-QVBOTNEP	20	38	2	2026-11-01	\N	50.000	50.000	40000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
31	LOT-QV-202611-QVBOTOTHAN	20	39	2	2026-11-01	\N	50.000	50.000	140000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
32	LOT-QV-202611-QVBOTTE	20	40	2	2026-11-01	\N	50.000	50.000	20000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
33	LOT-QV-202611-QVBR	16	41	2	2026-11-01	\N	50.000	50.000	10000.00	LÍT	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
34	LOT-QV-202611-QVBRM	20	42	2	2026-11-01	\N	50.000	50.000	190000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
35	LOT-QV-202611-QVBUN	16	43	2	2026-11-01	\N	50.000	50.000	15000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
36	LOT-QV-202611-QVBUOINGOT	16	44	2	2026-11-01	\N	50.000	50.000	15000.00	QUẢ	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
37	LOT-QV-202611-QVCACHUA	16	45	2	2026-11-01	\N	50.000	50.000	25000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
38	LOT-QV-202611-QVCACHUABI	16	46	2	2026-11-01	\N	50.000	50.000	50000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
39	LOT-QV-202611-QVCAHOI	22	47	2	2026-11-01	\N	50.000	50.000	320000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
40	LOT-QV-202611-QVCAICANH	16	48	2	2026-11-01	\N	50.000	50.000	8000.00	MỚ	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
41	LOT-QV-202611-QVCAICUC	16	49	2	2026-11-01	\N	50.000	50.000	10000.00	MỚ	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
42	LOT-QV-202611-QVCAINGONG	16	50	2	2026-11-01	\N	50.000	50.000	10000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
43	LOT-QV-202611-QVCAITHAO	16	51	2	2026-11-01	\N	50.000	50.000	9000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
44	LOT-QV-202611-QVCALANG	13	52	2	2026-11-01	\N	50.000	50.000	110000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
45	LOT-QV-202611-QVCAM	16	53	2	2026-11-01	\N	50.000	50.000	20000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
46	LOT-QV-202611-QVCANTT	16	54	2	2026-11-01	\N	50.000	50.000	30000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
47	LOT-QV-202611-QVCAPHAO	16	55	2	2026-11-01	\N	50.000	50.000	20000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
48	LOT-QV-202611-QVCATRICH	22	56	2	2026-11-01	\N	50.000	50.000	310000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
49	LOT-QV-202611-QVCBS	33	57	2	2026-11-01	\N	50.000	50.000	100000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
50	LOT-QV-202611-QVCGCX	10	58	2	2026-11-01	\N	50.000	50.000	62000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
51	LOT-QV-202611-QVCGG	10	59	2	2026-11-01	\N	50.000	50.000	86000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
52	LOT-QV-202611-QVCGRX	10	60	2	2026-11-01	\N	50.000	50.000	97000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
53	LOT-QV-202611-QVCHA	29	61	2	2026-11-01	\N	50.000	50.000	90000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
54	LOT-QV-202611-QVCHANGIO	29	62	2	2026-11-01	\N	50.000	50.000	80000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
55	LOT-QV-202611-QVCHANH	16	63	2	2026-11-01	\N	50.000	50.000	35000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
56	LOT-QV-202611-QVCHANSU	29	64	2	2026-11-01	\N	50.000	50.000	100000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
57	LOT-QV-202611-QVCHANSUA	21	65	2	2026-11-01	\N	50.000	50.000	120000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
58	LOT-QV-202611-QVCOC	16	66	2	2026-11-01	\N	50.000	50.000	30000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
59	LOT-QV-202611-QVCONKHO	20	67	2	2026-11-01	\N	50.000	50.000	28000.00	BỊCH	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
60	LOT-QV-202611-QVCR	16	68	2	2026-11-01	\N	50.000	50.000	15000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
61	LOT-QV-202611-QVCRP	29	69	2	2026-11-01	\N	50.000	50.000	55000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
62	LOT-QV-202611-QVCTD	20	70	2	2026-11-01	\N	50.000	50.000	26666.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
63	LOT-QV-202611-QVCUA	27	71	2	2026-11-01	\N	50.000	50.000	210000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
64	LOT-QV-202611-QVCUCAI	16	72	2	2026-11-01	\N	50.000	50.000	13000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
65	LOT-QV-202611-QVCUDAU	16	73	2	2026-11-01	\N	50.000	50.000	10000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
66	LOT-QV-202611-QVCX	13	74	2	2026-11-01	\N	50.000	50.000	85000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
67	LOT-QV-202611-QVDAM	20	75	2	2026-11-01	\N	50.000	50.000	43333.00	CAN	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
68	LOT-QV-202611-QVDAMHONG	20	76	2	2026-11-01	\N	50.000	50.000	30000.00	CHAI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
69	LOT-QV-202611-QVDAPCA	16	77	2	2026-11-01	\N	50.000	50.000	25000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
70	LOT-QV-202611-QVDAUAN	20	78	2	2026-11-01	\N	50.000	50.000	700000.00	THÙNG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
71	LOT-QV-202611-QVDAUBAP	16	79	2	2026-11-01	\N	50.000	50.000	40000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
72	LOT-QV-202611-QVDAUCHUOI	20	80	2	2026-11-01	\N	50.000	50.000	50000.00	CHAI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
73	LOT-QV-202611-QVDAUCOVE	16	81	2	2026-11-01	\N	50.000	50.000	20000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
74	LOT-QV-202611-QVDAUDEN	20	82	2	2026-11-01	\N	50.000	50.000	66000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
75	LOT-QV-202611-QVDAUHAO	20	83	2	2026-11-01	\N	50.000	50.000	25000.00	CHAI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
76	LOT-QV-202611-QVDAUME	20	84	2	2026-11-01	\N	50.000	50.000	50000.00	CHAI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
77	LOT-QV-202611-QVDAUPHU	16	85	2	2026-11-01	\N	50.000	50.000	3500.00	BÌA	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
78	LOT-QV-202611-QVDAUXANH	20	86	2	2026-11-01	\N	50.000	50.000	52000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
79	LOT-QV-202611-QVDTN	20	87	2	2026-11-01	\N	50.000	50.000	40000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
80	LOT-QV-202611-QVDUA	16	88	2	2026-11-01	\N	50.000	50.000	20000.00	QUẢ	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
81	LOT-QV-202611-QVDUACHUA	16	89	2	2026-11-01	\N	50.000	50.000	20000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
82	LOT-QV-202611-QVDUACHUOT	16	90	2	2026-11-01	\N	50.000	50.000	20000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
83	LOT-QV-202611-QVDUAHAU	16	91	2	2026-11-01	\N	50.000	50.000	17000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
84	LOT-QV-202611-QVDUAKHO	20	92	2	2026-11-01	\N	50.000	50.000	24000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
85	LOT-QV-202611-QVDUALUOI	16	93	2	2026-11-01	\N	50.000	50.000	40000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
86	LOT-QV-202611-QVDUDU	16	94	2	2026-11-01	\N	50.000	50.000	15000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
87	LOT-QV-202611-QVDUONG	20	95	2	2026-11-01	\N	50.000	50.000	20666.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
88	LOT-QV-202611-QVDV	23	96	2	2026-11-01	\N	50.000	50.000	8000.00	TÚI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
89	LOT-QV-202611-QVDX	23	97	2	2026-11-01	\N	50.000	50.000	8000.00	TÚI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
90	LOT-QV-202611-QVGA	29	98	2	2026-11-01	\N	50.000	50.000	85000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
91	LOT-QV-202611-QVGANLON	29	99	2	2026-11-01	\N	50.000	50.000	40000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
92	LOT-QV-202611-QVGAONHAT	20	100	2	2026-11-01	\N	50.000	50.000	20800.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
93	LOT-QV-202611-QVGASN	24	101	2	2026-11-01	\N	50.000	50.000	37038.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
94	LOT-QV-202611-QVGAST	24	102	2	2026-11-01	\N	50.000	50.000	37000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
95	LOT-QV-202611-QVGE	20	103	2	2026-11-01	\N	50.000	50.000	340000.00	TÚI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
96	LOT-QV-202611-QVGHE	19	104	2	2026-11-01	\N	50.000	50.000	210000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
97	LOT-QV-202611-QVGIA	16	105	2	2026-11-01	\N	50.000	50.000	15000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
98	LOT-QV-202611-QVGIAYRUT	11	106	2	2026-11-01	\N	50.000	50.000	285000.00	BỊCH	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
99	LOT-QV-202611-QVGIENGC	16	107	2	2026-11-01	\N	50.000	50.000	20000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
100	LOT-QV-202611-QVGIO	29	108	2	2026-11-01	\N	50.000	50.000	110000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
101	LOT-QV-202611-QVGNV	16	109	2	2026-11-01	\N	50.000	50.000	17000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
102	LOT-QV-202611-QVGT	16	110	2	2026-11-01	\N	50.000	50.000	48000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
103	LOT-QV-202611-QVGTTB	28	111	2	2026-11-01	\N	50.000	50.000	70000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
104	LOT-QV-202611-QVGUNG	16	112	2	2026-11-01	\N	50.000	50.000	25000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
105	LOT-QV-202611-QVHANH	16	113	2	2026-11-01	\N	50.000	50.000	35000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
106	LOT-QV-202611-QVHANHKHO	20	114	2	2026-11-01	\N	50.000	50.000	90000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
107	LOT-QV-202611-QVHANHTA	16	115	2	2026-11-01	\N	50.000	50.000	25000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
108	LOT-QV-202611-QVHANHTAY	16	116	2	2026-11-01	\N	50.000	50.000	15000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
109	LOT-QV-202611-QVHATE	20	117	2	2026-11-01	\N	50.000	50.000	120000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
110	LOT-QV-202611-QVHATSEN	20	118	2	2026-11-01	\N	50.000	50.000	180000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
111	LOT-QV-202611-QVHAU	21	119	2	2026-11-01	\N	50.000	50.000	17000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
112	LOT-QV-202611-QVHN	20	120	2	2026-11-01	\N	50.000	50.000	30000.00	TÚI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
113	LOT-QV-202611-QVHOA	16	121	2	2026-11-01	\N	50.000	50.000	90000.00	BÓ	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
114	LOT-QV-202611-QVKEMCHLD	26	122	2	2026-11-01	\N	50.000	50.000	285000.00	HỘP	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
115	LOT-QV-202611-QVKEMCHLT	26	123	2	2026-11-01	\N	50.000	50.000	240000.00	HỘP	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
116	LOT-QV-202611-QVKEMCOOKIE OROE	26	124	2	2026-11-01	\N	50.000	50.000	275000.00	HỘP	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
117	LOT-QV-202611-QVKEMDAUTAY	26	125	2	2026-11-01	\N	50.000	50.000	230000.00	HỘP	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
118	LOT-QV-202611-QVKEMDUANON	26	126	2	2026-11-01	\N	50.000	50.000	285000.00	HỘP	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
119	LOT-QV-202611-QVKEMHTTC	26	127	2	2026-11-01	\N	50.000	50.000	275000.00	HỘP	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
120	LOT-QV-202611-QVKEMIETQUAT	26	128	2	2026-11-01	\N	50.000	50.000	230000.00	HỘP	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
121	LOT-QV-202611-QVKEMVANI	26	129	2	2026-11-01	\N	50.000	50.000	180000.00	HỘP	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
122	LOT-QV-202611-QVKHANUOT	11	130	2	2026-11-01	\N	50.000	50.000	550.00	CÁI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
123	LOT-QV-202611-QVKHOAITAY	16	131	2	2026-11-01	\N	50.000	50.000	15000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
124	LOT-QV-202611-QVKINHGIOI	16	132	2	2026-11-01	\N	50.000	50.000	50000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
125	LOT-QV-202611-QVKLK	16	133	2	2026-11-01	\N	50.000	50.000	12000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
126	LOT-QV-202611-QVKTS	17	134	2	2026-11-01	\N	50.000	50.000	55000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
127	LOT-QV-202611-QVLAC	16	135	2	2026-11-01	\N	50.000	50.000	65000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
128	LOT-QV-202611-QVLACHANH	16	136	2	2026-11-01	\N	50.000	50.000	150000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
129	LOT-QV-202611-QVLACRANG	20	137	2	2026-11-01	\N	50.000	50.000	60000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
130	LOT-QV-202611-QVLAHE	16	138	2	2026-11-01	\N	50.000	50.000	50000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
131	LOT-QV-202611-QVLE	16	139	2	2026-11-01	\N	50.000	50.000	35000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
132	LOT-QV-202611-QVLN	17	140	2	2026-11-01	\N	50.000	50.000	150000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
133	LOT-QV-202611-QVLONGGA	29	141	2	2026-11-01	\N	50.000	50.000	5833.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
134	LOT-QV-202611-QVLONGLON	29	142	2	2026-11-01	\N	50.000	50.000	80000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
135	LOT-QV-202611-QVLT	16	143	2	2026-11-01	\N	50.000	50.000	35000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
136	LOT-QV-202611-QVLV	28	144	2	2026-11-01	\N	50.000	50.000	225000.00	LẦN	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
137	LOT-QV-202611-QVLX	16	145	2	2026-11-01	\N	50.000	50.000	35000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
138	LOT-QV-202611-QVMAJOLE	20	146	2	2026-11-01	\N	50.000	50.000	230000.00	CAN	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
139	LOT-QV-202611-QVMAM5L	20	147	2	2026-11-01	\N	50.000	50.000	70000.00	CAN	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
140	LOT-QV-202611-QVMATONG	20	148	2	2026-11-01	\N	50.000	50.000	33333.00	CHAI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
141	LOT-QV-202611-QVMC	16	149	2	2026-11-01	\N	50.000	50.000	30000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
142	LOT-QV-202611-QVMD	16	150	2	2026-11-01	\N	50.000	50.000	30000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
143	LOT-QV-202611-QVMEKHO	20	151	2	2026-11-01	\N	50.000	50.000	30000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
144	LOT-QV-202611-QVMOCNHI	20	152	2	2026-11-01	\N	50.000	50.000	130000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
145	LOT-QV-202611-QVMTP	20	153	2	2026-11-01	\N	50.000	50.000	200000.00	HỘP	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
146	LOT-QV-202611-QVMUC	32	154	2	2026-11-01	\N	50.000	50.000	160000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
147	LOT-QV-202611-QVMUITA	16	155	2	2026-11-01	\N	50.000	50.000	50000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
148	LOT-QV-202611-QVMUITAU	16	156	2	2026-11-01	\N	50.000	50.000	30000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
149	LOT-QV-202611-QVMUITAY	16	157	2	2026-11-01	\N	50.000	50.000	80000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
150	LOT-QV-202611-QVMUNGTOI	16	158	2	2026-11-01	\N	50.000	50.000	10000.00	MỚ	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
151	LOT-QV-202611-QVMUNI	32	159	2	2026-11-01	\N	50.000	50.000	400000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
152	LOT-QV-202611-QVMUOIT	20	160	2	2026-11-01	\N	50.000	50.000	5000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
153	LOT-QV-202611-QVMUOITINH	20	161	2	2026-11-01	\N	50.000	50.000	6666.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
154	LOT-QV-202611-QVMUOP	16	162	2	2026-11-01	\N	50.000	50.000	35000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
155	LOT-QV-202611-QVMUTAT	20	163	2	2026-11-01	\N	50.000	50.000	11000.00	TUÝP	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
156	LOT-QV-202611-QVMYCHINH	20	164	2	2026-11-01	\N	50.000	50.000	56000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
157	LOT-QV-202611-QVMYTOM	20	165	2	2026-11-01	\N	50.000	50.000	45000.00	BỊCH	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
158	LOT-QV-202611-QVMYY	20	166	2	2026-11-01	\N	50.000	50.000	26000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
159	LOT-QV-202611-QVNACSAY	29	167	2	2026-11-01	\N	50.000	50.000	105000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
160	LOT-QV-202611-QVNACVAI	29	168	2	2026-11-01	\N	50.000	50.000	105000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
161	LOT-QV-202611-QVNAM	16	169	2	2026-11-01	\N	50.000	50.000	6666.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
162	LOT-QV-202611-QVNAMHUONG	20	170	2	2026-11-01	\N	50.000	50.000	240000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
163	LOT-QV-202611-QVNAMLON	10	171	2	2026-11-01	\N	50.000	50.000	142000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
164	LOT-QV-202611-QVNAMTUYET	20	172	2	2026-11-01	\N	50.000	50.000	250000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
165	LOT-QV-202611-QVNEPCAM	20	173	2	2026-11-01	\N	50.000	50.000	36000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
166	LOT-QV-202611-QVNGAOHAICUI	21	174	2	2026-11-01	\N	50.000	50.000	60000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
167	LOT-QV-202611-QVNGAOMO	21	175	2	2026-11-01	\N	50.000	50.000	58000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
168	LOT-QV-202611-QVNGOKEM	20	176	2	2026-11-01	\N	50.000	50.000	12000.00	HỘP	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
169	LOT-QV-202611-QVNRB	11	177	2	2026-11-01	\N	50.000	50.000	190000.00	CAN	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
170	LOT-QV-202611-QVNTC	11	178	2	2026-11-01	\N	50.000	50.000	22000.00	CAN	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
171	LOT-QV-202611-QVNUOCCOTDUA	20	179	2	2026-11-01	\N	50.000	50.000	30000.00	LON	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
172	LOT-QV-202611-QVNUOCDASANI	31	180	2	2026-11-01	\N	50.000	50.000	3541.00	CHAI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
173	LOT-QV-202611-QVOCHUONG	32	181	2	2026-11-01	\N	50.000	50.000	135000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
174	LOT-QV-202611-QVOCNHOI	13	182	2	2026-11-01	\N	50.000	50.000	80000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
175	LOT-QV-202611-QVOI	16	183	2	2026-11-01	\N	50.000	50.000	20000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
176	LOT-QV-202611-QVOTCAY	16	184	2	2026-11-01	\N	50.000	50.000	50000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
177	LOT-QV-202611-QVOTSUNGDO	16	185	2	2026-11-01	\N	50.000	50.000	50000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
178	LOT-QV-202611-QVOTSUNGXANH	16	186	2	2026-11-01	\N	50.000	50.000	35000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
179	LOT-QV-202611-QVPHO	16	187	2	2026-11-01	\N	50.000	50.000	15000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
180	LOT-QV-202611-QVPHOMAI	20	188	2	2026-11-01	\N	50.000	50.000	180000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
181	LOT-QV-202611-QVPT	20	189	2	2026-11-01	\N	50.000	50.000	10000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
182	LOT-QV-202611-QVQUAT	16	190	2	2026-11-01	\N	50.000	50.000	20000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
183	LOT-QV-202611-QVQUAY	16	191	2	2026-11-01	\N	50.000	50.000	100000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
184	LOT-QV-202611-QVRAUMUONG	16	192	2	2026-11-01	\N	50.000	50.000	10000.00	MỚ	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
185	LOT-QV-202611-QVRBCC	20	193	2	2026-11-01	\N	50.000	50.000	320000.00	BỊCH	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
186	LOT-QV-202611-QVRBH	20	194	2	2026-11-01	\N	50.000	50.000	90000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
187	LOT-QV-202611-QVSA	16	195	2	2026-11-01	\N	50.000	50.000	15000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
188	LOT-QV-202611-QVSAN	21	196	2	2026-11-01	\N	50.000	50.000	80000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
189	LOT-QV-202611-QVSG	20	197	2	2026-11-01	\N	50.000	50.000	60000.00	CHAI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
190	LOT-QV-202611-QVSMR	20	198	2	2026-11-01	\N	50.000	50.000	160000.00	CHAI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
191	LOT-QV-202611-QVSOLONG	21	199	2	2026-11-01	\N	50.000	50.000	45000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
192	LOT-QV-202611-QVST	20	200	2	2026-11-01	\N	50.000	50.000	7666.00	LỌ	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
193	LOT-QV-202611-QVSTKD	20	201	2	2026-11-01	\N	50.000	50.000	35833.00	HỘP	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
194	LOT-QV-202611-QVSUACHUA	20	202	2	2026-11-01	\N	50.000	50.000	30000.00	VỈ	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
195	LOT-QV-202611-QVSUADAC	20	203	2	2026-11-01	\N	50.000	50.000	55833.00	HỘP	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
196	LOT-QV-202611-QVSUONT	10	204	2	2026-11-01	\N	50.000	50.000	112000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
197	LOT-QV-202611-QVTAI	29	205	2	2026-11-01	\N	50.000	50.000	90000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
198	LOT-QV-202611-QVTAM	20	206	2	2026-11-01	\N	50.000	50.000	17000.00	TÚI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
199	LOT-QV-202611-QVTAO	16	207	2	2026-11-01	\N	50.000	50.000	30000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
200	LOT-QV-202611-QVTAODO	20	208	2	2026-11-01	\N	50.000	50.000	70000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
201	LOT-QV-202611-QVTBT5	28	209	2	2026-11-01	\N	50.000	50.000	48000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
202	LOT-QV-202611-QVTCD	20	210	2	2026-11-01	\N	50.000	50.000	26666.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
203	LOT-QV-202611-QVTCX	32	211	2	2026-11-01	\N	50.000	50.000	185000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
204	LOT-QV-202611-QVTHAITOM	20	212	2	2026-11-01	\N	50.000	50.000	68000.00	LỌ	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
205	LOT-QV-202611-QVTHANHCUA	17	213	2	2026-11-01	\N	50.000	50.000	100000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
206	LOT-QV-202611-QVTHANHLONG	16	214	2	2026-11-01	\N	50.000	50.000	30000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
207	LOT-QV-202611-QVTHILA	16	215	2	2026-11-01	\N	50.000	50.000	20000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
208	LOT-QV-202611-QVTHITXAY	29	216	2	2026-11-01	\N	50.000	50.000	105000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
209	LOT-QV-202611-QVTIATO	16	217	2	2026-11-01	\N	50.000	50.000	40000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
210	LOT-QV-202611-QVTIGER	12	218	2	2026-11-01	\N	50.000	50.000	17500.00	LON	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
211	LOT-QV-202611-QVTOI	16	219	2	2026-11-01	\N	50.000	50.000	35000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
212	LOT-QV-202611-QVTOM	13	220	2	2026-11-01	\N	50.000	50.000	230000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
213	LOT-QV-202611-QVTRUNG	16	221	2	2026-11-01	\N	50.000	50.000	3500.00	QUẢ	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
214	LOT-QV-202611-QVTRUNGCUT	16	222	2	2026-11-01	\N	50.000	50.000	1000.00	QUẢ	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
215	LOT-QV-202611-QVTRUNGNON	10	223	2	2026-11-01	\N	50.000	50.000	125000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
216	LOT-QV-202611-QVTUOC	13	224	2	2026-11-01	\N	50.000	50.000	165000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
217	LOT-QV-202611-QVTUONGOT	20	225	2	2026-11-01	\N	50.000	50.000	25000.00	CHAI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
218	LOT-QV-202611-QVVAT	17	226	2	2026-11-01	\N	50.000	50.000	92000.00	LẦN	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
219	LOT-QV-202611-QVVCHS	27	227	2	2026-11-01	\N	50.000	50.000	80000.00	LẦN	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
220	LOT-QV-202611-QVVCK	28	228	2	2026-11-01	\N	50.000	50.000	100000.00	LẦN	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
221	LOT-QV-202611-QVVEMXANH	21	229	2	2026-11-01	\N	50.000	50.000	48000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
222	LOT-QV-202611-QVVIT	29	230	2	2026-11-01	\N	50.000	50.000	75000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
223	LOT-QV-202611-QVXALACH	16	231	2	2026-11-01	\N	50.000	50.000	25000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
224	LOT-QV-202611-QVXIDAU	20	232	2	2026-11-01	\N	50.000	50.000	33333.00	CHAI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
225	LOT-QV-202611-QVXOAIX	16	233	2	2026-11-01	\N	50.000	50.000	20000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
226	LOT-QV-202611-QVXUCXICH	10	234	2	2026-11-01	\N	50.000	50.000	60000.00	GÓI	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
227	LOT-QV-202611-QVXXB	10	235	2	2026-11-01	\N	50.000	50.000	66000.00	KG	CON_HANG	2026-11-23 21:10:15.837839+07	2026-11-23 21:10:15.837839+07
\.


--
-- Data for Name: inventory_check_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_check_items (id, check_id, item_id, batch_id, system_stock, actual_stock, difference, reason) FROM stdin;
\.


--
-- Data for Name: inventory_checks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_checks (id, check_code, branch_id, shift, check_date, checked_by_user_id, status, note, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: inventory_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_snapshots (id, branch_id, item_id, snapshot_date, shift_type, opening_stock, in_stock, closing_stock, unit, checked_by_user_id, note, created_at, updated_at) FROM stdin;
1	1	1	2026-11-23	CA_NGAY	20.000	30.000	12.000	KG	1	Kiểm kho cuối ca bởi Nguyễn Văn Bếp	2026-11-23 20:50:06.195001+07	2026-11-23 20:50:06.195001+07
2	1	2	2026-11-23	CA_NGAY	15.000	25.000	10.000	KG	1	Kiểm kho ghẹ cuối ca	2026-11-23 20:50:06.195001+07	2026-11-23 20:50:06.195001+07
3	1	3	2026-11-23	CA_NGAY	50.000	80.000	20.000	KHAY	1	Kiểm kho ba chỉ bò	2026-11-23 20:50:06.195001+07	2026-11-23 20:50:06.195001+07
4	1	4	2026-11-23	CA_NGAY	10.000	15.000	8.000	KG	1	Kiểm kho kim chi	2026-11-23 20:50:06.195001+07	2026-11-23 20:50:06.195001+07
\.


--
-- Data for Name: inventory_stocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_stocks (id, branch_id, item_id, batch_id, quantity, last_updated_at) FROM stdin;
1	1	1	1	85.000	2026-11-23 20:50:06.442739+07
2	1	2	2	65.000	2026-11-23 20:50:06.442739+07
5	1	11	5	90.000	2026-11-23 20:50:06.442739+07
6	1	12	6	110.000	2026-11-23 20:50:06.442739+07
7	2	13	7	75.000	2026-11-23 20:50:06.442739+07
8	2	1	8	50.000	2026-11-23 20:50:06.442739+07
9	2	7	9	40.000	2026-11-23 20:50:06.442739+07
10	2	18	10	160.000	2026-11-23 20:50:06.442739+07
11	2	19	11	50.000	2026-11-23 21:10:15.854586+07
12	2	20	12	50.000	2026-11-23 21:10:15.854586+07
13	2	21	13	50.000	2026-11-23 21:10:15.854586+07
14	2	22	14	50.000	2026-11-23 21:10:15.854586+07
15	2	23	15	50.000	2026-11-23 21:10:15.854586+07
16	2	24	16	50.000	2026-11-23 21:10:15.854586+07
17	2	25	17	50.000	2026-11-23 21:10:15.854586+07
18	2	26	18	50.000	2026-11-23 21:10:15.854586+07
19	2	27	19	50.000	2026-11-23 21:10:15.854586+07
20	2	28	20	50.000	2026-11-23 21:10:15.854586+07
21	2	29	21	50.000	2026-11-23 21:10:15.854586+07
22	2	30	22	50.000	2026-11-23 21:10:15.854586+07
23	2	31	23	50.000	2026-11-23 21:10:15.854586+07
24	2	32	24	50.000	2026-11-23 21:10:15.854586+07
25	2	33	25	50.000	2026-11-23 21:10:15.854586+07
26	2	34	26	50.000	2026-11-23 21:10:15.854586+07
27	2	35	27	50.000	2026-11-23 21:10:15.854586+07
28	2	36	28	50.000	2026-11-23 21:10:15.854586+07
29	2	37	29	50.000	2026-11-23 21:10:15.854586+07
30	2	38	30	50.000	2026-11-23 21:10:15.854586+07
31	2	39	31	50.000	2026-11-23 21:10:15.854586+07
32	2	40	32	50.000	2026-11-23 21:10:15.854586+07
33	2	41	33	50.000	2026-11-23 21:10:15.854586+07
34	2	42	34	50.000	2026-11-23 21:10:15.854586+07
35	2	43	35	50.000	2026-11-23 21:10:15.854586+07
36	2	44	36	50.000	2026-11-23 21:10:15.854586+07
37	2	45	37	50.000	2026-11-23 21:10:15.854586+07
38	2	46	38	50.000	2026-11-23 21:10:15.854586+07
39	2	47	39	50.000	2026-11-23 21:10:15.854586+07
40	2	48	40	50.000	2026-11-23 21:10:15.854586+07
41	2	49	41	50.000	2026-11-23 21:10:15.854586+07
42	2	50	42	50.000	2026-11-23 21:10:15.854586+07
43	2	51	43	50.000	2026-11-23 21:10:15.854586+07
44	2	52	44	50.000	2026-11-23 21:10:15.854586+07
45	2	53	45	50.000	2026-11-23 21:10:15.854586+07
46	2	54	46	50.000	2026-11-23 21:10:15.854586+07
47	2	55	47	50.000	2026-11-23 21:10:15.854586+07
48	2	56	48	50.000	2026-11-23 21:10:15.854586+07
49	2	57	49	50.000	2026-11-23 21:10:15.854586+07
50	2	58	50	50.000	2026-11-23 21:10:15.854586+07
51	2	59	51	50.000	2026-11-23 21:10:15.854586+07
52	2	60	52	50.000	2026-11-23 21:10:15.854586+07
53	2	61	53	50.000	2026-11-23 21:10:15.854586+07
54	2	62	54	50.000	2026-11-23 21:10:15.854586+07
55	2	63	55	50.000	2026-11-23 21:10:15.854586+07
56	2	64	56	50.000	2026-11-23 21:10:15.854586+07
57	2	65	57	50.000	2026-11-23 21:10:15.854586+07
58	2	66	58	50.000	2026-11-23 21:10:15.854586+07
59	2	67	59	50.000	2026-11-23 21:10:15.854586+07
60	2	68	60	50.000	2026-11-23 21:10:15.854586+07
61	2	69	61	50.000	2026-11-23 21:10:15.854586+07
62	2	70	62	50.000	2026-11-23 21:10:15.854586+07
63	2	71	63	50.000	2026-11-23 21:10:15.854586+07
64	2	72	64	50.000	2026-11-23 21:10:15.854586+07
65	2	73	65	50.000	2026-11-23 21:10:15.854586+07
66	2	74	66	50.000	2026-11-23 21:10:15.854586+07
67	2	75	67	50.000	2026-11-23 21:10:15.854586+07
68	2	76	68	50.000	2026-11-23 21:10:15.854586+07
69	2	77	69	50.000	2026-11-23 21:10:15.854586+07
70	2	78	70	50.000	2026-11-23 21:10:15.854586+07
71	2	79	71	50.000	2026-11-23 21:10:15.854586+07
72	2	80	72	50.000	2026-11-23 21:10:15.854586+07
73	2	81	73	50.000	2026-11-23 21:10:15.854586+07
74	2	82	74	50.000	2026-11-23 21:10:15.854586+07
75	2	83	75	50.000	2026-11-23 21:10:15.854586+07
76	2	84	76	50.000	2026-11-23 21:10:15.854586+07
77	2	85	77	50.000	2026-11-23 21:10:15.854586+07
78	2	86	78	50.000	2026-11-23 21:10:15.854586+07
79	2	87	79	50.000	2026-11-23 21:10:15.854586+07
80	2	88	80	50.000	2026-11-23 21:10:15.854586+07
81	2	89	81	50.000	2026-11-23 21:10:15.854586+07
82	2	90	82	50.000	2026-11-23 21:10:15.854586+07
83	2	91	83	50.000	2026-11-23 21:10:15.854586+07
84	2	92	84	50.000	2026-11-23 21:10:15.854586+07
85	2	93	85	50.000	2026-11-23 21:10:15.854586+07
86	2	94	86	50.000	2026-11-23 21:10:15.854586+07
87	2	95	87	50.000	2026-11-23 21:10:15.854586+07
88	2	96	88	50.000	2026-11-23 21:10:15.854586+07
89	2	97	89	50.000	2026-11-23 21:10:15.854586+07
90	2	98	90	50.000	2026-11-23 21:10:15.854586+07
91	2	99	91	50.000	2026-11-23 21:10:15.854586+07
92	2	100	92	50.000	2026-11-23 21:10:15.854586+07
93	2	101	93	50.000	2026-11-23 21:10:15.854586+07
94	2	102	94	50.000	2026-11-23 21:10:15.854586+07
95	2	103	95	50.000	2026-11-23 21:10:15.854586+07
96	2	104	96	50.000	2026-11-23 21:10:15.854586+07
97	2	105	97	50.000	2026-11-23 21:10:15.854586+07
98	2	106	98	50.000	2026-11-23 21:10:15.854586+07
99	2	107	99	50.000	2026-11-23 21:10:15.854586+07
100	2	108	100	50.000	2026-11-23 21:10:15.854586+07
101	2	109	101	50.000	2026-11-23 21:10:15.854586+07
102	2	110	102	50.000	2026-11-23 21:10:15.854586+07
103	2	111	103	50.000	2026-11-23 21:10:15.854586+07
104	2	112	104	50.000	2026-11-23 21:10:15.854586+07
105	2	113	105	50.000	2026-11-23 21:10:15.854586+07
106	2	114	106	50.000	2026-11-23 21:10:15.854586+07
107	2	115	107	50.000	2026-11-23 21:10:15.854586+07
108	2	116	108	50.000	2026-11-23 21:10:15.854586+07
109	2	117	109	50.000	2026-11-23 21:10:15.854586+07
110	2	118	110	50.000	2026-11-23 21:10:15.854586+07
111	2	119	111	50.000	2026-11-23 21:10:15.854586+07
112	2	120	112	50.000	2026-11-23 21:10:15.854586+07
113	2	121	113	50.000	2026-11-23 21:10:15.854586+07
114	2	122	114	50.000	2026-11-23 21:10:15.854586+07
115	2	123	115	50.000	2026-11-23 21:10:15.854586+07
116	2	124	116	50.000	2026-11-23 21:10:15.854586+07
117	2	125	117	50.000	2026-11-23 21:10:15.854586+07
118	2	126	118	50.000	2026-11-23 21:10:15.854586+07
119	2	127	119	50.000	2026-11-23 21:10:15.854586+07
120	2	128	120	50.000	2026-11-23 21:10:15.854586+07
121	2	129	121	50.000	2026-11-23 21:10:15.854586+07
122	2	130	122	50.000	2026-11-23 21:10:15.854586+07
123	2	131	123	50.000	2026-11-23 21:10:15.854586+07
124	2	132	124	50.000	2026-11-23 21:10:15.854586+07
125	2	133	125	50.000	2026-11-23 21:10:15.854586+07
126	2	134	126	50.000	2026-11-23 21:10:15.854586+07
127	2	135	127	50.000	2026-11-23 21:10:15.854586+07
128	2	136	128	50.000	2026-11-23 21:10:15.854586+07
129	2	137	129	50.000	2026-11-23 21:10:15.854586+07
130	2	138	130	50.000	2026-11-23 21:10:15.854586+07
131	2	139	131	50.000	2026-11-23 21:10:15.854586+07
132	2	140	132	50.000	2026-11-23 21:10:15.854586+07
133	2	141	133	50.000	2026-11-23 21:10:15.854586+07
134	2	142	134	50.000	2026-11-23 21:10:15.854586+07
135	2	143	135	50.000	2026-11-23 21:10:15.854586+07
136	2	144	136	50.000	2026-11-23 21:10:15.854586+07
137	2	145	137	50.000	2026-11-23 21:10:15.854586+07
138	2	146	138	50.000	2026-11-23 21:10:15.854586+07
139	2	147	139	50.000	2026-11-23 21:10:15.854586+07
140	2	148	140	50.000	2026-11-23 21:10:15.854586+07
141	2	149	141	50.000	2026-11-23 21:10:15.854586+07
142	2	150	142	50.000	2026-11-23 21:10:15.854586+07
143	2	151	143	50.000	2026-11-23 21:10:15.854586+07
144	2	152	144	50.000	2026-11-23 21:10:15.854586+07
145	2	153	145	50.000	2026-11-23 21:10:15.854586+07
146	2	154	146	50.000	2026-11-23 21:10:15.854586+07
147	2	155	147	50.000	2026-11-23 21:10:15.854586+07
148	2	156	148	50.000	2026-11-23 21:10:15.854586+07
149	2	157	149	50.000	2026-11-23 21:10:15.854586+07
150	2	158	150	50.000	2026-11-23 21:10:15.854586+07
151	2	159	151	50.000	2026-11-23 21:10:15.854586+07
152	2	160	152	50.000	2026-11-23 21:10:15.854586+07
153	2	161	153	50.000	2026-11-23 21:10:15.854586+07
154	2	162	154	50.000	2026-11-23 21:10:15.854586+07
155	2	163	155	50.000	2026-11-23 21:10:15.854586+07
156	2	164	156	50.000	2026-11-23 21:10:15.854586+07
157	2	165	157	50.000	2026-11-23 21:10:15.854586+07
158	2	166	158	50.000	2026-11-23 21:10:15.854586+07
159	2	167	159	50.000	2026-11-23 21:10:15.854586+07
160	2	168	160	50.000	2026-11-23 21:10:15.854586+07
161	2	169	161	50.000	2026-11-23 21:10:15.854586+07
162	2	170	162	50.000	2026-11-23 21:10:15.854586+07
163	2	171	163	50.000	2026-11-23 21:10:15.854586+07
164	2	172	164	50.000	2026-11-23 21:10:15.854586+07
165	2	173	165	50.000	2026-11-23 21:10:15.854586+07
166	2	174	166	50.000	2026-11-23 21:10:15.854586+07
167	2	175	167	50.000	2026-11-23 21:10:15.854586+07
168	2	176	168	50.000	2026-11-23 21:10:15.854586+07
169	2	177	169	50.000	2026-11-23 21:10:15.854586+07
170	2	178	170	50.000	2026-11-23 21:10:15.854586+07
171	2	179	171	50.000	2026-11-23 21:10:15.854586+07
172	2	180	172	50.000	2026-11-23 21:10:15.854586+07
173	2	181	173	50.000	2026-11-23 21:10:15.854586+07
174	2	182	174	50.000	2026-11-23 21:10:15.854586+07
175	2	183	175	50.000	2026-11-23 21:10:15.854586+07
176	2	184	176	50.000	2026-11-23 21:10:15.854586+07
177	2	185	177	50.000	2026-11-23 21:10:15.854586+07
178	2	186	178	50.000	2026-11-23 21:10:15.854586+07
179	2	187	179	50.000	2026-11-23 21:10:15.854586+07
180	2	188	180	50.000	2026-11-23 21:10:15.854586+07
181	2	189	181	50.000	2026-11-23 21:10:15.854586+07
182	2	190	182	50.000	2026-11-23 21:10:15.854586+07
183	2	191	183	50.000	2026-11-23 21:10:15.854586+07
184	2	192	184	50.000	2026-11-23 21:10:15.854586+07
185	2	193	185	50.000	2026-11-23 21:10:15.854586+07
186	2	194	186	50.000	2026-11-23 21:10:15.854586+07
187	2	195	187	50.000	2026-11-23 21:10:15.854586+07
188	2	196	188	50.000	2026-11-23 21:10:15.854586+07
189	2	197	189	50.000	2026-11-23 21:10:15.854586+07
190	2	198	190	50.000	2026-11-23 21:10:15.854586+07
191	2	199	191	50.000	2026-11-23 21:10:15.854586+07
192	2	200	192	50.000	2026-11-23 21:10:15.854586+07
193	2	201	193	50.000	2026-11-23 21:10:15.854586+07
194	2	202	194	50.000	2026-11-23 21:10:15.854586+07
195	2	203	195	50.000	2026-11-23 21:10:15.854586+07
196	2	204	196	50.000	2026-11-23 21:10:15.854586+07
197	2	205	197	50.000	2026-11-23 21:10:15.854586+07
198	2	206	198	50.000	2026-11-23 21:10:15.854586+07
199	2	207	199	50.000	2026-11-23 21:10:15.854586+07
200	2	208	200	50.000	2026-11-23 21:10:15.854586+07
201	2	209	201	50.000	2026-11-23 21:10:15.854586+07
202	2	210	202	50.000	2026-11-23 21:10:15.854586+07
203	2	211	203	50.000	2026-11-23 21:10:15.854586+07
204	2	212	204	50.000	2026-11-23 21:10:15.854586+07
205	2	213	205	50.000	2026-11-23 21:10:15.854586+07
206	2	214	206	50.000	2026-11-23 21:10:15.854586+07
207	2	215	207	50.000	2026-11-23 21:10:15.854586+07
208	2	216	208	50.000	2026-11-23 21:10:15.854586+07
209	2	217	209	50.000	2026-11-23 21:10:15.854586+07
210	2	218	210	50.000	2026-11-23 21:10:15.854586+07
211	2	219	211	50.000	2026-11-23 21:10:15.854586+07
212	2	220	212	50.000	2026-11-23 21:10:15.854586+07
213	2	221	213	50.000	2026-11-23 21:10:15.854586+07
214	2	222	214	50.000	2026-11-23 21:10:15.854586+07
215	2	223	215	50.000	2026-11-23 21:10:15.854586+07
216	2	224	216	50.000	2026-11-23 21:10:15.854586+07
217	2	225	217	50.000	2026-11-23 21:10:15.854586+07
218	2	226	218	50.000	2026-11-23 21:10:15.854586+07
219	2	227	219	50.000	2026-11-23 21:10:15.854586+07
220	2	228	220	50.000	2026-11-23 21:10:15.854586+07
221	2	229	221	50.000	2026-11-23 21:10:15.854586+07
222	2	230	222	50.000	2026-11-23 21:10:15.854586+07
223	2	231	223	50.000	2026-11-23 21:10:15.854586+07
224	2	232	224	50.000	2026-11-23 21:10:15.854586+07
225	2	233	225	50.000	2026-11-23 21:10:15.854586+07
226	2	234	226	50.000	2026-11-23 21:10:15.854586+07
227	2	235	227	50.000	2026-11-23 21:10:15.854586+07
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.items (id, item_code, barcode, item_name, category, unit, cost_price, is_buffet_line, created_at, updated_at, is_daily_only) FROM stdin;
3	BO_CUON_NAM	893000000003	Ba Chỉ Bò Cuộn Nấm Kim Châm	THIT	KHAY	85000.00	t	2026-11-23 20:50:06.144228+07	2026-11-23 20:50:06.144228+07	f
5	HAI_SAN_NUONG	893000000005	Hải Sản Tổng Hợp Sốt Cay	HAI_SAN	KG	220000.00	t	2026-11-23 20:50:06.144228+07	2026-11-23 20:50:06.144228+07	f
6	BIA_HA_NOI	893000000006	Bia Hà Nội Lon 330ml	DO_UONG	LON	15000.00	f	2026-11-23 20:50:06.144228+07	2026-11-23 20:50:06.144228+07	f
1	CUA_CA_MAU	893000000001	Cua Cà Mau (Tươi sống)	HAI_SAN	KG	350000.00	t	2026-11-23 20:50:06.144228+07	2026-11-23 20:50:06.144228+07	f
2	GHE_PHU_QUOC	893000000002	Ghẹ Phú Quốc (Loại 1)	HAI_SAN	KG	280000.00	t	2026-11-23 20:50:06.144228+07	2026-11-23 20:50:06.144228+07	f
11	TOM_CANG_XANH	893000000009	Tôm Càng Xanh Tươi Sống	HAI_SAN	KG	240000.00	t	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	f
12	BA_CHI_BO_MY	893000000010	Ba Chỉ Bò Mỹ Nhập Khẩu	THIT	KG	195000.00	t	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	f
13	MUC_LA_TUOI	893000000011	Mực Lá Tươi Phú Quốc	HAI_SAN	KG	180000.00	t	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	f
8	BANH_BAO_THIT	893000000008	Bánh Bao Nhân Thịt Hấp	KHAI_VI	CAI	12000.00	t	2026-11-23 20:50:06.379276+07	2026-11-23 20:50:06.379276+07	t
7	SALAD_NGA	893000000007	Salad Nga Tươi Sốt Mayonnaise	RAU_CU	KG	55000.00	t	2026-11-23 20:50:06.379276+07	2026-11-23 20:50:06.379276+07	t
4	KIM_CHI	893000000004	Kim Chi Cải Thảo Hàn Quốc	RAU_CU	KG	45000.00	t	2026-11-23 20:50:06.144228+07	2026-11-23 20:50:06.144228+07	t
17	NOM_HOA_CHUOI	893000000012	Nộm Hoa Chuối Tai Heo	RAU_CU	KG	65000.00	t	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	t
18	NUOC_LAU_THAI	893000000013	Nước Cốt Lẩu Thái Tomyum	LAU_NUONG	LIT	50000.00	t	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	f
19	QVBANHMY	BAR-QVBANHMY	Bánh mỳ dài	RAU	CÁI	12000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
20	QVBANHXEO	BAR-QVBANHXEO	Bột bánh xèo 400g	HANG_KHO	GÓI	40000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
21	QVBAP	BAR-QVBAP	Bắp Bò	THIT	KG	187000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
22	QVBAPNGO	BAR-QVBAPNGO	Bắp Ngô	RAU	BẮP	10000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
23	QVBBC	BAR-QVBBC	Bột bánh cuốn 1T= 24 goi	HANG_KHO	GÓI	20000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
24	QVBBKS	BAR-QVBBKS	Bánh Bao Kim Sa	HANG_KHO	CÁI	4200.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
25	QVBCBT	BAR-QVBCBT	Ba Chỉ Bò Thanh	THIT	KG	198000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
26	QVBCHH	BAR-QVBCHH	Muối Hảo Hảo 500g	HANG_KHO	GÓI	22000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
27	QVBCL	BAR-QVBCL	Ba Chỉ Lợn	THIT	KG	135000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
28	QVBCLNV	BAR-QVBCLNV	Ba Chỉ Lợn	DO_AN_NHAN_VIEN	KG	135000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
29	QVBCT	BAR-QVBCT	Bắp Cải Tím	RAU	KG	15000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
30	QVBCTR	BAR-QVBCTR	Bắp Cải Trắng	RAU	KG	15000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
31	QVBCX	BAR-QVBCX	Bột Chiên Xù 1kg	HANG_KHO	GÓI	55000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
32	QVBDS	BAR-QVBDS	Bao Đũa Sạch	TIEU_HAO	CÁI	170.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
33	QVBEBE	BAR-QVBEBE	Bề Bề	HS_CHINH	KG	210000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
34	QVBICHUOI	BAR-QVBICHUOI	Bi Chuối	RAU	CÁI	15000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
35	QVBM	BAR-QVBM	Bột Mỳ 1kg	HANG_KHO	GÓI	21000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
36	QVBOTCANH	BAR-QVBOTCANH	Bột Canh Hải Châu 190g	HANG_KHO	GÓI	20000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
37	QVBOTNANG	BAR-QVBOTNANG	Bột Năng 1kg	HANG_KHO	GÓI	24000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
38	QVBOTNEP	BAR-QVBOTNEP	Bột Nếp 400g	HANG_KHO	GÓI	40000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
39	QVBOTOTHAN	BAR-QVBOTOTHAN	Bột Ớt Hàn Quốc 1kg	HANG_KHO	GÓI	140000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
40	QVBOTTE	BAR-QVBOTTE	Bột GẠO TẺ 400g	HANG_KHO	GÓI	20000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
41	QVBR	BAR-QVBR	Bỗng Rượu	HANG_KHO	LÍT	10000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
42	QVBRM	BAR-QVBRM	Bột Rang Muối	HANG_KHO	KG	190000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
43	QVBUN	BAR-QVBUN	Bún	RAU	KG	15000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
44	QVBUOINGOT	BAR-QVBUOINGOT	Bưởi Ngọt	RAU	QUẢ	15000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
45	QVCACHUA	BAR-QVCACHUA	Cà Chua	RAU	KG	25000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
46	QVCACHUABI	BAR-QVCACHUABI	Cà Chua Bi	RAU	KG	50000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
47	QVCAHOI	BAR-QVCAHOI	Cá Hồi	HS_CHINH	KG	320000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
48	QVCAICANH	BAR-QVCAICANH	Cải Canh	RAU	MỚ	8000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
49	QVCAICUC	BAR-QVCAICUC	Cải Cúc	RAU	MỚ	10000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
50	QVCAINGONG	BAR-QVCAINGONG	Cải Ngồng	RAU	KG	10000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
51	QVCAITHAO	BAR-QVCAITHAO	Cải Thảo	RAU	KG	9000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
52	QVCALANG	BAR-QVCALANG	Cá Lăng	HS_PHU	KG	110000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
53	QVCAM	BAR-QVCAM	Cam Ngọt	RAU	KG	20000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
54	QVCANTT	BAR-QVCANTT	Cần Tỏi Tây	RAU	KG	30000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
55	QVCAPHAO	BAR-QVCAPHAO	Cà Pháo	RAU	KG	20000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
56	QVCATRICH	BAR-QVCATRICH	Cá Trích	HS_CHINH	KG	310000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
57	QVCBS	BAR-QVCBS	Chả Bọc Sả	THIT	KG	100000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
58	QVCGCX	BAR-QVCGCX	Chân Gà Có Xương	THIT	KG	62000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
59	QVCGG	BAR-QVCGG	Cánh Gà Giữa	THIT	KG	86000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
60	QVCGRX	BAR-QVCGRX	Chân gà rút xương	THIT	KG	97000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
61	QVCHA	BAR-QVCHA	Chả Thịt Lợn	THIT	KG	90000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
62	QVCHANGIO	BAR-QVCHANGIO	Chân Giò	DO_AN_NHAN_VIEN	KG	80000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
63	QVCHANH	BAR-QVCHANH	Chanh Quả	RAU	KG	35000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
64	QVCHANSU	BAR-QVCHANSU	Chân Sú	DO_AN_NHAN_VIEN	KG	100000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
65	QVCHANSUA	BAR-QVCHANSUA	Chân  Sứa	HS_PHU	KG	120000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
66	QVCOC	BAR-QVCOC	Cóc	RAU	KG	30000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
67	QVCONKHO	BAR-QVCONKHO	Cồn Khô	TIEU_HAO	BỊCH	28000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
68	QVCR	BAR-QVCR	Cà Rốt	RAU	KG	15000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
69	QVCRP	BAR-QVCRP	Cá Rô Phi	DO_AN_NHAN_VIEN	KG	55000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
70	QVCTD	BAR-QVCTD	Chân Trâu Đen 1kg	HANG_KHO	KG	26666.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
71	QVCUA	BAR-QVCUA	Cua Thịt	HS_CHINH	KG	210000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
72	QVCUCAI	BAR-QVCUCAI	Củ Cải	RAU	KG	13000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
73	QVCUDAU	BAR-QVCUDAU	Củ Đậu	RAU	KG	10000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
74	QVCX	BAR-QVCX	Cua Xay	HS_PHU	KG	85000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
75	QVDAM	BAR-QVDAM	Dấm trắng 2 Lít 6 can	HANG_KHO	CAN	43333.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
76	QVDAMHONG	BAR-QVDAMHONG	Dấm Hồng 620ml	HANG_KHO	CHAI	30000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
77	QVDAPCA	BAR-QVDAPCA	Dấp Cá	RAU	KG	25000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
78	QVDAUAN	BAR-QVDAUAN	Dầu Ăn 18.2 Lít/ 1 thùng	HANG_KHO	THÙNG	700000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
79	QVDAUBAP	BAR-QVDAUBAP	Đậu Bắp	RAU	KG	40000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
80	QVDAUCHUOI	BAR-QVDAUCHUOI	Dầu Chuối	HANG_KHO	CHAI	50000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
81	QVDAUCOVE	BAR-QVDAUCOVE	Đậu kove	RAU	KG	20000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
82	QVDAUDEN	BAR-QVDAUDEN	Đậu Đen	HANG_KHO	KG	66000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
83	QVDAUHAO	BAR-QVDAUHAO	Dầu Hào 700g	HANG_KHO	CHAI	25000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
84	QVDAUME	BAR-QVDAUME	Dầu Mè 250ml	HANG_KHO	CHAI	50000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
85	QVDAUPHU	BAR-QVDAUPHU	Đậu Phụ	RAU	BÌA	3500.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
86	QVDAUXANH	BAR-QVDAUXANH	Đậu Xanh	HANG_KHO	KG	52000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
87	QVDTN	BAR-QVDTN	Đường Thốt Nốt	HANG_KHO	KG	40000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
88	QVDUA	BAR-QVDUA	Dứa	RAU	QUẢ	20000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
89	QVDUACHUA	BAR-QVDUACHUA	Dưa Chua	RAU	KG	20000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
90	QVDUACHUOT	BAR-QVDUACHUOT	Dưa Chuột	RAU	KG	20000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
91	QVDUAHAU	BAR-QVDUAHAU	Dưa Hấu	RAU	KG	17000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
92	QVDUAKHO	BAR-QVDUAKHO	Dừa Khô 275g	HANG_KHO	GÓI	24000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
93	QVDUALUOI	BAR-QVDUALUOI	Dưa Lưới	RAU	KG	40000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
94	QVDUDU	BAR-QVDUDU	Đu Đủ Xanh	RAU	KG	15000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
95	QVDUONG	BAR-QVDUONG	Đường 0.9g 1bao= 30 gói	HANG_KHO	KG	20666.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
96	QVDV	BAR-QVDV	Đá Viên	TIEU_HAO	TÚI	8000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
97	QVDX	BAR-QVDX	Đá Xay	TIEU_HAO	TÚI	8000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
98	QVGA	BAR-QVGA	Gà	DO_AN_NHAN_VIEN	KG	85000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
99	QVGANLON	BAR-QVGANLON	Gan Lợn	DO_AN_NHAN_VIEN	KG	40000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
100	QVGAONHAT	BAR-QVGAONHAT	Gạo Nhật 1 bao = 25kg	HANG_KHO	KG	20800.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
101	QVGASN	BAR-QVGASN	Bình Ga Nhỏ (12kg)	TIEU_HAO	KG	37038.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
102	QVGAST	BAR-QVGAST	Bình Ga To (47kg)	TIEU_HAO	KG	37000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
103	QVGE	BAR-QVGE	Genlatine	HANG_KHO	TÚI	340000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
104	QVGHE	BAR-QVGHE	Ghẹ	HS_CHINH	KG	210000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
105	QVGIA	BAR-QVGIA	Giá Đỗ	RAU	KG	15000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
106	QVGIAYRUT	BAR-QVGIAYRUT	Giấy Rút	TIEU_HAO	BỊCH	285000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
107	QVGIENGC	BAR-QVGIENGC	Giềng Củ	RAU	KG	20000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
108	QVGIO	BAR-QVGIO	Giò	THIT	KG	110000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
109	QVGNV	BAR-QVGNV	Gạo Nhân Viên	DO_AN_NHAN_VIEN	KG	17000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
110	QVGT	BAR-QVGT	Gừng Tàu	RAU	KG	48000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
111	QVGTTB	BAR-QVGTTB	Gang Tay Túi Bóng	TIEU_HAO	KG	70000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
112	QVGUNG	BAR-QVGUNG	Gừng Ta	RAU	KG	25000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
113	QVHANH	BAR-QVHANH	Hành Hoa	RAU	KG	35000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
114	QVHANHKHO	BAR-QVHANHKHO	Hành khô phi 1 kg	HANG_KHO	KG	90000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
115	QVHANHTA	BAR-QVHANHTA	Hành Khô Tươi	RAU	KG	25000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
116	QVHANHTAY	BAR-QVHANHTAY	Hành Tây	RAU	KG	15000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
117	QVHATE	BAR-QVHATE	Hạt É	HANG_KHO	KG	120000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
118	QVHATSEN	BAR-QVHATSEN	Hạt Sen	RAU	KG	180000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
119	QVHAU	BAR-QVHAU	Hàu	VC_VO_CUNG	KG	17000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
120	QVHN	BAR-QVHN	Hạt Nêm 5kg	HANG_KHO	TÚI	30000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
121	QVHOA	BAR-QVHOA	Hoa Lan	TIEU_HAO	BÓ	90000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
122	QVKEMCHLD	BAR-QVKEMCHLD	Kem Chua Hy Lạp Dâu 4l	TIEU_HAO	HỘP	285000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
123	QVKEMCHLT	BAR-QVKEMCHLT	Kem Chua Hy Lạp Trắng 4l	TIEU_HAO	HỘP	240000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
124	QVKEMCOOKIE OROE	BAR-QVKEMCOOKIE OROE	Kem Cookie Oreo 4l	TIEU_HAO	HỘP	275000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
125	QVKEMDAUTAY	BAR-QVKEMDAUTAY	Kem Dâu Tây 4l	TIEU_HAO	HỘP	230000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
126	QVKEMDUANON	BAR-QVKEMDUANON	Kem Dừa Non 4l	TIEU_HAO	HỘP	285000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
127	QVKEMHTTC	BAR-QVKEMHTTC	Kem Hồng Trân Châu 4l	TIEU_HAO	HỘP	275000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
128	QVKEMIETQUAT	BAR-QVKEMIETQUAT	Kem Việt Quất 4l	TIEU_HAO	HỘP	230000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
129	QVKEMVANI	BAR-QVKEMVANI	Kem Vani 4l	TIEU_HAO	HỘP	180000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
130	QVKHANUOT	BAR-QVKHANUOT	Khăn Ướt	BAR	CÁI	550.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
131	QVKHOAITAY	BAR-QVKHOAITAY	Khoai Tây	RAU	KG	15000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
132	QVKINHGIOI	BAR-QVKINHGIOI	Kinh Giới	RAU	KG	50000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
133	QVKLK	BAR-QVKLK	Khoai Lang Kén	RAU	GÓI	12000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
134	QVKTS	BAR-QVKTS	Khoai tây sợi 10*10	THIT	KG	55000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
135	QVLAC	BAR-QVLAC	Lạc rang nhân viên	DO_AN_NHAN_VIEN	KG	65000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
136	QVLACHANH	BAR-QVLACHANH	Lá Chanh	RAU	KG	150000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
137	QVLACRANG	BAR-QVLACRANG	Lạc Rang	HANG_KHO	KG	60000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
138	QVLAHE	BAR-QVLAHE	Lá Hẹ	RAU	KG	50000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
139	QVLE	BAR-QVLE	Lê	RAU	KG	35000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
140	QVLN	BAR-QVLN	Lườn Ngỗng	THIT	KG	150000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
141	QVLONGGA	BAR-QVLONGGA	Lòng Gà	DO_AN_NHAN_VIEN	KG	5833.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
142	QVLONGLON	BAR-QVLONGLON	Lòng Lợn	THIT	KG	80000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
143	QVLT	BAR-QVLT	Lơ Trắng	RAU	KG	35000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
144	QVLV	BAR-QVLV	Giấy A4	TIEU_HAO	LẦN	225000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
145	QVLX	BAR-QVLX	Lơ Xanh	RAU	KG	35000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
146	QVMAJOLE	BAR-QVMAJOLE	Sốt Mayo Majole 3kg (1 thùng 4 hộp)	HANG_KHO	CAN	230000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
147	QVMAM5L	BAR-QVMAM5L	Mắm 5l	HANG_KHO	CAN	70000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
148	QVMATONG	BAR-QVMATONG	Mật Ong 800g	HANG_KHO	CHAI	33333.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
149	QVMC	BAR-QVMC	Măng Chua	DO_AN_NHAN_VIEN	KG	30000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
150	QVMD	BAR-QVMD	Mướp Đắng	DO_AN_NHAN_VIEN	KG	30000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
151	QVMEKHO	BAR-QVMEKHO	Me Khô	HANG_KHO	KG	30000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
152	QVMOCNHI	BAR-QVMOCNHI	Mộc Nhĩ	HANG_KHO	KG	130000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
153	QVMTP	BAR-QVMTP	Màng Thực Phẩm 45cm	TIEU_HAO	HỘP	200000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
154	QVMUC	BAR-QVMUC	Mực	HS_CHINH	KG	160000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
155	QVMUITA	BAR-QVMUITA	Rau Mùi Ta	RAU	KG	50000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
156	QVMUITAU	BAR-QVMUITAU	Mùi Tàu	RAU	KG	30000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
157	QVMUITAY	BAR-QVMUITAY	Mùi Tây	RAU	KG	80000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
158	QVMUNGTOI	BAR-QVMUNGTOI	Mùng Tơi	RAU	MỚ	10000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
159	QVMUNI	BAR-QVMUNI	Tôm Mũ Ni	HS_PHU	KG	400000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
160	QVMUOIT	BAR-QVMUOIT	Muối Hạt To 1kg	HANG_KHO	KG	5000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
161	QVMUOITINH	BAR-QVMUOITINH	Muối Tinh 550g	HANG_KHO	GÓI	6666.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
162	QVMUOP	BAR-QVMUOP	Mướp	RAU	KG	35000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
163	QVMUTAT	BAR-QVMUTAT	Mù Tạt Tuýp	HANG_KHO	TUÝP	11000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
164	QVMYCHINH	BAR-QVMYCHINH	Mỳ Chính 5 kg	HANG_KHO	GÓI	56000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
165	QVMYTOM	BAR-QVMYTOM	Mỳ Tôm trần( 1 thùng= 10kg)	HANG_KHO	BỊCH	45000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
166	QVMYY	BAR-QVMYY	Mỳ Ý 500g	HANG_KHO	GÓI	26000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
167	QVNACSAY	BAR-QVNACSAY	Thịt Nạc Xay	THIT	KG	105000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
168	QVNACVAI	BAR-QVNACVAI	Nạc Vai	DO_AN_NHAN_VIEN	KG	105000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
169	QVNAM	BAR-QVNAM	Nấm Kim	RAU	GÓI	6666.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
170	QVNAMHUONG	BAR-QVNAMHUONG	Nấm Hương	HANG_KHO	KG	240000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
171	QVNAMLON	BAR-QVNAMLON	Nầm Lợn	THIT	KG	142000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
172	QVNAMTUYET	BAR-QVNAMTUYET	Nấm Tuyết 500 g	HANG_KHO	GÓI	250000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
173	QVNEPCAM	BAR-QVNEPCAM	Nếp Cẩm	HANG_KHO	KG	36000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
174	QVNGAOHAICUI	BAR-QVNGAOHAICUI	Ngao Hai Cùi	VC_VO_CUNG	KG	60000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
175	QVNGAOMO	BAR-QVNGAOMO	Ngao Mỡ	VC_VO_CUNG	KG	58000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
176	QVNGOKEM	BAR-QVNGOKEM	Ngô Kem 450gr	HANG_KHO	HỘP	12000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
177	QVNRB	BAR-QVNRB	Nước Rửa Bát	TIEU_HAO	CAN	190000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
178	QVNTC	BAR-QVNTC	Nước Tẩy Cồn	TIEU_HAO	CAN	22000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
179	QVNUOCCOTDUA	BAR-QVNUOCCOTDUA	Nước Cốt Dừa 400ml 24 CHAI	HANG_KHO	LON	30000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
180	QVNUOCDASANI	BAR-QVNUOCDASANI	Nước Dasani	BAR	CHAI	3541.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
181	QVOCHUONG	BAR-QVOCHUONG	Ốc Hương	VC_VO_CUNG	KG	135000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
182	QVOCNHOI	BAR-QVOCNHOI	Ốc Nhồi	VC_VO_CUNG	KG	80000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
183	QVOI	BAR-QVOI	ỔI	RAU	KG	20000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
184	QVOTCAY	BAR-QVOTCAY	Ớt Cay	RAU	KG	50000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
185	QVOTSUNGDO	BAR-QVOTSUNGDO	Ớt Sừng Đỏ	RAU	KG	50000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
186	QVOTSUNGXANH	BAR-QVOTSUNGXANH	Ớt Sừng Xanh	RAU	KG	35000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
187	QVPHO	BAR-QVPHO	Phở	RAU	KG	15000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
188	QVPHOMAI	BAR-QVPHOMAI	Phô Mai Sợi	HANG_KHO	KG	180000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
189	QVPT	BAR-QVPT	Phồng Tôm 100g	HANG_KHO	GÓI	10000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
190	QVQUAT	BAR-QVQUAT	Quất	RAU	KG	20000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
191	QVQUAY	BAR-QVQUAY	Quẩy	RAU	KG	100000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
192	QVRAUMUONG	BAR-QVRAUMUONG	Rau Muống	RAU	MỚ	10000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
193	QVRBCC	BAR-QVRBCC	Rong Biển Cuộn Cơm	HANG_KHO	BỊCH	320000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
194	QVRBH	BAR-QVRBH	Rong Biển Hàn Nấu Sup	HANG_KHO	GÓI	90000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
195	QVSA	BAR-QVSA	Sả	RAU	KG	15000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
196	QVSAN	BAR-QVSAN	Sần	VC_VO_CUNG	KG	80000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
197	QVSG	BAR-QVSG	Sốt Gà Thái 1 Lít	HANG_KHO	CHAI	60000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
198	QVSMR	BAR-QVSMR	Sốt Mè Rang 1 Lít	HANG_KHO	CHAI	160000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
199	QVSOLONG	BAR-QVSOLONG	Sò Lông	VC_VO_CUNG	KG	45000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
200	QVST	BAR-QVST	Sa Tế Tôm 55g 1 vì 6 lọ	HANG_KHO	LỌ	7666.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
201	QVSTKD	BAR-QVSTKD	Sữa Tươi Không Đường 1lit( 1 thùng 12 hộp)	HANG_KHO	HỘP	35833.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
202	QVSUACHUA	BAR-QVSUACHUA	Sữa Chua Không Đường	HANG_KHO	VỈ	30000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
203	QVSUADAC	BAR-QVSUADAC	Sữa Đặc 1.284kg 12 HỘP-1 thùng	HANG_KHO	HỘP	55833.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
204	QVSUONT	BAR-QVSUONT	Sườn tảng đông lạnh	THIT	KG	112000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
205	QVTAI	BAR-QVTAI	Tai Lợn	THIT	KG	90000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
206	QVTAM	BAR-QVTAM	Tăm Xiên	HANG_KHO	TÚI	17000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
207	QVTAO	BAR-QVTAO	Táo	RAU	KG	30000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
208	QVTAODO	BAR-QVTAODO	Táo Đỏ	HANG_KHO	KG	70000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
209	QVTBT5	BAR-QVTBT5	Túi Bóng Trắng 5kg	TIEU_HAO	KG	48000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
210	QVTCD	BAR-QVTCD	Trân Châu Nhân Dừa Trắng	HANG_KHO	KG	26666.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
211	QVTCX	BAR-QVTCX	Tôm Càng Xanh	HS_CHINH	KG	185000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
212	QVTHAITOM	BAR-QVTHAITOM	Thái Tôm Yum 454 g	HANG_KHO	LỌ	68000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
213	QVTHANHCUA	BAR-QVTHANHCUA	Thanh Cua	THIT	GÓI	100000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
214	QVTHANHLONG	BAR-QVTHANHLONG	Thanh Long	RAU	KG	30000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
215	QVTHILA	BAR-QVTHILA	Thì Là	RAU	KG	20000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
216	QVTHITXAY	BAR-QVTHITXAY	Thịt Xay	DO_AN_NHAN_VIEN	KG	105000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
217	QVTIATO	BAR-QVTIATO	Tía Tô	RAU	KG	40000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
218	QVTIGER	BAR-QVTIGER	Bia tiger	BAR	LON	17500.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
219	QVTOI	BAR-QVTOI	Tỏi	RAU	KG	35000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
220	QVTOM	BAR-QVTOM	Tôm lớp	HS_CHINH	KG	230000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
221	QVTRUNG	BAR-QVTRUNG	Trứng	RAU	QUẢ	3500.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
222	QVTRUNGCUT	BAR-QVTRUNGCUT	Trứng Chim Cút	DO_AN_NHAN_VIEN	QUẢ	1000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
223	QVTRUNGNON	BAR-QVTRUNGNON	Trứng gà non	THIT	KG	125000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
224	QVTUOC	BAR-QVTUOC	Bạch Tuộc	HS_CHINH	KG	165000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
225	QVTUONGOT	BAR-QVTUONGOT	Tương Ớt Misa 2 Lít 1 thùng= 6can	HANG_KHO	CHAI	25000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
226	QVVAT	BAR-QVVAT	HD VAT	TIEU_HAO	LẦN	92000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
227	QVVCHS	BAR-QVVCHS	Vận Chuyển  Cua, Ghẹ	VC_CUA_GHE	LẦN	80000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
228	QVVCK	BAR-QVVCK	Vận Chuyển Huyền Hải Sản	VC_KHAC	LẦN	100000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
229	QVVEMXANH	BAR-QVVEMXANH	Vẹm xanh	VC_VO_CUNG	KG	48000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
230	QVVIT	BAR-QVVIT	Vịt	DO_AN_NHAN_VIEN	KG	75000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
231	QVXALACH	BAR-QVXALACH	Xà Lách	RAU	KG	25000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
232	QVXIDAU	BAR-QVXIDAU	Xì Dầu Misa 2L 1 thùng= 6can	HANG_KHO	CHAI	33333.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
233	QVXOAIX	BAR-QVXOAIX	Xoài Xanh	RAU	KG	20000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
234	QVXUCXICH	BAR-QVXUCXICH	Xúc Xích	THIT	GÓI	60000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
235	QVXXB	BAR-QVXXB	Xúc Xích Bi	THIT	KG	66000.00	f	2026-11-23 21:10:15.83112+07	2026-11-23 21:10:15.83112+07	f
\.


--
-- Data for Name: line_item_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.line_item_logs (id, branch_id, item_id, quantity, request_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: notification_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_logs (id, branch_id, channel, recipient, title, content, status, created_at) FROM stdin;
1	1	ZALO_WEBHOOK	Nhóm Quản Trị Sen Việt - Thái Nguyên	🚨 CẢNH BÁO THẤT THOÁT NGUYÊN LIỆU VƯỢT NGƯỠNG	Phát hiện thất thoát ngày hôm nay tại Thái Nguyên: Món [Cua Cà Mau] lệch 4.4 kg (1,540,000 đ - 11.58%), Món [Ghẹ Phú Quốc] lệch 1.6 kg (448,000 đ - 5.33%). Nhân viên kiểm kho: Nguyễn Văn Bếp.	SENT	2026-11-23 20:50:06.195001+07
2	1	ZALO_WEBHOOK	Nhóm Ban Giám Đốc & Kế Toán Chuỗi	🚨 CẢNH BÁO THẤT THOÁT VƯỢT ĐỊNH MỨC TẠI THÁI NGUYÊN	Phát hiện thất thoát ngày hôm nay: Món [Cua Cà Mau] thất thoát 6.5 kg tương đương 2,275,000 đ (Tỷ lệ lệch 13.00% > 5%). Người kiểm kho: Nguyễn Văn Bếp.	SENT	2026-11-23 20:50:06.442739+07
3	2	ZALO_WEBHOOK	Nhóm Ban Giám Đốc & Kế Toán Chuỗi	🚨 CẢNH BÁO THẤT THOÁT VƯỢT ĐỊNH MỨC TẠI QUẾ VÕ	Phát hiện thất thoát ngày hôm nay: Món [Cua Cà Mau] thất thoát 4.5 kg tương đương 1,575,000 đ (Tỷ lệ lệch 12.86% > 5%). Người kiểm kho: Lê Văn Bếp.	SENT	2026-11-23 20:50:06.442739+07
\.


--
-- Data for Name: payroll_periods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll_periods (id, period_month, branch_id, status, locked_at, locked_by, unlock_reason, created_at, updated_at) FROM stdin;
1	2026-11	1	OPEN	\N	\N	\N	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
2	2026-11	2	OPEN	\N	\N	\N	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
\.


--
-- Data for Name: payrolls; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payrolls (id, user_id, branch_id, payroll_month, base_salary, standard_work_days, actual_work_days, salary_raise, allowance, gross_salary, advance_deduction, penalty_deduction, net_salary, status, is_abandoned, is_uniform_retained, bank_name, bank_account_number, bank_account_holder, note, created_at, updated_at, excluded_from_cost, hold_reason, locked_at, locked_by) FROM stdin;
1	1	1	2026-11	8500000.00	26.0	26.0	500000.00	500000.00	9500000.00	2000000.00	0.00	7500000.00	CHO_DUYET	f	f	Vietcombank	1012345678	NGUYEN VAN BEP	Đạt điểm thi tay nghề Quý 4 (85 điểm)	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	f	\N	\N	\N
2	2	1	2026-11	12000000.00	26.0	26.0	0.00	1000000.00	13000000.00	0.00	0.00	13000000.00	CHO_DUYET	f	f	Techcombank	19034567890123	TRAN QUAN LY	Hoàn thành tốt chỉ tiêu quản trị kho bếp	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	f	\N	\N	\N
3	3	1	2026-11	9000000.00	26.0	26.0	0.00	500000.00	9500000.00	0.00	0.00	9500000.00	CHO_DUYET	f	f	MB Bank	0912345603	LE KE TOAN	Đối soát CukCuk đầy đủ	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	f	\N	\N	\N
4	8	1	2026-11	6500000.00	26.0	25.0	0.00	300000.00	6550000.00	0.00	125000.00	6425000.00	CHO_DUYET	f	f	MB Bank	0912345608	DANG THI PHUC VU	Trừ phạt 25 phút đi muộn (5.000 đ/phút)	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	f	\N	\N	\N
5	9	1	2026-11	7000000.00	26.0	26.0	0.00	300000.00	7300000.00	0.00	0.00	7300000.00	CHO_DUYET	f	f	VPBank	1567890123	BUI THU NGAN	Khớp đúng doanh thu tiền mặt ca trực	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	f	\N	\N	\N
6	5	2	2026-11	6500000.00	26.0	25.0	0.00	300000.00	6550000.00	2500000.00	0.00	4050000.00	CHO_DUYET	f	f	BIDV	21510001234567	HOANG NHAN VIEN	Khấu trừ ứng lương tháng 11/2026	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	f	\N	\N	\N
7	10	1	2026-11	6500000.00	26.0	24.0	0.00	300000.00	6300000.00	0.00	0.00	6300000.00	DANG_GIU_LUONG	f	t	Agribank	3100205123456	NGUYEN VAN NGHI	Nhân viên nghỉ việc chưa hoàn tất bàn giao đồng phục theo quy định	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	f	Đang giữ — thiếu 1 Tạp dề, 1 Nón	\N	\N
8	11	2	2026-11	6500000.00	26.0	18.0	0.00	0.00	4500000.00	0.00	0.00	0.00	BO_VIEC	t	f	BIDV	21510009876543	VU TRONG BO	Bỏ việc — không trả theo quy định	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	t	\N	\N	\N
\.


--
-- Data for Name: processing_batches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.processing_batches (id, branch_id, item_id, recipe_id, batch_code, input_weight, output_weight, loss_rate, standard_loss_rate, is_over_standard, is_second_batch, status, started_by_user_id, finished_by_user_id, started_at, finished_at, created_at, updated_at) FROM stdin;
1	1	1	1	BATCH-202611-001	20.000	\N	\N	20.00	f	f	DANG_LAM	1	\N	2026-11-23 20:20:06.442739+07	\N	2026-11-23 20:20:06.442739+07	2026-11-23 20:50:06.442739+07
2	1	2	2	BATCH-202611-002	25.000	19.000	24.00	18.00	t	f	HOAN_THANH	1	1	2026-11-23 17:50:06.442739+07	2026-11-23 18:50:06.442739+07	2026-11-23 17:50:06.442739+07	2026-11-23 20:50:06.442739+07
\.


--
-- Data for Name: recipe_ingredients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recipe_ingredients (id, recipe_id, ingredient_item_id, quantity, unit, note, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recipes (id, item_id, recipe_name, standard_loss_rate, description, created_at, updated_at) FROM stdin;
1	1	Cua Cà Mau Hấp Sả / Gừng	20.00	Chuẩn hao hụt hấp chín tối đa 20%	2026-11-23 20:50:06.144228+07	2026-11-23 20:50:06.144228+07
2	2	Ghẹ Phú Quốc Hấp Bia	18.00	Chuẩn hao hụt tối đa 18%	2026-11-23 20:50:06.144228+07	2026-11-23 20:50:06.144228+07
3	11	Tôm Càng Xanh Nướng Muối Ớt	15.00	Chuẩn hao hụt nướng than hoa 15%	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
4	12	Ba Chỉ Bò Mỹ Nướng Sốt Galbi	12.00	Chuẩn hao hụt sơ chế tẩm sốt 12%	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
5	13	Mực Lá Hấp Hành Gừng	16.00	Chuẩn hao hụt làm sạch và hấp 16%	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
6	8	Bánh Bao Thịt Hấp Nóng	5.00	Hao hụt bay hơi khi hấp tủ giữ nhiệt 5%	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
7	7	Salad Nga Trộn Tươi Ca Ngày	8.00	Hao hụt gọt vỏ luộc củ quả và ra nước 8%	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
8	4	Kim Chi Cải Thảo Muối Chua Cay	5.00	Hao hụt ra nước và cắt gọt gốc 5%	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
9	17	Nộm Hoa Chuối Tai Heo Chua Ngọt	10.00	Hao hụt vắt ráo hoa chuối và tai heo 10%	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
10	18	Nước Cốt Lẩu Thái Chua Cay Chuẩn Vị	10.00	Hao hụt cô đặc khi đun sôi liên tục 10%	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
\.


--
-- Data for Name: resignation_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resignation_requests (id, user_id, branch_id, request_date, reason, is_abandoned, status, missing_uniform_details, approved_by_user_id, approved_at, manager_note, created_at, cancelled_by_user_id, cancelled_at) FROM stdin;
1	5	2	2026-11-21	Chuyển nơi cư trú về quê sinh sống cùng gia đình	f	DANG_GIU_LUONG	Thiếu 01 Áo Thun Đồng Phục Sen Việt Buffet	\N	\N	Đã bàn giao tạp dề và thẻ tên, hẹn trả áo vào ngày 20/11	2026-11-23 20:50:06.22851+07	\N	\N
2	10	1	2026-11-18	Nghỉ việc chuyển về quê chăm sóc bố mẹ già	f	DANG_GIU_LUONG	1 Tạp dề, 1 Nón	\N	\N	Đã trả áo thun, còn thiếu 1 tạp dề và 1 nón bảo hộ	2026-11-18 20:50:06.442739+07	\N	\N
3	11	2	2026-11-08	Tự ý bỏ việc không thông báo trước	t	BO_VIEC	Áo đồng phục, Tạp dề, Thẻ tên	\N	\N	Bỏ việc — không trả theo quy định	2026-11-08 20:50:06.442739+07	\N	\N
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, role_name, description, created_at) FROM stdin;
1	ROLE_KITCHEN_STAFF	Nhân viên Bếp / Bar (Thao tác màn hình 4 nút lớn)	2026-11-23 20:50:06.087872+07
2	ROLE_RESTAURANT_MANAGER	Quản lý Nhà hàng / Quản lý Bếp (Duyệt hủy, thiết lập định mức, giám sát)	2026-11-23 20:50:06.087872+07
3	ROLE_BRANCH_ACCOUNTANT	Kế toán Chi nhánh (Đối soát kho, kiểm soát NCC)	2026-11-23 20:50:06.087872+07
4	ROLE_GENERAL_ACCOUNTANT	Kế toán Tổng chuỗi / Chủ chuỗi (Xem báo cáo đa chi nhánh, chốt lương)	2026-11-23 20:50:06.087872+07
5	ROLE_EMPLOYEE	Nhân viên chung (Chấm công GPS, xem lịch ca, đề xuất ứng lương)	2026-11-23 20:50:06.087872+07
\.


--
-- Data for Name: salary_advances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salary_advances (id, user_id, branch_id, request_date, requested_amount, reason, disbursed_amount, deduction_month, status, approved_by_user_id, approved_at, manager_note, created_at) FROM stdin;
3	1	1	2026-11-13	2000000.00	Gia đình có việc gấp ở quê	2000000.00	2026-11	DA_CHI	\N	\N	Đã chuyển khoản thực chi 2.000.000 đ qua Vietcombank	2026-11-13 20:50:06.442739+07
4	5	2	2026-11-15	3000000.00	Đóng tiền học phí đầu năm cho con	2500000.00	2026-11	DA_CHI	\N	\N	Hạn mức công thực tế cho phép chi tối đa 2.500.000 đ; đã giải ngân thực chi 2.500.000 đ	2026-11-15 20:50:06.442739+07
5	8	1	2026-11-21	1500000.00	Chi phí khám chữa bệnh phát sinh	0.00	2026-11	CHO_DUYET	\N	\N	\N	2026-11-21 20:50:06.442739+07
6	6	2	2026-11-20	2000000.00	Sửa chữa xe máy hỏng trên đường đi làm	0.00	2026-11	CHO_DUYET	\N	\N	\N	2026-11-20 20:50:06.442739+07
7	9	1	2026-11-18	4000000.00	Mua sắm thiết bị điện thoại cá nhân	0.00	2026-11	TU_CHOI	\N	\N	Từ chối: Chưa tích lũy đủ 15 ngày công trong tháng và lý do không thuộc diện khẩn cấp	2026-11-18 20:50:06.442739+07
8	11	2	2026-11-11	5000000.00	Chi tiêu việc riêng gia đình	0.00	2026-11	TU_CHOI	\N	\N	Từ chối: Nhân viên có biểu hiện nghỉ không phép nhiều ngày, đang trong diện xem xét kỷ luật	2026-11-11 20:50:06.442739+07
\.


--
-- Data for Name: salary_increase_proposals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salary_increase_proposals (id, user_id, branch_id, exam_quarter, exam_score, late_count, unexcused_absence_count, is_eligible, raise_amount, status, evaluation_details, approved_by_user_id, approved_at, created_at) FROM stdin;
1	1	1	Q4-2026	85.00	1	0	t	500000.00	CHO_DUYET	Đủ điều kiện: Điểm thi 85/100 (>=80), Đi muộn 1 lần (<=3), Nghỉ không phép 0 ngày	\N	\N	2026-11-23 20:50:06.268366+07
\.


--
-- Data for Name: salary_rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salary_rules (id, branch_id, standard_work_days, exam_raise_amount, max_advance_ratio, late_penalty_per_minute, created_at) FROM stdin;
1	1	26.0	500000.00	0.50	5000.00	2026-11-23 20:50:06.268366+07
2	2	26.0	500000.00	0.50	5000.00	2026-11-23 20:50:06.268366+07
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, supplier_code, supplier_name, phone, address, contact_person, email, tax_code, status, created_at, updated_at) FROM stdin;
1	NCC-QN01	Hải Sản Quảng Ninh	0912345678	Cảng Cá Hạ Long, TP. Hạ Long, Tỉnh Quảng Ninh	Nguyễn Văn Tuấn	tuankd@haisanqn.vn	0102030405	HOAT_DONG	2026-11-23 20:50:06.307769+07	2026-11-23 20:50:06.307769+07
2	NCC-CM02	Hải Sản Cà Mau Đặc Sản	0987654321	Thị Trấn Năm Căn, Huyện Năm Căn, Tỉnh Cà Mau	Trần Văn Cà	info@haisancamau.vn	0506070809	HOAT_DONG	2026-11-23 20:50:06.307769+07	2026-11-23 20:50:06.307769+07
3	NCC-HN03	Thực Phẩm Tươi Sống Hà Nội	0901122334	Khu Công Nghiệp Vĩnh Tuy, Quận Hoàng Mai, TP. Hà Nội	Lê Thị Thu	thucphamhn@gmail.com	0109988776	HOAT_DONG	2026-11-23 20:50:06.307769+07	2026-11-23 20:50:06.307769+07
4	NCC-DL04	Nông Sản & Rau Sạch Đà Lạt	0933445566	Xã Hiệp An, Huyện Đức Trọng, Tỉnh Lâm Đồng	Phạm Hồng Thái	dalatfarm@dalat.vn	5800112233	HOAT_DONG	2026-11-23 20:50:06.307769+07	2026-11-23 20:50:06.307769+07
9	NCC-MB05	Gia Vị & Đồ Khô Miền Bắc	0945678901	Cụm Kho Bãi Phúc Đồng, Quận Long Biên, TP. Hà Nội	Hoàng Đình Bắc	mienbacspices@gmail.com	0108877665	HOAT_DONG	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
10	QVANHLUC	Công ty Cổ Phần  Shalom LG	0988000017	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
11	QVAXH	Anh xứng hạnh	0988000005	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
12	QVBAOTUYET	Bia bão tuyết	0988000012	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
13	QVBASAU	Bà Sáu	0988000004	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
14	QVBBKS	Bánh bao kim sa	0988000015	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
15	QVBH	Tiền bảo hiểm	0988000023	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
16	QVCHIPHUONG	Chị Phượng rau	0988000001	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
17	QVCHIVINH	Chị Vinh- Hà Dũng	0988000016	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
18	QVCONTRUNG	Diệt Côn Trùng	0988000021	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
19	QVCOPHUONG	Cô Phượng Nghệ An	0988000014	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
20	QVCOTHAO	Cô Thảo đồ khô	0988000010	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
21	QVDCP	Dũng Cẩm Phả	0988000013	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
22	QVDUNGCH	Anh Khanh Cá Hồi	0988000003	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
23	QVDX	Đá xay	0988000008	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
24	QVGAS	Gas Hồng Lĩnh	0988000020	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
25	QVHUYENHS	Huyền hải sản	0988000006	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
26	QVKEMY	Kem Ý	0988000019	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
27	QVLIENCUA	Liên Cua Cà Mau	0988000009	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
28	QVLV	Chi Lặt Vặt	0988000011	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
29	QVNHUNG	Cô Nhưng	0988000002	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
30	QVQUANGCAO	Chi phí quảng cáo	0988000022	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
31	QVQUANGHUE	Rượu Quang Huệ	0988000018	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
32	QVTHN	Chị Tâm Hà Nội	0988000007	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
33	QVVQV	Vũ quế võ	0988000024	Quế Võ, Bắc Ninh	\N	\N	\N	HOAT_DONG	2026-11-23 21:10:15.827275+07	2026-11-23 21:10:15.827275+07
\.


--
-- Data for Name: take_out_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.take_out_logs (id, branch_id, item_id, quantity, unit, user_id, note, created_at) FROM stdin;
\.


--
-- Data for Name: uniform_allocations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.uniform_allocations (id, user_id, branch_id, uniform_item_id, allocated_date, is_returned, returned_date, received_by_user_id, note, created_at) FROM stdin;
1	5	2	1	2026-09-24	f	\N	\N	\N	2026-11-23 20:50:06.22851+07
2	5	2	2	2026-09-24	f	\N	\N	\N	2026-11-23 20:50:06.22851+07
3	5	2	4	2026-09-24	f	\N	\N	\N	2026-11-23 20:50:06.22851+07
4	1	1	1	2026-08-25	f	\N	\N	\N	2026-11-23 20:50:06.22851+07
5	1	1	2	2026-08-25	f	\N	\N	\N	2026-11-23 20:50:06.22851+07
6	1	1	3	2026-08-25	f	\N	\N	\N	2026-11-23 20:50:06.22851+07
7	1	1	4	2026-08-25	f	\N	\N	\N	2026-11-23 20:50:06.22851+07
8	10	1	1	2026-08-25	t	2026-11-18	\N	Đã trả áo thun nguyên vẹn	2026-11-23 20:50:06.442739+07
9	10	1	2	2026-08-25	f	\N	\N	Chưa bàn giao lại tạp dề	2026-11-23 20:50:06.442739+07
10	10	1	3	2026-08-25	f	\N	\N	Chưa bàn giao lại nón bảo hộ	2026-11-23 20:50:06.442739+07
\.


--
-- Data for Name: uniform_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.uniform_items (id, item_name, deposit_value, created_at) FROM stdin;
1	Áo Thun Đồng Phục Sen Việt Buffet	150000.00	2026-11-23 20:50:06.22851+07
2	Tạp Dề Bếp / Phục Vụ Chống Thấm	80000.00	2026-11-23 20:50:06.22851+07
3	Nón / Mũ Bếp Tiêu Chuẩn Vệ Sinh	50000.00	2026-11-23 20:50:06.22851+07
4	Thẻ Tên Nhân Viên Từ Tính	40000.00	2026-11-23 20:50:06.22851+07
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (user_id, role_id, role_name, assigned_at) FROM stdin;
1	1	ROLE_KITCHEN_STAFF	2026-11-23 20:50:06.396241+07
2	2	ROLE_RESTAURANT_MANAGER	2026-11-23 20:50:06.396241+07
3	3	ROLE_BRANCH_ACCOUNTANT	2026-11-23 20:50:06.396241+07
4	4	ROLE_GENERAL_ACCOUNTANT	2026-11-23 20:50:06.396241+07
5	5	ROLE_EMPLOYEE	2026-11-23 20:50:06.396241+07
1	5	ROLE_EMPLOYEE	2026-11-23 20:50:06.396241+07
2	5	ROLE_EMPLOYEE	2026-11-23 20:50:06.396241+07
3	5	ROLE_EMPLOYEE	2026-11-23 20:50:06.396241+07
6	1	ROLE_KITCHEN_STAFF	2026-11-23 20:50:06.442739+07
7	2	ROLE_RESTAURANT_MANAGER	2026-11-23 20:50:06.442739+07
6	5	ROLE_EMPLOYEE	2026-11-23 20:50:06.442739+07
7	5	ROLE_EMPLOYEE	2026-11-23 20:50:06.442739+07
8	5	ROLE_EMPLOYEE	2026-11-23 20:50:06.442739+07
9	5	ROLE_EMPLOYEE	2026-11-23 20:50:06.442739+07
10	5	ROLE_EMPLOYEE	2026-11-23 20:50:06.442739+07
11	5	ROLE_EMPLOYEE	2026-11-23 20:50:06.442739+07
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password, full_name, email, phone, branch_id, status, created_at, updated_at, bank_name, bank_account_number, bank_account_holder, base_salary, role) FROM stdin;
1	bep_thainguyen	$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2	Nguyễn Văn Bếp (Thái Nguyên)	bep.tn@senvietbuffet.vn	0912345601	1	ACTIVE	2026-11-23 20:50:06.129734+07	2026-11-23 20:50:06.129734+07	Vietcombank	1012345678	NGUYEN VAN BEP	8500000.00	ROLE_KITCHEN_STAFF
2	quanly_thainguyen	$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2	Trần Quản Lý (Thái Nguyên)	quanly.tn@senvietbuffet.vn	0912345602	1	ACTIVE	2026-11-23 20:50:06.129734+07	2026-11-23 20:50:06.129734+07	Techcombank	19034567890123	TRAN QUAN LY	12000000.00	ROLE_RESTAURANT_MANAGER
3	ketoan_thainguyen	$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2	Lê Kế Toán (Thái Nguyên)	ketoan.tn@senvietbuffet.vn	0912345603	1	ACTIVE	2026-11-23 20:50:06.129734+07	2026-11-23 20:50:06.129734+07	MB Bank	0912345603	LE KE TOAN	9000000.00	ROLE_BRANCH_ACCOUNTANT
4	ketoan_tong	$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2	Phạm Kế Toán Tổng (Admin Chuỗi)	ketoan.tong@senvietbuffet.vn	0912345604	1	ACTIVE	2026-11-23 20:50:06.129734+07	2026-11-23 20:50:06.129734+07	VietinBank	10887654321	PHAM KE TOAN TONG	15000000.00	ROLE_GENERAL_ACCOUNTANT
5	nhanvien_quevo	$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2	Hoàng Nhân Viên (Quế Võ)	nhanvien.qv@senvietbuffet.vn	0912345605	2	ACTIVE	2026-11-23 20:50:06.129734+07	2026-11-23 20:50:06.129734+07	BIDV	21510001234567	HOANG NHAN VIEN	6500000.00	ROLE_EMPLOYEE
6	bep_quevo	$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2	Lê Văn Bếp (Quế Võ)	bep.qv@senvietbuffet.vn	0912345606	2	ACTIVE	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	Vietcombank	1023456789	LE VAN BEP	8500000.00	ROLE_KITCHEN_STAFF
7	quanly_quevo	$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2	Đỗ Quản Lý (Quế Võ)	quanly.qv@senvietbuffet.vn	0912345607	2	ACTIVE	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	Techcombank	19034567890124	DO QUAN LY	12000000.00	ROLE_RESTAURANT_MANAGER
8	phucvu_thainguyen	$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2	Đặng Thị Phục Vụ (Thái Nguyên)	phucvu.tn@senvietbuffet.vn	0912345608	1	ACTIVE	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	MB Bank	0912345608	DANG THI PHUC VU	6500000.00	ROLE_EMPLOYEE
9	thungan_thainguyen	$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2	Bùi Thu Ngân (Thái Nguyên)	thungan.tn@senvietbuffet.vn	0912345609	1	ACTIVE	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	VPBank	1567890123	BUI THU NGAN	7000000.00	ROLE_EMPLOYEE
10	nhanvien_nghiviec	$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2	Nguyễn Văn Nghỉ (Thái Nguyên)	nghiviec.tn@senvietbuffet.vn	0912345610	1	ACTIVE	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	Agribank	3100205123456	NGUYEN VAN NGHI	6500000.00	ROLE_EMPLOYEE
11	nhanvien_boviec	$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2	Vũ Trọng Bỏ (Quế Võ)	boviec.qv@senvietbuffet.vn	0912345611	2	INACTIVE	2026-11-23 20:50:06.442739+07	2026-11-23 20:50:06.442739+07	BIDV	21510009876543	VU TRONG BO	6500000.00	ROLE_EMPLOYEE
\.


--
-- Data for Name: warehouse_document_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.warehouse_document_items (id, document_id, item_id, batch_id, quantity, unit_price, note) FROM stdin;
1	1	1	1	100.000	350000.00	Kiểm tra độ tươi sống đạt 100%, dây buộc nhẹ
2	2	12	6	150.000	195000.00	Thịt nguyên tảng đóng gói chân không, hạn dùng xa
3	3	1	8	70.000	350000.00	Cua Cà Mau loại 1 sống khỏe, đạt quy cách
4	4	18	10	200.000	50000.00	10 can loại 20L nguyên tem mác nhà sản xuất
5	5	11	5	20.000	240000.00	Xuất phục vụ quầy line hải sản nướng ca tối
6	6	13	7	5.000	180000.00	Mực đổi màu do tụt lạnh; có biên bản kiểm tra
\.


--
-- Data for Name: warehouse_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.warehouse_documents (id, doc_type, doc_code, branch_id, supplier_id, created_by_user_id, status, note, total_amount, image_urls, created_at, updated_at) FROM stdin;
1	NHAP	PN-TN-202611-001	1	1	3	HOAN_THANH	Nhập hải sản tươi sống sáng sớm (Cua Cà Mau loại 1)	35000000.00	\N	2026-11-20 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
2	NHAP	PN-TN-202611-002	1	3	3	HOAN_THANH	Nhập thịt bò Mỹ đông lạnh nguyên tảng kèm giấy kiểm dịch	29250000.00	\N	2026-11-19 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
3	NHAP	PN-QV-202611-001	2	2	5	HOAN_THANH	Nhập hải sản tươi sống chi nhánh Quế Võ (Cua Năm Căn sống)	24500000.00	\N	2026-11-20 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
4	NHAP	PN-QV-202611-002	2	9	5	HOAN_THANH	Nhập nước cốt lẩu Thái Tomyum đóng can 20L nguyên niêm phong	10000000.00	\N	2026-11-18 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
5	XUAT_CHUYEN	PX-TN-202611-001	1	\N	1	HOAN_THANH	Xuất điều chuyển hỗ trợ bếp chính và quầy line nướng ca tối	4800000.00	\N	2026-11-22 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
6	HUY	PH-QV-202611-001	2	\N	7	HOAN_THANH	Xuất hủy nguyên liệu do tủ cấp đông lỗi cảm biến nhiệt độ	900000.00	\N	2026-11-22 20:50:06.442739+07	2026-11-23 20:50:06.442739+07
\.


--
-- Name: attendances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attendances_id_seq', 9, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: branches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.branches_id_seq', 2, true);


--
-- Name: cukcuk_sales_imports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cukcuk_sales_imports_id_seq', 1, true);


--
-- Name: daily_reconciliations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.daily_reconciliations_id_seq', 11, true);


--
-- Name: daily_waste_confirmations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.daily_waste_confirmations_id_seq', 1, false);


--
-- Name: damage_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.damage_reports_id_seq', 2, true);


--
-- Name: exam_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exam_questions_id_seq', 9, true);


--
-- Name: exam_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exam_submissions_id_seq', 1, false);


--
-- Name: import_batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.import_batches_id_seq', 227, true);


--
-- Name: inventory_check_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_check_items_id_seq', 1, false);


--
-- Name: inventory_checks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_checks_id_seq', 1, false);


--
-- Name: inventory_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_snapshots_id_seq', 4, true);


--
-- Name: inventory_stocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_stocks_id_seq', 227, true);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.items_id_seq', 235, true);


--
-- Name: line_item_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.line_item_logs_id_seq', 1, false);


--
-- Name: notification_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notification_logs_id_seq', 3, true);


--
-- Name: payroll_periods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payroll_periods_id_seq', 2, true);


--
-- Name: payrolls_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payrolls_id_seq', 8, true);


--
-- Name: processing_batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.processing_batches_id_seq', 2, true);


--
-- Name: recipe_ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recipe_ingredients_id_seq', 1, false);


--
-- Name: recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recipes_id_seq', 10, true);


--
-- Name: resignation_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.resignation_requests_id_seq', 3, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 5, true);


--
-- Name: salary_advances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.salary_advances_id_seq', 8, true);


--
-- Name: salary_increase_proposals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.salary_increase_proposals_id_seq', 1, true);


--
-- Name: salary_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.salary_rules_id_seq', 2, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 33, true);


--
-- Name: take_out_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.take_out_logs_id_seq', 1, false);


--
-- Name: uniform_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.uniform_allocations_id_seq', 10, true);


--
-- Name: uniform_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.uniform_items_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 11, true);


--
-- Name: warehouse_document_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.warehouse_document_items_id_seq', 6, true);


--
-- Name: warehouse_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.warehouse_documents_id_seq', 6, true);


--
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: branches branches_branch_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_branch_code_key UNIQUE (branch_code);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: cukcuk_sales_imports cukcuk_sales_imports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cukcuk_sales_imports
    ADD CONSTRAINT cukcuk_sales_imports_pkey PRIMARY KEY (id);


--
-- Name: daily_reconciliations daily_reconciliations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_reconciliations
    ADD CONSTRAINT daily_reconciliations_pkey PRIMARY KEY (id);


--
-- Name: daily_waste_confirmations daily_waste_confirmations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_waste_confirmations
    ADD CONSTRAINT daily_waste_confirmations_pkey PRIMARY KEY (id);


--
-- Name: damage_reports damage_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_pkey PRIMARY KEY (id);


--
-- Name: exam_questions exam_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_questions
    ADD CONSTRAINT exam_questions_pkey PRIMARY KEY (id);


--
-- Name: exam_submissions exam_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_submissions
    ADD CONSTRAINT exam_submissions_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: import_batches import_batches_batch_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_batches
    ADD CONSTRAINT import_batches_batch_code_key UNIQUE (batch_code);


--
-- Name: import_batches import_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_batches
    ADD CONSTRAINT import_batches_pkey PRIMARY KEY (id);


--
-- Name: inventory_check_items inventory_check_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_check_items
    ADD CONSTRAINT inventory_check_items_pkey PRIMARY KEY (id);


--
-- Name: inventory_checks inventory_checks_check_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT inventory_checks_check_code_key UNIQUE (check_code);


--
-- Name: inventory_checks inventory_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT inventory_checks_pkey PRIMARY KEY (id);


--
-- Name: inventory_snapshots inventory_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_snapshots
    ADD CONSTRAINT inventory_snapshots_pkey PRIMARY KEY (id);


--
-- Name: inventory_stocks inventory_stocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_stocks
    ADD CONSTRAINT inventory_stocks_pkey PRIMARY KEY (id);


--
-- Name: items items_barcode_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_barcode_key UNIQUE (barcode);


--
-- Name: items items_item_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_item_code_key UNIQUE (item_code);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: line_item_logs line_item_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.line_item_logs
    ADD CONSTRAINT line_item_logs_pkey PRIMARY KEY (id);


--
-- Name: line_item_logs line_item_logs_request_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.line_item_logs
    ADD CONSTRAINT line_item_logs_request_id_key UNIQUE (request_id);


--
-- Name: notification_logs notification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);


--
-- Name: payroll_periods payroll_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_pkey PRIMARY KEY (id);


--
-- Name: payrolls payrolls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_pkey PRIMARY KEY (id);


--
-- Name: processing_batches processing_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_batches
    ADD CONSTRAINT processing_batches_pkey PRIMARY KEY (id);


--
-- Name: recipe_ingredients recipe_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_pkey PRIMARY KEY (id);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- Name: resignation_requests resignation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resignation_requests
    ADD CONSTRAINT resignation_requests_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- Name: salary_advances salary_advances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_advances
    ADD CONSTRAINT salary_advances_pkey PRIMARY KEY (id);


--
-- Name: salary_increase_proposals salary_increase_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_increase_proposals
    ADD CONSTRAINT salary_increase_proposals_pkey PRIMARY KEY (id);


--
-- Name: salary_rules salary_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_rules
    ADD CONSTRAINT salary_rules_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_supplier_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_supplier_code_key UNIQUE (supplier_code);


--
-- Name: take_out_logs take_out_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.take_out_logs
    ADD CONSTRAINT take_out_logs_pkey PRIMARY KEY (id);


--
-- Name: payroll_periods uk_payroll_period_branch; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT uk_payroll_period_branch UNIQUE (period_month, branch_id);


--
-- Name: payrolls uk_payroll_user_month; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT uk_payroll_user_month UNIQUE (user_id, payroll_month);


--
-- Name: uniform_allocations uniform_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uniform_allocations
    ADD CONSTRAINT uniform_allocations_pkey PRIMARY KEY (id);


--
-- Name: uniform_items uniform_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uniform_items
    ADD CONSTRAINT uniform_items_pkey PRIMARY KEY (id);


--
-- Name: inventory_stocks uq_branch_item_batch; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_stocks
    ADD CONSTRAINT uq_branch_item_batch UNIQUE (branch_id, item_id, batch_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: warehouse_document_items warehouse_document_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_document_items
    ADD CONSTRAINT warehouse_document_items_pkey PRIMARY KEY (id);


--
-- Name: warehouse_documents warehouse_documents_doc_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_documents
    ADD CONSTRAINT warehouse_documents_doc_code_key UNIQUE (doc_code);


--
-- Name: warehouse_documents warehouse_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_documents
    ADD CONSTRAINT warehouse_documents_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_advances_deduction_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_advances_deduction_month ON public.salary_advances USING btree (deduction_month);


--
-- Name: idx_advances_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_advances_status ON public.salary_advances USING btree (status);


--
-- Name: idx_advances_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_advances_user_id ON public.salary_advances USING btree (user_id);


--
-- Name: idx_attendances_branch_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendances_branch_date ON public.attendances USING btree (branch_id, attendance_date);


--
-- Name: idx_attendances_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendances_user_date ON public.attendances USING btree (user_id, attendance_date);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_batches_branch_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batches_branch_date ON public.processing_batches USING btree (branch_id, created_at);


--
-- Name: idx_batches_branch_item_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batches_branch_item_status ON public.processing_batches USING btree (branch_id, item_id, status);


--
-- Name: idx_batches_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batches_code ON public.import_batches USING btree (batch_code);


--
-- Name: idx_batches_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batches_lookup ON public.import_batches USING btree (branch_id, item_id, current_stock);


--
-- Name: idx_batches_supplier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batches_supplier ON public.import_batches USING btree (supplier_id);


--
-- Name: idx_branches_branch_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_branches_branch_code ON public.branches USING btree (branch_code);


--
-- Name: idx_cukcuk_sales_branch_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cukcuk_sales_branch_date ON public.cukcuk_sales_imports USING btree (branch_id, import_date);


--
-- Name: idx_daily_reconciliations_flag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_reconciliations_flag ON public.daily_reconciliations USING btree (is_over_threshold);


--
-- Name: idx_daily_reconciliations_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_reconciliations_lookup ON public.daily_reconciliations USING btree (branch_id, recon_date, shift_type);


--
-- Name: idx_daily_waste_branch_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_waste_branch_date ON public.daily_waste_confirmations USING btree (branch_id, waste_date);


--
-- Name: idx_daily_waste_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_waste_item ON public.daily_waste_confirmations USING btree (item_id);


--
-- Name: idx_damage_branch_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_damage_branch_date ON public.damage_reports USING btree (branch_id, created_at);


--
-- Name: idx_damage_reports_batch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_damage_reports_batch ON public.damage_reports USING btree (batch_id);


--
-- Name: idx_damage_reports_supplier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_damage_reports_supplier ON public.damage_reports USING btree (supplier_id);


--
-- Name: idx_damage_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_damage_status ON public.damage_reports USING btree (status);


--
-- Name: idx_exam_questions_pos; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_questions_pos ON public.exam_questions USING btree ("position", is_active);


--
-- Name: idx_exam_submissions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_submissions_user ON public.exam_submissions USING btree (user_id, exam_quarter);


--
-- Name: idx_inv_check_items_check; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inv_check_items_check ON public.inventory_check_items USING btree (check_id);


--
-- Name: idx_inv_checks_branch_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inv_checks_branch_date ON public.inventory_checks USING btree (branch_id, check_date);


--
-- Name: idx_inventory_snapshots_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_snapshots_lookup ON public.inventory_snapshots USING btree (branch_id, item_id, snapshot_date, shift_type);


--
-- Name: idx_inventory_stocks_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_stocks_branch ON public.inventory_stocks USING btree (branch_id, item_id);


--
-- Name: idx_items_barcode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_barcode ON public.items USING btree (barcode);


--
-- Name: idx_items_item_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_item_code ON public.items USING btree (item_code);


--
-- Name: idx_line_branch_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_line_branch_date ON public.line_item_logs USING btree (branch_id, created_at);


--
-- Name: idx_notification_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_logs_created ON public.notification_logs USING btree (created_at);


--
-- Name: idx_payroll_periods_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_periods_lookup ON public.payroll_periods USING btree (period_month, branch_id);


--
-- Name: idx_payroll_periods_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payroll_periods_status ON public.payroll_periods USING btree (status);


--
-- Name: idx_payrolls_excluded; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payrolls_excluded ON public.payrolls USING btree (excluded_from_cost);


--
-- Name: idx_payrolls_locked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payrolls_locked ON public.payrolls USING btree (locked_at);


--
-- Name: idx_payrolls_month_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payrolls_month_branch ON public.payrolls USING btree (payroll_month, branch_id);


--
-- Name: idx_payrolls_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payrolls_status ON public.payrolls USING btree (status);


--
-- Name: idx_raise_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_raise_user_id ON public.salary_increase_proposals USING btree (user_id);


--
-- Name: idx_recipe_ingredients_recipe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recipe_ingredients_recipe ON public.recipe_ingredients USING btree (recipe_id);


--
-- Name: idx_recipes_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recipes_item_id ON public.recipes USING btree (item_id);


--
-- Name: idx_resignation_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resignation_user ON public.resignation_requests USING btree (user_id, status);


--
-- Name: idx_suppliers_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suppliers_code ON public.suppliers USING btree (supplier_code);


--
-- Name: idx_suppliers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suppliers_status ON public.suppliers USING btree (status);


--
-- Name: idx_take_out_branch_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_take_out_branch_date ON public.take_out_logs USING btree (branch_id, created_at);


--
-- Name: idx_uniform_allocations_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_uniform_allocations_user ON public.uniform_allocations USING btree (user_id, is_returned);


--
-- Name: idx_user_roles_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_role_id ON public.user_roles USING btree (role_id);


--
-- Name: idx_user_roles_role_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_role_name ON public.user_roles USING btree (role_name);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_users_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_branch_id ON public.users USING btree (branch_id);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: idx_wh_doc_branch_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wh_doc_branch_date ON public.warehouse_documents USING btree (branch_id, created_at);


--
-- Name: idx_wh_doc_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wh_doc_code ON public.warehouse_documents USING btree (doc_code);


--
-- Name: idx_wh_doc_items_doc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wh_doc_items_doc ON public.warehouse_document_items USING btree (document_id);


--
-- Name: idx_wh_doc_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wh_doc_type ON public.warehouse_documents USING btree (doc_type);


--
-- Name: uq_user_roles_user_role_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_user_roles_user_role_name ON public.user_roles USING btree (user_id, role_name);


--
-- Name: user_roles trg_fill_user_role_name; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fill_user_role_name BEFORE INSERT OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.fill_user_role_name();


--
-- Name: attendances attendances_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: attendances attendances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: cukcuk_sales_imports cukcuk_sales_imports_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cukcuk_sales_imports
    ADD CONSTRAINT cukcuk_sales_imports_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: cukcuk_sales_imports cukcuk_sales_imports_imported_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cukcuk_sales_imports
    ADD CONSTRAINT cukcuk_sales_imports_imported_by_user_id_fkey FOREIGN KEY (imported_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: daily_reconciliations daily_reconciliations_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_reconciliations
    ADD CONSTRAINT daily_reconciliations_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: daily_reconciliations daily_reconciliations_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_reconciliations
    ADD CONSTRAINT daily_reconciliations_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: daily_waste_confirmations daily_waste_confirmations_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_waste_confirmations
    ADD CONSTRAINT daily_waste_confirmations_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: daily_waste_confirmations daily_waste_confirmations_confirmed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_waste_confirmations
    ADD CONSTRAINT daily_waste_confirmations_confirmed_by_user_id_fkey FOREIGN KEY (confirmed_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: daily_waste_confirmations daily_waste_confirmations_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_waste_confirmations
    ADD CONSTRAINT daily_waste_confirmations_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: damage_reports damage_reports_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: damage_reports damage_reports_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.import_batches(id) ON DELETE SET NULL;


--
-- Name: damage_reports damage_reports_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: damage_reports damage_reports_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: damage_reports damage_reports_reported_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_reported_by_user_id_fkey FOREIGN KEY (reported_by_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: damage_reports damage_reports_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- Name: exam_submissions exam_submissions_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_submissions
    ADD CONSTRAINT exam_submissions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: exam_submissions exam_submissions_graded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_submissions
    ADD CONSTRAINT exam_submissions_graded_by_user_id_fkey FOREIGN KEY (graded_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: exam_submissions exam_submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_submissions
    ADD CONSTRAINT exam_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: import_batches import_batches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_batches
    ADD CONSTRAINT import_batches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: import_batches import_batches_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_batches
    ADD CONSTRAINT import_batches_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: import_batches import_batches_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_batches
    ADD CONSTRAINT import_batches_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT;


--
-- Name: inventory_check_items inventory_check_items_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_check_items
    ADD CONSTRAINT inventory_check_items_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.import_batches(id) ON DELETE SET NULL;


--
-- Name: inventory_check_items inventory_check_items_check_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_check_items
    ADD CONSTRAINT inventory_check_items_check_id_fkey FOREIGN KEY (check_id) REFERENCES public.inventory_checks(id) ON DELETE CASCADE;


--
-- Name: inventory_check_items inventory_check_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_check_items
    ADD CONSTRAINT inventory_check_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: inventory_checks inventory_checks_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT inventory_checks_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: inventory_checks inventory_checks_checked_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT inventory_checks_checked_by_user_id_fkey FOREIGN KEY (checked_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: inventory_snapshots inventory_snapshots_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_snapshots
    ADD CONSTRAINT inventory_snapshots_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: inventory_snapshots inventory_snapshots_checked_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_snapshots
    ADD CONSTRAINT inventory_snapshots_checked_by_user_id_fkey FOREIGN KEY (checked_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: inventory_snapshots inventory_snapshots_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_snapshots
    ADD CONSTRAINT inventory_snapshots_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: inventory_stocks inventory_stocks_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_stocks
    ADD CONSTRAINT inventory_stocks_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.import_batches(id) ON DELETE CASCADE;


--
-- Name: inventory_stocks inventory_stocks_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_stocks
    ADD CONSTRAINT inventory_stocks_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: inventory_stocks inventory_stocks_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_stocks
    ADD CONSTRAINT inventory_stocks_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: line_item_logs line_item_logs_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.line_item_logs
    ADD CONSTRAINT line_item_logs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: line_item_logs line_item_logs_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.line_item_logs
    ADD CONSTRAINT line_item_logs_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: line_item_logs line_item_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.line_item_logs
    ADD CONSTRAINT line_item_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notification_logs notification_logs_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: payroll_periods payroll_periods_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: payroll_periods payroll_periods_locked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_locked_by_fkey FOREIGN KEY (locked_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payrolls payrolls_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: payrolls payrolls_locked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_locked_by_fkey FOREIGN KEY (locked_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payrolls payrolls_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: processing_batches processing_batches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_batches
    ADD CONSTRAINT processing_batches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: processing_batches processing_batches_finished_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_batches
    ADD CONSTRAINT processing_batches_finished_by_user_id_fkey FOREIGN KEY (finished_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: processing_batches processing_batches_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_batches
    ADD CONSTRAINT processing_batches_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: processing_batches processing_batches_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_batches
    ADD CONSTRAINT processing_batches_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE SET NULL;


--
-- Name: processing_batches processing_batches_started_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_batches
    ADD CONSTRAINT processing_batches_started_by_user_id_fkey FOREIGN KEY (started_by_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: recipe_ingredients recipe_ingredients_ingredient_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_ingredient_item_id_fkey FOREIGN KEY (ingredient_item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: recipe_ingredients recipe_ingredients_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;


--
-- Name: recipes recipes_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: resignation_requests resignation_requests_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resignation_requests
    ADD CONSTRAINT resignation_requests_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: resignation_requests resignation_requests_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resignation_requests
    ADD CONSTRAINT resignation_requests_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: resignation_requests resignation_requests_cancelled_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resignation_requests
    ADD CONSTRAINT resignation_requests_cancelled_by_user_id_fkey FOREIGN KEY (cancelled_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: resignation_requests resignation_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resignation_requests
    ADD CONSTRAINT resignation_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: salary_advances salary_advances_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_advances
    ADD CONSTRAINT salary_advances_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id);


--
-- Name: salary_advances salary_advances_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_advances
    ADD CONSTRAINT salary_advances_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: salary_advances salary_advances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_advances
    ADD CONSTRAINT salary_advances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: salary_increase_proposals salary_increase_proposals_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_increase_proposals
    ADD CONSTRAINT salary_increase_proposals_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id);


--
-- Name: salary_increase_proposals salary_increase_proposals_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_increase_proposals
    ADD CONSTRAINT salary_increase_proposals_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: salary_increase_proposals salary_increase_proposals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_increase_proposals
    ADD CONSTRAINT salary_increase_proposals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: salary_rules salary_rules_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_rules
    ADD CONSTRAINT salary_rules_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: take_out_logs take_out_logs_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.take_out_logs
    ADD CONSTRAINT take_out_logs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: take_out_logs take_out_logs_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.take_out_logs
    ADD CONSTRAINT take_out_logs_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: take_out_logs take_out_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.take_out_logs
    ADD CONSTRAINT take_out_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: uniform_allocations uniform_allocations_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uniform_allocations
    ADD CONSTRAINT uniform_allocations_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: uniform_allocations uniform_allocations_received_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uniform_allocations
    ADD CONSTRAINT uniform_allocations_received_by_user_id_fkey FOREIGN KEY (received_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: uniform_allocations uniform_allocations_uniform_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uniform_allocations
    ADD CONSTRAINT uniform_allocations_uniform_item_id_fkey FOREIGN KEY (uniform_item_id) REFERENCES public.uniform_items(id) ON DELETE CASCADE;


--
-- Name: uniform_allocations uniform_allocations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uniform_allocations
    ADD CONSTRAINT uniform_allocations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: warehouse_document_items warehouse_document_items_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_document_items
    ADD CONSTRAINT warehouse_document_items_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.import_batches(id) ON DELETE SET NULL;


--
-- Name: warehouse_document_items warehouse_document_items_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_document_items
    ADD CONSTRAINT warehouse_document_items_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.warehouse_documents(id) ON DELETE CASCADE;


--
-- Name: warehouse_document_items warehouse_document_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_document_items
    ADD CONSTRAINT warehouse_document_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: warehouse_documents warehouse_documents_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_documents
    ADD CONSTRAINT warehouse_documents_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: warehouse_documents warehouse_documents_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_documents
    ADD CONSTRAINT warehouse_documents_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: warehouse_documents warehouse_documents_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_documents
    ADD CONSTRAINT warehouse_documents_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict fZp1MibpZKtxFQYaSFvXdxeZtsTGgDVdvh60OV7RiNOlKhEW7VfQK0Zjgj9BgIc



-- ==============================================================================
-- KHO SAU CHẾ BIẾN (PROCESSED DISHES) & MỞ RỘNG PROCESSING BATCHES (V13)
-- ==============================================================================

ALTER TABLE public.processing_batches
    ADD COLUMN IF NOT EXISTS raw_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS scale_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS output_plates INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'CHO_DUYET',
    ADD COLUMN IF NOT EXISTS approval_note VARCHAR(255),
    ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS public.processed_dishes (
    id BIGSERIAL PRIMARY KEY,
    dish_code VARCHAR(100) NOT NULL,
    dish_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    raw_item_id BIGINT REFERENCES public.items (id) ON DELETE SET NULL,
    raw_item_code VARCHAR(100),
    raw_item_name VARCHAR(255),
    branch_id BIGINT NOT NULL REFERENCES public.branches (id) ON DELETE CASCADE,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'đĩa',
    standard_portion_weight NUMERIC(10, 3) DEFAULT 0.650,
    cost_price NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_processed_dishes_branch_code UNIQUE (branch_id, dish_code)
);

CREATE INDEX IF NOT EXISTS idx_processed_dishes_branch_status ON public.processed_dishes (branch_id, status);
CREATE INDEX IF NOT EXISTS idx_processed_dishes_dish_code ON public.processed_dishes (dish_code);

INSERT INTO public.processed_dishes (dish_code, dish_name, category, raw_item_code, raw_item_name, branch_id, quantity, unit, standard_portion_weight, cost_price, status)
VALUES
    ('DISH-HAU-NUONG', 'Hàu nướng mỡ hành', 'Món Nướng', 'QVHAU', 'Hàu sữa tươi vỏ cứng', 1, 25.0, 'đĩa', 0.650, 185000, 'AVAILABLE'),
    ('DISH-CUA-ME', 'Cua sốt me', 'Món Nóng', 'QVCUATHIT', 'Cua thịt Cà Mau', 1, 12.0, 'đĩa', 0.700, 280000, 'AVAILABLE'),
    ('DISH-GHE-HAP', 'Ghẹ hấp sả', 'Món Hấp', 'QVGHE', 'Ghẹ tươi sống', 1, 15.0, 'đĩa', 0.600, 260000, 'AVAILABLE'),
    ('DISH-BO-SOT-TIEU', 'Bò sốt tiêu đen', 'Món Nóng', 'QVBAP', 'Bắp Bò tươi', 1, 18.0, 'đĩa', 0.500, 195000, 'AVAILABLE'),
    ('DISH-TOM-NUONG', 'Tôm sú nướng muối ớt', 'Món Nướng', 'QVTOMSU', 'Tôm Sú tươi', 1, 22.0, 'đĩa', 0.450, 210000, 'AVAILABLE'),
    ('DISH-MUC-CHIEN', 'Mực chiên giòn', 'Món Nóng', 'QVMUC', 'Mực ống Phú Quốc', 1, 15.0, 'đĩa', 0.400, 175000, 'AVAILABLE'),
    ('DISH-BA-CHI-NUONG', 'Ba chỉ bò nướng tảng', 'Món Nướng', 'QVBCBT', 'Ba Chỉ Bò Thanh', 1, 20.0, 'đĩa', 0.550, 180000, 'AVAILABLE'),
    ('DISH-CA-HOI-CHANH-LEO', 'Cá hồi sốt chanh leo', 'Món Nóng', 'QVCAHOI', 'Cá Hồi phi lê tươi', 1, 12.0, 'đĩa', 0.450, 240000, 'AVAILABLE'),
    ('DISH-HAU-NUONG', 'Hàu nướng mỡ hành', 'Món Nướng', 'QVHAU', 'Hàu sữa tươi vỏ cứng', 2, 16.0, 'đĩa', 0.650, 185000, 'AVAILABLE'),
    ('DISH-CUA-ME', 'Cua sốt me', 'Món Nóng', 'QVCUATHIT', 'Cua thịt Cà Mau', 2, 8.0, 'đĩa', 0.700, 280000, 'AVAILABLE'),
    ('DISH-GHE-HAP', 'Ghẹ hấp sả', 'Món Hấp', 'QVGHE', 'Ghẹ tươi sống', 2, 10.0, 'đĩa', 0.600, 260000, 'AVAILABLE'),
    ('DISH-BO-SOT-TIEU', 'Bò sốt tiêu đen', 'Món Nóng', 'QVBAP', 'Bắp Bò tươi', 2, 14.0, 'đĩa', 0.500, 195000, 'AVAILABLE'),
    ('DISH-TOM-NUONG', 'Tôm sú nướng muối ớt', 'Món Nướng', 'QVTOMSU', 'Tôm Sú tươi', 2, 20.0, 'đĩa', 0.450, 210000, 'AVAILABLE'),
    ('DISH-MUC-CHIEN', 'Mực chiên giòn', 'Món Nóng', 'QVMUC', 'Mực ống Phú Quốc', 2, 12.0, 'đĩa', 0.400, 175000, 'AVAILABLE'),
    ('DISH-BA-CHI-NUONG', 'Ba chỉ bò nướng tảng', 'Món Nướng', 'QVBCBT', 'Ba Chỉ Bò Thanh', 2, 15.0, 'đĩa', 0.550, 180000, 'AVAILABLE'),
    ('DISH-CA-HOI-CHANH-LEO', 'Cá hồi sốt chanh leo', 'Món Nóng', 'QVCAHOI', 'Cá Hồi phi lê tươi', 2, 10.0, 'đĩa', 0.450, 240000, 'AVAILABLE')
ON CONFLICT (branch_id, dish_code) DO UPDATE
SET quantity = EXCLUDED.quantity,
    standard_portion_weight = EXCLUDED.standard_portion_weight,
    cost_price = EXCLUDED.cost_price,
    status = EXCLUDED.status,
    updated_at = NOW();
