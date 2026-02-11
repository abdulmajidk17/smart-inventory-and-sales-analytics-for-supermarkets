# Smart Inventory & Sales Analytics (SSSA) System

A comprehensive inventory management and sales analytics system for supermarkets, featuring AI-powered forecasting, product recommendations, and automated reorder predictions.

## Features

- **Admin Authentication** - Secure JWT-based login
- **Inventory Management** - Track products, stock levels, and categories
- **Sales Tracking** - Record and analyze sales transactions
- **Customer Management** - Manage customer data and purchase history
- **Vendor Management** - Track suppliers and purchase orders
- **AI-Powered Analytics**:
  - Sales Forecasting (Prophet)
  - Product Recommendations (Apriori)
  - Reorder Predictions (EOQ)
- **Reports & Analytics** - Comprehensive business intelligence
- **Audit Logging** - Complete activity tracking

## Technology Stack

**Backend:** Flask, SQLAlchemy, SQLite, JWT, Pandas, NumPy, Prophet, MLxtend
**Frontend:** React 18, Material-UI, Recharts, Axios

## Quick Start

### Backend
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Default Login
- Username: `admin`
- Password: `admin123`

## Project Structure
```
sssa-project/
├── app.py              # Flask backend
├── requirements.txt    # Python dependencies
├── instance/
│   └── inventory.db   # SQLite database
├── ml_models/         # ML algorithms
└── frontend/          # React frontend
```
