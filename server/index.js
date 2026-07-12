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

app.get('/api/search/metadata', asyncRoute(async (_request, response) => {
  response.json(await getSearchMetadata())
}))

app.post('/api/auth/register', asyncRoute(async (request, response) => {
  const user = await registerUser(request.body ?? {})
  response.status(201).json({ user })
}))

app.post('/api/auth/login', asyncRoute(async (request, response) => {
  const user = await loginUser(request.body ?? {})
  response.json({ user })
}))

app.post('/api/auth/logout', (_request, response) => {
  response.status(204).send()
})

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

