# Ecommerce ML Module
"""
E-Commerce AI/ML Features:
- Product Recommendations
- Inventory Predictions
- Demand Forecasting
- Sales Analytics
"""

from .inventory import InventoryPredictor, InventoryDataProcessor, DemandForecaster, SeasonalAnalyzer

__all__ = [
    'InventoryPredictor',
    'InventoryDataProcessor', 
    'DemandForecaster',
    'SeasonalAnalyzer'
]