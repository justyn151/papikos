import json
from contextlib import asynccontextmanager
from typing import AsyncIterator

import asyncpg

from .config import settings


async def _initialize_connection(connection: asyncpg.Connection) -> None:
    for data_type in ("json", "jsonb"):
        await connection.set_type_codec(
            data_type,
            schema="pg_catalog",
            encoder=json.dumps,
            decoder=json.loads,
            format="text",
        )


class Database:
    def __init__(self) -> None:
        self.pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        if self.pool is not None:
            return
        database_url = settings.database_url.replace("postgres://", "postgresql://", 1)
        self.pool = await asyncpg.create_pool(
            dsn=database_url,
            min_size=2,
            max_size=10,
            init=_initialize_connection,
        )

    async def disconnect(self) -> None:
        if self.pool is not None:
            await self.pool.close()
            self.pool = None

    def require_pool(self) -> asyncpg.Pool:
        if self.pool is None:
            raise RuntimeError("Database pool is not initialized.")
        return self.pool

    async def fetch(self, query: str, *args: object) -> list[asyncpg.Record]:
        return await self.require_pool().fetch(query, *args)

    async def fetchrow(self, query: str, *args: object) -> asyncpg.Record | None:
        return await self.require_pool().fetchrow(query, *args)

    async def execute(self, query: str, *args: object) -> str:
        return await self.require_pool().execute(query, *args)

    @asynccontextmanager
    async def connection(self) -> AsyncIterator[asyncpg.Connection]:
        async with self.require_pool().acquire() as connection:
            yield connection


db = Database()
