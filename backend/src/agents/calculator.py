"""Financial ROI calculations for early payment discounts."""

from __future__ import annotations

from typing import Dict, Optional


def calculate_discount_roi(
    invoice_amount: Optional[float],
    discount_percentage: Optional[float],
    discount_days: Optional[int],
    net_days: Optional[int],
    cost_of_capital: Optional[float] = 15.0,
) -> Dict[str, Optional[float]]:
    """Calculate the ROI of taking an early payment discount."""

    result = {
        "discount_amount": None,
        "days_early": None,
        "apr": None,
        "opportunity_cost": None,
        "net_benefit": None,
        "roi_vs_capital": None,
        "recommendation": "PAY ON TIME",
        "opportunity_score": 0,
    }

    if not _valid_inputs(
        invoice_amount, discount_percentage, discount_days, net_days, cost_of_capital
    ):
        return result

    days_early = net_days - discount_days
    if days_early <= 0:
        return result

    discount_amount = invoice_amount * (discount_percentage / 100)
    apr = (discount_percentage / 100) * (365 / days_early) * 100
    opportunity_cost = invoice_amount * (cost_of_capital / 100) * (days_early / 365)
    net_benefit = discount_amount - opportunity_cost
    roi_vs_capital = apr - cost_of_capital

    recommendation = "TAKE DISCOUNT" if net_benefit > 0 else "PAY ON TIME"
    opportunity_score = max(0, min(100, int(round(roi_vs_capital * 2))))

    result.update(
        {
            "discount_amount": round(discount_amount, 2),
            "days_early": days_early,
            "apr": round(apr, 2),
            "opportunity_cost": round(opportunity_cost, 2),
            "net_benefit": round(net_benefit, 2),
            "roi_vs_capital": round(roi_vs_capital, 2),
            "recommendation": recommendation,
            "opportunity_score": opportunity_score,
        }
    )

    return result


def _valid_inputs(
    invoice_amount: Optional[float],
    discount_percentage: Optional[float],
    discount_days: Optional[int],
    net_days: Optional[int],
    cost_of_capital: Optional[float],
) -> bool:
    try:
        return all(
            (
                isinstance(invoice_amount, (int, float)) and invoice_amount > 0,
                isinstance(discount_percentage, (int, float)) and discount_percentage > 0,
                isinstance(discount_days, int) and discount_days >= 0,
                isinstance(net_days, int) and net_days > 0,
                isinstance(cost_of_capital, (int, float)) and cost_of_capital >= 0,
            )
        )
    except TypeError:
        return False


if __name__ == "__main__":
    scenarios = [
        {
            "name": "High value 2/10 Net 30",
            "invoice_amount": 10_000,
            "discount_percentage": 2.0,
            "discount_days": 10,
            "net_days": 30,
        },
        {
            "name": "Marginal 1.5% over 35 days",
            "invoice_amount": 25_000,
            "discount_percentage": 1.5,
            "discount_days": 10,
            "net_days": 45,
        },
        {
            "name": "Poor 0.5% discount",
            "invoice_amount": 15_000,
            "discount_percentage": 0.5,
            "discount_days": 10,
            "net_days": 30,
        },
        {
            "name": "Large invoice",
            "invoice_amount": 250_000,
            "discount_percentage": 2.0,
            "discount_days": 10,
            "net_days": 30,
        },
    ]

    for scenario in scenarios:
        params = {k: v for k, v in scenario.items() if k != "name"}
        result = calculate_discount_roi(**params, cost_of_capital=15.0)
        print(f"\n{scenario['name']}")
        print(result)

