"""In-memory traffic aggregation utilities."""

from __future__ import annotations

import logging
import threading
import time
from collections import defaultdict
from typing import DefaultDict, Dict, List, Optional

LOGGER = logging.getLogger(__name__)


class TrafficAggregator:
    """Aggregate captured traffic into tumbling windows."""

    def __init__(self, server_ip: str, window_seconds: int, retention_seconds: int) -> None:
        self.server_ip = server_ip
        self.window_seconds = window_seconds
        self.retention_seconds = retention_seconds
        self._lock = threading.Lock()
        self._data: Dict[int, Dict[str, Dict[str, object]]] = {}

    def _bin_ts(self, packet_ts: float) -> int:
        window = int(self.window_seconds)
        return int(packet_ts) - (int(packet_ts) % window)

    def _prune(self, reference_ts: float) -> None:
        cutoff = int(reference_ts) - self.retention_seconds
        removable: List[int] = []
        for ts in self._data.keys():
            if ts < cutoff:
                removable.append(ts)

        for ts in removable:
            self._data.pop(ts, None)

    def add_packet(
        self,
        *,
        timestamp: float,
        src_ip: str,
        dst_ip: str,
        length: int,
        protocol: str,
    ) -> None:
        """Add a captured packet to the aggregation buckets."""

        if length <= 0:
            return

        direction: Optional[str]
        client_ip: Optional[str]

        LOGGER.info("Aggregator: src_ip=%s, dst_ip=%s, server_ip=%s", src_ip, dst_ip, self.server_ip)

        # Capturar tráfego para o servidor principal (backend)
        if dst_ip == self.server_ip:  # Backend
            direction = "in"
            client_ip = src_ip
            LOGGER.info("Aggregator: Direction IN, client_ip=%s", client_ip)
        elif src_ip == self.server_ip:  # Backend
            direction = "out"
            client_ip = dst_ip
            LOGGER.info("Aggregator: Direction OUT, client_ip=%s", client_ip)
        else:
            LOGGER.info("Aggregator: SKIPPING packet - no match with server_ip")
            return

        ts_bin = self._bin_ts(timestamp)
        protocol_key = protocol.upper() if protocol else "OTHER"

        with self._lock:
            bucket = self._data.setdefault(ts_bin, {})
            client_bucket = bucket.setdefault(
                client_ip,
                {
                    "in": 0,
                    "out": 0,
                    "proto": defaultdict(lambda: {"in": 0, "out": 0}),
                },
            )

            client_bucket[direction] = int(client_bucket[direction]) + length
            proto_map: DefaultDict[str, Dict[str, int]] = client_bucket["proto"]
            proto_totals = proto_map[protocol_key]
            proto_totals[direction] = proto_totals.get(direction, 0) + length

            self._prune(reference_ts=timestamp)

    def get_summary(self, *, from_ts: Optional[int] = None, to_ts: Optional[int] = None) -> List[Dict[str, object]]:
        """Return a flattened view of aggregated bins within the time range."""

        now = int(time.time())
        lower = from_ts if from_ts is not None else now - self.retention_seconds
        upper = to_ts if to_ts is not None else now

        with self._lock:
            self._prune(reference_ts=upper)
            payload: List[Dict[str, object]] = []

            for ts in sorted(self._data.keys()):
                if ts < lower or ts > upper:
                    continue
                for client_ip, data in self._data[ts].items():
                    payload.append(
                        {
                            "ts": ts,
                            "client_ip": client_ip,
                            "in_bytes": int(data["in"]),
                            "out_bytes": int(data["out"]),
                        }
                    )

        return payload

    def get_drilldown(self, *, ts: int, client_ip: str) -> Optional[Dict[str, object]]:
        """Return protocol-level details for a specific bin/client."""

        with self._lock:
            bucket = self._data.get(ts)
            if not bucket:
                return None

            client_bucket = bucket.get(client_ip)
            if not client_bucket:
                return None

            proto_map: DefaultDict[str, Dict[str, int]] = client_bucket["proto"]
            items = []
            for protocol, totals in sorted(proto_map.items()):
                items.append(
                    {
                        "protocol": protocol,
                        "in_bytes": int(totals.get("in", 0)),
                        "out_bytes": int(totals.get("out", 0)),
                    }
                )

        return {
            "ts": ts,
            "client_ip": client_ip,
            "items": items,
        }


