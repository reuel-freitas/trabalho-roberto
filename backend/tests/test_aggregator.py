"""Unit tests for the traffic aggregator."""

import time

from backend.aggregator import TrafficAggregator


def make_aggregator(window: int = 5, retention: int = 300) -> TrafficAggregator:
    return TrafficAggregator(server_ip="10.50.0.10", window_seconds=window, retention_seconds=retention)


def test_packets_are_binned_by_window_seconds() -> None:
    aggregator = make_aggregator(window=10)
    base_ts = time.time()

    aggregator.add_packet(
        timestamp=base_ts,
        src_ip="192.168.0.10",
        dst_ip="10.50.0.10",
        length=100,
        protocol="HTTP",
    )
    aggregator.add_packet(
        timestamp=base_ts + 8,
        src_ip="192.168.0.10",
        dst_ip="10.50.0.10",
        length=50,
        protocol="HTTP",
    )

    summary = aggregator.get_summary()
    assert len(summary) == 1
    assert summary[0]["in_bytes"] == 150


def test_in_out_totals_per_client() -> None:
    aggregator = make_aggregator()
    ts = time.time()

    aggregator.add_packet(
        timestamp=ts,
        src_ip="192.168.0.20",
        dst_ip="10.50.0.10",
        length=200,
        protocol="HTTP",
    )
    aggregator.add_packet(
        timestamp=ts,
        src_ip="10.50.0.10",
        dst_ip="192.168.0.20",
        length=120,
        protocol="HTTP",
    )

    summary = aggregator.get_summary()
    assert summary[0]["in_bytes"] == 200
    assert summary[0]["out_bytes"] == 120


def test_drilldown_contains_protocol_totals() -> None:
    aggregator = make_aggregator()
    ts = int(time.time())

    aggregator.add_packet(
        timestamp=ts,
        src_ip="192.168.0.30",
        dst_ip="10.50.0.10",
        length=300,
        protocol="HTTP",
    )
    aggregator.add_packet(
        timestamp=ts,
        src_ip="10.50.0.10",
        dst_ip="192.168.0.30",
        length=50,
        protocol="UDP",
    )

    drilldown = aggregator.get_drilldown(ts=aggregator.get_summary()[0]["ts"], client_ip="192.168.0.30")
    assert drilldown is not None
    proto_map = {item["protocol"]: item for item in drilldown["items"]}
    assert proto_map["HTTP"]["in_bytes"] == 300
    assert proto_map["UDP"]["out_bytes"] == 50


def test_garbage_collection_removes_old_bins() -> None:
    aggregator = make_aggregator(window=5, retention=5)
    base_ts = int(time.time()) - 10

    aggregator.add_packet(
        timestamp=base_ts,
        src_ip="192.168.0.40",
        dst_ip="10.50.0.10",
        length=100,
        protocol="HTTP",
    )
    aggregator.get_summary()

    now_ts = int(time.time())
    aggregator.add_packet(
        timestamp=now_ts,
        src_ip="192.168.0.41",
        dst_ip="10.50.0.10",
        length=100,
        protocol="HTTP",
    )

    summary = aggregator.get_summary()
    assert all(entry["ts"] >= now_ts - 5 for entry in summary)

