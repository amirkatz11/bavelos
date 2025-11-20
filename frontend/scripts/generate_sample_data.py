import csv
import random
from datetime import datetime, timedelta

random.seed(42)

suppliers = [
    "Acme Steel Corp", "Office Supply Plus", "Logistics International",
    "Raw Materials Inc", "Tech Components LLC", "Industrial Parts Co",
    "Global Shipping Ltd", "Manufacturing Supply", "Premium Materials",
    "Quality Products Inc", "Swift Delivery Services", "Wholesale Goods Co"
]

invoices = []
base_date = datetime(2025, 12, 1)

for i in range(1, 101):
    if i <= 60:
        terms = random.choice(["2/10 Net 30", "2/10 Net 30", "1/15 Net 45"])
    elif i <= 90:
        terms = random.choice(["Net 30", "Net 45"])
    else:
        terms = random.choice(["2/10, Net 30", "2% 10 days net 30"])
    
    if i % 5 == 0:
        amount = random.randint(50000, 500000)
    elif i % 3 == 0:
        amount = random.randint(1000, 10000)
    else:
        amount = random.randint(10000, 50000)
    
    invoices.append({
        'invoice_number': f'INV-{i:04d}',
        'supplier_name': random.choice(suppliers),
        'invoice_amount': amount,
        'payment_terms': terms,
        'due_date': (base_date + timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d')
    })

print("Generating sample invoices...")
with open('data/sample_invoices.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['invoice_number', 'supplier_name', 
                                           'invoice_amount', 'payment_terms', 'due_date'])
    writer.writeheader()
    writer.writerows(invoices)

total_value = sum(inv['invoice_amount'] for inv in invoices)
discount_count = sum(1 for inv in invoices if '/' in inv['payment_terms'])

print(f"✓ Created {len(invoices)} invoices")
print(f"✓ Total value: ${total_value:,}")
print(f"✓ {discount_count} invoices with discount terms")
print(f"✓ Saved to: data/sample_invoices.csv")
