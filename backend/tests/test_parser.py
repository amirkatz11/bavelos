"""Tests for the discount term parser agent."""

from src.agents.parser import parse_discount_term


def test_standard_fraction_term():
    parsed = parse_discount_term("2/10 Net 30")
    assert parsed == {"discount_pct": 2.0, "discount_days": 10.0, "net_days": 30.0}


def test_percent_style_term():
    parsed = parse_discount_term("1.5% if paid within 10 days otherwise Net 45")
    assert parsed
    assert parsed["discount_pct"] == 1.5
    assert parsed["discount_days"] == 10.0
    assert parsed["net_days"] == 45.0


def test_eom_term():
    parsed = parse_discount_term("5 days EOM")
    assert parsed == {"discount_pct": 0.0, "discount_days": 0.0, "net_days": 35.0}


def test_invalid_term_returns_none():
    assert parse_discount_term("Pay whenever") is None
