# backend/recommender/app.py - OPTIMIZED VERSION

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from typing import List, Optional, Dict
import numpy as np
from datetime import datetime, timedelta
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')
import os
import asyncio
import httpx
from functools import lru_cache
import hashlib
import json

app = FastAPI(title="MyFin AI Recommender", version="1.0.0")

PROJECT_ROOT = Path(__file__).resolve().parents[2]

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= CONFIGURATION =============
OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "gemma:2b"  # Use smaller model for speed
LLM_TIMEOUT = 15.0  # Reduced timeout
MAX_TOKENS = 100  # Reduced token count for faster responses
CACHE_SIZE = 128  # Cache size for LLM responses

# ============= DATA MODELS =============

class Transaction(BaseModel):
    id: str
    date: str
    amount: float
    category: str
    type: str
    accountId: Optional[str] = None
    note: Optional[str] = None

class Account(BaseModel):
    id: str
    type: str
    balance: float
    name: Optional[str] = None

class UserFinancialData(BaseModel):
    userId: str
    accounts: List[Account]
    transactions: List[Transaction]
    monthlyIncome: Optional[float] = None
    savingsGoal: Optional[float] = None

class Insight(BaseModel):
    type: str
    category: str
    title: str
    message: str
    priority: int
    actionable: bool
    suggestedAction: Optional[str] = None

class Prediction(BaseModel):
    metric: str
    currentValue: float
    predictedValue: float
    confidence: float
    timeframe: str
    change: Optional[float] = None
    changePercent: Optional[float] = None

class RecommendationResponse(BaseModel):
    insights: List[Insight]
    predictions: List[Prediction]
    overallScore: int
    recommendations: List[str]
    summary: Dict

# ============= ML MODEL =============

class FinancialMLModel:
    def __init__(self):
        self.expense_model = None
        self.income_model = None
        self.scaler = StandardScaler()
        self.is_trained = False
    
    def predict_next_month(self, current_data: Dict) -> Dict:
        avg_expenses = current_data.get('avg_expenses', 0)
        avg_income = current_data.get('avg_income', 0)
        latest_expenses = current_data.get('latest_month_expense', avg_expenses)
        
        if latest_expenses > avg_expenses * 1.2:
            expense_pred = avg_expenses * 1.1
        elif latest_expenses < avg_expenses * 0.8:
            expense_pred = avg_expenses * 0.9
        else:
            expense_pred = avg_expenses
        
        income_pred = avg_income
        confidence = 0.75 if current_data.get('total_months', 0) >= 3 else 0.5
        
        return {
            'expenses': max(0, expense_pred),
            'income': max(0, income_pred),
            'confidence': confidence
        }

ml_model = FinancialMLModel()

# ============= OPTIMIZED OLLAMA INTEGRATION =============

# In-memory cache for LLM responses
llm_cache = {}

def get_cache_key(prompt: str, max_tokens: int) -> str:
    """Generate cache key for prompt"""
    content = f"{prompt}:{max_tokens}"
    return hashlib.md5(content.encode()).hexdigest()

async def check_ollama_available() -> bool:
    """Check if Ollama is running"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/api/tags", timeout=2.0)
            return response.status_code == 200
    except:
        return False

@lru_cache(maxsize=CACHE_SIZE)
def _cached_llm_call(cache_key: str, prompt: str, max_tokens: int) -> Optional[str]:
    """Synchronous cached LLM call - not directly used but helps with caching logic"""
    return None

async def _call_llm_generate(prompt: str, max_tokens: int = MAX_TOKENS) -> Optional[str]:
    """
    Optimized Ollama API call with:
    - Caching
    - Reduced token count
    - Shorter timeout
    - Temperature optimization
    """
    # Check cache first
    cache_key = get_cache_key(prompt, max_tokens)
    if cache_key in llm_cache:
        print(f"[LLM Cache HIT] {cache_key[:8]}...")
        return llm_cache[cache_key]
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OLLAMA_API_URL,
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.5,  # Lower for more consistent/faster
                        "num_predict": max_tokens,
                        "top_k": 20,  # Reduce for speed
                        "top_p": 0.8,  # Reduce for speed
                        "num_ctx": 1024,  # Smaller context window
                    }
                },
                timeout=LLM_TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()
                generated_text = result.get("response", "")
                
                # Cache the result
                if len(llm_cache) >= CACHE_SIZE:
                    # Remove oldest entry
                    llm_cache.pop(next(iter(llm_cache)))
                llm_cache[cache_key] = generated_text
                
                print(f"[LLM Cache MISS] Generated {len(generated_text)} chars")
                return generated_text
            else:
                print(f"[Ollama error] Status {response.status_code}")
                return None
    except asyncio.TimeoutError:
        print(f"[Ollama timeout] Request took longer than {LLM_TIMEOUT}s")
        return None
    except Exception as e:
        print(f"[Ollama call error] {e}")
        return None

async def enhance_insight_with_llm(insight: Insight, summary: Dict) -> Insight:
    """
    Enhanced insight with optimized prompts and parallel processing
    """
    try:
        # Shorter, more direct prompt
        prompt = f"""Rewrite this financial insight concisely (under 80 words).

Title: {insight.title}
Message: {insight.message}

Balance: ${summary.get('totalBalance', 0):.0f}
Monthly expenses: ${summary.get('monthlyExpenses', 0):.0f}

Format:
TITLE: [clear title]
MESSAGE: [actionable message]
ACTION: [specific action or NONE]"""

        gen = await _call_llm_generate(prompt, max_tokens=80)
        if not gen:
            return insight
        
        # Quick parsing
        new_title = insight.title
        new_message = insight.message
        new_action = insight.suggestedAction
        
        lines = gen.strip().split('\n')
        for line in lines:
            line = line.strip()
            if line.upper().startswith("TITLE:"):
                new_title = line.split(":", 1)[1].strip()[:100]
            elif line.upper().startswith("MESSAGE:"):
                new_message = line.split(":", 1)[1].strip()[:300]
            elif line.upper().startswith("ACTION:"):
                action = line.split(":", 1)[1].strip()
                new_action = action if action.upper() != "NONE" else insight.suggestedAction
        
        return Insight(
            type=insight.type,
            category=insight.category,
            title=new_title if new_title else insight.title,
            message=new_message if new_message else insight.message,
            priority=insight.priority,
            actionable=insight.actionable,
            suggestedAction=new_action
        )
    except Exception as e:
        print(f"[enhance_insight error] {e}")
        return insight

async def enhance_recommendation_with_llm(rec: str, summary: Dict) -> str:
    """Enhanced recommendation with shorter prompts"""
    try:
        prompt = f"""Make this financial tip more actionable (under 40 words):
{rec}

Balance: ${summary.get('totalBalance', 0):.0f}
Expenses: ${summary.get('monthlyExpenses', 0):.0f}

Improved tip:"""

        gen = await _call_llm_generate(prompt, max_tokens=60)
        if not gen:
            return rec
        
        # Clean response
        improved = gen.strip()
        for prefix in ["Improved tip:", "Here's", "Recommendation:", "Tip:"]:
            if improved.lower().startswith(prefix.lower()):
                improved = improved[len(prefix):].strip()
        
        return improved[:200] if improved else rec
    except Exception as e:
        print(f"[enhance_recommendation error] {e}")
        return rec

# ============= PARALLEL LLM PROCESSING =============

async def enhance_insights_parallel(insights: List[Insight], summary: Dict, max_enhance: int = 2) -> List[Insight]:
    """
    Enhance multiple insights in parallel for speed
    Only enhance top N insights to save time
    """
    if not insights:
        return insights
    
    # Only enhance top priority insights
    to_enhance = insights[:max_enhance]
    rest = insights[max_enhance:]
    
    # Process in parallel
    tasks = [enhance_insight_with_llm(ins, summary) for ins in to_enhance]
    enhanced = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Replace with enhanced versions (fallback to original on error)
    result = []
    for i, item in enumerate(enhanced):
        if isinstance(item, Insight):
            result.append(item)
        else:
            print(f"[Error enhancing insight {i}]: {item}")
            result.append(to_enhance[i])
    
    return result + rest

async def enhance_recommendations_parallel(recommendations: List[str], summary: Dict, max_enhance: int = 2) -> List[str]:
    """
    Enhance multiple recommendations in parallel
    Only enhance top N recommendations
    """
    if not recommendations:
        return recommendations
    
    # Only enhance top recommendations
    to_enhance = recommendations[:max_enhance]
    rest = recommendations[max_enhance:]
    
    # Process in parallel
    tasks = [enhance_recommendation_with_llm(rec, summary) for rec in to_enhance]
    enhanced = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Replace with enhanced versions (fallback to original on error)
    result = []
    for i, item in enumerate(enhanced):
        if isinstance(item, str):
            result.append(item)
        else:
            print(f"[Error enhancing recommendation {i}]: {item}")
            result.append(to_enhance[i])
    
    return result + rest

# ============= ANALYSIS FUNCTIONS (unchanged) =============

def analyze_spending_patterns(transactions: List[Transaction]) -> Dict:
    """Analyze spending patterns and trends"""
    if not transactions:
        return {
            'category_totals': {},
            'avg_monthly_expense': 0,
            'latest_month_expense': 0,
            'is_unusual_spending': False,
            'total_months': 0,
            'top_category': None,
            'spending_trend': 'stable',
            'total_income': 0,
            'total_expenses': 0,
            'net_cashflow': 0
        }
    
    df = pd.DataFrame([t.dict() for t in transactions])
    df['date'] = pd.to_datetime(df['date'])
    df['month'] = df['date'].dt.to_period('M')
    
    expenses = df[df['type'] == 'out'].copy()
    income = df[df['type'] == 'in'].copy()
    
    if expenses.empty:
        category_totals = {}
        avg_monthly_expense = 0
        latest_month_expense = 0
        is_unusual = False
        monthly = pd.Series(dtype=float)
        top_category = None
    else:
        category_totals = expenses.groupby('category')['amount'].sum().to_dict()
        monthly = expenses.groupby('month')['amount'].sum()
        avg_monthly_expense = monthly.mean()
        latest_month_expense = monthly.iloc[-1] if len(monthly) > 0 else 0
        
        if len(monthly) >= 2:
            std_dev = monthly.std()
            is_unusual = abs(latest_month_expense - avg_monthly_expense) > std_dev
        else:
            is_unusual = False
        
        top_category = max(category_totals, key=category_totals.get) if category_totals else None
    
    spending_trend = 'stable'
    if len(monthly) >= 3:
        recent_avg = monthly.iloc[-2:].mean()
        older_avg = monthly.iloc[:-2].mean() if len(monthly) > 2 else recent_avg
        if recent_avg > older_avg * 1.1:
            spending_trend = 'increasing'
        elif recent_avg < older_avg * 0.9:
            spending_trend = 'decreasing'
    
    total_income = income['amount'].sum() if not income.empty else 0
    total_expenses = expenses['amount'].sum() if not expenses.empty else 0
    
    return {
        'category_totals': category_totals,
        'avg_monthly_expense': float(avg_monthly_expense),
        'latest_month_expense': float(latest_month_expense),
        'is_unusual_spending': bool(is_unusual),
        'total_months': len(monthly),
        'top_category': top_category,
        'spending_trend': spending_trend,
        'total_income': float(total_income),
        'total_expenses': float(total_expenses),
        'net_cashflow': float(total_income - total_expenses)
    }

def calculate_financial_health_score(data: UserFinancialData, analysis: Dict) -> int:
    """Calculate overall financial health score (0-100)"""
    score = 40
    total_balance = sum(acc.balance for acc in data.accounts)
    total_income = analysis.get('total_income', 0)
    total_expenses = analysis.get('total_expenses', 0)
    
    if total_income > 0:
        savings_rate = (total_income - total_expenses) / total_income
        score += min(25, savings_rate * 100 * 0.25)
    
    if total_balance > 0:
        score += 10
    
    avg_monthly = analysis.get('avg_monthly_expense', 0)
    if avg_monthly > 0 and total_balance >= (avg_monthly * 3):
        score += 15
    elif avg_monthly > 0 and total_balance >= (avg_monthly * 1):
        score += 8
    
    if analysis.get('spending_trend') == 'decreasing':
        score += 10
    elif analysis.get('spending_trend') == 'stable':
        score += 5
    
    return min(100, max(0, int(score)))

def generate_insights(data: UserFinancialData, analysis: Dict) -> List[Insight]:
    """Generate actionable insights"""
    insights = []
    
    total_balance = sum(acc.balance for acc in data.accounts)
    total_income = analysis.get('total_income', 0)
    total_expenses = analysis.get('total_expenses', 0)
    
    if analysis.get('is_unusual_spending'):
        insights.append(Insight(
            type="warning",
            category="spending",
            title="Unusual Spending Detected",
            message=f"Your spending this month is ${analysis['latest_month_expense']:.2f}, significantly higher than your average of ${analysis['avg_monthly_expense']:.2f}",
            priority=5,
            actionable=True,
            suggestedAction="Review your recent transactions and identify areas where you can cut back"
        ))
    
    top_category = analysis.get('top_category')
    if top_category:
        category_totals = analysis.get('category_totals', {})
        top_amount = category_totals.get(top_category, 0)
        
        insights.append(Insight(
            type="info",
            category="spending",
            title=f"Highest Spending: {top_category}",
            message=f"You've spent ${top_amount:.2f} on {top_category}",
            priority=3,
            actionable=True,
            suggestedAction=f"Consider setting a monthly budget limit for {top_category}"
        ))
    
    if total_balance < 0:
        insights.append(Insight(
            type="warning",
            category="balance",
            title="⚠️ Negative Balance Alert",
            message="Your total account balance is negative. This requires immediate attention.",
            priority=5,
            actionable=True,
            suggestedAction="Prioritize paying off debts and avoid new expenses until balance is positive"
        ))
    elif total_balance < 500:
        insights.append(Insight(
            type="warning",
            category="emergency_fund",
            title="Low Emergency Fund",
            message="Your balance is critically low. An unexpected expense could cause financial stress.",
            priority=4,
            actionable=True,
            suggestedAction="Try to save at least $1,000 for emergencies, then work toward 3-6 months of expenses"
        ))
    elif total_balance < analysis.get('avg_monthly_expense', 0) * 3:
        insights.append(Insight(
            type="warning",
            category="emergency_fund",
            title="Build Your Emergency Fund",
            message="Financial experts recommend having 3-6 months of expenses saved for emergencies.",
            priority=3,
            actionable=True,
            suggestedAction=f"Aim to save ${analysis.get('avg_monthly_expense', 0) * 3:.2f} for a 3-month emergency fund"
        ))
    else:
        insights.append(Insight(
            type="success",
            category="emergency_fund",
            title="✓ Strong Emergency Fund",
            message="Great job! You have a healthy emergency fund that can cover unexpected expenses.",
            priority=2,
            actionable=False
        ))
    
    if data.savingsGoal and data.savingsGoal > 0:
        progress = (total_balance / data.savingsGoal) * 100
        if progress >= 100:
            insights.append(Insight(
                type="success",
                category="goals",
                title="🎉 Savings Goal Achieved!",
                message=f"Congratulations! You've reached your savings goal of ${data.savingsGoal:.2f}",
                priority=5,
                actionable=False
            ))
        elif progress >= 75:
            insights.append(Insight(
                type="success",
                category="goals",
                title="Almost There!",
                message=f"You're at {progress:.1f}% of your savings goal. Keep up the great work!",
                priority=3,
                actionable=True,
                suggestedAction=f"Just ${data.savingsGoal - total_balance:.2f} more to reach your goal!"
            ))
        elif progress >= 50:
            insights.append(Insight(
                type="info",
                category="goals",
                title="Halfway to Your Goal",
                message=f"You've saved {progress:.1f}% toward your ${data.savingsGoal:.2f} goal.",
                priority=2,
                actionable=True,
                suggestedAction="Stay consistent with your savings plan to reach your goal faster"
            ))
    
    if total_income > 0:
        savings_rate = ((total_income - total_expenses) / total_income) * 100
        if savings_rate < 0:
            insights.append(Insight(
                type="warning",
                category="savings",
                title="⚠️ Spending More Than Earning",
                message=f"You're spending ${total_expenses - total_income:.2f} more than you earn.",
                priority=5,
                actionable=True,
                suggestedAction="Create a budget to reduce expenses and increase income immediately"
            ))
        elif savings_rate < 10:
            insights.append(Insight(
                type="warning",
                category="savings",
                title="Low Savings Rate",
                message=f"You're only saving {savings_rate:.1f}% of your income. This may not be enough for long-term goals.",
                priority=4,
                actionable=True,
                suggestedAction="Aim to save at least 20% of your income each month using the 50/30/20 rule"
            ))
        elif savings_rate >= 20:
            insights.append(Insight(
                type="success",
                category="savings",
                title="💰 Excellent Savings Rate!",
                message=f"You're saving {savings_rate:.1f}% of your income - that's fantastic!",
                priority=2,
                actionable=False
            ))
    
    trend = analysis.get('spending_trend')
    if trend == 'increasing':
        insights.append(Insight(
            type="warning",
            category="spending",
            title="Rising Expenses Trend",
            message="Your monthly expenses have been increasing over the past few months.",
            priority=4,
            actionable=True,
            suggestedAction="Review your budget and identify where costs are rising. Look for subscriptions or services you can cancel."
        ))
    elif trend == 'decreasing':
        insights.append(Insight(
            type="success",
            category="spending",
            title="📉 Great Job Cutting Expenses!",
            message="Your monthly expenses have been decreasing. Keep up the good work!",
            priority=2,
            actionable=False
        ))
    
    return sorted(insights, key=lambda x: x.priority, reverse=True)

def generate_predictions(data: UserFinancialData, analysis: Dict) -> List[Prediction]:
    """Generate financial predictions"""
    predictions = []
    
    current_data = {
        'previous_expenses': analysis.get('avg_monthly_expense', 0),
        'previous_income': data.monthlyIncome or 0,
        'account_balance': sum(acc.balance for acc in data.accounts),
        'avg_expenses': analysis.get('avg_monthly_expense', 0),
        'avg_income': data.monthlyIncome or analysis.get('total_income', 0) / max(analysis.get('total_months', 1), 1),
        'latest_month_expense': analysis.get('latest_month_expense', 0),
        'total_months': analysis.get('total_months', 0)
    }
    
    pred = ml_model.predict_next_month(current_data)
    
    current_expense = analysis.get('latest_month_expense', 0)
    predicted_expense = pred['expenses']
    expense_change = predicted_expense - current_expense
    expense_change_pct = (expense_change / current_expense * 100) if current_expense > 0 else 0
    
    predictions.append(Prediction(
        metric="Next Month Expenses",
        currentValue=current_expense,
        predictedValue=predicted_expense,
        confidence=pred['confidence'],
        timeframe="next_month",
        change=expense_change,
        changePercent=expense_change_pct
    ))
    
    if data.monthlyIncome:
        predictions.append(Prediction(
            metric="Next Month Income",
            currentValue=data.monthlyIncome,
            predictedValue=pred['income'],
            confidence=pred['confidence'],
            timeframe="next_month",
            change=0,
            changePercent=0
        ))
    
    current_balance = sum(acc.balance for acc in data.accounts)
    predicted_balance = current_balance + pred['income'] - pred['expenses']
    balance_change = predicted_balance - current_balance
    balance_change_pct = (balance_change / current_balance * 100) if current_balance > 0 else 0
    
    predictions.append(Prediction(
        metric="End of Month Balance",
        currentValue=current_balance,
        predictedValue=predicted_balance,
        confidence=pred['confidence'] * 0.85,
        timeframe="end_of_month",
        change=balance_change,
        changePercent=balance_change_pct
    ))
    
    return predictions

def generate_recommendations(insights: List[Insight], score: int, analysis: Dict) -> List[str]:
    """Generate actionable recommendations"""
    recs = []
    
    if score < 40:
        recs.append("🚨 Focus on financial basics: track all expenses, create a budget, and eliminate unnecessary spending")
        recs.append("💡 Consider ways to increase income through side gigs, asking for a raise, or freelancing")
    elif score < 60:
        recs.append("📊 You're making progress! Focus on building an emergency fund of 3-6 months expenses")
        recs.append("💰 Review your budget monthly and look for opportunities to save 20% of your income")
    elif score < 80:
        recs.append("✅ You're doing well! Consider investing surplus funds in retirement accounts or index funds")
        recs.append("📈 Explore tax-advantaged savings options to maximize your financial growth")
    else:
        recs.append("🌟 Excellent financial health! Consider meeting with a financial advisor to optimize investments")
        recs.append("🎯 Set ambitious long-term goals like early retirement or major purchases")
    
    for insight in insights[:3]:
        if insight.actionable and insight.suggestedAction and insight.suggestedAction not in recs:
            recs.append(f"💡 {insight.suggestedAction}")
    
    if analysis.get('spending_trend') == 'increasing':
        recs.append("📉 Your expenses are rising. Review subscriptions, dining out, and impulse purchases")
    
    return recs[:6]

# ============= API ENDPOINTS =============

@app.get("/")
def root():
    return {
        "message": "MyFin AI Recommender Service 🤖",
        "version": "2.0.0-optimized",
        "status": "running",
        "llm_available": asyncio.run(check_ollama_available()),
        "optimizations": ["parallel_processing", "llm_caching", "reduced_tokens", "faster_timeouts"],
        "endpoints": {
            "recommendations": "/api/recommendations",
            "health": "/health",
            "docs": "/docs",
            "cache_stats": "/cache-stats"
        }
    }

@app.get("/health")
async def health_check():
    ollama_status = await check_ollama_available()
    return {
        "status": "healthy",
        "service": "ai-recommender",
        "llm_available": ollama_status,
        "llm_provider": "ollama" if ollama_status else "none",
        "cache_size": len(llm_cache),
        "max_cache_size": CACHE_SIZE
    }

@app.get("/cache-stats")
async def cache_stats():
    """Get LLM cache statistics"""
    return {
        "cache_entries": len(llm_cache),
        "max_cache_size": CACHE_SIZE,
        "cache_keys": list(llm_cache.keys())[:10]  # Show first 10
    }

@app.post("/api/recommendations", response_model=RecommendationResponse)
async def get_recommendations(data: UserFinancialData):
    """
    Generate personalized financial recommendations
    OPTIMIZED with parallel LLM processing
    """
    try:
        # Step 1: Fast analysis (no LLM)
        analysis = analyze_spending_patterns(data.transactions)
        insights = generate_insights(data, analysis)
        score = calculate_financial_health_score(data, analysis)
        predictions = generate_predictions(data, analysis)
        recommendations = generate_recommendations(insights, score, analysis)
        
        total_balance = sum(acc.balance for acc in data.accounts)
        summary = {
            'totalBalance': total_balance,
            'monthlyExpenses': analysis.get('avg_monthly_expense', 0),
            'savingsRate': ((analysis.get('total_income', 0) - analysis.get('total_expenses', 0)) / analysis.get('total_income', 1) * 100) if analysis.get('total_income', 0) > 0 else 0,
            'topCategory': analysis.get('top_category'),
            'spendingTrend': analysis.get('spending_trend')
        }
        print("Analysis with no LLM")
        # Step 2: Try to enhance with LLM (parallel, non-blocking)
        llm_enhanced = False
        try:
            if await check_ollama_available():
                print("[AI] Enhancing with LLM in parallel...")
                start_time = asyncio.get_event_loop().time()
                
                # Process top 2 insights and top 2 recommendations in parallel
                enhanced_insights, enhanced_recs = await asyncio.gather(
                    enhance_insights_parallel(insights, summary, max_enhance=2),
                    enhance_recommendations_parallel(recommendations, summary, max_enhance=2),
                    return_exceptions=True
                )
                
                # Use enhanced versions if successful
                if isinstance(enhanced_insights, list):
                    insights = enhanced_insights
                    llm_enhanced = True
                
                if isinstance(enhanced_recs, list):
                    recommendations = enhanced_recs
                    llm_enhanced = True
                
                elapsed = asyncio.get_event_loop().time() - start_time
                print(f"[AI] LLM enhancement complete in {elapsed:.2f}s")
        except Exception as e:
            print(f"[AI] LLM enhancement failed (non-critical): {e}")
        
        return RecommendationResponse(
            insights=insights,
            predictions=predictions,
            overallScore=score,
            recommendations=recommendations,
            summary=summary
        )
    
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("Starting Optimized AI Recommender Service...")
    print(f"LLM Model: {OLLAMA_MODEL}")
    print(f"Max Tokens: {MAX_TOKENS}")
    uvicorn.run(app, host="0.0.0.0", port=8000)