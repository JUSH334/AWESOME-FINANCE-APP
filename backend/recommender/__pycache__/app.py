"""
MyFin AI Recommender Service
Save as: ai-service/main.py
Run with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import numpy as np
from datetime import datetime, timedelta
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

app = FastAPI(title="MyFin AI Recommender", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= DATA MODELS =============

class Transaction(BaseModel):
    id: str
    date: str
    amount: float
    category: str
    type: str  # "in" or "out"
    accountId: Optional[str] = None
    note: Optional[str] = None

class Account(BaseModel):
    id: str
    type: str  # "checking", "savings", "credit"
    balance: float
    name: Optional[str] = None

class UserFinancialData(BaseModel):
    userId: str
    accounts: List[Account]
    transactions: List[Transaction]
    monthlyIncome: Optional[float] = None
    savingsGoal: Optional[float] = None

class Insight(BaseModel):
    type: str  # "warning", "success", "info", "tip"
    category: str
    title: str
    message: str
    priority: int  # 1-5, 5 being highest
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
    overallScore: int  # Financial health score 0-100
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
        """Predict next month's expenses and income"""
        avg_expenses = current_data.get('avg_expenses', 0)
        avg_income = current_data.get('avg_income', 0)
        latest_expenses = current_data.get('latest_month_expense', avg_expenses)
        
        # Simple prediction with trend analysis
        if latest_expenses > avg_expenses * 1.2:
            expense_pred = avg_expenses * 1.1  # Expect some regression to mean
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
            'spending_trend': 'stable'
        }
    
    df = pd.DataFrame([t.dict() for t in transactions])
    df['date'] = pd.to_datetime(df['date'])
    df['month'] = df['date'].dt.to_period('M')
    
    # Calculate by category
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
        
        # Detect unusual spending
        if len(monthly) >= 2:
            std_dev = monthly.std()
            is_unusual = abs(latest_month_expense - avg_monthly_expense) > std_dev
        else:
            is_unusual = False
        
        top_category = max(category_totals, key=category_totals.get) if category_totals else None
    
    # Calculate spending trend
    spending_trend = 'stable'
    if len(monthly) >= 3:
        recent_avg = monthly.iloc[-2:].mean()
        older_avg = monthly.iloc[:-2].mean() if len(monthly) > 2 else recent_avg
        if recent_avg > older_avg * 1.1:
            spending_trend = 'increasing'
        elif recent_avg < older_avg * 0.9:
            spending_trend = 'decreasing'
    
    # Income analysis
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
    score = 40  # Base score
    
    # Total balance
    total_balance = sum(acc.balance for acc in data.accounts)
    
    # Income vs Expenses ratio
    total_income = analysis.get('total_income', 0)
    total_expenses = analysis.get('total_expenses', 0)
    
    # 1. Savings rate (up to 25 points)
    if total_income > 0:
        savings_rate = (total_income - total_expenses) / total_income
        score += min(25, savings_rate * 100 * 0.25)
    
    # 2. Positive balance (10 points)
    if total_balance > 0:
        score += 10
    
    # 3. Emergency fund (15 points)
    avg_monthly = analysis.get('avg_monthly_expense', 0)
    if avg_monthly > 0 and total_balance >= (avg_monthly * 3):
        score += 15
    elif avg_monthly > 0 and total_balance >= (avg_monthly * 1):
        score += 8
    
    # 4. Spending trend (10 points)
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
    
    # 1. Unusual spending warning
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
    
    # 2. Top spending category
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
    
    # 3. Balance warnings
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
    
    # 4. Savings goal progress
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
    
    # 5. Savings rate insights
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
    
    # 6. Spending trend
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
    
    # Balance prediction
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
    
    # Score-based recommendations
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
    
    # Add specific recommendations from high-priority insights
    for insight in insights[:3]:
        if insight.actionable and insight.suggestedAction and insight.suggestedAction not in recs:
            recs.append(f"💡 {insight.suggestedAction}")
    
    # Spending trend recommendations
    if analysis.get('spending_trend') == 'increasing':
        recs.append("📉 Your expenses are rising. Review subscriptions, dining out, and impulse purchases")
    
    return recs[:6]  # Limit to top 6 recommendations

# ============= API ENDPOINTS =============

@app.get("/")
def root():
    return {
        "message": "MyFin AI Recommender Service 🤖",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "recommendations": "/api/recommendations",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ai-recommender"}

@app.post("/api/recommendations", response_model=RecommendationResponse)
async def get_recommendations(data: UserFinancialData):
    """Generate personalized financial recommendations"""
    try:
        # Analyze spending patterns
        analysis = analyze_spending_patterns(data.transactions)
        
        # Generate insights
        insights = generate_insights(data, analysis)
        
        # Calculate financial health score
        score = calculate_financial_health_score(data, analysis)
        
        # Generate predictions
        predictions = generate_predictions(data, analysis)
        
        # Generate recommendations
        recommendations = generate_recommendations(insights, score, analysis)
        
        # Create summary
        total_balance = sum(acc.balance for acc in data.accounts)
        summary = {
            'totalBalance': total_balance,
            'monthlyExpenses': analysis.get('avg_monthly_expense', 0),
            'savingsRate': ((analysis.get('total_income', 0) - analysis.get('total_expenses', 0)) / analysis.get('total_income', 1) * 100) if analysis.get('total_income', 0) > 0 else 0,
            'topCategory': analysis.get('top_category'),
            'spendingTrend': analysis.get('spending_trend')
        }
        
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
    uvicorn.run(app, host="0.0.0.0", port=8000)