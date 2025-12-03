# backend/recommender/app.py - ENHANCED WITH DYNAMIC LLM PROCESSING

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
OLLAMA_MODEL = "gemma:2b"
LLM_TIMEOUT = 60.0
MAX_TOKENS = 300  # Increased from 150 to allow longer responses
CACHE_SIZE = 128

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

# ============= OLLAMA INTEGRATION =============

llm_cache = {}

def get_cache_key(prompt: str, max_tokens: int) -> str:
    content = f"{prompt}:{max_tokens}"
    return hashlib.md5(content.encode()).hexdigest()

async def check_ollama_available() -> bool:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:11434/api/tags")
            return response.status_code == 200
    except Exception as e:
        print(f"[Ollama] Health check failed: {e}")
        return False

async def _call_llm_generate(prompt: str, max_tokens: int = MAX_TOKENS) -> Optional[str]:
    cache_key = get_cache_key(prompt, max_tokens)
    if cache_key in llm_cache:
        print(f"[LLM Cache HIT] {cache_key[:8]}...")
        return llm_cache[cache_key]
    
    try:
        print(f"[LLM] Calling Ollama with model: {OLLAMA_MODEL}")
        
        async with httpx.AsyncClient(timeout=LLM_TIMEOUT) as client:
            response = await client.post(
                OLLAMA_API_URL,
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.8,  # Higher for more variety
                        "num_predict": max_tokens,
                        "top_k": 40,
                        "top_p": 0.9,
                    }
                },
                timeout=LLM_TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()
                generated_text = result.get("response", "").strip()
                
                if generated_text:
                    if len(llm_cache) >= CACHE_SIZE:
                        llm_cache.pop(next(iter(llm_cache)))
                    llm_cache[cache_key] = generated_text
                    
                    print(f"[LLM] Success! Generated {len(generated_text)} chars")
                    return generated_text
            else:
                print(f"[LLM Error] Status {response.status_code}: {response.text[:200]}")
                
    except Exception as e:
        print(f"[LLM] Error: {type(e).__name__}: {e}")
    
    return None

async def generate_unique_insight(insight_type: str, category: str, title: str, 
                                  base_message: str, financial_context: Dict) -> Insight:
    """Generate a unique, LLM-enhanced insight"""
    try:
        prompt = f"""You are a financial advisor providing personalized insights.
Generate a unique, actionable financial insight based on this information:

Type: {insight_type}
Category: {category}
Title: {title}
Base Context: {base_message}
Financial Data: {json.dumps(financial_context, default=str)}

Create a concise, personalized message (max 50 words) that is:
- Specific to their situation
- Actionable and practical
- Different from generic financial advice
- Written in first or second person

Format: MESSAGE: [your unique message here]"""
        
        gen = await _call_llm_generate(prompt, max_tokens=200)
        
        if gen and "MESSAGE:" in gen:
            message = gen.split("MESSAGE:")[-1].strip()[:300]
        else:
            message = base_message
        
        return Insight(
            type=insight_type,
            category=category,
            title=title,
            message=message if message else base_message,
            priority=5 if insight_type == "warning" else (3 if insight_type == "info" else 2),
            actionable=True,
            suggestedAction=None
        )
    except Exception as e:
        print(f"[LLM] Error generating insight: {e}")
        return Insight(
            type=insight_type,
            category=category,
            title=title,
            message=base_message,
            priority=3,
            actionable=True,
            suggestedAction=None
        )

async def generate_unique_recommendation(recommendation_context: str, financial_data: Dict) -> str:
    """Generate a unique, LLM-enhanced recommendation"""
    try:
        prompt = f"""You are a financial advisor providing personalized recommendations.
Generate ONE unique, specific financial recommendation based on:

Context: {recommendation_context}
Financial Snapshot: {json.dumps(financial_data, default=str)}

Create a practical, actionable recommendation that:
- Is specific to their financial situation
- Provides clear steps or direction
- Is 1-2 sentences max
- Avoids generic advice

Format: RECOMMENDATION: [your unique recommendation here]"""
        
        gen = await _call_llm_generate(prompt, max_tokens=100)
        
        if gen and "RECOMMENDATION:" in gen:
            recommendation = gen.split("RECOMMENDATION:")[-1].strip()[:200]
        else:
            recommendation = recommendation_context
        
        return recommendation if recommendation else recommendation_context
    except Exception as e:
        print(f"[LLM] Error generating recommendation: {e}")
        return recommendation_context

# ============= ANALYSIS FUNCTIONS =============

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

async def generate_insights(data: UserFinancialData, analysis: Dict) -> List[Insight]:
    """Generate LLM-enhanced insights"""
    insights = []
    
    total_balance = sum(acc.balance for acc in data.accounts)
    total_income = analysis.get('total_income', 0)
    total_expenses = analysis.get('total_expenses', 0)
    
    # Unusual spending
    if analysis.get('is_unusual_spending'):
        context = {
            'latest_spending': analysis['latest_month_expense'],
            'average_spending': analysis['avg_monthly_expense'],
            'difference': analysis['latest_month_expense'] - analysis['avg_monthly_expense']
        }
        insight = await generate_unique_insight(
            'warning', 'spending', 'Unusual Spending Detected',
            f"Your spending this month (${analysis['latest_month_expense']:.2f}) is unusually high compared to your average (${analysis['avg_monthly_expense']:.2f})",
            context
        )
        insights.append(insight)
    
    # Top spending category
    top_category = analysis.get('top_category')
    if top_category:
        category_totals = analysis.get('category_totals', {})
        top_amount = category_totals.get(top_category, 0)
        context = {
            'category': top_category,
            'amount_spent': top_amount,
            'total_expenses': total_expenses
        }
        insight = await generate_unique_insight(
            'info', 'spending', f'Spending Pattern: {top_category}',
            f"You've spent ${top_amount:.2f} on {top_category}. Consider budgeting this category.",
            context
        )
        insights.append(insight)
    
    # Balance warnings
    context_balance = {'current_balance': total_balance, 'emergency_fund_target': analysis.get('avg_monthly_expense', 0) * 3}
    
    if total_balance < 0:
        insight = await generate_unique_insight(
            'warning', 'balance', '⚠️ Negative Balance Alert',
            "Your total account balance is negative. This requires immediate attention.",
            context_balance
        )
        insights.append(insight)
    elif total_balance < 500:
        insight = await generate_unique_insight(
            'warning', 'emergency_fund', 'Low Emergency Fund',
            "Your balance is critically low. An unexpected expense could cause financial stress.",
            context_balance
        )
        insights.append(insight)
    elif total_balance < analysis.get('avg_monthly_expense', 0) * 3:
        insight = await generate_unique_insight(
            'warning', 'emergency_fund', 'Build Your Emergency Fund',
            "Financial experts recommend having 3-6 months of expenses saved for emergencies.",
            context_balance
        )
        insights.append(insight)
    else:
        insight = await generate_unique_insight(
            'success', 'emergency_fund', '✓ Strong Emergency Fund',
            "Great job! You have a healthy emergency fund that can cover unexpected expenses.",
            context_balance
        )
        insights.append(insight)
    
    # Savings goal progress - use real user savings goal
    savings_goal = data.savingsGoal if data.savingsGoal and data.savingsGoal > 0 else None
    
    if savings_goal:
        progress = (total_balance / savings_goal) * 100
        remaining = savings_goal - total_balance
        context_goal = {
            'current_savings': total_balance,
            'goal': savings_goal,
            'progress_percent': progress,
            'remaining_amount': remaining
        }
        
        if progress >= 100:
            insight = await generate_unique_insight(
                'success', 'goals', '🎉 Savings Goal Achieved!',
                f"Congratulations! You've reached your personal savings goal of ${savings_goal:.2f}",
                context_goal
            )
            insights.append(insight)
        elif progress >= 75:
            insight = await generate_unique_insight(
                'success', 'goals', 'Almost There!',
                f"You're at {progress:.1f}% of your personal goal (${savings_goal:.2f}). Just ${remaining:.2f} more to go!",
                context_goal
            )
            insights.append(insight)
        else:
            insight = await generate_unique_insight(
                'info', 'goals', 'Working Towards Your Goal',
                f"You've saved ${total_balance:.2f} toward your goal of ${savings_goal:.2f}. That's {progress:.1f}% of the way there!",
                context_goal
            )
            insights.append(insight)
    
    # Savings rate
    if total_income > 0:
        savings_rate = ((total_income - total_expenses) / total_income) * 100
        context_rate = {
            'income': total_income,
            'expenses': total_expenses,
            'savings_rate': savings_rate
        }
        
        if savings_rate < 0:
            insight = await generate_unique_insight(
                'warning', 'savings', '⚠️ Spending More Than Earning',
                f"You're spending ${total_expenses - total_income:.2f} more than you earn.",
                context_rate
            )
            insights.append(insight)
        elif savings_rate < 10:
            insight = await generate_unique_insight(
                'warning', 'savings', 'Low Savings Rate',
                f"You're only saving {savings_rate:.1f}% of your income. Aim for at least 20%.",
                context_rate
            )
            insights.append(insight)
        elif savings_rate >= 20:
            insight = await generate_unique_insight(
                'success', 'savings', '💰 Excellent Savings Rate!',
                f"You're saving {savings_rate:.1f}% of your income - that's fantastic!",
                context_rate
            )
            insights.append(insight)
    
    return sorted(insights, key=lambda x: x.priority, reverse=True)

def generate_predictions(data: UserFinancialData, analysis: Dict) -> List[Prediction]:
    """Generate financial predictions"""
    predictions = []
    
    thirty_days_ago = datetime.now() - timedelta(days=30)
    recent_income = 0
    
    for transaction in data.transactions:
        try:
            txn_date = datetime.fromisoformat(transaction.date.replace('Z', '+00:00'))
            if txn_date >= thirty_days_ago and transaction.type == 'in':
                recent_income += transaction.amount
        except:
            pass
    
    current_income = data.monthlyIncome if data.monthlyIncome else recent_income
    
    current_data = {
        'avg_expenses': analysis.get('avg_monthly_expense', 0),
        'avg_income': current_income,
        'latest_month_expense': analysis.get('latest_month_expense', 0),
        'total_months': analysis.get('total_months', 0)
    }
    
    pred = ml_model.predict_next_month(current_data)
    
    # Expense prediction
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
    
    # Income prediction
    predicted_income = pred['income']
    income_change = predicted_income - current_income
    income_change_pct = (income_change / current_income * 100) if current_income > 0 else 0
    
    predictions.append(Prediction(
        metric="Next Month Income",
        currentValue=current_income,
        predictedValue=predicted_income,
        confidence=pred['confidence'],
        timeframe="next_month",
        change=income_change,
        changePercent=income_change_pct
    ))
    
    # Balance prediction
    current_balance = sum(acc.balance for acc in data.accounts)
    predicted_balance = current_balance + predicted_income - predicted_expense
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

async def generate_recommendations(insights: List[Insight], score: int, analysis: Dict) -> List[str]:
    """Generate LLM-enhanced recommendations"""
    recs = []
    
    financial_snapshot = {
        'health_score': score,
        'spending_trend': analysis.get('spending_trend'),
        'total_income': analysis.get('total_income'),
        'total_expenses': analysis.get('total_expenses')
    }
    
    if score < 40:
        rec = await generate_unique_recommendation(
            "User has poor financial health. Recommend foundational financial improvements.",
            financial_snapshot
        )
        recs.append(f"🚨 {rec}")
        
        rec = await generate_unique_recommendation(
            "Low income/high expenses ratio. Suggest income improvement or expense reduction.",
            financial_snapshot
        )
        recs.append(f"💡 {rec}")
    
    elif score < 60:
        rec = await generate_unique_recommendation(
            "Moderate financial health. Recommend building emergency fund and budgeting.",
            financial_snapshot
        )
        recs.append(f"📊 {rec}")
        
        rec = await generate_unique_recommendation(
            "Income exceeds expenses but savings rate is low. Suggest structured savings plan.",
            financial_snapshot
        )
        recs.append(f"💰 {rec}")
    
    elif score < 80:
        rec = await generate_unique_recommendation(
            "Good financial health. Recommend investment and wealth building strategies.",
            financial_snapshot
        )
        recs.append(f"✅ {rec}")
        
        rec = await generate_unique_recommendation(
            "Solid emergency fund and positive cash flow. Suggest optimization strategies.",
            financial_snapshot
        )
        recs.append(f"📈 {rec}")
    
    else:
        rec = await generate_unique_recommendation(
            "Excellent financial health. Recommend advanced financial planning and wealth optimization.",
            financial_snapshot
        )
        recs.append(f"🌟 {rec}")
        
        rec = await generate_unique_recommendation(
            "Strong savings and investment potential. Suggest long-term wealth building.",
            financial_snapshot
        )
        recs.append(f"🎯 {rec}")
    
    # Add actionable recommendations from insights
    for insight in insights[:3]:
        if insight.actionable and insight.suggestedAction:
            rec = await generate_unique_recommendation(
                f"Convert this insight to actionable advice: {insight.suggestedAction}",
                financial_snapshot
            )
            recs.append(f"💡 {rec}")
    
    if analysis.get('spending_trend') == 'increasing':
        rec = await generate_unique_recommendation(
            "Spending is increasing. Generate urgent advice to control expenses.",
            financial_snapshot
        )
        recs.append(f"📉 {rec}")
    
    return recs[:6]

# ============= API ENDPOINTS =============

@app.get("/")
def root():
    return {
        "message": "MyFin AI Recommender Service 🤖",
        "version": "2.0.0-llm-enhanced",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    ollama_status = await check_ollama_available()
    return {
        "status": "healthy",
        "service": "ai-recommender",
        "ollama_available": ollama_status,
        "cache_size": len(llm_cache)
    }

@app.post("/api/recommendations", response_model=RecommendationResponse)
async def get_recommendations(data: UserFinancialData):
    """Generate personalized financial recommendations with LLM enhancement"""
    try:
        print(f"\n[API] Processing recommendations for user {data.userId}")
        
        # If savings goal wasn't provided in the request, it should have been sent from frontend
        # The frontend should pass the real savings goal from the database
        # Log what we received for debugging
        print(f"[API] Received savings goal from request: {data.savingsGoal}")
        
        # Step 1: Fast analysis
        analysis = analyze_spending_patterns(data.transactions)
        score = calculate_financial_health_score(data, analysis)
        predictions = generate_predictions(data, analysis)
        
        total_balance = sum(acc.balance for acc in data.accounts)
        
        # Use real user savings goal, or calculate emergency fund target
        savings_goal = data.savingsGoal if data.savingsGoal and data.savingsGoal > 0 else (analysis.get('avg_monthly_expense', 0) * 3)
        goal_progress = min(total_balance / savings_goal, 1) if savings_goal > 0 else 0
        
        summary = {
            'totalBalance': total_balance,
            'monthlyExpenses': analysis.get('avg_monthly_expense', 0),
            'savingsRate': ((analysis.get('total_income', 0) - analysis.get('total_expenses', 0)) / analysis.get('total_income', 1) * 100) if analysis.get('total_income', 0) > 0 else 0,
            'topCategory': analysis.get('top_category'),
            'spendingTrend': analysis.get('spending_trend'),
            'savingsGoal': savings_goal,
            'goalProgress': goal_progress
        }
        
        # Step 2: Generate LLM-enhanced insights and recommendations in parallel
        insights_task = generate_insights(data, analysis)
        
        insights = await insights_task
        recommendations = await generate_recommendations(insights, score, analysis)
        
        print(f"[API] Generated {len(insights)} insights and {len(recommendations)} recommendations")
        
        return RecommendationResponse(
            insights=insights,
            predictions=predictions,
            overallScore=score,
            recommendations=recommendations,
            summary=summary
        )
    
    except Exception as e:
        print(f"[API] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("Starting AI Recommender Service...")
    print(f"Ollama URL: {OLLAMA_API_URL}")
    print(f"Model: {OLLAMA_MODEL}")
    uvicorn.run(app, host="0.0.0.0", port=8000)