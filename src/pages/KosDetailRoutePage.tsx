import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Header } from '../components/Header/Header'
import { KosDetailPage } from '../components/KosDetailPage/KosDetailPage'
import { kosService } from '../services/kosService'
import type { KosListing } from '../types/kos'

export function KosDetailRoutePage() {
  const navigate = useNavigate()
  const { kosId } = useParams()
  const listingId = Number(kosId)
  const hasValidId = Number.isInteger(listingId)
  const [listing, setListing] = useState<KosListing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrentRequest = true
    if (!hasValidId) return

    kosService
      .getById(listingId)
      .then((result) => {
        if (!isCurrentRequest) return
        if (result) setListing(result)
        else setError('Kos tidak ditemukan.')
      })
      .catch(() => {
        if (isCurrentRequest) setError('Detail kos gagal dimuat.')
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false)
      })

    return () => {
      isCurrentRequest = false
    }
  }, [hasValidId, listingId])

  const displayedError = hasValidId ? error : 'ID kos tidak valid.'

  return (
    <>
      <Header />
      <main>
        {displayedError ? (
          <div className="mx-auto my-20 max-w-xl px-4 text-center">
            <h1 className="text-2xl font-black text-neutral-800">{displayedError}</h1>
            <button
              className="mt-6 rounded-full bg-green-600 px-6 py-3 font-black text-white"
              onClick={() => navigate('/')}
              type="button"
            >
              Kembali ke beranda
            </button>
          </div>
        ) : isLoading ? (
          <div className="mx-auto my-16 h-[520px] w-[min(92%,1180px)] animate-pulse rounded-3xl bg-neutral-100" />
        ) : !listing ? (
          <div className="mx-auto my-20 max-w-xl px-4 text-center">
            <h1 className="text-2xl font-black text-neutral-800">Kos tidak ditemukan.</h1>
            <button
              className="mt-6 rounded-full bg-green-600 px-6 py-3 font-black text-white"
              onClick={() => navigate('/')}
              type="button"
            >
              Kembali ke beranda
            </button>
          </div>
        ) : (
          <KosDetailPage kos={listing} onBack={() => navigate(-1)} />
        )}
      </main>
    </>
  )
}
