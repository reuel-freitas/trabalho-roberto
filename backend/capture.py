"""Live traffic capture that feeds the aggregator."""

from __future__ import annotations

import logging
import threading
import time
from typing import Optional

import pyshark

from aggregator import TrafficAggregator

LOGGER = logging.getLogger(__name__)


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
        LOGGER.info("=== CAPTURE THREAD STARTING ===")
        LOGGER.info("Starting LiveCapture on interface %s", self.iface)
        while not self._stop_event.is_set():
            try:
                LOGGER.info("Creating LiveCapture instance...")
                capture = pyshark.LiveCapture(interface=self.iface)
                LOGGER.info("Starting packet capture...")
                packet_count = 0
                for packet in capture.sniff_continuously():
                    if self._stop_event.is_set():
                        break
                    packet_count += 1
                    LOGGER.info("Processing packet #%d", packet_count)
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
            LOGGER.info("Packet: %s -> %s, length=%d", src_ip, dst_ip, length)
        except Exception as exc:  # noqa: BLE001
            LOGGER.debug("Skipping packet due to parse error: %s", exc)
            return

        protocol = self._detect_protocol(packet)
        LOGGER.info("Detected protocol: %s", protocol)

        try:
            self.aggregator.add_packet(
                timestamp=timestamp,
                src_ip=src_ip,
                dst_ip=dst_ip,
                length=length,
                protocol=protocol,
            )
            LOGGER.info("Packet added to aggregator successfully")
        except Exception as exc:  # noqa: BLE001
            LOGGER.exception("Failed to add packet to aggregator: %s", exc)

    def _detect_protocol(self, packet: pyshark.packet.packet.Packet) -> str:
        # PRIMEIRO: Detectar por conteúdo/layers (mais preciso para protocolos de aplicação)
        if hasattr(packet, 'http'):
            LOGGER.info("🌐 HTTP DETECTED BY LAYER!")
            return "HTTP"
        if hasattr(packet, 'ftp'):
            LOGGER.info("🐟 FTP DETECTED BY LAYER!")
            return "FTP"
        if hasattr(packet, 'ftp-data'):
            LOGGER.info("🐟 FTP-DATA DETECTED BY LAYER!")
            return "FTP"
        if hasattr(packet, 'dns'):
            LOGGER.info("🔍 DNS DETECTED BY LAYER!")
            return "DNS"
        if hasattr(packet, 'tls'):
            LOGGER.info("🔒 TLS DETECTED BY LAYER!")
            return "HTTPS/TLS"
        if hasattr(packet, 'ssl'):
            LOGGER.info("🔒 SSL DETECTED BY LAYER!")
            return "HTTPS/TLS"
            
        # SEGUNDO: Detectar por porta (fallback para protocolos não detectados por layer)
        try:
            if hasattr(packet, 'tcp'):
                src_port = int(packet.tcp.srcport)
                dst_port = int(packet.tcp.dstport)
                
                LOGGER.info("🔍 TCP packet: src_port=%s, dst_port=%s", src_port, dst_port)
                
                # FTP - porta 21 (controle) e 20 (dados) e portas passivas (30000-30009)
                if (src_port == 21 or dst_port == 21 or 
                    src_port == 20 or dst_port == 20 or
                    (30000 <= src_port <= 30009) or (30000 <= dst_port <= 30009)):
                    LOGGER.info("🐟 FTP DETECTED BY PORT! src_port=%s, dst_port=%s", src_port, dst_port)
                    return "FTP"
                
                # HTTP - porta 80 (fallback se não detectou por layer)
                if src_port == 80 or dst_port == 80:
                    LOGGER.info("🌐 HTTP DETECTED BY PORT! src_port=%s, dst_port=%s", src_port, dst_port)
                    return "HTTP"
                
                # HTTPS - porta 443  
                if src_port == 443 or dst_port == 443:
                    LOGGER.info("🔒 HTTPS DETECTED BY PORT! src_port=%s, dst_port=%s", src_port, dst_port)
                    return "HTTPS/TLS"
                    
                # DNS - porta 53
                if src_port == 53 or dst_port == 53:
                    LOGGER.info("🔍 DNS DETECTED BY PORT! src_port=%s, dst_port=%s", src_port, dst_port)
                    return "DNS"
                    
                # Se é TCP mas não identificamos protocolo específico
                LOGGER.info("📦 TCP GENERIC: src_port=%s, dst_port=%s", src_port, dst_port)
                return "TCP"
                
            elif hasattr(packet, 'udp'):
                src_port = int(packet.udp.srcport)
                dst_port = int(packet.udp.dstport) 
                
                LOGGER.info("📦 UDP packet: src_port=%s, dst_port=%s", src_port, dst_port)
                
                # DNS - porta 53
                if src_port == 53 or dst_port == 53:
                    LOGGER.info("🔍 DNS DETECTED BY UDP PORT! src_port=%s, dst_port=%s", src_port, dst_port)
                    return "DNS"
                    
                return "UDP"
                
            elif hasattr(packet, 'icmp'):
                LOGGER.info("📡 ICMP packet detected")
                return "ICMP"
                
        except Exception as exc:
            LOGGER.debug("Error detecting protocol by port: %s", exc)
            
        LOGGER.info("❓ UNKNOWN PROTOCOL")
        return "OTHER"


