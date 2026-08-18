"""Research Spec and Spec Artifact metadata models."""
import uuid
from typing import List
from pydantic import BaseModel, Field


class ClaimEvidenceCard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    claim: str
    baseline: str
    metric: str
    evidence: str
    rejection_condition: str

class ContributionInfo(BaseModel):
    contribution: str

class Stage5Draft(BaseModel):
    contribution: str
    cards: List[ClaimEvidenceCard] = Field(default_factory=list)

class Stage5DraftResponse(BaseModel):
    draft: Stage5Draft
    mock_context: dict

class Stage5ConfirmRequest(BaseModel):
    contribution: str
    cards: List[ClaimEvidenceCard]

class Stage5ConfirmResponse(BaseModel):
    status: str
    message: str
