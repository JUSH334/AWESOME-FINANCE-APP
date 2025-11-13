-- Table: public.transactions

-- DROP TABLE IF EXISTS public.transactions;

CREATE TABLE IF NOT EXISTS public.transactions
(
    id bigint NOT NULL DEFAULT nextval('transactions_id_seq'::regclass),
    user_id bigint NOT NULL,
    account_id bigint,
    transaction_date date NOT NULL,
    amount numeric(15,2) NOT NULL,
    category character varying(50) COLLATE pg_catalog."default" NOT NULL,
    type character varying(10) COLLATE pg_catalog."default" NOT NULL,
    note character varying(255) COLLATE pg_catalog."default",
    merchant character varying(100) COLLATE pg_catalog."default",
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transactions_pkey PRIMARY KEY (id),
    CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id)
        REFERENCES public.accounts (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT transactions_type_check CHECK (type::text = ANY (ARRAY['in'::character varying, 'out'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.transactions
    OWNER to mastertyler;
-- Index: idx_transactions_account

-- DROP INDEX IF EXISTS public.idx_transactions_account;

CREATE INDEX IF NOT EXISTS idx_transactions_account
    ON public.transactions USING btree
    (account_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_transactions_category

-- DROP INDEX IF EXISTS public.idx_transactions_category;

CREATE INDEX IF NOT EXISTS idx_transactions_category
    ON public.transactions USING btree
    (category COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_transactions_user_date

-- DROP INDEX IF EXISTS public.idx_transactions_user_date;

CREATE INDEX IF NOT EXISTS idx_transactions_user_date
    ON public.transactions USING btree
    (user_id ASC NULLS LAST, transaction_date DESC NULLS FIRST)
    TABLESPACE pg_default;
-- Index: idx_transactions_user_id

-- DROP INDEX IF EXISTS public.idx_transactions_user_id;

CREATE INDEX IF NOT EXISTS idx_transactions_user_id
    ON public.transactions USING btree
    (user_id ASC NULLS LAST)
    TABLESPACE pg_default;
