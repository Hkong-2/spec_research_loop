import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_spec_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/spec/health")
        assert response.status_code == 200
        assert response.json() == {"module": "spec", "status": "ok"}

@pytest.mark.asyncio
async def test_stage_5_draft():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/spec/stage-5/draft")
        assert response.status_code == 200
        data = response.json()
        assert "draft" in data
        assert "contribution" in data["draft"]
        assert "cards" in data["draft"]
        assert "mock_context" in data

@pytest.mark.asyncio
async def test_stage_5_confirm():
    payload = {
        "contribution": "Test contribution",
        "cards": [
            {
                "id": "123",
                "claim": "Test claim",
                "baseline": "baseline",
                "metric": "metric",
                "evidence": "evidence",
                "rejection_condition": "condition"
            }
        ]
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/spec/stage-5/confirm", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
