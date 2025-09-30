"""Pydantic models for API responses."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Represents the health endpoint payload."""

    ok: bool
    now: int


class SummaryBin(BaseModel):
    """Aggregated traffic for a specific client within a time bin."""

    ts: int
    client_ip: str
    in_bytes: int
    out_bytes: int


class SummaryResponse(BaseModel):
    """Response model for the traffic summary endpoint."""

    bins: List[SummaryBin]


class DrilldownItem(BaseModel):
    """Protocol-level aggregation details."""

    protocol: str
    in_bytes: int
    out_bytes: int


class DrilldownResponse(BaseModel):
    """Response model for drill-down information."""

    ts: int
    client_ip: str
    items: List[DrilldownItem]


class JsonDataRequest(BaseModel):
    """Request model for JSON data received via FTP."""
    
    client_id: str
    timestamp: int
    data_type: str
    payload: Dict[str, Any]
    file_size: int


class JsonDataResponse(BaseModel):
    """Response model for JSON data processing."""
    
    received: bool
    processed_at: int
    client_id: str
    file_size: int
    message: str


