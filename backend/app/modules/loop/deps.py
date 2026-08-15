"""Loop FastAPI / composition-root helpers."""

from app.modules.loop.catalog import WORKFLOW_NODES
from app.ports.stage import NoOpStagePort, StagePort

_stage_ports: dict[str, StagePort] | None = None


def default_stage_ports() -> dict[str, StagePort]:
    noop = NoOpStagePort()
    return {node.value: noop for node in WORKFLOW_NODES}


def bind_stage_ports(ports: dict[str, StagePort]) -> None:
    global _stage_ports
    _stage_ports = ports


def get_stage_ports() -> dict[str, StagePort]:
    return _stage_ports if _stage_ports is not None else default_stage_ports()
