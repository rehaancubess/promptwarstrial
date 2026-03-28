import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app, get_current_user
from io import BytesIO

# Mock authentication
async def mock_get_current_user():
    return "test-user-123"

app.dependency_overrides[get_current_user] = mock_get_current_user

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_history_api_without_db(monkeypatch):
    import app.main
    monkeypatch.setattr(app.main, "db", None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/history")
    assert response.status_code == 500

@pytest.mark.asyncio
async def test_analyze_file_size_limit():
    # 11MB file to trigger 400 rejection
    large_file = BytesIO(b"0" * (11 * 1024 * 1024)) 
    large_file.name = "large.txt"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/analyze", files={"file": ("large.txt", large_file, "text/plain")})
    assert response.status_code == 400
    assert "too large" in response.text.lower()
