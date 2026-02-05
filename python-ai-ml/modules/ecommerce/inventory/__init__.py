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
- Linear Regression for simple predictions
- Exponential Smoothing for seasonal patterns
"""

from .data_processor import InventoryDataProcessor
from .demand_forecaster import DemandForecaster
from .inventory_predictor import InventoryPredictor
from .seasonal_analyzer import SeasonalAnalyzer

__all__ = [
    'InventoryDataProcessor',
    'DemandForecaster', 
    'InventoryPredictor',
    'SeasonalAnalyzer'
]

__version__ = '1.0.0'
__author__ = 'PetConnect AI Team'
