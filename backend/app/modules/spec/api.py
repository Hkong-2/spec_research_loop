from fastapi import APIRouter
from app.modules.spec.models import Stage5DraftResponse, Stage5ConfirmRequest, Stage5ConfirmResponse, Stage5Draft
from app.modules.spec.mock_context import get_stage_5_mock_context
from app.modules.spec.service import generate_stage_5_draft
from app.adapters.llm.openai_adapter import OpenAIAdapter

router = APIRouter()

# In-memory storage for the draft
_STAGE_5_DRAFT_STORE = {}

@router.get("/health")
async def health() -> dict[str, str]:
    return {"module": "spec", "status": "ok"}

@router.get("/stage-5/draft", response_model=Stage5DraftResponse)
async def get_stage_5_draft():
    """
    Returns the current in-memory draft if it exists.
    Otherwise, generates a new draft using the LLM and the mock context.
    """
    session_id = "default-session" # Hardcoded for now
    mock_context = get_stage_5_mock_context()

    if session_id in _STAGE_5_DRAFT_STORE:
        draft = _STAGE_5_DRAFT_STORE[session_id]
    else:
        llm = OpenAIAdapter()
        draft = await generate_stage_5_draft(mock_context, llm)
        _STAGE_5_DRAFT_STORE[session_id] = draft

    return Stage5DraftResponse(
        draft=draft,
        mock_context=mock_context
    )

@router.post("/stage-5/confirm", response_model=Stage5ConfirmResponse)
async def confirm_stage_5(request: Stage5ConfirmRequest):
    """
    Confirms and saves the stage 5 draft (in-memory for now).
    """
    session_id = "default-session"
    _STAGE_5_DRAFT_STORE[session_id] = Stage5Draft(
        contribution=request.contribution,
        cards=request.cards
    )

    return Stage5ConfirmResponse(
        status="success",
        message="Stage 5 confirmed successfully."
    )
