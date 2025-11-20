from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import sys
import os
import csv
from datetime import datetime
from io import StringIO

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.agents.parser import parse_payment_terms
from src.agents.calculator import calculate_discount_roi
from src.agents.recommender import generate_recommendation
from src.agents.llm_analyzer import analyze_with_llm, analyze_supplier_intelligence

app = Flask(__name__)
CORS(app)

app.config['UPLOAD_FOLDER'] = 'web/uploads'
app.config['OUTPUT_FOLDER'] = 'web/outputs'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

# In-memory store for review decisions (in production, use database)
review_decisions = {}  # {invoice_number: "approve"|"reject"}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/upload', methods=['POST'])
def upload_csv():
    try:
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file provided"}), 400
        
        file = request.files['file']
        content = file.read().decode('utf-8')
        csv_reader = csv.DictReader(StringIO(content))
        
        data = []
        columns = []
        
        for row in csv_reader:
            if not columns:
                columns = list(row.keys())
            data.append(row)
        
        return jsonify({"success": True, "rows": len(data), "columns": columns, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        payload = request.json
        data = payload.get('data', [])
        config = payload.get('config', {})
        
        cost_of_capital = float(config.get('costOfCapital', 15))
        approval_threshold = float(config.get('approvalThreshold', 50000))
        min_discount = float(config.get('minDiscount', 0.5))
        use_enhanced = config.get('useEnhanced', True)  # Enable enhanced analysis by default
        
        results = []
        llm_enhanced_count = 0
        
        for row in data:
            try:
                parsed = parse_payment_terms(row.get('payment_terms', ''))
                invoice_amount = float(str(row.get('invoice_amount', 0)).replace(',', ''))
                
                if parsed['has_discount']:
                    roi = calculate_discount_roi(
                        invoice_amount=invoice_amount,
                        discount_percentage=parsed['discount_percentage'],
                        discount_days=parsed['discount_days'],
                        net_days=parsed['net_days'],
                        cost_of_capital=cost_of_capital
                    )
                else:
                    roi = None
                
                recommendation = generate_recommendation(
                    invoice_number=row.get('invoice_number', ''),
                    supplier_name=row.get('supplier_name', ''),
                    invoice_amount=invoice_amount,
                    calc_result=roi,
                    approval_threshold=approval_threshold,
                    min_discount=min_discount
                )
            except Exception as e:
                print(f"ERROR processing row {row.get('invoice_number', 'unknown')}: {str(e)}")
                import traceback
                traceback.print_exc()
                # Set defaults on error
                parsed = {'has_discount': False, 'discount_percentage': '', 'discount_days': '', 'net_days': ''}
                roi = None
                recommendation = {
                    'action': 'PAY ON TIME',
                    'status': 'Skip',
                    'priority': 'Low',
                    'savings': 0,
                    'reason': f'Error processing: {str(e)}',
                    'flags': []
                }
            
            # LLM-Enhanced Analysis (if enabled)
            llm_insights = None
            supplier_intel = None
            
            if use_enhanced:
                # Apply LLM analysis to strategic invoices
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
            
            result = {**row}
            
            # Always set these fields (even if empty)
            result['has_discount'] = 'Yes' if parsed.get('has_discount', False) else 'No'
            result['discount_percentage'] = parsed.get('discount_percentage') or ''
            result['discount_days'] = parsed.get('discount_days') or ''
            result['net_days'] = parsed.get('net_days') or ''
            
            # ROI fields - set even if None (empty string or 0)
            if roi:
                result['apr'] = round(roi.get('apr', 0), 1)
                result['net_benefit'] = round(roi.get('net_benefit', 0), 2)
                result['roi_vs_capital'] = round(roi.get('roi_vs_capital', 0), 1)
            else:
                result['apr'] = ''
                result['net_benefit'] = ''
                result['roi_vs_capital'] = ''
            
            # Recommendation fields - ALWAYS set these
            result['action'] = recommendation.get('action', 'PAY ON TIME')
            result['status'] = recommendation.get('status', 'Skip')
            result['priority'] = recommendation.get('priority', 'Low')
            result['savings'] = round(recommendation.get('savings', 0), 2)
            result['reason'] = recommendation.get('reason', '')
            result['flags'] = recommendation.get('flags', [])
            
            # Verify all required fields are present
            required_fields = ['has_discount', 'action', 'status', 'priority', 'savings']
            for field in required_fields:
                if field not in result:
                    print(f"WARNING: Missing field {field} in result for invoice {result.get('invoice_number', 'unknown')}")
                    result[field] = '' if field != 'savings' else 0
            
            # Add LLM insights if available
            if llm_insights:
                result['strategic_insight'] = llm_insights.get('strategic_insight', '')
                result['supplier_intelligence'] = llm_insights.get('supplier_intelligence', '')
                result['risk_assessment'] = llm_insights.get('risk_assessment', '')
                result['negotiation_tips'] = llm_insights.get('negotiation_tips', [])
                result['context_score'] = llm_insights.get('context_score', 0)
            
            if supplier_intel:
                result['supplier_payment_history'] = supplier_intel.get('payment_history', '')
                result['supplier_relationship'] = supplier_intel.get('relationship_strength', '')
                result['supplier_leverage'] = supplier_intel.get('negotiation_leverage', '')
            
            results.append(result)
        
        # DEBUG: Print first result structure
        if len(results) > 0:
            print("=" * 80)
            print("DEBUG: First result from /api/analyze:")
            print("Total keys:", len(results[0].keys()))
            print("All keys:", list(results[0].keys()))
            print("\nSample values:")
            for key in ['invoice_number', 'has_discount', 'discount_percentage', 'apr', 'action', 'status', 'savings', 'priority', 'reason']:
                value = results[0].get(key, 'MISSING')
                print(f"  {key}: {value} (type: {type(value).__name__})")
            print("\nFull first result (first 500 chars):")
            import json
            result_str = json.dumps(results[0], indent=2, default=str)
            print(result_str[:500])
            print("=" * 80)
        
        with_discounts = sum(1 for r in results if r['has_discount'] == 'Yes')
        recommended = sum(1 for r in results if r['action'] == 'TAKE DISCOUNT')
        total_savings = sum(r['savings'] for r in results if r['action'] == 'TAKE DISCOUNT')
        
        return jsonify({
            "success": True,
            "results": results,
            "summary": {
                "total_invoices": len(results),
                "with_discounts": with_discounts,
                "recommended": recommended,
                "total_savings": round(total_savings, 2),
                "llm_enhanced": llm_enhanced_count if use_enhanced else 0
            }
        })
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/export', methods=['POST'])
def export_excel():
    try:
        payload = request.json
        results = payload.get('results', [])
        
        from src.excel_export import create_excel_report
        
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], f'analysis_{int(datetime.now().timestamp())}.xlsx')
        create_excel_report(results, output_path)
        
        return send_file(output_path, as_attachment=True, download_name='discount_analysis.xlsx')
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/review', methods=['POST'])
def review_invoice():
    """Handle human-in-the-loop review decisions."""
    try:
        payload = request.json
        invoice_number = payload.get('invoice_number')
        action = payload.get('action')  # "approve" or "reject"
        
        if not invoice_number or not action:
            return jsonify({"success": False, "error": "Missing invoice_number or action"}), 400
        
        if action not in ['approve', 'reject']:
            return jsonify({"success": False, "error": "Action must be 'approve' or 'reject'"}), 400
        
        # Store decision
        review_decisions[invoice_number] = action
        
        return jsonify({
            "success": True,
            "invoice_number": invoice_number,
            "action": action,
            "message": f"Invoice {invoice_number} {action}d"
        })
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
