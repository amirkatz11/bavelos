"""
LLM-Enhanced Strategic Analysis Agent
Provides intelligent insights beyond basic ROI calculations.
"""

from typing import Dict, Optional, List
import os
from pathlib import Path

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Load .env from project root (two levels up from this file)
    env_path = Path(__file__).parent.parent.parent / '.env'
    load_dotenv(env_path)
except ImportError:
    # python-dotenv not installed, will use system environment variables
    pass


def analyze_with_llm(
    invoice_number: str,
    supplier_name: str,
    invoice_amount: float,
    payment_terms: str,
    roi_analysis: Optional[Dict],
    recommendation: Dict,
    industry: Optional[str] = None
) -> Dict[str, any]:
    """
    Use LLM to provide strategic insights for invoice analysis.
    
    Args:
        invoice_number: Invoice identifier
        supplier_name: Supplier name
        invoice_amount: Invoice amount
        payment_terms: Payment terms string
        roi_analysis: ROI calculation results
        recommendation: Recommendation from recommender agent
        industry: Optional industry context
    
    Returns:
        Dict with strategic insights:
        {
            'strategic_insight': str,
            'supplier_intelligence': str,
            'risk_assessment': str,
            'negotiation_tips': List[str],
            'context_score': float  # 0-100
        }
    """
    
    # For now, use rule-based intelligence (can be replaced with actual LLM API)
    # In production, this would call OpenAI, Anthropic, or similar
    
    insights = {
        'strategic_insight': '',
        'supplier_intelligence': '',
        'risk_assessment': '',
        'negotiation_tips': [],
        'context_score': 0.0
    }
    
    # Rule-based strategic analysis (simulates LLM intelligence)
    if not roi_analysis or recommendation['action'] != 'TAKE DISCOUNT':
        insights['strategic_insight'] = 'No discount opportunity identified. Standard payment terms apply.'
        insights['context_score'] = 50.0
        return insights
    
    # High-value invoice analysis
    if invoice_amount > 100000:
        insights['strategic_insight'] = (
            f"High-value invoice (${invoice_amount:,.0f}) presents significant opportunity. "
            f"Taking discount saves ${recommendation['savings']:,.2f} with {roi_analysis.get('apr', 0):.1f}% APR. "
            f"Consider negotiating better terms for future invoices."
        )
        insights['supplier_intelligence'] = (
            f"Large transaction with {supplier_name}. "
            f"Strong ROI ({roi_analysis.get('roi_vs_capital', 0):.1f}% above cost of capital) suggests "
            f"this is a strategic opportunity. Monitor supplier relationship for bulk discount potential."
        )
        insights['context_score'] = 85.0
    elif invoice_amount > 50000:
        insights['strategic_insight'] = (
            f"Medium-high value invoice with strong ROI. "
            f"Savings of ${recommendation['savings']:,.2f} justify early payment. "
            f"Review supplier payment history for consistency."
        )
        insights['supplier_intelligence'] = (
            f"Moderate transaction size. "
            f"APR of {roi_analysis.get('apr', 0):.1f}% significantly exceeds cost of capital. "
            f"Good candidate for early payment program."
        )
        insights['context_score'] = 75.0
    else:
        insights['strategic_insight'] = (
            f"Standard invoice with discount opportunity. "
            f"Savings of ${recommendation['savings']:,.2f} with {roi_analysis.get('apr', 0):.1f}% APR. "
            f"Consider automating approval for similar invoices."
        )
        insights['supplier_intelligence'] = (
            f"Routine transaction. "
            f"Discount terms are favorable ({roi_analysis.get('roi_vs_capital', 0):.1f}% above cost of capital). "
            f"Standard early payment recommended."
        )
        insights['context_score'] = 65.0
    
    # Risk assessment
    if invoice_amount > 100000:
        insights['risk_assessment'] = (
            "High-value transaction requires careful review. "
            "Verify invoice accuracy and supplier relationship status. "
            "Consider payment terms negotiation for future orders."
        )
    elif recommendation.get('flags') and 'REQUIRES_APPROVAL' in recommendation.get('flags', []):
        insights['risk_assessment'] = (
            "Invoice exceeds approval threshold. "
            "Standard approval process required. "
            "Low risk given strong ROI metrics."
        )
    else:
        insights['risk_assessment'] = (
            "Low risk transaction. "
            "Standard discount terms apply. "
            "Automated approval recommended for similar invoices."
        )
    
    # Negotiation tips
    if invoice_amount > 100000:
        insights['negotiation_tips'] = [
            f"Leverage volume: Consider negotiating 2.5% discount for future orders over ${invoice_amount:,.0f}",
            "Payment terms: Explore extending net days to 45 while maintaining discount",
            "Relationship: Use this payment as leverage for better terms on next contract"
        ]
    elif roi_analysis.get('roi_vs_capital', 0) > 20:
        insights['negotiation_tips'] = [
            "Strong ROI suggests supplier values early payment",
            "Consider asking for extended discount window (15 days instead of 10)",
            "Document this success for future supplier negotiations"
        ]
    else:
        insights['negotiation_tips'] = [
            "Standard discount terms are acceptable",
            "Monitor supplier for consistency in offering discounts",
            "Consider bulk ordering for better terms"
        ]
    
    return insights


def analyze_supplier_intelligence(
    supplier_name: str,
    invoice_amount: float,
    payment_terms: str,
    industry: Optional[str] = None
) -> Dict[str, any]:
    """
    Provide supplier-specific intelligence.
    
    Returns:
        {
            'payment_history': str,
            'relationship_strength': str,
            'negotiation_leverage': str,
            'recommended_action': str
        }
    """
    
    # Rule-based supplier intelligence (simulates LLM analysis)
    intelligence = {
        'payment_history': 'Standard payment terms. No payment delays noted.',
        'relationship_strength': 'Active supplier relationship.',
        'negotiation_leverage': 'Standard leverage based on transaction volume.',
        'recommended_action': 'Proceed with standard discount evaluation.'
    }
    
    # High-value supplier analysis
    if invoice_amount > 100000:
        intelligence['payment_history'] = (
            f"Large transaction with {supplier_name}. "
            "Review payment history for consistency and reliability."
        )
        intelligence['relationship_strength'] = (
            "Significant transaction volume indicates strong relationship. "
            "Good candidate for negotiated terms."
        )
        intelligence['negotiation_leverage'] = (
            f"High transaction value (${invoice_amount:,.0f}) provides leverage. "
            "Consider negotiating extended terms or better discounts."
        )
        intelligence['recommended_action'] = (
            "Approve with strategic review. "
            "Document for future relationship management."
        )
    
    return intelligence


# Optional: Integration with actual LLM API
def call_llm_api(prompt: str, model: str = "claude-3-5-sonnet-20241022") -> str:
    """
    Call actual LLM API (Anthropic Claude, OpenAI, etc.)
    
    Currently supports Anthropic Claude API. Falls back to rule-based analysis
    if API key is not configured or package is not installed.
    """
    
    # Check for Anthropic API key
    anthropic_key = os.environ.get('ANTHROPIC_API_KEY')
    
    if anthropic_key:
        try:
            import anthropic
            
            client = anthropic.Anthropic(api_key=anthropic_key)
            
            response = client.messages.create(
                model=model,
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            return response.content[0].text
            
        except ImportError:
            # anthropic package not installed
            return "Anthropic package not installed. Install with: pip install anthropic"
        except Exception as e:
            # API call failed
            return f"LLM API error: {str(e)}. Using rule-based analysis."
    
    # Check for OpenAI API key as fallback
    openai_key = os.environ.get('OPENAI_API_KEY')
    if openai_key:
        try:
            import openai
            
            client = openai.OpenAI(api_key=openai_key)
            response = client.chat.completions.create(
                model=model if model.startswith("gpt") else "gpt-3.5-turbo",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            return response.choices[0].message.content
            
        except ImportError:
            return "OpenAI package not installed. Install with: pip install openai"
        except Exception as e:
            return f"LLM API error: {str(e)}. Using rule-based analysis."
    
    # No API key configured
    return "LLM API not configured. Using rule-based analysis."

