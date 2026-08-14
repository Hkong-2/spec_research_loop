"""Idea workflow HTTP API — includes SSE demo stream."""

import asyncio
import json
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.modules.identity.deps import get_current_account
from app.modules.identity.models import Account

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"module": "idea", "status": "ok"}


async def _demo_event_stream(account: Account):
    steps = [
        {"type": "progress", "message": "Starting grilling demo…", "pct": 0},
        {"type": "token", "text": "Restating your idea"},
        {"type": "token", "text": " as a research question…"},
        {"type": "progress", "message": "Waiting for human confirmation (simulated)", "pct": 50},
        {"type": "progress", "message": "Demo stream complete", "pct": 100},
        {"type": "done", "account_email": account.email},
    ]
    for step in steps:
        payload = json.dumps(step, ensure_ascii=False)
        yield f"event: message\ndata: {payload}\n\n"
        await asyncio.sleep(0.4)


@router.get("/demo/stream")
async def demo_stream(
    account: Annotated[Account, Depends(get_current_account)],
) -> StreamingResponse:
    """In-request SSE demo (ADR 0004). Requires Bearer JWT."""
    return StreamingResponse(
        _demo_event_stream(account),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
