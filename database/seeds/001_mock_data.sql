-- Seed data based on the current frontend mock dataset.
-- Safe to run more than once because inserts use ON CONFLICT where practical.

begin;

insert into admin_locations (name, type, aliases) values
  ('Aceh', 'province', '{}'),
  ('Sumatera Utara', 'province', '{sumut}'),
  ('Sumatera Barat', 'province', '{sumbar}'),
  ('Riau', 'province', '{}'),
  ('Kepulauan Riau', 'province', '{}'),
  ('Jambi', 'province', '{}'),
  ('Sumatera Selatan', 'province', '{sumsel}'),
  ('Kepulauan Bangka Belitung', 'province', '{}'),
  ('Bengkulu', 'province', '{}'),
  ('Lampung', 'province', '{}'),
  ('Banten', 'province', '{}'),
  ('DKI Jakarta', 'province', '{jakarta,"daerah khusus ibukota jakarta"}'),
  ('Jawa Barat', 'province', '{jabar}'),
  ('Jawa Tengah', 'province', '{jateng}'),
  ('DI Yogyakarta', 'province', '{yogyakarta,jogja,jogjakarta,yogya}'),
  ('Jawa Timur', 'province', '{jatim}'),
  ('Bali', 'province', '{}'),
  ('Nusa Tenggara Barat', 'province', '{ntb}'),
  ('Nusa Tenggara Timur', 'province', '{ntt}'),
  ('Kalimantan Barat', 'province', '{kalbar}'),
  ('Kalimantan Tengah', 'province', '{kalteng}'),
  ('Kalimantan Selatan', 'province', '{kalsel}'),
  ('Kalimantan Timur', 'province', '{kaltim}'),
  ('Kalimantan Utara', 'province', '{kaltara}'),
  ('Sulawesi Utara', 'province', '{sulut}'),
  ('Gorontalo', 'province', '{}'),
  ('Sulawesi Tengah', 'province', '{sulteng}'),
  ('Sulawesi Barat', 'province', '{sulbar}'),
  ('Sulawesi Selatan', 'province', '{sulsel}'),
  ('Sulawesi Tenggara', 'province', '{sultra}'),
  ('Maluku', 'province', '{}'),
  ('Maluku Utara', 'province', '{}'),
  ('Papua', 'province', '{}'),
  ('Papua Barat', 'province', '{}'),
  ('Papua Selatan', 'province', '{}'),
  ('Papua Tengah', 'province', '{}'),
  ('Papua Pegunungan', 'province', '{}'),
  ('Papua Barat Daya', 'province', '{}')
on conflict do nothing;

insert into admin_locations (name, type, aliases) values
  ('Bali', 'city', '{}'),
  ('Bandung', 'city', '{bdg}'),
  ('Bogor', 'city', '{}'),
  ('Depok', 'city', '{}'),
  ('Jakarta', 'city', '{"dki jakarta","jakarta raya"}'),
  ('Malang', 'city', '{mlg}'),
  ('Surabaya', 'city', '{sby}'),
  ('Yogyakarta', 'city', '{jogja,jogjakarta,jogyakarta,yogya,djogja}')
on conflict do nothing;

insert into admin_locations (name, type, aliases) values
  ('Universitas Gadjah Mada', 'campus', '{ugm}'),
  ('Universitas Negeri Yogyakarta', 'campus', '{uny}'),
  ('Universitas Muhammadiyah Yogyakarta', 'campus', '{umy}'),
  ('Universitas Islam Indonesia', 'campus', '{uii}'),
  ('Universitas Indonesia', 'campus', '{ui}'),
  ('Institut Teknologi Bandung', 'campus', '{itb}'),
  ('Universitas Padjadjaran', 'campus', '{unpad}'),
  ('Universitas Airlangga', 'campus', '{unair}'),
  ('Universitas Brawijaya', 'campus', '{ub}'),
  ('Institut Teknologi Sepuluh Nopember', 'campus', '{its}'),
  ('IPB University', 'campus', '{ipb}'),
  ('BINUS University Kemanggisan', 'campus', '{binus}')
on conflict do nothing;

insert into admin_locations (name, type, aliases) values
  ('Denpasar', 'area', '{}'),
  ('Jimbaran', 'area', '{}'),
  ('Kuta', 'area', '{}'),
  ('Dago', 'area', '{}'),
  ('Dipatiukur', 'area', '{}'),
  ('Buah Batu', 'area', '{}'),
  ('Sukajadi', 'area', '{}'),
  ('Jatinangor', 'area', '{}'),
  ('Dramaga', 'area', '{}'),
  ('Margonda', 'area', '{}'),
  ('Beji', 'area', '{}'),
  ('Kukusan', 'area', '{}'),
  ('Pondok Cina', 'area', '{}'),
  ('Tebet', 'area', '{}'),
  ('Kuningan', 'area', '{}'),
  ('Kemang', 'area', '{}'),
  ('Rawamangun', 'area', '{}'),
  ('Kemanggisan', 'area', '{}'),
  ('Lowokwaru', 'area', '{}'),
  ('Dinoyo', 'area', '{}'),
  ('Tlogomas', 'area', '{}'),
  ('Sumbersari', 'area', '{}'),
  ('Mulyorejo', 'area', '{}'),
  ('Sukolilo', 'area', '{}'),
  ('Rungkut', 'area', '{}'),
  ('Keputih', 'area', '{}'),
  ('Kaliurang', 'area', '{}'),
  ('Seturan', 'area', '{}'),
  ('Gejayan', 'area', '{}'),
  ('Pogung', 'area', '{}'),
  ('Babarsari', 'area', '{}')
on conflict do nothing;

insert into kos_listings (
  id,
  title,
  city,
  monthly_price,
  rating,
  tag,
  address,
  description,
  room_size,
  available_rooms,
  owner_name,
  image_url,
  image_alt,
  is_featured,
  latitude,
  longitude
) values
  (1, 'Kos Melati Margonda Putri', 'Depok', 891000, 4.8, 'Putri', 'Jl. Margonda Raya No. 24, Depok', 'Kamar minimalis dengan pencahayaan hangat, cocok untuk mahasiswa atau pekerja yang butuh akses cepat ke transportasi umum.', '3 x 4 m', 4, 'Ibu Ratna', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85', 'Kamar kos minimalis dengan kasur, meja kecil, dan dekorasi hangat', true, -6.3728000, 106.8321000),
  (2, 'Griya Kaliurang Residence', 'Yogyakarta', 1250000, 4.9, 'Campur', 'Jl. Kaliurang KM 5, Yogyakarta', 'Kos siap huni dengan interior modern, area komunal nyaman, dan lokasi strategis dekat kuliner serta kampus.', '3.5 x 4 m', 2, 'Pak Bima', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=85', 'Interior kamar kos modern dengan tempat tidur dan jendela besar', true, -7.7557000, 110.3807000),
  (3, 'Kos Tubagus Ismail Eksklusif', 'Bandung', 1650000, 4.7, 'Putra', 'Jl. Tubagus Ismail No. 12, Bandung', 'Kos eksklusif di lingkungan tenang dengan akses keamanan dan fasilitas lengkap untuk tinggal jangka panjang.', '4 x 4 m', 1, 'Mas Dimas', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85', 'Bangunan kos modern dengan ruang tinggal yang terang', true, -6.8796000, 107.6158000),
  (101, 'Kos Putri Pogung Nyaman', 'Yogyakarta', 950000, 4.5, 'Putri', 'Pogung, Sinduadi, Mlati, Sleman, DI Yogyakarta', 'Kos nyaman di kawasan Pogung, Yogyakarta, dengan akses mudah menuju Universitas Gadjah Mada.', '3 x 4 m', 1, 'Ibu Sari', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85', 'Interior Kos Putri Pogung Nyaman di Pogung', false, -7.7652000, 110.3724000),
  (102, 'Kos Campur Kaliurang Residence', 'Yogyakarta', 1350000, 4.6, 'Campur', 'Jl. Kaliurang KM 5, Caturtunggal, Sleman, DI Yogyakarta', 'Kos nyaman di kawasan Kaliurang, Yogyakarta, dekat UGM dan UNY.', '3.5 x 4 m', 2, 'Pak Andi', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=85', 'Interior Kos Campur Kaliurang Residence di Kaliurang', false, -7.7557000, 110.3807000),
  (103, 'Kos Kukusan Dekat UI', 'Depok', 1200000, 4.7, 'Campur', 'Kukusan, Beji, Kota Depok, Jawa Barat', 'Kos nyaman di kawasan Kukusan, Depok, dekat Universitas Indonesia.', '3 x 4 m', 3, 'Ibu Sari', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85', 'Interior Kos Kukusan Dekat UI di Kukusan', false, -6.3627000, 106.8249000),
  (104, 'Kos Putri Margonda', 'Depok', 1500000, 4.8, 'Putri', 'Jl. Margonda Raya, Beji, Kota Depok, Jawa Barat', 'Kos nyaman di kawasan Margonda, Depok, dekat UI dan Gunadarma.', '3.5 x 4 m', 4, 'Pak Andi', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85', 'Interior Kos Putri Margonda di Margonda', false, -6.3728000, 106.8321000),
  (105, 'Kos Putra Dago Asri', 'Bandung', 1650000, 4.9, 'Putra', 'Dago, Coblong, Kota Bandung, Jawa Barat', 'Kos nyaman di kawasan Dago, Bandung, dekat ITB.', '3 x 4 m', 0, 'Ibu Sari', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=85', 'Interior Kos Putra Dago Asri di Dago', false, -6.8796000, 107.6158000),
  (106, 'Kos Jatinangor Student House', 'Bandung', 1100000, 4.5, 'Campur', 'Jl. Raya Jatinangor, Sumedang, Jawa Barat', 'Kos nyaman di kawasan Jatinangor, Bandung, dekat Universitas Padjadjaran.', '3.5 x 4 m', 2, 'Pak Andi', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85', 'Interior Kos Jatinangor Student House di Jatinangor', false, -6.9281000, 107.7696000),
  (107, 'Kos Dramaga Dekat IPB', 'Bogor', 850000, 4.6, 'Putra', 'Babakan, Dramaga, Kabupaten Bogor, Jawa Barat', 'Kos nyaman di kawasan Dramaga, Bogor, dekat IPB University.', '3 x 4 m', 3, 'Ibu Sari', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85', 'Interior Kos Dramaga Dekat IPB di Dramaga', false, -6.5591000, 106.7255000),
  (108, 'Kos Jimbaran Kampus Udayana', 'Bali', 1450000, 4.7, 'Campur', 'Jimbaran, Kuta Selatan, Kabupaten Badung, Bali', 'Kos nyaman di kawasan Jimbaran, Bali, dekat Universitas Udayana.', '3.5 x 4 m', 4, 'Pak Andi', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=85', 'Interior Kos Jimbaran Kampus Udayana di Jimbaran', false, -8.7908000, 115.1722000),
  (109, 'Kos Kemanggisan BINUS', 'Jakarta', 2100000, 4.8, 'Campur', 'Kemanggisan, Palmerah, Jakarta Barat', 'Kos nyaman di kawasan Kemanggisan, Jakarta, dekat BINUS.', '3 x 4 m', 0, 'Ibu Sari', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85', 'Interior Kos Kemanggisan BINUS di Kemanggisan', false, -6.2017000, 106.7824000),
  (110, 'Kos Rawamangun UNJ', 'Jakarta', 1750000, 4.9, 'Putri', 'Rawamangun, Pulo Gadung, Jakarta Timur', 'Kos nyaman di kawasan Rawamangun, Jakarta, dekat UNJ.', '3.5 x 4 m', 2, 'Pak Andi', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85', 'Interior Kos Rawamangun UNJ di Rawamangun', false, -6.1939000, 106.8841000),
  (111, 'Kos Lowokwaru UB', 'Malang', 1000000, 4.5, 'Campur', 'Lowokwaru, Kota Malang, Jawa Timur', 'Kos nyaman di kawasan Lowokwaru, Malang, dekat UB dan UM.', '3 x 4 m', 3, 'Ibu Sari', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=85', 'Interior Kos Lowokwaru UB di Lowokwaru', false, -7.9525000, 112.6138000),
  (112, 'Kos Keputih ITS', 'Surabaya', 1250000, 4.6, 'Putra', 'Keputih, Sukolilo, Kota Surabaya', 'Kos nyaman di kawasan Keputih, Surabaya, dekat ITS.', '3.5 x 4 m', 4, 'Pak Andi', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85', 'Interior Kos Keputih ITS di Keputih', false, -7.2891000, 112.7978000)
on conflict (id) do nothing;

insert into kos_payment_terms (
  kos_id,
  dp_percentage,
  service_fee,
  admin_fee,
  deposit,
  discount_percentage
)
select id, 30, 15000, 25000, 200000,
  case
    when id in (1, 101, 104, 107, 110) then 7
    when id = 2 then 12
    when id = 3 then 11
    else 0
  end
from kos_listings
on conflict (kos_id) do nothing;

insert into kos_facilities (kos_id, name, sort_order)
select kos_id, facility, sort_order
from (
  values
    ('Kasur', 1),
    ('Lemari', 2),
    ('Meja belajar', 3),
    ('Wi-Fi', 4),
    ('Kamar mandi dalam', 5),
    ('Parkir motor', 6),
    ('AC', 7)
) as base(facility, sort_order)
cross join (select id as kos_id from kos_listings) listings
on conflict do nothing;

insert into kos_facility_categories (kos_id, id, title, sort_order)
select kos_id, category_id, title, sort_order
from (select id as kos_id from kos_listings) listings
cross join (
  values
    ('kamar', 'Fasilitas kamar', 1),
    ('kamar-mandi', 'Fasilitas kamar mandi', 2),
    ('bersama', 'Fasilitas bersama', 3)
) categories(category_id, title, sort_order)
on conflict do nothing;

insert into kos_facility_category_items (kos_id, category_id, name, sort_order)
select kos_id, category_id, name, sort_order
from (select id as kos_id from kos_listings) listings
cross join (
  values
    ('kamar', 'Kasur', 1),
    ('kamar', 'Lemari', 2),
    ('kamar', 'Meja belajar', 3),
    ('kamar', 'AC', 4),
    ('kamar-mandi', 'Kamar mandi dalam', 1),
    ('kamar-mandi', 'Kloset duduk', 2),
    ('kamar-mandi', 'Shower', 3),
    ('bersama', 'Wi-Fi', 1),
    ('bersama', 'Parkir motor', 2),
    ('bersama', 'CCTV', 3)
) items(category_id, name, sort_order)
on conflict do nothing;

insert into kos_rules (kos_id, rule, sort_order)
select kos_id, rule, sort_order
from (select id as kos_id from kos_listings) listings
cross join (
  values
    ('Tidak merokok di dalam kamar', 1),
    ('Tamu wajib melapor kepada pemilik', 2),
    ('Wajib jaga kebersihan', 3)
) rules(rule, sort_order)
on conflict do nothing;

insert into kos_rental_durations (kos_id, duration, sort_order)
select kos_id, duration::rental_duration, sort_order
from (select id as kos_id from kos_listings) listings
cross join (
  values
    ('Bulanan', 1),
    ('3 Bulan', 2),
    ('6 Bulan', 3),
    ('Tahunan', 4)
) durations(duration, sort_order)
on conflict do nothing;

insert into kos_media (
  kos_id,
  id,
  category,
  label,
  type,
  url,
  thumbnail_url,
  alt,
  sort_order
)
select
  id,
  'video-tour',
  'video-tour',
  'Video tour',
  'video',
  '/videos/kos-tour.mp4',
  image_url,
  'Video tour interior kos',
  1
from kos_listings
on conflict do nothing;

insert into kos_media (
  kos_id,
  id,
  category,
  label,
  type,
  url,
  alt,
  sort_order
)
select id, 'bedroom-1', 'bedroom', 'Kamar tidur', 'image', image_url, image_alt, 2
from kos_listings
on conflict do nothing;

insert into kos_media (
  kos_id,
  id,
  category,
  label,
  type,
  url,
  alt,
  sort_order
)
select id, 'common-area-1', 'common-area', 'Area bersama', 'image', image_url, image_alt, 3
from kos_listings
on conflict do nothing;

insert into kos_nearby_campuses (kos_id, campus_name, sort_order) values
  (1, 'Universitas Indonesia', 1),
  (2, 'Universitas Gadjah Mada', 1),
  (2, 'Universitas Negeri Yogyakarta', 2),
  (3, 'Institut Teknologi Bandung', 1),
  (101, 'Universitas Gadjah Mada', 1),
  (102, 'Universitas Gadjah Mada', 1),
  (102, 'Universitas Negeri Yogyakarta', 2),
  (103, 'Universitas Indonesia', 1),
  (103, 'Politeknik Negeri Jakarta', 2),
  (104, 'Universitas Indonesia', 1),
  (104, 'Universitas Gunadarma', 2),
  (105, 'Institut Teknologi Bandung', 1),
  (106, 'Universitas Padjadjaran', 1),
  (107, 'IPB University', 1),
  (108, 'Universitas Udayana', 1),
  (109, 'BINUS University Kemanggisan', 1),
  (110, 'Universitas Negeri Jakarta', 1),
  (111, 'Universitas Brawijaya', 1),
  (111, 'Universitas Negeri Malang', 2),
  (112, 'Institut Teknologi Sepuluh Nopember', 1)
on conflict do nothing;

commit;
