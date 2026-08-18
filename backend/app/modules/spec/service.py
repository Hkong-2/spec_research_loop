"""Spec application services."""
import json
from app.modules.spec.models import Stage5Draft, ClaimEvidenceCard
from app.ports.llm import LlmPort

async def generate_stage_5_draft(mock_context: dict, llm: LlmPort) -> Stage5Draft:
    system_prompt = (
        "You are an AI assistant helping to build a Research Specification. "
        "Based on the provided research context (problem, research question, confirmed gap, related works), "
        "generate a single main contribution and a list of claim-evidence cards. "
        "Each claim-evidence card must contain a 'claim', 'baseline', 'metric', 'evidence', and 'rejection_condition'. "
        "Return the output STRICTLY as a JSON object with two keys: 'contribution' (string) and 'cards' (list of objects)."
    )

    prompt = f"Context:\n{json.dumps(mock_context, ensure_ascii=False, indent=2)}\n\nPlease generate the contribution and claim-evidence cards in JSON format."

    response_str = await llm.complete(system=system_prompt, prompt=prompt)

    try:
        data = json.loads(response_str)
        # Parse into Pydantic models
        cards = []
        for c in data.get("cards", []):
            cards.append(ClaimEvidenceCard(
                claim=c.get("claim", ""),
                baseline=c.get("baseline", ""),
                metric=c.get("metric", ""),
                evidence=c.get("evidence", ""),
                rejection_condition=c.get("rejection_condition", "")
            ))

        return Stage5Draft(
            contribution=data.get("contribution", ""),
            cards=cards
        )
    except Exception as e:
        # Fallback in case of parse error
        return Stage5Draft(
            contribution="Failed to parse LLM response.",
            cards=[]
        )
