-- One-time, expiring password reset tokens.

begin;

create table password_reset_tokens (
  token_hash text primary key,
  user_id bigint not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index password_reset_tokens_user_idx on password_reset_tokens (user_id);
create index password_reset_tokens_expiry_idx on password_reset_tokens (expires_at);

commit;
