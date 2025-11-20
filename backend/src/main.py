import csv
import sys
from agents.parser import parse_payment_terms
from agents.calculator import calculate_discount_roi
from agents.recommender import generate_recommendation


def analyze_invoices(csv_path, cost_of_capital=15.0, approval_threshold=50000.0, min_discount=0.5):
    """
    Analyze invoice CSV and return results.
    
    Returns:
        list of dicts with structure:
        {
            'invoice_number': str,
            'supplier_name': str,
            'invoice_amount': float,
            'payment_terms': str,
            'due_date': str,
            'parsed_terms': dict,
            'roi_analysis': dict,
            'recommendation': dict
        }
    """
    results = []
    
    # Read CSV
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse terms
            parsed = parse_payment_terms(row['payment_terms'])
            
            # Calculate ROI (only if discount available)
            if parsed['has_discount']:
                # Handle invoice_amount that might be a string with commas
                invoice_amount = float(str(row['invoice_amount']).replace(',', ''))
                
                roi = calculate_discount_roi(
                    invoice_amount=invoice_amount,
                    discount_percentage=parsed['discount_percentage'],
                    discount_days=parsed['discount_days'],
                    net_days=parsed['net_days'],
                    cost_of_capital=cost_of_capital
                )
            else:
                roi = None
            
            # Generate recommendation
            invoice_amount = float(str(row['invoice_amount']).replace(',', ''))
            recommendation = generate_recommendation(
                invoice_number=row['invoice_number'],
                supplier_name=row['supplier_name'],
                invoice_amount=invoice_amount,
                calc_result=roi,
                approval_threshold=approval_threshold,
                min_discount=min_discount
            )
            
            # Collect result
            results.append({
                'invoice_number': row['invoice_number'],
                'supplier_name': row['supplier_name'],
                'invoice_amount': invoice_amount,
                'payment_terms': row['payment_terms'],
                'due_date': row.get('due_date', ''),
                'parsed_terms': parsed,
                'roi_analysis': roi,
                'recommendation': recommendation
            })
    
    return results


def print_summary(results):
    """Print analysis summary to console."""
    print("\n" + "="*80)
    print("🚀 BAVELOS FINOPS - DISCOUNT OPPORTUNITY FINDER")
    print("="*80)
    
    total_invoices = len(results)
    with_discounts = sum(1 for r in results if r['parsed_terms']['has_discount'])
    take_discount = sum(1 for r in results if r['recommendation']['action'] == 'TAKE DISCOUNT')
    
    total_savings = sum(
        r['recommendation']['savings'] 
        for r in results 
        if r['recommendation']['action'] == 'TAKE DISCOUNT'
    )
    
    print(f"\n📊 ANALYSIS SUMMARY")
    print(f"   Total invoices analyzed: {total_invoices}")
    print(f"   Invoices with discount terms: {with_discounts}")
    print(f"   Recommended to take discount: {take_discount}")
    print(f"   Total potential savings: ${total_savings:,.2f}")
    
    # Top opportunities
    top_ops = sorted(
        [r for r in results if r['recommendation']['action'] == 'TAKE DISCOUNT'],
        key=lambda x: x['recommendation']['savings'],
        reverse=True
    )[:10]
    
    if top_ops:
        print(f"\n💰 TOP 10 OPPORTUNITIES")
        print(f"{'Invoice':<12} {'Supplier':<25} {'Amount':<12} {'Savings':<12} {'Priority':<10}")
        print("-" * 80)
        for opp in top_ops:
            print(f"{opp['invoice_number']:<12} "
                  f"{opp['supplier_name']:<25} "
                  f"${opp['invoice_amount']:>10,.0f} "
                  f"${opp['recommendation']['savings']:>10,.2f} "
                  f"{opp['recommendation']['priority']:<10}")
    
    print("\n" + "="*80)
    print("✅ Analysis complete. Results ready for export.")
    print("="*80 + "\n")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python src/main.py <path_to_csv>")
        print("Example: python src/main.py data/sample_invoices.csv")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    
    print(f"Analyzing invoices from: {csv_path}")
    results = analyze_invoices(csv_path)
    print_summary(results)
    
    print(f"To export to Excel, run:")
    print(f"  python src/excel_export.py {csv_path}")
