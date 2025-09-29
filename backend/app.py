"""FastAPI application entry point."""

from __future__ import annotations

import logging
import threading
import time
from typing import Optional

import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Query

from aggregator import TrafficAggregator
from capture import CaptureService
from models import DrilldownResponse, HealthResponse, SummaryResponse
from settings import Settings, get_settings


LOGGER = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def create_app(settings: Optional[Settings] = None) -> FastAPI:
    settings = settings or get_settings()
    aggregator = TrafficAggregator(
        server_ip=settings.server_ip,
        window_seconds=settings.window_seconds,
        retention_seconds=settings.retention_seconds,
    )
    capture_service = CaptureService(aggregator=aggregator, iface=settings.iface)

    app = FastAPI(title="Realtime Traffic Dashboard", version="1.0.0")

    @app.on_event("startup")
    def _startup() -> None:
        LOGGER.info("Starting capture thread")
        capture_service.start()

    @app.on_event("shutdown")
    def _shutdown() -> None:
        LOGGER.info("Stopping capture thread")
        capture_service.stop()

    def get_aggregator() -> TrafficAggregator:
        return aggregator

    @app.get("/api/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(ok=True, now=int(time.time()))

    @app.get("/api/summary", response_model=SummaryResponse)
    def summary(
        from_ts: Optional[int] = Query(default=None),
        to_ts: Optional[int] = Query(default=None),
        aggregator: TrafficAggregator = Depends(get_aggregator),
    ) -> SummaryResponse:
        bins = aggregator.get_summary(from_ts=from_ts, to_ts=to_ts)
        return SummaryResponse(bins=bins)

    @app.get("/api/drilldown", response_model=DrilldownResponse)
    def drilldown(
        ts: int = Query(...),
        client_ip: str = Query(...),
        aggregator: TrafficAggregator = Depends(get_aggregator),
    ) -> DrilldownResponse:
        result = aggregator.get_drilldown(ts=ts, client_ip=client_ip)
        if not result:
            raise HTTPException(status_code=404, detail="Bin not found")
        return DrilldownResponse(**result)

    return app


app = create_app()


if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "backend.app:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        factory=False,
    )


