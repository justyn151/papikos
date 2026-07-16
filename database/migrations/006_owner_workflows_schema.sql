-- Associate owner accounts with listings for authorized request management.

begin;

alter table kos_listings
  add column owner_user_id bigint references users(id) on delete set null;

create index kos_listings_owner_user_idx on kos_listings (owner_user_id);

commit;
