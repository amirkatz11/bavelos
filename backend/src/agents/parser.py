"""Discount term parsing utilities."""

from __future__ import annotations

import re
from typing import Dict, Optional

ParsedTerm = Dict[str, float]

_PATTERN_FRACTION = re.compile(
    r"(?P<pct>\d+(?:\.\d+)?)\s*/\s*(?P<days>\d+)\s*NET\s*(?P<net>\d+)"
)
_PATTERN_VERBOSE = re.compile(
    r"(?P<pct>\d+(?:\.\d+)?)\s*%\s*(?P<days>\d+)\s*(?:DAY|DAYS)\s*NET\s*(?P<net>\d+)"
)
_PATTERN_NET_ONLY = re.compile(r"NET\s*(?P<net>\d+)")


def parse_payment_terms(term: Optional[str]) -> Dict[str, Optional[float]]:
    """Parse payment term strings into structured data."""
    raw_term = term or ""
    result = {
        "has_discount": False,
        "discount_percentage": None,
        "discount_days": None,
        "net_days": None,
        "raw_terms": raw_term,
        "parse_error": False,
    }

    if not raw_term.strip():
        result["parse_error"] = True
        return result

    normalized = _normalize_terms(raw_term)

    match = _PATTERN_FRACTION.search(normalized)
    if match:
        result.update(
            {
                "has_discount": True,
                "discount_percentage": float(match.group("pct")),
                "discount_days": int(match.group("days")),
                "net_days": int(match.group("net")),
            }
        )
        return result

    match = _PATTERN_VERBOSE.search(normalized)
    if match:
        result.update(
            {
                "has_discount": True,
                "discount_percentage": float(match.group("pct")),
                "discount_days": int(match.group("days")),
                "net_days": int(match.group("net")),
            }
        )
        return result

    match = _PATTERN_NET_ONLY.search(normalized)
    if match:
        result["net_days"] = int(match.group("net"))
        return result

    result["parse_error"] = True
    return result


def parse_discount_term(term: str) -> Optional[ParsedTerm]:
    """Legacy helper that converts payment terms into calculator-friendly values."""
    parsed = parse_payment_terms(term)

    if parsed["parse_error"] or not parsed["has_discount"]:
        return None

    return {
        "discount_pct": float(parsed["discount_percentage"]),
        "discount_days": float(parsed["discount_days"]),
        "net_days": float(parsed["net_days"]),
    }


def format_discount_term(parsed: Dict[str, float]) -> str:
    """Format parsed discount back into readable string."""
    if not parsed:
        return "No discount terms"

    if parsed.get("discount_pct", 0) == 0:
        return f"Net {int(parsed.get('net_days', 0))}"

    discount_pct = parsed.get("discount_pct", 0)
    discount_days = parsed.get("discount_days", 0)
    net_days = parsed.get("net_days", 0)
    return f"{discount_pct}/{int(discount_days)} Net {int(net_days)}"


def _normalize_terms(term: str) -> str:
    value = term.upper().strip()
    value = value.replace(",", " ")
    value = re.sub(r"\s+", " ", value)
    value = re.sub(r"(NET)(\d)", r"\1 \2", value)
    value = re.sub(r"/\s+", "/", value)
    return value


if __name__ == "__main__":
    samples = [
        "2/10 Net 30",
        "1/15 Net 45",
        "Net 30",
        "2/10, Net 30",
        "2% 10 days net 30",
        "Net45",
        "",
        "pay when paid",
    ]

    for sample in samples:
        print(f"{sample!r} -> {parse_payment_terms(sample)}")

