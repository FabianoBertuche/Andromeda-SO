"""FastAPI entrypoint for the Andromeda cognitive Python service."""

from __future__ import annotations

from datetime import datetime, timezone
from time import perf_counter

from fastapi import Depends, FastAPI

from app.security import verify_service_token
from contracts.base import CognitiveMetrics, CognitiveRequest, CognitiveResponse, TraceContext
from contracts.classification import TaskClassification
from contracts.health import HealthResponse, ReadinessResponse
from services.planner.classifier import classify_query

SERVICE_NAME = "cognitive-python"
SERVICE_VERSION = "0.1.0"

app = FastAPI(
    title="Andromeda Cognitive Python",
    version=SERVICE_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.get("/health", response_model=HealthResponse)
async def healthcheck() -> HealthResponse:
    """Returns a shallow liveness report for operational monitoring."""

    return HealthResponse(
        status="ok",
        service=SERVICE_NAME,
        version=SERVICE_VERSION,
        timestamp=utc_now(),
        checks={
            "http": "ok",
            "contracts": "loaded",
        },
    )


@app.get("/readiness", response_model=ReadinessResponse)
async def readiness() -> ReadinessResponse:
    """Returns readiness state for internal orchestration."""

    return ReadinessResponse(
        status="ready",
        service=SERVICE_NAME,
        version=SERVICE_VERSION,
        timestamp=utc_now(),
        dependencies={
            "planner": "ready",
            "contracts": "ready",
        },
    )


@app.post(
    "/v1/integration/ping",
    response_model=CognitiveResponse,
    dependencies=[Depends(verify_service_token)],
)
async def integration_ping(payload: CognitiveRequest) -> CognitiveResponse:
    """Echoes a canonical response to validate TS <-> Python connectivity."""

    started_at = perf_counter()
    message = str(payload.input.get("message", "ping"))

    return build_response(
        payload=payload,
        data={
            "echo": message,
            "acknowledged": True,
            "service": SERVICE_NAME,
        },
        model_used="ping-v1",
        duration_ms=elapsed_ms(started_at),
    )


@app.post(
    "/v1/cognitive/classify",
    response_model=CognitiveResponse,
    dependencies=[Depends(verify_service_token)],
)
async def classify_task(payload: CognitiveRequest) -> CognitiveResponse:
    """Returns a non-authoritative routing signal for the TS kernel."""

    started_at = perf_counter()
    query = str(payload.input.get("query", ""))
    classification: TaskClassification = classify_query(query)

    return build_response(
        payload=payload,
        data=classification.model_dump(),
        model_used="hybrid-signal-v1",
        duration_ms=elapsed_ms(started_at),
    )


def build_response(
    payload: CognitiveRequest,
    data: dict[str, object],
    model_used: str,
    duration_ms: int,
) -> CognitiveResponse:
    """Builds the canonical response envelope expected by the TS adapter."""

    return CognitiveResponse(
        success=True,
        data=data,
        metrics=CognitiveMetrics(latencyMs=duration_ms),
        warnings=[],
        error=None,
        provider=SERVICE_NAME,
        modelUsed=model_used,
        durationMs=duration_ms,
        trace=TraceContext(
            requestId=payload.requestId,
            correlationId=payload.correlationId,
            taskId=payload.taskId,
            sessionId=payload.sessionId,
            agentId=payload.agentId,
            tenantId=payload.tenantId,
        ),
    )


def utc_now() -> str:
    """Returns the current UTC timestamp in ISO 8601 format."""

    return datetime.now(timezone.utc).isoformat()


def elapsed_ms(started_at: float) -> int:
    """Converts a perf counter delta into integer milliseconds."""

    return max(1, int((perf_counter() - started_at) * 1000))
