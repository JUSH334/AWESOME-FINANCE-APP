-- Table: public.accounts

-- DROP TABLE IF EXISTS public.accounts;

CREATE TABLE IF NOT EXISTS public.accounts
(
    id bigint NOT NULL DEFAULT nextval('accounts_id_seq'::regclass),
    user_id bigint NOT NULL,
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    type character varying(20) COLLATE pg_catalog."default" NOT NULL,
    balance numeric(15,2) NOT NULL DEFAULT 0.00,
    institution character varying(100) COLLATE pg_catalog."default",
    account_number character varying(50) COLLATE pg_catalog."default",
    is_active boolean DEFAULT true,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT accounts_type_check CHECK (type::text = ANY (ARRAY['checking'::character varying, 'savings'::character varying, 'credit'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.accounts
    OWNER to mastertyler;
-- Index: idx_accounts_user_active

-- DROP INDEX IF EXISTS public.idx_accounts_user_active;

CREATE INDEX IF NOT EXISTS idx_accounts_user_active
    ON public.accounts USING btree
    (user_id ASC NULLS LAST, is_active ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_accounts_user_id

-- DROP INDEX IF EXISTS public.idx_accounts_user_id;

CREATE INDEX IF NOT EXISTS idx_accounts_user_id
    ON public.accounts USING btree
    (user_id ASC NULLS LAST)
    TABLESPACE pg_default;
