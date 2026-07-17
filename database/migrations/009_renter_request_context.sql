-- Store the context an owner needs to evaluate renter requests. Account data
-- identifies the requester; these fields preserve who visits and when a renter
-- intends to move in even if the account is later edited.

begin;

alter table survey_requests
  add column visitor_type text not null default 'self'
    check (visitor_type in ('self', 'representative')),
  add column visitor_name text,
  add column visitor_phone text,
  add column relationship text not null default '';

update survey_requests request
set
  visitor_name = renter.full_name,
  visitor_phone = renter.phone_number
from users renter
where renter.id = request.renter_id;

alter table survey_requests
  alter column visitor_name set not null,
  alter column visitor_phone set not null,
  add constraint survey_representative_identity_complete check (
    visitor_type = 'self'
    or (
      length(trim(visitor_name)) > 0
      and length(trim(visitor_phone)) > 0
      and length(trim(relationship)) > 0
    )
  );

alter table contact_requests
  add column preferred_contact_method text not null default 'chat'
    check (preferred_contact_method in ('chat', 'whatsapp', 'phone'));

alter table rental_applications
  add column move_in_date date,
  add column notes text not null default '';

update rental_applications
set move_in_date = created_at::date
where move_in_date is null;

alter table rental_applications
  alter column move_in_date set not null;

create index rental_applications_move_in_idx
  on rental_applications (kos_id, move_in_date, status);

commit;
