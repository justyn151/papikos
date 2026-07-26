-- Rich owner-managed listing content.
-- A listing represents one room type, with its own inventory, price, and gallery.

begin;

alter table kos_listings
  add column room_type_name text not null default 'Kamar standar',
  add column total_rooms integer,
  add column address_notes text not null default '',
  add column last_inventory_update timestamptz;

update kos_listings
set
  total_rooms = greatest(available_rooms, 1),
  last_inventory_update = coalesce(updated_at, created_at);

alter table kos_listings
  alter column total_rooms set not null,
  alter column total_rooms set default 1,
  add constraint kos_total_rooms_non_negative check (total_rooms >= 0),
  add constraint kos_available_rooms_within_total check (
    available_rooms <= total_rooms
  );

create index kos_listings_owner_inventory_idx
  on kos_listings (owner_user_id, last_inventory_update desc);

commit;
