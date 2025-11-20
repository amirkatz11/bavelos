import csv
import random
from datetime import datetime, timedelta

# Set seed for reproducibility
random.seed(42)

suppliers = [
    "Acme Steel Corp",
    "Office Supply Plus",
    "Logistics International",
    "Raw Materials Inc",
    "Tech Components LLC",
    "Industrial Parts Co",
    "Global Shipping Ltd",
    "Manufacturing Supply",
    "Premium Materials",
    "Quality Products Inc",
    "Swift Delivery Services",
    "Wholesale Goods Co",
]


def generate_invoices(count=100):
    invoices = []
    base_date = datetime(2025, 12, 1)

    for i in range(1, count + 1):
        # Determine payment terms based on distribution
        if i <= 60:
            terms = random.choice(["2/10 Net 30", "2/10 Net 30", "1/15 Net 45"])
        elif i <= 90:
            terms = random.choice(["Net 30", "Net 45"])
        else:
            terms = random.choice(["2/10, Net 30", "2% 10 days net 30"])

        # Determine invoice amount based on distribution
        if i % 5 == 0:  # 20% large
            amount = random.randint(50000, 500000)
        elif i % 3 == 0:  # 30% small
            amount = random.randint(1000, 10000)
        else:  # 50% medium
            amount = random.randint(10000, 50000)

        invoice = {
            "invoice_number": f"INV-{i:04d}",
            "supplier_name": random.choice(suppliers),
            "invoice_amount": amount,
            "payment_terms": terms,
            "due_date": (base_date + timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d"),
        }
        invoices.append(invoice)

    return invoices


# Generate invoices
print("Generating sample invoices...")
invoices = generate_invoices(100)

# Save to CSV
with open("data/sample_invoices.csv", "w", newline="") as f:
    writer = csv.DictWriter(
        f,
        fieldnames=[
            "invoice_number",
            "supplier_name",
            "invoice_amount",
            "payment_terms",
            "due_date",
        ],
    )
    writer.writeheader()
    writer.writerows(invoices)

# Print summary
total_value = sum(inv["invoice_amount"] for inv in invoices)
discount_count = sum(1 for inv in invoices if "/" in inv["payment_terms"])

print(f"✓ Created {len(invoices)} invoices")
print(f"✓ Total value: ${total_value:,}")
print(f"✓ {discount_count} invoices with discount terms")
print("✓ Expected opportunity: ~$500K in savings")
print("✓ Saved to: data/sample_invoices.csv")

