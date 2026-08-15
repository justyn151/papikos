import type {
  Amenity,
  CostItem,
  FacilityItem,
  GalleryItem,
  HouseRule,
  Landmark,
  Listing,
  ListingDetail,
  ListingQuestion,
  LocalizedText,
  RoomOption,
} from "./types";

const text = (id: string, en: string): LocalizedText => ({ id, en });

export const cities = ["Jakarta", "Bandung", "Yogyakarta", "Surabaya"];

export const amenities: Amenity[] = [
  "wifi",
  "ac",
  "privateBathroom",
  "motorParking",
  "kitchen",
  "laundry",
];

export const listings: Listing[] = [
  {
    id: "senja-setiabudi",
    name: "Papikos Senja Setiabudi",
    city: "Jakarta",
    district: "Setiabudi",
    type: "campur",
    price: 2450000,
    amenities: ["wifi", "ac", "privateBathroom", "laundry"],
    availableRooms: 2,
    verified: true,
    tone: "from-blue-700 via-blue-600 to-cyan-500",
    accent: "bg-cyan-200",
  },
  {
    id: "asri-dago",
    name: "Kos Asri Dago",
    city: "Bandung",
    district: "Coblong",
    type: "putri",
    price: 1650000,
    amenities: ["wifi", "privateBathroom", "motorParking", "kitchen"],
    availableRooms: 3,
    verified: true,
    tone: "from-indigo-700 via-blue-600 to-sky-400",
    accent: "bg-amber-200",
  },
  {
    id: "kalyana-gejayan",
    name: "Kalyana Living Gejayan",
    city: "Yogyakarta",
    district: "Depok",
    type: "putri",
    price: 1350000,
    amenities: ["wifi", "ac", "privateBathroom", "motorParking"],
    availableRooms: 1,
    verified: true,
    tone: "from-sky-700 via-cyan-600 to-teal-400",
    accent: "bg-rose-200",
  },
  {
    id: "ruang-teduh",
    name: "Ruang Teduh Keputih",
    city: "Surabaya",
    district: "Sukolilo",
    type: "putra",
    price: 1200000,
    amenities: ["wifi", "motorParking", "kitchen"],
    availableRooms: 4,
    verified: false,
    tone: "from-slate-700 via-blue-700 to-blue-400",
    accent: "bg-lime-200",
  },
  {
    id: "nara-kemang",
    name: "Nara House Kemang",
    city: "Jakarta",
    district: "Mampang Prapatan",
    type: "campur",
    price: 2850000,
    amenities: ["wifi", "ac", "privateBathroom", "motorParking", "kitchen"],
    availableRooms: 2,
    verified: true,
    tone: "from-blue-950 via-indigo-800 to-blue-500",
    accent: "bg-violet-200",
  },
  {
    id: "bumi-pasteur",
    name: "Bumi Pasteur Residence",
    city: "Bandung",
    district: "Sukajadi",
    type: "putra",
    price: 1850000,
    amenities: ["wifi", "ac", "motorParking", "laundry"],
    availableRooms: 5,
    verified: true,
    tone: "from-cyan-800 via-sky-600 to-blue-400",
    accent: "bg-orange-200",
  },
  {
    id: "oma-pogung",
    name: "Omah Pogung Ceria",
    city: "Yogyakarta",
    district: "Mlati",
    type: "campur",
    price: 950000,
    amenities: ["wifi", "motorParking", "kitchen", "laundry"],
    availableRooms: 3,
    verified: false,
    tone: "from-blue-800 via-cyan-700 to-emerald-400",
    accent: "bg-sky-200",
  },
  {
    id: "taman-rungkut",
    name: "Taman Rungkut Putri",
    city: "Surabaya",
    district: "Rungkut",
    type: "putri",
    price: 1550000,
    amenities: ["wifi", "ac", "privateBathroom", "kitchen", "laundry"],
    availableRooms: 2,
    verified: true,
    tone: "from-indigo-900 via-blue-700 to-cyan-400",
    accent: "bg-fuchsia-200",
  },
  {
    id: "melati-tebet",
    name: "Kos Melati Tebet",
    city: "Jakarta",
    district: "Tebet",
    type: "putri",
    price: 1750000,
    amenities: ["wifi", "ac", "privateBathroom", "laundry"],
    availableRooms: 0,
    verified: true,
    tone: "from-blue-800 via-indigo-600 to-sky-400",
    accent: "bg-rose-200",
  },
];

const descriptions: Record<string, LocalizedText> = {
  "senja-setiabudi": text(
    "Kos modern yang tenang di tengah Setiabudi, dengan ruang bersama terang dan akses mudah ke kawasan perkantoran.",
    "A calm modern kos in central Setiabudi, with bright shared spaces and easy access to business districts.",
  ),
  "asri-dago": text(
    "Hunian putri yang nyaman di area Dago, cocok untuk mahasiswa dan pekerja yang mengutamakan lingkungan teduh.",
    "A comfortable women-only residence in Dago, suited to students and professionals who value a leafy neighborhood.",
  ),
  "kalyana-gejayan": text(
    "Kos putri ringkas dekat pusat aktivitas Gejayan, dengan kamar siap huni dan kebutuhan harian dalam jangkauan.",
    "A compact women-only kos near lively Gejayan, with move-in-ready rooms and daily essentials nearby.",
  ),
  "ruang-teduh": text(
    "Kos putra sederhana dengan suasana rumahan di Keputih, dekat kampus dan pilihan makan yang terjangkau.",
    "A straightforward men-only kos with a homely feel in Keputih, near campuses and affordable food.",
  ),
  "nara-kemang": text(
    "Hunian urban dengan kamar lega dan area bersama rapi, berada dekat pusat kuliner dan perkantoran Kemang.",
    "An urban residence with generous rooms and tidy shared spaces near Kemang dining and offices.",
  ),
  "bumi-pasteur": text(
    "Kos putra dengan akses praktis ke Pasteur, menawarkan pilihan kamar nyaman untuk mobilitas harian yang tinggi.",
    "A men-only kos with practical Pasteur access and comfortable rooms for highly mobile residents.",
  ),
  "oma-pogung": text(
    "Kos campur bernuansa hangat di Pogung, cocok untuk penghuni yang mencari harga bersahabat dan dapur bersama.",
    "A warm mixed kos in Pogung for residents seeking approachable pricing and a shared kitchen.",
  ),
  "taman-rungkut": text(
    "Kos putri yang tertata di Rungkut dengan fasilitas harian lengkap dan suasana lingkungan yang lebih tenang.",
    "A well-kept women-only kos in Rungkut with practical facilities and a quieter neighborhood atmosphere.",
  ),
  "melati-tebet": text(
    "Kos putri di Tebet dengan kamar ber-AC dan akses cepat ke stasiun; seluruh kamar sedang terisi penuh.",
    "A women-only kos in Tebet with air-conditioned rooms and quick station access; every room is currently occupied.",
  ),
};

const areaLandmarks: Record<string, [string, string, string, string]> = {
  Jakarta: ["Halte TransJakarta", "Kuningan City", "RS MMC", "Universitas Bakrie"],
  Bandung: ["Halte Pasteur", "Paris Van Java", "RS Advent", "ITB"],
  Yogyakarta: ["Halte Trans Jogja", "Plaza Ambarrukmo", "RS Panti Rapih", "UGM"],
  Surabaya: ["Halte Suroboyo Bus", "Transmart", "RS Premier", "ITS"],
};

const amenityFacility: Record<Amenity, FacilityItem> = {
  wifi: {
    id: "wifi",
    label: text("Wi-Fi seluruh area", "Property-wide Wi-Fi"),
    category: "service",
  },
  ac: {
    id: "ac",
    label: text("AC di dalam kamar", "In-room air conditioning"),
    category: "room",
  },
  privateBathroom: {
    id: "private-bathroom",
    label: text("Kamar mandi dalam", "Private bathroom"),
    category: "room",
  },
  motorParking: {
    id: "motor-parking",
    label: text("Parkir motor", "Motorbike parking"),
    category: "parking",
  },
  kitchen: {
    id: "kitchen",
    label: text("Dapur bersama", "Shared kitchen"),
    category: "shared",
  },
  laundry: {
    id: "laundry",
    label: text("Area laundry", "Laundry area"),
    category: "service",
  },
};

function createGallery(listing: Listing, index: number): GalleryItem[] {
  return [
    {
      id: `${listing.id}-room`,
      category: "room",
      label: text("Kamar utama", "Main room"),
      variant: index,
    },
    {
      id: `${listing.id}-bathroom`,
      category: "bathroom",
      label: text("Kamar mandi", "Bathroom"),
      variant: index + 1,
    },
    {
      id: `${listing.id}-shared`,
      category: "shared",
      label: text("Area bersama", "Shared area"),
      variant: index + 2,
    },
    {
      id: `${listing.id}-exterior`,
      category: "exterior",
      label: text("Tampak depan", "Exterior"),
      variant: index + 3,
    },
    {
      id: `${listing.id}-area`,
      category: "neighborhood",
      label: text("Sekitar kos", "Neighborhood"),
      variant: index + 4,
    },
  ];
}

function createRooms(listing: Listing, index: number): RoomOption[] {
  const privateBath = listing.amenities.includes("privateBathroom");
  const standardAvailable =
    listing.availableRooms === 0
      ? 0
      : Math.max(1, Math.ceil(listing.availableRooms / 2));
  return [
    {
      id: `${listing.id}-standard`,
      name: text("Kamar Standard", "Standard room"),
      size: `${3 + (index % 2)} × 3 m`,
      price: listing.price,
      availableRooms: standardAvailable,
      bathroom: privateBath ? "private" : "shared",
      furnishings: [
        text("Tempat tidur", "Bed"),
        text("Lemari", "Wardrobe"),
        text("Meja kerja", "Desk"),
      ],
    },
    {
      id: `${listing.id}-plus`,
      name: text("Kamar Plus", "Plus room"),
      size: `${3 + (index % 2)} × 4 m`,
      price: listing.price + 250000,
      availableRooms: Math.max(0, listing.availableRooms - standardAvailable),
      bathroom: privateBath ? "private" : "shared",
      furnishings: [
        text("Tempat tidur besar", "Large bed"),
        text("Lemari", "Wardrobe"),
        text("Meja kerja", "Desk"),
        text("Jendela luar", "Exterior window"),
      ],
    },
  ];
}

function createCosts(listing: Listing, index: number): CostItem[] {
  return [
    {
      id: "water",
      label: text("Air", "Water"),
      amount: null,
      included: true,
    },
    {
      id: "electricity",
      label: text("Listrik", "Electricity"),
      amount: null,
      included: false,
      note: text("Sesuai meter kamar", "Based on the room meter"),
    },
    {
      id: "parking",
      label: text("Parkir motor", "Motorbike parking"),
      amount: listing.amenities.includes("motorParking")
        ? 50000 + (index % 2) * 25000
        : null,
      included: false,
      note: listing.amenities.includes("motorParking")
        ? undefined
        : text("Tidak tersedia", "Not available"),
    },
    {
      id: "deposit",
      label: text("Deposit", "Deposit"),
      amount: null,
      included: true,
      note: text("Tidak ada deposit", "No deposit required"),
    },
  ];
}

function createRules(listing: Listing): HouseRule[] {
  return [
    {
      id: "access",
      label: text("Akses penghuni 24 jam", "24-hour resident access"),
      allowed: true,
    },
    {
      id: "guests",
      label: text("Tamu wajib melapor", "Guests must be registered"),
      allowed: true,
    },
    {
      id: "smoking",
      label: text("Merokok di dalam kamar", "Smoking inside rooms"),
      allowed: false,
    },
    {
      id: "pets",
      label: text("Membawa hewan peliharaan", "Pets"),
      allowed: false,
    },
    {
      id: "couples",
      label: text("Pasangan menikah", "Married couples"),
      allowed: listing.type === "campur",
    },
  ];
}

function createLandmarks(listing: Listing, index: number): Landmark[] {
  const names = areaLandmarks[listing.city];
  const kinds = ["transit", "shopping", "health", "campus"] as const;
  return names.map((name, landmarkIndex) => ({
    id: `${listing.id}-landmark-${landmarkIndex}`,
    name,
    kind: kinds[landmarkIndex],
    distanceKm: Number((0.6 + landmarkIndex * 0.7 + (index % 3) * 0.2).toFixed(1)),
    travelMinutes: 5 + landmarkIndex * 4 + (index % 3),
  }));
}

function createQuestions(listing: Listing): ListingQuestion[] {
  return [
    {
      id: `${listing.id}-q-1`,
      question: text(
        "Apakah listrik sudah termasuk harga sewa?",
        "Is electricity included in the rent?",
      ),
      answer: text(
        "Belum. Pemakaian listrik dihitung dari meter masing-masing kamar.",
        "No. Electricity is charged from each room's meter.",
      ),
      status: "answered",
    },
    {
      id: `${listing.id}-q-2`,
      question: text(
        "Apakah kamar bisa disurvei sebelum mengajukan sewa?",
        "Can I visit the room before submitting a rental request?",
      ),
      answer: text(
        "Bisa. Ajukan pertanyaan dengan tanggal yang diinginkan agar pemilik dapat mengonfirmasi.",
        "Yes. Ask with your preferred date so the owner can confirm.",
      ),
      status: "answered",
    },
  ];
}

export const listingDetails: ListingDetail[] = listings.map((listing, index) => ({
  ...listing,
  description: descriptions[listing.id],
  updatedAt: `2026-07-${String(24 - (index % 5)).padStart(2, "0")}`,
  availableFrom: `2026-08-${String(1 + (index % 4) * 4).padStart(2, "0")}`,
  minimumStayMonths: index % 3 === 0 ? 3 : 1,
  approximateArea: `${listing.district}, ${listing.city}`,
  privacyRadiusMeters: 450,
  ownerName: [
    "Ayu Pratama",
    "Nadia Kusuma",
    "Dewi Larasati",
    "Bima Santoso",
    "Raka Wijaya",
    "Fajar Nugraha",
    "Mira Handayani",
    "Sinta Maharani",
    "Laras Pertiwi",
  ][index],
  ownerSince: 2018 + (index % 5),
  gallery: createGallery(listing, index),
  rooms: createRooms(listing, index),
  costs: createCosts(listing, index),
  facilities: [
    ...listing.amenities.map((amenity) => amenityFacility[amenity]),
    {
      id: "cctv",
      label: text("CCTV area masuk", "Entrance CCTV"),
      category: "security" as const,
    },
    {
      id: "cleaning",
      label: text("Kebersihan area bersama", "Shared-area cleaning"),
      category: "service" as const,
    },
  ],
  rules: createRules(listing),
  landmarks: createLandmarks(listing, index),
  questions: createQuestions(listing),
  verification: {
    identity: listing.verified,
    property: listing.verified,
    checkedAt: `2026-07-${String(20 - (index % 4)).padStart(2, "0")}`,
  },
}));

export function getListingDetail(id: string) {
  return listingDetails.find((listing) => listing.id === id);
}

export function getRelatedListings(listing: ListingDetail, limit = 3) {
  return listingDetails
    .filter((candidate) => candidate.id !== listing.id)
    .map((candidate) => ({
      listing: candidate,
      score:
        (candidate.city === listing.city ? 4 : 0) +
        (candidate.type === listing.type ? 3 : 0) +
        Math.max(
          0,
          3 - Math.floor(Math.abs(candidate.price - listing.price) / 500000),
        ),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        Math.abs(a.listing.price - listing.price) -
          Math.abs(b.listing.price - listing.price),
    )
    .slice(0, limit)
    .map(({ listing: related }) => related);
}
