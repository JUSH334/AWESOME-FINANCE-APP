-- Table: public.users

-- DROP TABLE IF EXISTS public.users;

CREATE TABLE IF NOT EXISTS public.users
(
    id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    username character varying(50) COLLATE pg_catalog."default" NOT NULL,
    email character varying(100) COLLATE pg_catalog."default" NOT NULL,
    password_hash character varying(255) COLLATE pg_catalog."default" NOT NULL,
    first_name character varying(50) COLLATE pg_catalog."default",
    last_name character varying(50) COLLATE pg_catalog."default",
    is_active boolean DEFAULT true,
    is_email_verified boolean DEFAULT false,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at timestamp without time zone,
    verification_token character varying(255) COLLATE pg_catalog."default",
    password_reset_token character varying(255) COLLATE pg_catalog."default",
    password_reset_expiry timestamp without time zone,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_username_key UNIQUE (username),
    CONSTRAINT email_format CHECK (email::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'::text)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to mastertyler;
-- Index: idx_users_password_reset_token

CREATE INDEX IF NOT EXISTS idx_users_password_reset_token
    ON public.users USING btree
    (password_reset_token COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_users_verification_token

CREATE INDEX IF NOT EXISTS idx_users_verification_token
    ON public.users USING btree
    (verification_token COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
