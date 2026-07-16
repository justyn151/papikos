import dotenv from 'dotenv'

dotenv.config()

export const config = {
  databaseUrl: process.env.DATABASE_URL ?? '',
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  sessionDays: Number(process.env.SESSION_DAYS ?? 7),
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  publicAppUrl: process.env.PUBLIC_APP_URL ?? 'http://localhost:5173',
  exposeResetToken: process.env.EXPOSE_RESET_TOKEN === 'true',
}
