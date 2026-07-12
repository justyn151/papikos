import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

if (!config.databaseUrl) {
  console.warn(
    'DATABASE_URL is empty. Backend endpoints that need PostgreSQL will fail until it is configured.',
  )
}

export const pool = new Pool({
  connectionString: config.databaseUrl,
})

export async function query(text, params = []) {
  return pool.query(text, params)
}

