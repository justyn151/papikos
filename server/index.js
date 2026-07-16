import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { pool, query } from './db.js'
import { asyncRoute, HttpError } from './errors.js'
import { loginUser, registerUser } from './services/authRepository.js'
import {
  getFeaturedListings,
  getListingById,
  getSearchMetadata,
  parseSearchFilters,
  searchListings,
} from './services/kosRepository.js'
import { createPaymentQuote } from './services/paymentService.js'
import {
  createSession,
  deleteSession,
  getSessionUser,
  requireSessionUser,
} from './services/sessionRepository.js'
import {
  createContactRequest,
  createRentalApplication,
  createSurveyRequest,
  getMyActivity,
} from './services/renterActionRepository.js'
import {
  requestPasswordReset,
  resetPassword,
} from './services/passwordResetRepository.js'
import { getOwnerInbox, updateOwnerRequest } from './services/ownerRepository.js'

const app = express()

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', asyncRoute(async (_request, response) => {
  await query('select 1 as ok')
  response.json({ ok: true })
}))

app.get('/api/kos/search', asyncRoute(async (request, response) => {
  const lat = request.query.lat === undefined ? Number.NaN : Number(request.query.lat)
  const lng = request.query.lng === undefined ? Number.NaN : Number(request.query.lng)
  const coordinates =
    request.query.lat !== undefined &&
    request.query.lng !== undefined &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
      ? { lat, lng }
      : undefined

  const results = await searchListings({
    query: String(request.query.query ?? ''),
    filters: parseSearchFilters(request.query),
    coordinates,
  })

  response.json(results)
}))

app.get('/api/kos', asyncRoute(async (request, response) => {
  if (request.query.featured === 'true') {
    response.json(await getFeaturedListings())
    return
  }

  response.json(
    await searchListings({
      query: '',
      filters: parseSearchFilters(request.query),
    }),
  )
}))

app.get('/api/kos/:id', asyncRoute(async (request, response) => {
  response.json(await getListingById(Number(request.params.id)))
}))

app.post('/api/kos/:id/payment-quote', asyncRoute(async (request, response) => {
  response.json(await createPaymentQuote(Number(request.params.id), request.body ?? {}))
}))

app.post('/api/kos/:id/surveys', asyncRoute(async (request, response) => {
  const user = await requireSessionUser(request)
  response.status(201).json({
    survey: await createSurveyRequest(user, Number(request.params.id), request.body ?? {}),
  })
}))

app.post('/api/kos/:id/contact-requests', asyncRoute(async (request, response) => {
  const user = await requireSessionUser(request)
  response.status(201).json({
    contact: await createContactRequest(user, Number(request.params.id), request.body ?? {}),
  })
}))

app.post('/api/kos/:id/rental-applications', asyncRoute(async (request, response) => {
  const user = await requireSessionUser(request)
  response.status(201).json({
    rental: await createRentalApplication(user, Number(request.params.id), request.body ?? {}),
  })
}))

app.get('/api/me/activity', asyncRoute(async (request, response) => {
  response.json(await getMyActivity(await requireSessionUser(request)))
}))

app.get('/api/owner/inbox', asyncRoute(async (request, response) => {
  response.json(await getOwnerInbox(await requireSessionUser(request)))
}))

app.patch('/api/owner/requests/:type/:id', asyncRoute(async (request, response) => {
  const user = await requireSessionUser(request)
  response.json({
    request: await updateOwnerRequest(
      user,
      String(request.params.type),
      Number(request.params.id),
      String(request.body?.status ?? ''),
    ),
  })
}))

app.get('/api/search/metadata', asyncRoute(async (_request, response) => {
  response.json(await getSearchMetadata())
}))

app.post('/api/auth/register', asyncRoute(async (request, response) => {
  const user = await registerUser(request.body ?? {})
  await createSession(user.id, response)
  response.status(201).json({ user })
}))

app.post('/api/auth/login', asyncRoute(async (request, response) => {
  const user = await loginUser(request.body ?? {})
  await createSession(user.id, response)
  response.json({ user })
}))

app.get('/api/auth/me', asyncRoute(async (request, response) => {
  response.json({ user: await getSessionUser(request) })
}))

app.post('/api/auth/logout', asyncRoute(async (request, response) => {
  await deleteSession(request, response)
  response.status(204).send()
}))

app.post('/api/auth/forgot-password', asyncRoute(async (request, response) => {
  const result = await requestPasswordReset(request.body ?? {})
  response.json({
    message: 'Jika akun ditemukan, petunjuk reset password telah dibuat.',
    ...result,
  })
}))

app.post('/api/auth/reset-password', asyncRoute(async (request, response) => {
  await resetPassword(request.body ?? {})
  response.json({ message: 'Password berhasil diperbarui. Silakan masuk kembali.' })
}))

app.use((_request, _response, next) => {
  next(new HttpError(404, 'Endpoint tidak ditemukan.', 'NOT_FOUND'))
})

app.use((error, _request, response, _next) => {
  const status = error.status ?? 500

  if (status >= 500) {
    console.error(error)
  }

  response.status(status).json({
    code: error.code ?? 'INTERNAL_SERVER_ERROR',
    message:
      status >= 500
        ? 'Terjadi kesalahan pada server.'
        : error.message,
    fields: error.fields,
  })
})

const server = app.listen(config.port, () => {
  console.log(`Papikos backend listening on http://localhost:${config.port}`)
})

process.on('SIGINT', async () => {
  server.close()
  await pool.end()
  process.exit(0)
})
