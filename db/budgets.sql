-- Table: public.budgets

-- DROP TABLE IF EXISTS public.budgets;

CREATE TABLE IF NOT EXISTS public.budgets
(
    id bigint NOT NULL DEFAULT nextval('budgets_id_seq'::regclass),
    user_id bigint NOT NULL,
    category character varying(50) COLLATE pg_catalog."default" NOT NULL,
    amount numeric(15,2) NOT NULL,
    period_type character varying(20) COLLATE pg_catalog."default" NOT NULL,
    spent numeric(15,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT budgets_pkey PRIMARY KEY (id),
    CONSTRAINT unique_user_category UNIQUE (user_id, category, is_active),
    CONSTRAINT fk_budget_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT budgets_period_type_check CHECK (period_type::text = ANY (ARRAY['monthly'::character varying, 'yearly'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.budgets
    OWNER to mastertyler;
-- Index: idx_budgets_active

-- DROP INDEX IF EXISTS public.idx_budgets_active;

CREATE INDEX IF NOT EXISTS idx_budgets_active
    ON public.budgets USING btree
    (is_active ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_budgets_category

-- DROP INDEX IF EXISTS public.idx_budgets_category;

CREATE INDEX IF NOT EXISTS idx_budgets_category
    ON public.budgets USING btree
    (category COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_budgets_user_id

-- DROP INDEX IF EXISTS public.idx_budgets_user_id;

CREATE INDEX IF NOT EXISTS idx_budgets_user_id
    ON public.budgets USING btree
    (user_id ASC NULLS LAST)
    TABLESPACE pg_default;
