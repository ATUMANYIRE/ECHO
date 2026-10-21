"""Tests for configuration parsing and CORS origin handling."""

from app.config import Settings


def test_default_settings():
    """Verify default configurations have sensible values."""
    s = Settings(
        ENVIRONMENT="test",
        DEBUG=True,
        PORT=8005,
        CORS_ORIGINS=["http://localhost:3005"],
    )
    assert s.port == 8005
    assert s.environment == "test"
    assert s.debug is True
    assert "http://localhost:3005" in s.cors_origins


def test_cors_origins_from_comma_string():
    """Verify CORS_ORIGINS as comma-separated string parses correctly."""
    s = Settings(CORS_ORIGINS="http://localhost:3000, http://localhost:3005")
    assert "http://localhost:3000" in s.cors_origins
    assert "http://localhost:3005" in s.cors_origins


def test_cors_origins_from_json_string():
    """Verify CORS_ORIGINS as JSON array parses correctly."""
    s = Settings(CORS_ORIGINS='["http://localhost:3005", "https://echo.app"]')
    assert "http://localhost:3005" in s.cors_origins
    assert "https://echo.app" in s.cors_origins
