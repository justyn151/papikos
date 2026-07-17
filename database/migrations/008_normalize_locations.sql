-- Complete the location hierarchy and replace repeated nearby-campus text with
-- foreign-key assignments. A compatibility view preserves existing readers.

begin;

create table kos_campus_assignments (
  kos_id bigint not null references kos_listings(id) on delete cascade,
  campus_id bigint not null references admin_locations(id) on delete restrict,
  sort_order integer not null default 0,
  primary key (kos_id, campus_id)
);

create index kos_campus_assignments_campus_idx
  on kos_campus_assignments (campus_id, kos_id);

-- Repair area rows created by older seeds that omitted their city parent.
update admin_locations child
set parent_id = parent.id
from (
  values
    ('Denpasar', 'Bali'), ('Jimbaran', 'Bali'), ('Kuta', 'Bali'),
    ('Dago', 'Bandung'), ('Dipatiukur', 'Bandung'),
    ('Buah Batu', 'Bandung'), ('Sukajadi', 'Bandung'),
    ('Jatinangor', 'Bandung'), ('Dramaga', 'Bogor'),
    ('Margonda', 'Depok'), ('Beji', 'Depok'), ('Kukusan', 'Depok'),
    ('Pondok Cina', 'Depok'), ('Tebet', 'Jakarta'),
    ('Kuningan', 'Jakarta'), ('Kemang', 'Jakarta'),
    ('Rawamangun', 'Jakarta'), ('Kemanggisan', 'Jakarta'),
    ('Lowokwaru', 'Malang'), ('Dinoyo', 'Malang'),
    ('Tlogomas', 'Malang'), ('Sumbersari', 'Malang'),
    ('Mulyorejo', 'Surabaya'), ('Sukolilo', 'Surabaya'),
    ('Rungkut', 'Surabaya'), ('Keputih', 'Surabaya'),
    ('Kaliurang', 'Yogyakarta'), ('Seturan', 'Yogyakarta'),
    ('Gejayan', 'Yogyakarta'), ('Pogung', 'Yogyakarta'),
    ('Babarsari', 'Yogyakarta')
) mapping(child_name, parent_name)
join admin_locations parent
  on parent.name = mapping.parent_name and parent.type = 'city'
where child.name = mapping.child_name
  and child.type = 'area'
  and child.parent_id is null;

-- Add campuses referenced by listings but absent from older location catalogs.
insert into admin_locations (name, type, parent_id, aliases)
select mapping.name, 'campus', city.id, mapping.aliases
from (
  values
    ('Politeknik Negeri Jakarta', 'Depok', '{pnj}'::text[]),
    ('Universitas Gunadarma', 'Depok', '{gunadarma}'::text[]),
    ('Universitas Negeri Jakarta', 'Jakarta', '{unj}'::text[]),
    ('Universitas Negeri Malang', 'Malang', '{um}'::text[]),
    ('Universitas Udayana', 'Bali', '{unud}'::text[])
) mapping(name, city_name, aliases)
join admin_locations city
  on city.name = mapping.city_name and city.type = 'city'
on conflict do nothing;

-- Repair campus rows created by older seeds that omitted their city parent.
update admin_locations child
set parent_id = parent.id
from (
  values
    ('Universitas Gadjah Mada', 'Yogyakarta'),
    ('Universitas Negeri Yogyakarta', 'Yogyakarta'),
    ('Universitas Muhammadiyah Yogyakarta', 'Yogyakarta'),
    ('Universitas Islam Indonesia', 'Yogyakarta'),
    ('Universitas Indonesia', 'Depok'),
    ('Politeknik Negeri Jakarta', 'Depok'),
    ('Universitas Gunadarma', 'Depok'),
    ('Institut Teknologi Bandung', 'Bandung'),
    ('Universitas Padjadjaran', 'Bandung'),
    ('Universitas Airlangga', 'Surabaya'),
    ('Institut Teknologi Sepuluh Nopember', 'Surabaya'),
    ('Universitas Brawijaya', 'Malang'),
    ('Universitas Negeri Malang', 'Malang'),
    ('IPB University', 'Bogor'),
    ('BINUS University Kemanggisan', 'Jakarta'),
    ('Universitas Negeri Jakarta', 'Jakarta'),
    ('Universitas Udayana', 'Bali')
) mapping(child_name, parent_name)
join admin_locations parent
  on parent.name = mapping.parent_name and parent.type = 'city'
where child.name = mapping.child_name
  and child.type = 'campus'
  and child.parent_id is null;

insert into kos_campus_assignments (kos_id, campus_id, sort_order)
select legacy.kos_id, campus.id, legacy.sort_order
from kos_nearby_campuses legacy
join admin_locations campus
  on campus.name = legacy.campus_name and campus.type = 'campus'
on conflict (kos_id, campus_id) do update
set sort_order = excluded.sort_order;

do $$
begin
  if (select count(*) from kos_campus_assignments)
     <> (select count(*) from kos_nearby_campuses) then
    raise exception 'Cannot normalize campuses: catalog entries are missing';
  end if;
end
$$;

drop table kos_nearby_campuses;

create view kos_nearby_campuses as
select
  assignment.kos_id,
  campus.name as campus_name,
  assignment.sort_order
from kos_campus_assignments assignment
join admin_locations campus on campus.id = assignment.campus_id;

commit;
