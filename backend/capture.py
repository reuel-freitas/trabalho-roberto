"""Live traffic capture that feeds the aggregator."""

from __future__ import annotations

import logging
import threading
import time
from typing import Optional

import pyshark

from aggregator import TrafficAggregator

LOGGER = logging.getLogger(__name__)


KNOWN_PROTOCOLS = {
    "http": "HTTP",
    "ftp": "FTP",
    "dns": "DNS",
    "tls": "HTTPS/TLS",
    "tcp": "TCP",
    "udp": "UDP",
    "icmp": "ICMP",
}


class CaptureService:
    """Capture packets from an interface and feed the aggregator."""

    def __init__(self, *, aggregator: TrafficAggregator, iface: str) -> None:
        self.aggregator = aggregator
        self.iface = iface
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return

        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1)

    def _run(self) -> None:
        LOGGER.info("Starting LiveCapture on interface %s", self.iface)
        while not self._stop_event.is_set():
            try:
                capture = pyshark.LiveCapture(interface=self.iface, bpf_filter="ip")
                for packet in capture.sniff_continuously():
                    if self._stop_event.is_set():
                        break
                    self._process_packet(packet)
            except Exception as exc:  # noqa: BLE001
                LOGGER.exception("Capture loop error: %s", exc)
                time.sleep(1)

    def _process_packet(self, packet: pyshark.packet.packet.Packet) -> None:
        try:
            timestamp = float(packet.sniff_timestamp)
            length = int(packet.length)
            src_ip = packet.ip.src
            dst_ip = packet.ip.dst
        except Exception as exc:  # noqa: BLE001
            LOGGER.debug("Skipping packet due to parse error: %s", exc)
            return

        protocol = self._detect_protocol(packet)

        try:
            self.aggregator.add_packet(
                timestamp=timestamp,
                src_ip=src_ip,
                dst_ip=dst_ip,
                length=length,
                protocol=protocol,
            )
        except Exception as exc:  # noqa: BLE001
            LOGGER.exception("Failed to add packet to aggregator: %s", exc)

    def _detect_protocol(self, packet: pyshark.packet.packet.Packet) -> str:
        for layer_name, protocol in KNOWN_PROTOCOLS.items():
            if getattr(packet, layer_name, None) is not None:
                return protocol
        return "OTHER"


