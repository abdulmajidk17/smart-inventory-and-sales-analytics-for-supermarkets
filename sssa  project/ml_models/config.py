"""
Configuration settings for ML models
"""

# Forecasting settings
FORECAST_MIN_PERIODS = 2
FORECAST_FUTURE_PERIODS = 15  # Extended from 7 to 15 days for better planning

# Market Basket Analysis settings
MIN_SUPPORT = 0.001  # Very low support (0.1%)
MIN_LIFT = 0.001     # Extremely low lift (0.001)
TOP_N_RECOMMENDATIONS = 15  # Increased to 15

# Reorder Prediction settings
LOW_STOCK_THRESHOLD = 10
MIN_SAMPLES_FOR_TRAINING = 2

# Common settings
DEBUG = True  # Set to False in production 