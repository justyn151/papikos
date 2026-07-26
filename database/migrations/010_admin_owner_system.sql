-- Admin accounts, owner verification, and listing moderation.
-- Existing listings stay publicly visible; new owner listings start as drafts.

alter type user_role add value if not exists 'admin';

begin;

create type user_verification_status as enum (
  'not_required',
  'pending',
  'verified',
  'rejected'
);

create type listing_moderation_status as enum (
  'draft',
  'pending',
  'published',
  'rejected',
  'archived'
);

alter table users
  add column is_active boolean not null default true,
  add column verification_status user_verification_status not null default 'not_required';

update users
set verification_status = 'pending'
where role = 'pemilik-kos';

alter table users
  add constraint users_verification_role_check check (
    role = 'pemilik-kos' or verification_status = 'not_required'
  );

alter table kos_listings
  add column moderation_status listing_moderation_status not null default 'published',
  add column review_notes text not null default '',
  add column submitted_at timestamptz,
  add column reviewed_at timestamptz,
  add column reviewed_by bigint references users(id) on delete set null,
  add column published_at timestamptz;

update kos_listings
set
  submitted_at = coalesce(submitted_at, created_at),
  reviewed_at = coalesce(reviewed_at, created_at),
  published_at = coalesce(published_at, created_at)
where moderation_status = 'published';

create index users_admin_dashboard_idx
  on users (role, verification_status, is_active, created_at desc);

create index kos_listings_moderation_idx
  on kos_listings (moderation_status, updated_at desc);

create index kos_listings_owner_moderation_idx
  on kos_listings (owner_user_id, moderation_status, updated_at desc);

commit;
