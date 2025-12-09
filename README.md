# Awesome Finance

> A comprehensive personal finance management application with AI-powered insights, intelligent transaction categorization, and advanced analytics.

## Overview

Awesome Finance is a full-stack financial management platform that helps users track accounts, manage budgets, analyze spending patterns, and receive personalized AI recommendations. Built with modern web technologies and featuring machine learning capabilities.

## Key Features

### Authentication & Security
- **Secure user authentication** with JWT tokens
- **Email verification** system
- **Password reset** functionality
- **Username management** with change capability
- **Remember me** option for persistent sessions
- **BCrypt password hashing** for security

### Account Management
- **Multi-account support** (Checking, Savings, Credit)
- **Real-time balance tracking**
- **Account categorization** by institution
- **Soft delete** functionality for data retention

### Transaction Tracking
- **Manual transaction entry** with detailed categorization
- **PDF bank statement parsing** with AI/ML
- **Bulk transaction import**
- **Advanced search and filtering**
- **Multi-criteria sorting** (date, amount, category)
- **Bulk delete operations** with automatic balance adjustment
- **14+ transaction categories** (Income, Groceries, Dining, Gas, etc.)

### Budget & Planning
- **Category-based budgets** (monthly/yearly)
- **Real-time spending tracking** against budgets
- **Visual budget progress indicators**
- **Savings goal setting and tracking**
- **Savings calculator** with projections
- **Budget recalculation** engine

### AI-Powered Insights
- **Machine learning predictions** for spending trends
- **LLM-enhanced recommendations** (via Ollama + Gemma 2B)
- **Financial health scoring** (0-100)
- **Personalized insights** based on spending patterns
- **Next-month predictions** for expenses and income
- **Smart categorization** of transactions
- **Goal progress tracking** with AI suggestions

### Advanced Analytics
- **Customizable dashboards** with 5 chart types:
  - Line charts for trends
  - Bar charts for comparisons
  - Area charts for cumulative data
  - Pie charts for distributions
  - Scatter plots for analysis
- **20+ configuration options** per chart:
  - Time range filtering (7d, 30d, 3m, 6m, 1y, all)
  - Aggregation modes (daily, weekly, monthly, quarterly, yearly)
  - Data modes (total, average, cumulative, percentage)
  - Multi-category filtering
  - Account-specific filtering
  - Income/Expense/Net cash flow views
  - Moving averages
  - Budget comparison lines
  - Log scale support
  - Interactive zooming and brushing
- **Click-through drill-down** to transaction details
- **Real-time recalculation** based on filters
- **Spending trends** and pattern recognition
- **Category breakdown** with sorting options

### PDF Statement Parsing
- **Intelligent OCR** with error correction
- **Multi-format support** (various bank statement layouts)
- **Automatic transaction extraction**:
  - Date, amount, description, merchant
  - Smart category inference
  - Transaction type detection (income/expense)
- **Preview and edit** before import
- **Generic smart parser** as fallback
- **Bank-specific parsers** for optimal accuracy

### User Management
- **Profile management** (first name, last name, email)
- **Password change** with current password verification
- **Financial goals** (savings targets)
- **Data export** (CSV/JSON)
- **Account deletion** with confirmation

## Architecture

### Tech Stack

#### Frontend
- **React 18.3** with TypeScript
- **Vite** for blazing-fast development
- **TailwindCSS** for modern styling
- **Recharts** for data visualization
- **React Router** for navigation
- **Zustand** for state management
- **React Hook Form** + **Zod** for form validation
- **Lucide React** for icons

#### Backend
- **Spring Boot 3.4.0** (Java)
- **PostgreSQL** for data persistence
- **Spring Security** with JWT
- **Spring Data JPA** for ORM
- **Spring Mail** for email services
- **Apache PDFBox** for PDF parsing
- **BCrypt** for password hashing

#### AI/ML Services
- **FastAPI** (Python) for ML service
- **Ollama** + **Gemma 2B** for LLM processing
- **Scikit-learn** for ML predictions
- **Pandas** + **NumPy** for data processing

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                    |
│  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌─────────┐   |
│  │Dashboard │  │ Accounts │  │ Budgets │  │AI Insights  │
│  └──────────┘  └──────────┘  └─────────┘  └─────────┘   |
└────────────────────┬────────────────────────────────────┘
                     │ REST API (JWT Auth)
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (Spring Boot + Java)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │   Auth   │  │   Data   │  │  Budget  │  │   PDF   │  │
│  │Controller│  │Controller│  │Controller│  │ Parser  │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │
│         │              │              │              │  │
│         ▼              ▼              ▼              ▼  │
│  ┌─────────────────────────────────────────────────────┐│
│  │              PostgreSQL Database                    ││
│  │  (Users, Accounts, Transactions, Budgets)           ││
│  └─────────────────────────────────────────────────────┘│
└────────────────────┬────────────────────────────────────┘
                     │ REST API
                     ▼
┌─────────────────────────────────────────────────────────┐
│         AI Service (FastAPI + Python + Ollama)          │
│  ┌──────────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │ML Predictions│  │LLM Insights│  │Categorization   │  │
│  │(Scikit-learn)│  │(Gemma 2B)  │  │(Pattern Match)  │  │ 
│  └──────────────┘  └────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- **Java 17+** (for Spring Boot)
- **Node.js 18+** and npm (for React)
- **Python 3.10+** (for AI service)
- **PostgreSQL 14+**
- **Ollama** (for LLM features)
- **SMTP Server** (for email features - or use Gmail)

### Database Setup

1. Install PostgreSQL and create a database:
```sql
CREATE DATABASE awesome_finance;
```

2. Update `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/awesome_finance
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Ensure Spring Boot and Java Virtual Machine are downloaded

3. Configure email settings in `application.properties`:
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
app.frontend-url=http://localhost:5173
```

4. Build and run:
```bash
./mvnw clean install
./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080`

### AI Service Setup

1. Install Ollama:
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Pull Gemma 2B model
ollama pull gemma:2b
```

2. Navigate to AI service directory:
```bash
cd backend/recommender
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Start the AI service:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

AI service runs on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## Project Structure

```
awesome-finance/
├── frontend/                    # React TypeScript frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── stores/            # Zustand stores
│   │   └── types.ts           # TypeScript types
│   └── package.json
├── backend/                     # Spring Boot backend
│   ├── src/main/java/backend/
│   │   ├── config/            # Security, JWT, CORS
│   │   ├── controller/        # REST controllers
│   │   ├── entity/            # JPA entities
│   │   ├── repository/        # Data repositories
│   │   ├── service/           # Business logic
│   │   └── util/              # Utilities (JWT)
│   ├── recommender/           # Python AI service
│   │   └── app.py            # FastAPI ML service
│   └── pom.xml
└── README.md
```

## Key Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with JWT
- `GET /api/auth/verify-email` - Verify email
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/reset-password/confirm` - Confirm reset
- `POST /api/auth/change-username` - Change username

### Data Management
- `GET /api/data/accounts` - Get all accounts
- `POST /api/data/accounts` - Create account
- `GET /api/data/transactions` - Get transactions
- `POST /api/data/transactions` - Create transaction
- `POST /api/data/upload-statement` - Upload PDF
- `POST /api/data/import-transactions` - Bulk import

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/{id}` - Update budget
- `DELETE /api/budgets/{id}` - Delete budget
- `POST /api/budgets/recalculate` - Recalculate all

### AI Insights
- `POST /api/ai/recommendations` - Get AI insights
- `GET /api/ai/health` - Check AI service status

### User Profile
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/change-password` - Change password
- `GET /api/users/financial-goals` - Get goals
- `PUT /api/users/financial-goals` - Update goals
- `POST /api/users/export-data` - Export data

## Core Features in Detail

### Transaction Categorization
The system automatically categorizes transactions using pattern matching:
- **Income**: Salary, paycheck, direct deposit
- **Groceries**: Supermarkets, food stores
- **Dining**: Restaurants, coffee shops
- **Gas**: Fuel stations, gas pumps
- **Shopping**: Amazon, Walmart, Target
- **Utilities**: Electric, water, internet
- **Healthcare**: Medical, pharmacy
- **Entertainment**: Netflix, Spotify, movies

### Financial Health Score
Calculated from multiple factors:
- **Savings rate** (25 points max)
- **Emergency fund** coverage (15 points)
- **Positive balance** (10 points)
- **Spending trends** (10 points)
- **Base score** (40 points)

### AI Predictions
Machine learning model predicts:
- Next month's expenses
- Next month's income
- End-of-month balance
- Confidence scores for predictions

### LLM-Enhanced Insights
Gemma 2B generates:
- Personalized spending insights
- Actionable recommendations
- Budget advice
- Savings strategies

## Contributors

- **Josh Castro**
- **Nick Leete**
- **Tyler Mullins**
- **Bhavya Sri**

## Known Issues & Limitations

- PDF parsing accuracy varies by bank format
- LLM responses require Ollama running locally
- Email verification requires SMTP configuration
- PostgreSQL required 

## Future Enhancements

- [ ] Recurring transaction templates
- [ ] Bill payment reminders
- [ ] Investment tracking
- [ ] Multi-currency support
- [ ] Mobile app (React Native)
- [ ] Bank API integrations (Plaid)

**Built using React, Spring Boot, and Ollama AI**
