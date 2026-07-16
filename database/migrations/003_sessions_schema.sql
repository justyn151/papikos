-- Server-side browser sessions. Only a SHA-256 hash of the random token is stored.

begin;

create table user_sessions (
  token_hash text primary key,
  user_id bigint not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index user_sessions_user_idx on user_sessions (user_id);
create index user_sessions_expiry_idx on user_sessions (expires_at);

commit;
