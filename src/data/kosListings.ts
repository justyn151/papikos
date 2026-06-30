import type { KosListing, KosMedia } from '../types/kos'
import { dummyKosSearchRecords } from './searchData'

const minimalKosImage =
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85'
const readyKosImage =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=85'
const exclusiveKosImage =
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85'

function createCategoryMedia(
  category: string,
  label: string,
  imageUrls: string[],
): KosMedia[] {
  return imageUrls.map((url, index) => ({
    id: category + '-' + (index + 1),
    category,
    label,
    type: 'image',
    url,
    alt: label + ' kos dari sudut ' + (index + 1),
  }))
}

function createListingMedia(imageUrls: string[]): KosMedia[] {
  return [
    {
      id: 'video-tour',
      category: 'video-tour',
      label: 'Video tour',
      type: 'video',
      url: '/videos/kos-tour.mp4',
      thumbnailUrl: imageUrls[0],
      alt: 'Video tour interior kos',
    },
    ...createCategoryMedia('bedroom', 'Kamar tidur', imageUrls),
    ...createCategoryMedia('study-area', 'Area belajar', imageUrls.slice(0, 2)),
    ...createCategoryMedia('bathroom', 'Kamar mandi', imageUrls.slice(1, 3)),
    ...createCategoryMedia('kitchen', 'Dapur', imageUrls.slice(0, 2)),
    ...createCategoryMedia('common-area', 'Area bersama', [imageUrls[0], imageUrls[2]]),
  ]
}

export const featuredKosListings: KosListing[] = [
  {
    id: 1,
    title: 'Kos Melati Margonda Putri',
    location: 'Depok',
    monthlyPrice: 891000,
    rating: 4.8,
    tag: 'Putri',
    address: 'Jl. Margonda Raya No. 24, Depok',
    description:
      'Kamar minimalis dengan pencahayaan hangat, cocok untuk mahasiswa atau pekerja yang butuh akses cepat ke transportasi umum.',
    facilities: ['Kasur', 'Lemari', 'Meja belajar', 'Wi-Fi', 'Kamar mandi luar'],
    facilityCategories: [
      {
        id: 'kamar',
        title: 'Fasilitas kamar',
        items: ['Kasur', 'Lemari', 'Meja belajar', 'Jendela', 'Ventilasi'],
      },
      {
        id: 'kamar-mandi',
        title: 'Fasilitas kamar mandi',
        items: ['Kamar mandi luar', 'Kloset duduk', 'Shower'],
      },
      {
        id: 'bersama',
        title: 'Fasilitas bersama',
        items: ['Wi-Fi', 'Dapur bersama', 'Parkir motor'],
      },
    ],
    rules: ['Maksimal 1 orang/kamar', 'Jam tamu sampai 21.00', 'Wajib jaga kebersihan'],
    roomSize: '3 x 4 m',
    availableRooms: 4,
    rentalDurations: ['Bulanan', '3 Bulan', '6 Bulan', 'Tahunan'],
    owner: 'Ibu Ratna',
    paymentTerms: {
      dpPercentage: 30,
      serviceFee: 15000,
      adminFee: 25000,
      deposit: 200000,
      discountPercentage: 7,
    },
    imageUrl: minimalKosImage,
    imageAlt: 'Kamar kos minimalis dengan kasur, meja kecil, dan dekorasi hangat',
    media: createListingMedia([minimalKosImage, readyKosImage, exclusiveKosImage]),
  },
  {
    id: 2,
    title: 'Griya Kaliurang Residence',
    location: 'Yogyakarta',
    monthlyPrice: 1250000,
    rating: 4.9,
    tag: 'Campur',
    address: 'Jl. Kaliurang KM 5, Yogyakarta',
    description:
      'Kos siap huni dengan interior modern, area komunal nyaman, dan lokasi strategis dekat kuliner serta kampus.',
    facilities: ['AC', 'Kamar mandi dalam', 'Wi-Fi', 'Dapur bersama', 'Parkir motor'],
    facilityCategories: [
      {
        id: 'kamar',
        title: 'Fasilitas kamar',
        items: ['AC', 'Kasur', 'Meja', 'Lemari / Storage', 'Jendela', 'Kursi'],
      },
      {
        id: 'kamar-mandi',
        title: 'Fasilitas kamar mandi',
        items: ['Kamar mandi dalam', 'Kloset duduk', 'Wastafel', 'Shower'],
      },
      {
        id: 'bersama',
        title: 'Fasilitas bersama',
        items: ['Wi-Fi', 'Dapur bersama', 'Parkir motor', 'Ruang komunal'],
      },
    ],
    rules: ['Deposit 1 bulan', 'Tidak boleh membawa hewan', 'Konfirmasi tamu menginap'],
    roomSize: '3.5 x 4 m',
    availableRooms: 2,
    rentalDurations: ['Bulanan', '3 Bulan', '6 Bulan', 'Tahunan'],
    owner: 'Pak Bima',
    paymentTerms: {
      dpPercentage: 30,
      serviceFee: 15000,
      adminFee: 25000,
      deposit: 200000,
      discountPercentage: 12,
    },
    imageUrl: readyKosImage,
    imageAlt: 'Interior kamar kos modern dengan tempat tidur dan jendela besar',
    media: createListingMedia([readyKosImage, exclusiveKosImage, minimalKosImage]),
  },
  {
    id: 3,
    title: 'Kos Tubagus Ismail Eksklusif',
    location: 'Bandung',
    monthlyPrice: 1650000,
    rating: 4.7,
    tag: 'Putra',
    address: 'Jl. Tubagus Ismail No. 12, Bandung',
    description:
      'Kos eksklusif di lingkungan tenang dengan akses keamanan dan fasilitas lengkap untuk tinggal jangka panjang.',
    facilities: ['AC', 'Water heater', 'Laundry berbayar', 'CCTV', 'Akses 24 jam'],
    facilityCategories: [
      {
        id: 'kamar',
        title: 'Fasilitas kamar',
        items: ['AC', 'Kasur', 'Lemari', 'Meja kerja', 'TV', 'Jendela'],
      },
      {
        id: 'kamar-mandi',
        title: 'Fasilitas kamar mandi',
        items: ['Kamar mandi dalam', 'Water heater', 'Kloset duduk', 'Shower'],
      },
      {
        id: 'gedung',
        title: 'Fasilitas gedung',
        items: ['CCTV', 'Akses 24 jam', 'Laundry berbayar', 'Parkir motor'],
      },
    ],
    rules: ['Khusus putra', 'Tidak merokok di kamar', 'Pembayaran sebelum tanggal 5'],
    roomSize: '4 x 4 m',
    availableRooms: 1,
    rentalDurations: ['Bulanan', '6 Bulan', 'Tahunan'],
    owner: 'Mas Dimas',
    paymentTerms: {
      dpPercentage: 30,
      serviceFee: 15000,
      adminFee: 25000,
      deposit: 200000,
      discountPercentage: 11,
    },
    imageUrl: exclusiveKosImage,
    imageAlt: 'Bangunan kos modern dengan ruang tinggal yang terang',
    media: createListingMedia([exclusiveKosImage, minimalKosImage, readyKosImage]),
  },
]

const searchImages = [minimalKosImage, readyKosImage, exclusiveKosImage]

export const searchKosListings: KosListing[] = dummyKosSearchRecords.map(
  (record, index) => {
    const imageUrl = searchImages[index % searchImages.length]
    const secondImage = searchImages[(index + 1) % searchImages.length]
    const thirdImage = searchImages[(index + 2) % searchImages.length]
    const hasPrivateBathroom = index % 2 === 0
    const hasAc = index % 3 !== 0
    const facilities = [
      'Kasur',
      'Lemari',
      'Meja belajar',
      'Wi-Fi',
      hasPrivateBathroom ? 'Kamar mandi dalam' : 'Kamar mandi luar',
      ...(hasAc ? ['AC'] : ['Ventilasi']),
      ...(index % 2 === 0 ? ['Parkir motor'] : ['Dapur bersama']),
    ]

    return {
      id: record.listingId,
      title: record.name,
      location: record.city,
      monthlyPrice: record.monthlyPrice,
      rating: Number((4.5 + (index % 5) * 0.1).toFixed(1)),
      tag: record.tag,
      address: record.address,
      description: `Kos nyaman di kawasan ${record.area}, ${record.city}, dengan akses mudah menuju ${record.nearbyCampuses.join(' dan ')}. Cocok untuk mahasiswa maupun pekerja yang mencari hunian aman dan praktis.`,
      facilities,
      facilityCategories: [
        {
          id: 'kamar',
          title: 'Fasilitas kamar',
          items: facilities.filter((facility) =>
            ['Kasur', 'Lemari', 'Meja belajar', 'AC', 'Ventilasi'].includes(facility),
          ),
        },
        {
          id: 'kamar-mandi',
          title: 'Fasilitas kamar mandi',
          items: [
            hasPrivateBathroom ? 'Kamar mandi dalam' : 'Kamar mandi luar',
            'Kloset duduk',
            'Shower',
          ],
        },
        {
          id: 'bersama',
          title: 'Fasilitas bersama',
          items: ['Wi-Fi', index % 2 === 0 ? 'Parkir motor' : 'Dapur bersama', 'CCTV'],
        },
      ],
      rules: [
        `Khusus penghuni ${record.tag.toLocaleLowerCase('id-ID')}`,
        'Tidak merokok di dalam kamar',
        'Tamu wajib melapor kepada pemilik',
      ],
      roomSize: index % 2 === 0 ? '3 x 4 m' : '3.5 x 4 m',
      availableRooms: index % 5 === 4 ? 0 : (index % 4) + 1,
      rentalDurations:
        index % 3 === 0
          ? ['Bulanan', '3 Bulan', '6 Bulan', 'Tahunan']
          : ['Bulanan', '6 Bulan', 'Tahunan'],
      owner: index % 2 === 0 ? 'Ibu Sari' : 'Pak Andi',
      paymentTerms: {
        dpPercentage: 30,
        serviceFee: 15000,
        adminFee: 25000,
        deposit: 200000,
        discountPercentage: index % 3 === 0 ? 7 : 0,
      },
      imageUrl,
      imageAlt: `Interior ${record.name} di ${record.area}`,
      media: createListingMedia([imageUrl, secondImage, thirdImage]),
    }
  },
)

export const allKosListings = [...featuredKosListings, ...searchKosListings]
