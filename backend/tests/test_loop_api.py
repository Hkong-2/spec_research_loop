"""HTTP seam tests for /api/loop (ADR 0020)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.modules.loop.catalog import WORKFLOW_NODES

CATALOG = [
    "idea_interpretation",
    "idea_decomposition",
    "research_inputs",
    "related_work",
    "gap",
    "contribution",
    "claims",
    "evidence",
    "experiment_plan",
    "feasibility",
    "gap_judge",
    "contribution_judge",
    "evidence_judge",
    "experiment_judge",
    "conference_judge",
    "aggregator",
]


def _head(payload: dict, node: str) -> dict:
    return next(item for item in payload["node_heads"] if item["node"] == node)


async def _register(client: AsyncClient, email: str | None = None) -> str:
    response = await client.post(
        "/api/identity/register",
        json={"email": email or f"{uuid4().hex[:12]}@example.com", "password": "password1"},
    )
    assert response.status_code == 201, response.text
    return response.json()["access_token"]


async def _auth_client(client: AsyncClient) -> AsyncClient:
    token = await _register(client)
    client.headers["Authorization"] = f"Bearer {token}"
    return client


async def _create_session(client: AsyncClient, title: str | None = "Latency idea") -> dict:
    response = await client.post("/api/loop/sessions", json={"title": title})
    assert response.status_code == 201, response.text
    return response.json()


async def _confirm(client: AsyncClient, session_id: str, node: str) -> dict:
    response = await client.post(f"/api/loop/sessions/{session_id}/confirm", json={"node": node})
    assert response.status_code == 200, response.text
    return response.json()


async def _prepare(client: AsyncClient, session_id: str, stage: str) -> dict:
    response = await client.post(
        f"/api/loop/sessions/{session_id}/recompute-prepare",
        json={"stage": stage},
    )
    assert response.status_code == 200, response.text
    return response.json()


@pytest.mark.asyncio
async def test_loop_health_is_public(client: AsyncClient) -> None:
    response = await client.get("/api/loop/health")
    assert response.status_code == 200
    assert response.json() == {"module": "loop", "status": "ok"}


@pytest.mark.asyncio
async def test_create_session_requires_bearer(client: AsyncClient) -> None:
    response = await client.post("/api/loop/sessions", json={})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_session_has_empty_catalog_heads(client: AsyncClient) -> None:
    await _auth_client(client)
    payload = await _create_session(client)
    assert payload["version"] == 1
    assert payload["working_draft_node"] == "idea_interpretation"
    assert payload["working_draft_narrative"] == {}
    assert payload["cards"] == []
    assert payload["produced_spec_version"] is None
    assert payload["valid_spec_version_id"] is None
    nodes = [item["node"] for item in payload["node_heads"]]
    assert nodes == CATALOG
    assert [item["status"] for item in payload["node_heads"]] == ["empty"] * 16
    assert len(WORKFLOW_NODES) == 16


@pytest.mark.asyncio
async def test_list_and_get_and_patch_title(client: AsyncClient) -> None:
    await _auth_client(client)
    created = await _create_session(client, title=None)
    session_id = created["id"]
    listed = await client.get("/api/loop/sessions")
    assert listed.status_code == 200
    assert listed.json()[0]["id"] == session_id
    assert listed.json()[0]["version"] == 1
    assert listed.json()[0]["updated_at"] == created["updated_at"]
    patched = await client.patch(
        f"/api/loop/sessions/{session_id}",
        json={"title": "GPU budget", "expected_version": 1},
    )
    assert patched.status_code == 200
    assert patched.json()["title"] == "GPU budget"
    assert patched.json()["version"] == 2
    fetched = await client.get(f"/api/loop/sessions/{session_id}")
    assert fetched.json()["title"] == "GPU budget"
    assert fetched.json()["version"] == 2


@pytest.mark.asyncio
async def test_list_sessions_orders_by_recent_activity(client: AsyncClient) -> None:
    await _auth_client(client)
    first = await _create_session(client, title="First")
    second = await _create_session(client, title="Second")

    renamed = await client.patch(
        f"/api/loop/sessions/{first['id']}",
        json={"title": "Most recent", "expected_version": first["version"]},
    )
    assert renamed.status_code == 200

    listed = await client.get("/api/loop/sessions")
    assert listed.status_code == 200
    rows = listed.json()
    assert [row["id"] for row in rows] == [first["id"], second["id"]]
    assert rows[0]["updated_at"] == renamed.json()["updated_at"]


@pytest.mark.asyncio
async def test_patch_title_requires_expected_version(client: AsyncClient) -> None:
    await _auth_client(client)
    created = await _create_session(client)

    response = await client.patch(
        f"/api/loop/sessions/{created['id']}",
        json={"title": "Missing version"},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_stale_title_patch_preserves_server_value(client: AsyncClient) -> None:
    await _auth_client(client)
    created = await _create_session(client, title="Original")
    accepted = await client.patch(
        f"/api/loop/sessions/{created['id']}",
        json={"title": "Accepted", "expected_version": created["version"]},
    )
    assert accepted.status_code == 200
    assert accepted.json()["version"] == 2

    stale = await client.patch(
        f"/api/loop/sessions/{created['id']}",
        json={"title": "Stale overwrite", "expected_version": created["version"]},
    )

    assert stale.status_code == 409
    assert stale.json() == {
        "code": "version_conflict",
        "detail": "Loop Session was changed by another request",
        "current_version": 2,
    }
    fetched = await client.get(f"/api/loop/sessions/{created['id']}")
    assert fetched.json()["title"] == "Accepted"
    assert fetched.json()["version"] == 2


@pytest.mark.asyncio
async def test_foreign_session_is_not_found(client: AsyncClient) -> None:
    await _auth_client(client)
    created = await _create_session(client)
    other_token = await _register(client)
    client.headers["Authorization"] = f"Bearer {other_token}"
    response = await client.get(f"/api/loop/sessions/{created['id']}")
    assert response.status_code == 404
    missing = await client.get(f"/api/loop/sessions/{uuid4()}")
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_cannot_patch_working_draft_onto_empty_node(client: AsyncClient) -> None:
    await _auth_client(client)
    created = await _create_session(client)
    response = await client.patch(
        f"/api/loop/sessions/{created['id']}/working-draft",
        json={"node": "idea_decomposition"},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_confirm_wrong_node_conflicts(client: AsyncClient) -> None:
    await _auth_client(client)
    created = await _create_session(client)
    response = await client.post(
        f"/api/loop/sessions/{created['id']}/confirm",
        json={"node": "idea_decomposition"},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_confirm_interpretation_moves_working_draft(client: AsyncClient) -> None:
    await _auth_client(client)
    created = await _create_session(client)
    session_id = created["id"]
    payload = await _confirm(client, session_id, "idea_interpretation")
    assert payload["working_draft_node"] == "idea_decomposition"
    assert _head(payload, "idea_interpretation")["status"] == "current"
    assert _head(payload, "idea_interpretation")["stage_revision_id"] is not None
    assert _head(payload, "idea_decomposition")["status"] == "empty"
    decisions = await client.get(f"/api/loop/sessions/{session_id}/decisions")
    assert decisions.status_code == 200
    rows = decisions.json()
    assert len(rows) == 1
    assert rows[0]["kind"] == "confirm"
    assert rows[0]["node"] == "idea_interpretation"


@pytest.mark.asyncio
async def test_identical_confirm_is_noop(client: AsyncClient) -> None:
    await _auth_client(client)
    created = await _create_session(client)
    session_id = created["id"]
    first = await _confirm(client, session_id, "idea_interpretation")
    revision = _head(first, "idea_interpretation")["stage_revision_id"]
    await client.patch(
        f"/api/loop/sessions/{session_id}/working-draft",
        json={"node": "idea_interpretation"},
    )
    second = await _confirm(client, session_id, "idea_interpretation")
    assert _head(second, "idea_interpretation")["stage_revision_id"] == revision
    decisions = await client.get(f"/api/loop/sessions/{session_id}/decisions")
    assert len(decisions.json()) == 1


@pytest.mark.asyncio
async def test_card_write_requires_owning_working_draft(client: AsyncClient) -> None:
    await _auth_client(client)
    created = await _create_session(client)
    session_id = created["id"]
    denied = await client.post(
        f"/api/loop/sessions/{session_id}/cards",
        json={"kind": "problem", "body": {"text": "too soon"}},
    )
    assert denied.status_code == 409
    await _confirm(client, session_id, "idea_interpretation")
    created_card = await client.post(
        f"/api/loop/sessions/{session_id}/cards",
        json={"kind": "problem", "body": {"text": "LLM latency"}},
    )
    assert created_card.status_code == 201, created_card.text
    assert created_card.json()["kind"] == "problem"
    constraint = await client.post(
        f"/api/loop/sessions/{session_id}/cards",
        json={"kind": "constraint", "body": {"text": "one 16GB GPU"}},
    )
    assert constraint.status_code == 201


@pytest.mark.asyncio
async def test_changed_interpretation_marks_decomposition_stale(client: AsyncClient) -> None:
    await _auth_client(client)
    created = await _create_session(client)
    session_id = created["id"]
    await _confirm(client, session_id, "idea_interpretation")
    card = await client.post(
        f"/api/loop/sessions/{session_id}/cards",
        json={"kind": "problem", "body": {"text": "accuracy"}},
    )
    assert card.status_code == 201
    await _confirm(client, session_id, "idea_decomposition")
    await client.patch(
        f"/api/loop/sessions/{session_id}/working-draft",
        json={"node": "idea_interpretation", "narrative": {"understanding": "latency"}},
    )
    payload = await _confirm(client, session_id, "idea_interpretation")
    assert _head(payload, "idea_decomposition")["status"] == "stale"
    assert payload["valid_spec_version_id"] is None


@pytest.mark.asyncio
async def test_prepare_grilling_lands_on_stale_decomposition(client: AsyncClient) -> None:
    await _auth_client(client)
    created = await _create_session(client)
    session_id = created["id"]
    await _confirm(client, session_id, "idea_interpretation")
    await client.post(
        f"/api/loop/sessions/{session_id}/cards",
        json={"kind": "problem", "body": {"text": "accuracy"}},
    )
    await _confirm(client, session_id, "idea_decomposition")
    await client.patch(
        f"/api/loop/sessions/{session_id}/working-draft",
        json={"node": "idea_interpretation", "narrative": {"understanding": "latency"}},
    )
    await _confirm(client, session_id, "idea_interpretation")
    payload = await _prepare(client, session_id, "grilling")
    assert payload["working_draft_node"] == "idea_decomposition"
    assert _head(payload, "idea_interpretation")["status"] == "current"
    assert _head(payload, "idea_decomposition")["status"] == "stale"


@pytest.mark.asyncio
async def test_prepare_grilling_conflicts_when_current(client: AsyncClient) -> None:
    await _auth_client(client)
    created = await _create_session(client)
    session_id = created["id"]
    await _confirm(client, session_id, "idea_interpretation")
    await _confirm(client, session_id, "idea_decomposition")
    response = await client.post(
        f"/api/loop/sessions/{session_id}/recompute-prepare",
        json={"stage": "grilling"},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_prepare_readiness_conflicts(client: AsyncClient) -> None:
    await _auth_client(client)
    created = await _create_session(client)
    response = await client.post(
        f"/api/loop/sessions/{created['id']}/recompute-prepare",
        json={"stage": "readiness"},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_prepare_related_work_requires_grilling(client: AsyncClient) -> None:
    await _auth_client(client)
    created = await _create_session(client)
    response = await client.post(
        f"/api/loop/sessions/{created['id']}/recompute-prepare",
        json={"stage": "related_work"},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_feasibility_confirm_mints_spec_version(client: AsyncClient) -> None:
    await _auth_client(client)
    created = await _create_session(client)
    session_id = created["id"]
    await _confirm(client, session_id, "idea_interpretation")
    await _confirm(client, session_id, "idea_decomposition")
    for stage, node in (
        ("related_work", "research_inputs"),
        ("related_work", "related_work"),
        ("related_work", "gap"),
        ("contribution", "contribution"),
        ("claims_evidence", "claims"),
        ("claims_evidence", "evidence"),
        ("experiment_planning", "experiment_plan"),
        ("experiment_planning", "feasibility"),
    ):
        prepared = await _prepare(client, session_id, stage)
        assert prepared["working_draft_node"] == node
        await _confirm(client, session_id, node)
    fetched = await client.get(f"/api/loop/sessions/{session_id}")
    payload = fetched.json()
    assert payload["produced_spec_version"] is not None
    assert payload["valid_spec_version_id"] == payload["produced_spec_version"]["id"]
    assert "idea_interpretation" in payload["produced_spec_version"]["document"]["nodes"]
    assert "feasibility" in payload["produced_spec_version"]["document"]["nodes"]
