"""FastAPI application entry point."""

from __future__ import annotations

import logging
import threading
import time
from typing import Optional

import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from aggregator import TrafficAggregator
from capture import CaptureService
from models import DrilldownResponse, HealthResponse, JsonDataRequest, JsonDataResponse, SummaryResponse
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

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins
        allow_credentials=True,
        allow_methods=["*"],  # Allow all methods
        allow_headers=["*"],  # Allow all headers
    )

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

    @app.post("/api/json-data", response_model=JsonDataResponse)
    def receive_json_data(
        request: JsonDataRequest,
        aggregator: TrafficAggregator = Depends(get_aggregator),
    ) -> JsonDataResponse:
        """Receive and process JSON data sent via FTP."""
        LOGGER.info("📄 JSON DATA RECEIVED: client_id=%s, type=%s, size=%d bytes", 
                   request.client_id, request.data_type, request.file_size)
        
        # Log the payload for debugging
        LOGGER.info("📄 JSON PAYLOAD: %s", request.payload)
        
        # Process the JSON data (you can add business logic here)
        processed_at = int(time.time())
        
        return JsonDataResponse(
            received=True,
            processed_at=processed_at,
            client_id=request.client_id,
            file_size=request.file_size,
            message=f"JSON data from {request.client_id} processed successfully"
        )

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


