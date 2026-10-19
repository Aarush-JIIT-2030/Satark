"""Shared FIRSTLIGHT investigation API.

This service wraps the repository's canonical Python engine so web and
Streamlit workflows can use the same evidence verification and investigation
rules. It performs no live collection or real response actions.
"""
from __future__ import annotations

import hmac
import os
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator

from firstlight_engine import investigate_case, seal_evidence, sha256_record, verify_evidence

MAX_BODY_BYTES = 2 * 1024 * 1024
MAX_EVIDENCE = 500
app = FastAPI(title="FIRSTLIGHT Investigation API", version="1.0.0", docs_url=None, redoc_url=None)


class EvidenceInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    id: str = Field(min_length=1, max_length=100)
    time: str = Field(min_length=1, max_length=64)
    source: str = Field(min_length=1, max_length=160)
    kind: str = Field(min_length=1, max_length=100)
    summary: str = Field(min_length=1, max_length=4096)
    digest: str = Field(pattern=r"^[0-9a-f]{64}$")

    @field_validator("time")
    @classmethod
    def validate_timestamp(cls, value: str) -> str:
        from datetime import datetime
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError("time must be an ISO-8601 timestamp") from exc
        if parsed.tzinfo is None:
            raise ValueError("time must include an explicit timezone")
        return value


class InvestigationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    case_id: str = Field(min_length=1, max_length=128)
    title: str = Field(default="FIRSTLIGHT investigation", min_length=1, max_length=240)
    evidence: list[EvidenceInput] = Field(max_length=MAX_EVIDENCE)


def _authorize(authorization: str | None) -> None:
    expected = os.getenv("FIRSTLIGHT_API_TOKEN", "")
    if not expected:
        return
    if len(expected) < 32:
        raise HTTPException(status_code=503, detail="FIRSTLIGHT API token configuration is invalid")
    supplied = authorization or ""
    if not supplied.startswith("Bearer ") or not hmac.compare_digest(supplied[7:], expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.middleware("http")
async def bounded_request(request: Request, call_next):
    length = request.headers.get("content-length")
    if length:
        try:
            if int(length) > MAX_BODY_BYTES:
                return JSONResponse(status_code=413, content={"detail": "Request body is too large"})
        except ValueError:
            return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length"})
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/health")
async def health():
    return {"status": "ok", "engine": "firstlight_engine.investigate_case", "model_agents_enabled": False, "production_ready": False}


@app.post("/api/v1/cases/investigate")
async def run_investigation(
    payload: InvestigationRequest,
    request: Request,
    authorization: str | None = Header(default=None),
):
    _authorize(authorization)
    if len(await request.body()) > MAX_BODY_BYTES:
        raise HTTPException(status_code=413, detail="Request body is too large")
    ids = [item.id for item in payload.evidence]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=422, detail="Evidence IDs must be unique within a case")

    envelopes: list[dict[str, Any]] = []
    integrity = []
    for item in payload.evidence:
        # This representation is also used by the browser when hashing evidence.
        record = {
            "event_id": item.id,
            "timestamp": item.time,
            "source": item.source,
            "kind": item.kind,
            "summary": item.summary,
            "details": {},
        }
        actual = sha256_record(record)
        valid = hmac.compare_digest(actual, item.digest)
        integrity.append({
            "evidence_id": item.id,
            "valid": valid,
            "status": "VERIFIED" if valid else "HASH MISMATCH — POSSIBLE TAMPERING",
            "expected_sha256": item.digest,
            "actual_sha256": actual,
        })
        # Keep a mismatched submitted digest intact so the engine also marks it
        # untrusted; never silently reseal a record that failed verification.
        envelopes.append({
            "evidence_id": item.id,
            "record": record,
            "sha256": item.digest,
            "collected_at": "",
            "integrity_status": "verified" if valid else "mismatch",
        })

    result = investigate_case({"case_id": payload.case_id, "title": payload.title}, envelopes)
    return {
        "schema_version": "1.0",
        "case_id": payload.case_id,
        "integrity": integrity,
        "integrity_summary": {
            "total": len(integrity),
            "verified": sum(1 for item in integrity if item["valid"]),
            "mismatched": sum(1 for item in integrity if not item["valid"]),
        },
        "investigation": result,
        "limitations": [
            "Only client-supplied event summaries were reviewed; no live endpoint collection occurred.",
            "Browser-computed hashes detect changes relative to the submitted digest but do not prove source authenticity or establish an independently protected chain of custody.",
            "All stages are deterministic; independent LLM agents are not enabled.",
            "Response proposals are simulation-only.",
        ],
    }
