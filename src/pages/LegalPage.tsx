import { Link, Navigate, useParams } from 'react-router-dom'

const legalContent = {
  terms: {
    title: 'Syarat dan Ketentuan',
    paragraphs: [
      'Papikos membantu pencari dan pemilik kos bertukar informasi serta mengajukan layanan. Pengajuan belum menjadi perjanjian sewa sampai disetujui kedua pihak.',
      'Pengguna wajib memberikan informasi akun yang benar dan menggunakan layanan secara bertanggung jawab.',
      'Harga, ketersediaan, jadwal survey, dan keputusan sewa harus dikonfirmasi sebelum transaksi final.',
    ],
  },
  privacy: {
    title: 'Kebijakan Privasi',
    paragraphs: [
      'Papikos menyimpan data akun, sesi masuk, dan pengajuan yang diperlukan untuk menjalankan layanan.',
      'Password disimpan sebagai hash dan token sesi browser disimpan dalam cookie HttpOnly. Token mentah tidak disimpan di database.',
      'Data lokal dalam proyek demonstrasi ini tidak boleh dianggap sebagai sistem produksi tanpa pengamanan, backup, dan kebijakan retensi tambahan.',
    ],
  },
} as const

export function LegalPage() {
  const { document } = useParams()
  if (document !== 'terms' && document !== 'privacy') return <Navigate replace to="/" />
  const content = legalContent[document]
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-12">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm sm:p-12">
        <Link className="font-black text-green-600" to="/">← Papikos</Link>
        <h1 className="mt-8 text-4xl font-black text-neutral-900">{content.title}</h1>
        <p className="mt-2 text-sm font-bold text-neutral-400">Versi demonstrasi lokal — 16 Juli 2026</p>
        <div className="mt-8 space-y-5 leading-8 text-neutral-600">
          {content.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </article>
    </main>
  )
}
