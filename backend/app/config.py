from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql://papikos:papikos@localhost:5433/papikos"
    cors_origin: str = "http://localhost:5173"
    session_days: int = 7
    cookie_secure: bool = False
    public_app_url: str = "http://localhost:5173"
    expose_reset_token: bool = False
    app_timezone: str = "Asia/Jakarta"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origin.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
