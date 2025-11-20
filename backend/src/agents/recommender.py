"""Recommendation helpers built on top of the discount calculator."""

from __future__ import annotations

from typing import Dict, List, Optional


def recommend_discount_action(
    invoice_number: str,
    supplier_name: str,
    invoice_amount: float,
    calc_result: Dict[str, Optional[float]],
    approval_threshold: float = 50_000,
    min_discount: float = 0.5,
) -> Dict[str, Optional[float]]:
    """Generate actionable recommendations based on ROI calculation."""

    recommendation = {
        "action": "PAY ON TIME",
        "status": "Skip",
        "priority": "Low",
        "reason": "No early payment discount available",
        "savings": 0.0,
        "flags": [],
    }

    if not calc_result or calc_result.get("net_benefit") is None:
        return recommendation

    net_benefit = calc_result["net_benefit"]
    roi_vs_capital = calc_result.get("roi_vs_capital") or 0.0
    apr = calc_result.get("apr")
    days_early = calc_result.get("days_early")

    if net_benefit <= 0:
        recommendation["reason"] = (
            f"Discount rate ({apr}% APR) below cost of capital"
            if apr is not None
            else "Discount rate below cost of capital"
        )
        if roi_vs_capital < 5:
            recommendation["priority"] = "Low"
        return recommendation

    flags: List[str] = []
    action = "TAKE DISCOUNT"

    if invoice_amount > approval_threshold:
        status = "Requires approval"
        flags.append("REQUIRES_APPROVAL")
        reason = (
            f"Strong ROI ({apr}% APR) but requires approval "
            f"(invoice > ${approval_threshold:,.0f})"
        )
        priority = "High" if roi_vs_capital > 10 else "Medium"
    else:
        status = "Auto-approve"
        priority = "High" if net_benefit > 1000 else "Medium"
        reason = (
            f"Save ${net_benefit:,.0f} by paying {days_early} days early ({apr}% APR)"
            if days_early is not None and apr is not None
            else f"Save ${net_benefit:,.0f} by paying early"
        )

    if net_benefit < 100:
        flags.append("MARGINAL_BENEFIT")
        priority = "Low"
    elif 100 <= net_benefit <= 1000 and 5 <= roi_vs_capital <= 10:
        priority = "Medium"

    if invoice_amount > 100_000:
        flags.append("LARGE_INVOICE")

    recommendation.update(
        {
            "action": action,
            "status": status,
            "priority": priority,
            "reason": reason,
            "savings": round(net_benefit, 2),
            "flags": flags,
        }
    )

    return recommendation


if __name__ == "__main__":
    sample_results = [
        {
            "name": "High value auto-approve",
            "invoice_number": "INV-1001",
            "supplier_name": "Acme Steel",
            "invoice_amount": 25_000,
            "calc": {
                "net_benefit": 1500.0,
                "roi_vs_capital": 18.0,
                "apr": 33.0,
                "days_early": 20,
            },
        },
        {
            "name": "High value needs approval",
            "invoice_number": "INV-1002",
            "supplier_name": "Global Shipping",
            "invoice_amount": 120_000,
            "calc": {
                "net_benefit": 2500.0,
                "roi_vs_capital": 12.0,
                "apr": 30.0,
                "days_early": 15,
            },
        },
        {
            "name": "Marginal benefit",
            "invoice_number": "INV-1003",
            "supplier_name": "Logistics Intl",
            "invoice_amount": 8_000,
            "calc": {
                "net_benefit": 80.0,
                "roi_vs_capital": 6.0,
                "apr": 18.0,
                "days_early": 10,
            },
        },
        {
            "name": "Skip (negative benefit)",
            "invoice_number": "INV-1004",
            "supplier_name": "Tech Components",
            "invoice_amount": 12_000,
            "calc": {
                "net_benefit": -50.0,
                "roi_vs_capital": -2.0,
                "apr": 8.0,
                "days_early": 20,
            },
        },
        {
            "name": "No discount available",
            "invoice_number": "INV-1005",
            "supplier_name": "Office Supply Plus",
            "invoice_amount": 5_000,
            "calc": {
                "net_benefit": None,
                "roi_vs_capital": None,
                "apr": None,
                "days_early": None,
            },
        },
    ]

    for case in sample_results:
        print(f"\n{case['name']}")
        rec = recommend_discount_action(
            invoice_number=case["invoice_number"],
            supplier_name=case["supplier_name"],
            invoice_amount=case["invoice_amount"],
            calc_result=case["calc"],
            approval_threshold=50_000,
            min_discount=0.5,
        )
        print(rec)


# Alias for compatibility with main.py
generate_recommendation = recommend_discount_action

