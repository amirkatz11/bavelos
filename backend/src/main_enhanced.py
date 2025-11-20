"""
Enhanced Main Analyzer with LLM Intelligence
Integrates strategic AI analysis for deeper insights.
"""

import csv
import sys
from agents.parser import parse_payment_terms
from agents.calculator import calculate_discount_roi
from agents.recommender import generate_recommendation
from agents.llm_analyzer import analyze_with_llm, analyze_supplier_intelligence


def analyze_invoices_enhanced(csv_path, cost_of_capital=15.0, approval_threshold=50000.0, min_discount=0.5):
    """
    Analyze invoice CSV with LLM-enhanced strategic insights.
    
    Returns:
        list of dicts with enhanced structure including LLM insights
    """
    results = []
    llm_enhanced_count = 0
    
    print("🚀 BAVELOS FINOPS - ENHANCED DISCOUNT OPPORTUNITY FINDER")
    print("=" * 80)
    print("Analyzing with LLM intelligence...")
    print()
    
    # Read CSV
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        total_rows = len(rows)
        
        for idx, row in enumerate(rows, 1):
            # Parse terms
            parsed = parse_payment_terms(row.get('payment_terms', ''))
            
            # Calculate ROI (only if discount available)
            if parsed['has_discount']:
                invoice_amount = float(str(row.get('invoice_amount', 0)).replace(',', ''))
                
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
            invoice_amount = float(str(row.get('invoice_amount', 0)).replace(',', ''))
            recommendation = generate_recommendation(
                invoice_number=row.get('invoice_number', ''),
                supplier_name=row.get('supplier_name', ''),
                invoice_amount=invoice_amount,
                calc_result=roi,
                approval_threshold=approval_threshold,
                min_discount=min_discount
            )
            
            # LLM-Enhanced Analysis (for high-value or strategic invoices)
            llm_insights = None
            supplier_intel = None
            
            # Apply LLM analysis to:
            # 1. High-value invoices (> $50K)
            # 2. Invoices with strong ROI (> 20% above cost of capital)
            # 3. Invoices requiring approval
            should_analyze = False
            
            if invoice_amount > approval_threshold:
                should_analyze = True
            elif roi and roi.get('roi_vs_capital', 0) > 20:
                should_analyze = True
            elif recommendation.get('status') == 'Requires approval':
                should_analyze = True
            
            if should_analyze:
                llm_insights = analyze_with_llm(
                    invoice_number=row.get('invoice_number', ''),
                    supplier_name=row.get('supplier_name', ''),
                    invoice_amount=invoice_amount,
                    payment_terms=row.get('payment_terms', ''),
                    roi_analysis=roi,
                    recommendation=recommendation,
                    industry=row.get('industry', None)
                )
                
                # Supplier intelligence for high-value invoices
                if invoice_amount > 100000:
                    supplier_intel = analyze_supplier_intelligence(
                        supplier_name=row.get('supplier_name', ''),
                        invoice_amount=invoice_amount,
                        payment_terms=row.get('payment_terms', ''),
                        industry=row.get('industry', None)
                    )
                
                llm_enhanced_count += 1
            
            # Build result
            result = {
                'invoice_number': row.get('invoice_number', ''),
                'supplier_name': row.get('supplier_name', ''),
                'invoice_amount': invoice_amount,
                'payment_terms': row.get('payment_terms', ''),
                'due_date': row.get('due_date', ''),
                'industry': row.get('industry', ''),
                'parsed_terms': parsed,
                'roi_analysis': roi,
                'recommendation': recommendation,
                'llm_insights': llm_insights,
                'supplier_intelligence': supplier_intel
            }
            
            results.append(result)
            
            # Progress indicator
            if idx % 10 == 0:
                print(f"  Processed {idx}/{total_rows} invoices...", end='\r')
    
    print()
    print(f"✅ Analysis complete!")
    print(f"📊 Total invoices analyzed: {len(results)}")
    print(f"🤖 {llm_enhanced_count} invoices include strategic AI analysis")
    print("=" * 80)
    print()
    
    return results


def print_summary(results):
    """Print enhanced summary with LLM insights."""
    print("\n" + "=" * 80)
    print("📈 ENHANCED ANALYSIS SUMMARY")
    print("=" * 80)
    
    total_invoices = len(results)
    with_discounts = sum(1 for r in results if r['parsed_terms']['has_discount'])
    take_discount = sum(1 for r in results if r['recommendation']['action'] == 'TAKE DISCOUNT')
    total_savings = sum(
        r['recommendation']['savings'] 
        for r in results 
        if r['recommendation']['action'] == 'TAKE DISCOUNT'
    )
    llm_analyzed = sum(1 for r in results if r['llm_insights'] is not None)
    
    print(f"\n📊 OVERALL METRICS:")
    print(f"  Total invoices analyzed: {total_invoices}")
    print(f"  Invoices with discount terms: {with_discounts}")
    print(f"  Recommended to take discount: {take_discount}")
    print(f"  Total potential savings: ${total_savings:,.2f}")
    print(f"  🤖 LLM-enhanced analysis: {llm_analyzed} invoices")
    
    # Top opportunities with LLM insights
    top_ops = sorted(
        [r for r in results if r['recommendation']['action'] == 'TAKE DISCOUNT'],
        key=lambda x: x['recommendation']['savings'],
        reverse=True
    )[:10]
    
    if top_ops:
        print(f"\n💰 TOP 10 OPPORTUNITIES:")
        print(f"{'Invoice':<12} {'Supplier':<25} {'Amount':<12} {'Savings':<12} {'AI':<5}")
        print("-" * 80)
        for opp in top_ops:
            ai_indicator = "🤖" if opp['llm_insights'] else "  "
            print(
                f"{opp['invoice_number']:<12} "
                f"{opp['supplier_name']:<25} "
                f"${opp['invoice_amount']:>10,.0f} "
                f"${opp['recommendation']['savings']:>10,.2f} "
                f"{ai_indicator:<5}"
            )
        
        # Show LLM insights for top opportunity
        top_with_ai = next((r for r in top_ops if r['llm_insights']), None)
        if top_with_ai:
            print(f"\n🤖 STRATEGIC INSIGHT (Top Opportunity):")
            print(f"  Invoice: {top_with_ai['invoice_number']}")
            print(f"  {top_with_ai['llm_insights']['strategic_insight']}")
            if top_with_ai['supplier_intelligence']:
                print(f"\n  Supplier Intelligence:")
                print(f"  {top_with_ai['supplier_intelligence']['recommended_action']}")
    
    print("\n" + "=" * 80)
    print("✅ Enhanced analysis complete. Results ready for export.")
    print("=" * 80 + "\n")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python src/main_enhanced.py <path_to_csv>")
        print("Example: python src/main_enhanced.py data/sample_invoices.csv")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    print(f"Analyzing invoices from: {csv_path}")
    print()
    
    results = analyze_invoices_enhanced(csv_path)
    print_summary(results)
    
    print(f"To export to Excel, run:")
    print(f"  python src/excel_export.py {csv_path}")

