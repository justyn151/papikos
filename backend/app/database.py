import asyncpg
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from app.config import settings

class Database:
    def __init__(self):
        self.pool: asyncpg.Pool | None = None

    async def connect(self):
        if not self.pool:
            url = settings.DATABASE_URL
            # Normalize postgres:// to postgresql:// for asyncpg compliance
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            self.pool = await asyncpg.create_pool(
                dsn=url,
                min_size=2,
                max_size=10
            )

    async def disconnect(self):
        if self.pool:
            await self.pool.close()
            self.pool = None

    @asynccontextmanager
    async def connection(self) -> AsyncGenerator[asyncpg.Connection, None]:
        if not self.pool:
            await self.connect()
        async with self.pool.acquire() as conn:
            yield conn

db = Database()
