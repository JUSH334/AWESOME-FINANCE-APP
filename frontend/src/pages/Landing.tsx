import { useState } from 'react';
import { ArrowRight, Brain, Lock, TrendingUp, Wallet, PieChart, Upload, CheckCircle, Menu, X, BarChart3, Shield, Zap, Globe } from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Get personalized financial recommendations powered by machine learning and LLM technology.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: TrendingUp,
      title: 'Smart Analytics',
      description: 'Track your spending patterns, income trends, and financial health with beautiful visualizations.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Upload,
      title: 'PDF Statement Parsing',
      description: 'Upload bank statements and automatically extract and categorize your transactions.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: PieChart,
      title: 'Budget Management',
      description: 'Set budgets by category and track your spending to stay on top of your financial goals.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: Wallet,
      title: 'Multi-Account Support',
      description: 'Manage checking, savings, and credit card accounts all in one place.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'Your data is encrypted and secure. We never share your financial information.',
      gradient: 'from-rose-500 to-pink-500'
    }
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime' },
    { value: '256-bit', label: 'Encryption' },
    { value: '< 1s', label: 'Load Time' },
    { value: '24/7', label: 'Support' }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Small Business Owner',
      content: 'Awesome Finance transformed how I manage my business finances. The AI insights are incredibly accurate!',
      avatar: 'SJ'
    },
    {
      name: 'Michael Chen',
      role: 'Software Engineer',
      content: 'Finally, a finance app that understands tech. The PDF parsing saved me hours of manual entry.',
      avatar: 'MC'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Freelance Designer',
      content: 'The budget tracking helped me save 30% more each month. Highly recommend!',
      avatar: 'ER'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10">
                <svg viewBox="0 0 64 64" className="h-full w-full text-emerald-600">
                  <defs>
                    <linearGradient id="logo-grad" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <circle cx="32" cy="32" r="28" fill="url(#logo-grad)" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M4 32 A 28 12 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                  <path d="M4 32 A 28 20 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                  <path d="M32 4 A 28 28 0 0 1 32 60" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                  <path d="M32 4 A 28 28 0 0 0 32 60" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900">Awesome Finance</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">How it Works</a>
              <a href="/login" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Sign In</a>
              <a href="/register" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors">
                Get Started
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-emerald-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3">
              <a href="#features" className="block text-slate-600 hover:text-emerald-600 font-medium">Features</a>
              <a href="#how-it-works" className="block text-slate-600 hover:text-emerald-600 font-medium">How it Works</a>
              <a href="/login" className="block text-slate-600 hover:text-emerald-600 font-medium">Sign In</a>
              <a href="/register" className="block px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-center">
                Get Started
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              AI-Powered Financial Management
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Take Control of Your
              <span className="block bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Financial Future
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
              Smart budgeting, intelligent insights, and automated tracking. Awesome Finance helps you understand your money and make better financial decisions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register" className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/25">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </a>
              <a href="#features" className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 rounded-xl font-semibold text-lg transition-colors">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed to simplify your financial life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-xl transition-shadow">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Get started in minutes, not hours
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create Account', description: 'Sign up with your email and verify your account in seconds.' },
              { step: '2', title: 'Add Your Data', description: 'Upload bank statements or manually add accounts and transactions.' },
              { step: '3', title: 'Get Insights', description: 'Let AI analyze your finances and get personalized recommendations.' }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-emerald-600/25">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-emerald-600 to-green-600 rounded-3xl p-12 md:p-16 text-white shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Finances?
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already taking control of their financial future with Awesome Finance.
            </p>
            <a href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-emerald-600 rounded-xl font-semibold text-lg transition-colors shadow-xl">
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </a>
            <p className="text-sm text-emerald-100 mt-4">No credit card required • Free forever</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8">
                <svg viewBox="0 0 64 64" className="h-full w-full text-emerald-500">
                  <circle cx="32" cy="32" r="28" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M4 32 A 28 12 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                  <path d="M32 4 A 28 28 0 0 1 32 60" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <span className="text-xl font-bold">Awesome Finance</span>
            </div>

            <div className="text-sm text-slate-400">
              © 2025 Awesome Finance. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}