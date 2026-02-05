"""
Inventory AI/ML Module - Auto-Restock Prediction System

This module provides intelligent inventory management features:
- Sales velocity analysis
- Demand forecasting using ML models
- Stockout prediction
- Smart restock recommendations
- Seasonal pattern detection

Models Used:
- Prophet (Facebook) for time series forecasting
- ARIMA for trend analysis
- XGBoost for gradient boosting ML
- LightGBM for fast gradient boosting
- Linear Regression for simple predictions
- Exponential Smoothing for seasonal patterns
- Isolation Forest for anomaly detection
"""

from .data_processor import InventoryDataProcessor
from .demand_forecaster import DemandForecaster
from .inventory_predictor import InventoryPredictor
from .seasonal_analyzer import SeasonalAnalyzer
from .advanced_forecaster import AdvancedForecaster, AnomalyDetector

__all__ = [
    'InventoryDataProcessor',
    'DemandForecaster', 
    'InventoryPredictor',
    'SeasonalAnalyzer',
    'AdvancedForecaster',
    'AnomalyDetector'
]

__version__ = '2.0.0'
__author__ = 'PetConnect AI Team'
