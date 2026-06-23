import { useState } from 'react'

const papikosFeatures = [
  {
    title: 'Pencarian kos berdasarkan lokasi',
    description:
      'Cari kos di sekitar kampus, kantor, atau area pilihanmu dengan memasukkan nama lokasi, kawasan, maupun alamat lengkap.',
  },
  {
    title: 'Filter sesuai kebutuhan',
    description:
      'Temukan kamar berdasarkan harga, tipe kos, ketersediaan, ukuran kamar, serta fasilitas seperti AC, Wi-Fi, parkir, dan kamar mandi dalam.',
  },
  {
    title: 'Informasi kos yang transparan',
    description:
      'Lihat foto interior, video tour, fasilitas, peraturan, jumlah kamar tersedia, dan informasi pemilik sebelum menentukan pilihan.',
  },
  {
    title: 'Hubungi pemilik dan jadwalkan survey',
    description:
      'Hubungi pemilik kos atau ajukan jadwal survey langsung dari halaman detail agar proses pencarian menjadi lebih praktis.',
  },
  {
    title: 'Simpan kos favorit',
    description:
      'Simpan beberapa pilihan kos untuk dibandingkan kembali sebelum kamu memutuskan tempat tinggal yang paling cocok.',
  },
]

export function AboutPapikos() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section className="w-full min-w-0 overflow-hidden bg-neutral-50 px-4 py-12 text-neutral-700 sm:px-8 sm:py-14 lg:px-[86px]">
      <div className="mx-auto min-w-0 max-w-6xl">
        <h2 className="text-center text-xl font-black tracking-[-0.03em] text-neutral-800 sm:text-2xl">
          Papikos — Cara Nyaman Menemukan Kos Pilihan
        </h2>

        <p className="mx-auto mt-5 max-w-5xl text-sm font-medium leading-7 text-neutral-600 sm:text-base sm:leading-8">
          Papikos memanfaatkan teknologi untuk membantu pencari kos menemukan tempat tinggal yang sesuai dengan kebutuhan.
          Kamu dapat menjelajahi pilihan kos, melihat ketersediaan kamar, fasilitas, foto interior, video tour, serta informasi
          harga dengan lebih mudah. Papikos juga membantu menghubungkan calon penghuni dengan pemilik kos agar proses survey
          dan pemesanan terasa lebih jelas, cepat, dan nyaman.
        </p>

        <button
          className="mx-auto mt-8 flex max-w-full items-center justify-center gap-3 rounded-full px-3 py-3 text-center text-sm font-black text-neutral-700 transition hover:bg-white hover:shadow-sm sm:px-5 sm:text-xl"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
          aria-expanded={isExpanded}
          aria-controls="papikos-feature-list"
        >
          Fitur yang dapat dimanfaatkan di Papikos
          <span
            className={
              'text-xl transition-transform duration-300 ' +
              (isExpanded ? 'rotate-180' : 'rotate-0')
            }
            aria-hidden="true"
          >
           ⌄
          </span>
        </button>

        <div
          className={
            'grid transition-[grid-template-rows,opacity] duration-500 ease-out ' +
            (isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')
          }
          id="papikos-feature-list"
        >
          <div className="overflow-hidden">
            <ol className="mt-5 space-y-6 pb-2">
              {papikosFeatures.map((feature, index) => (
                <li className="grid gap-2 sm:grid-cols-[32px_1fr]" key={feature.title}>
                  <span className="font-black text-green-600">{String.fromCharCode(97 + index)}.</span>
                  <div>
                    <h3 className="text-base font-black text-neutral-700 sm:text-lg">{feature.title}</h3>
                    <p className="mt-1 text-sm font-medium leading-7 text-neutral-600 sm:text-base sm:leading-8">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
