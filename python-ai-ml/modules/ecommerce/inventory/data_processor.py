"""
Data Processor for Inventory ML Analysis

This module handles all data extraction and preprocessing
for the AI/ML inventory prediction system.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class InventoryDataProcessor:
    """
    Process sales and inventory data for ML analysis.
    
    Features:
    - Historical sales data extraction
    - Time series data preparation
    - Missing data handling
    - Feature engineering for ML models
    """
    
    def __init__(self):
        """Initialize database connection"""
        mongo_uri = os.getenv('MONGODB_URI')
        if not mongo_uri:
            raise ValueError("MONGODB_URI environment variable is required. Please check your .env file")
        
        self.client = MongoClient(mongo_uri)
        # Extract database name from URI or use PetWelfare as default
        db_name = 'PetWelfare'  # Must match backend database
        self.db = self.client[db_name]
        logger.info(f"InventoryDataProcessor initialized with MongoDB connection to {db_name}")
        
    def get_product_sales_history(self, product_id, variant_id=None, days=90):
        """
        Fetch historical sales data for a product or specific variant.
        
        Args:
            product_id: MongoDB ObjectId or string ID
            variant_id: Optional variant ObjectId for variant-specific analysis
            days: Number of days of history to fetch
            
        Returns:
            DataFrame with columns [date, units_sold, revenue, orders_count, returns_count, net_units_sold]
        """
        try:
            # Convert to ObjectId if string
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)
            if variant_id and isinstance(variant_id, str):
                variant_id = ObjectId(variant_id)
                
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            variant_info = f" (variant: {variant_id})" if variant_id else ""
            logger.info(f"Fetching sales history for product {product_id}{variant_info} from {start_date} to {end_date}")
            
            # Build match conditions
            item_match = {'items.product': product_id}
            if variant_id:
                item_match['items.variant'] = variant_id
            
            # Aggregate sales from orders collection
            pipeline = [
                {
                    '$match': {
                        'createdAt': {'$gte': start_date, '$lte': end_date},
                        'status': {'$in': ['confirmed', 'processing', 'packed', 'shipped', 'delivered']}
                    }
                },
                {'$unwind': '$items'},
                {'$match': item_match},
                {
                    '$group': {
                        '_id': {
                            '$dateToString': {
                                'format': '%Y-%m-%d',
                                'date': '$createdAt'
                            }
                        },
                        'units_sold': {'$sum': '$items.quantity'},
                        'revenue': {'$sum': '$items.total'},
                        'orders_count': {'$sum': 1},
                        'avg_price': {'$avg': '$items.price'}
                    }
                },
                {'$sort': {'_id': 1}}
            ]
            
            results = list(self.db.orders.aggregate(pipeline))
            
            # Get returns/refunds data
            returns_pipeline = [
                {
                    '$match': {
                        'createdAt': {'$gte': start_date, '$lte': end_date},
                        'status': {'$in': ['returned', 'refunded', 'cancelled']}
                    }
                },
                {'$unwind': '$items'},
                {'$match': item_match},
                {
                    '$group': {
                        '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$createdAt'}},
                        'returns_count': {'$sum': '$items.quantity'}
                    }
                }
            ]
            returns_results = list(self.db.orders.aggregate(returns_pipeline))
            
            # Convert to DataFrame
            if not results:
                logger.warning(f"No sales data found for product {product_id}{variant_info}")
                return self._create_empty_dataframe(start_date, end_date)
            
            df = pd.DataFrame(results)
            df.rename(columns={'_id': 'date'}, inplace=True)
            df['date'] = pd.to_datetime(df['date'])
            
            # Merge returns data
            if returns_results:
                returns_df = pd.DataFrame(returns_results)
                returns_df.rename(columns={'_id': 'date'}, inplace=True)
                returns_df['date'] = pd.to_datetime(returns_df['date'])
                df = df.merge(returns_df, on='date', how='left')
            
            df['returns_count'] = df.get('returns_count', 0).fillna(0)
            df['net_units_sold'] = df['units_sold'] - df['returns_count']
            
            # Fill missing dates with 0 sales
            df = self._fill_missing_dates(df, start_date, end_date)
            
            logger.info(f"Fetched {len(df)} days of sales data with {df['units_sold'].sum()} total units sold, {df['returns_count'].sum()} returns")
            return df
            
        except Exception as e:
            logger.error(f"Error fetching sales history: {str(e)}")
            return self._create_empty_dataframe(
                datetime.now() - timedelta(days=days), 
                datetime.now()
            )
    
    def get_product_details(self, product_id, variant_id=None):
        """
        Get product details including current stock, variants, and expiry info.
        
        Args:
            product_id: MongoDB ObjectId or string ID
            variant_id: Optional variant ID for variant-specific details
            
        Returns:
            dict with product details
        """
        try:
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)
            if variant_id and isinstance(variant_id, str):
                variant_id = ObjectId(variant_id)
                
            product = self.db.products.find_one(
                {'_id': product_id},
                {
                    '_id': 1,
                    'name': 1,
                    'inventory.stock': 1,
                    'inventory.reserved': 1,
                    'inventory.lowStockThreshold': 1,
                    'pricing.basePrice': 1,
                    'pricing.salePrice': 1,
                    'pricing.costPrice': 1,
                    'pricing.discount': 1,
                    'status': 1,
                    'category': 1,
                    'petType': 1,
                    'hasVariants': 1,
                    'variants': 1,
                    'attributes.expiryDate': 1,
                    'attributes.shelfLife': 1
                }
            )
            
            if product:
                # Handle variant-specific details
                if variant_id and product.get('hasVariants'):
                    variant = next((v for v in product.get('variants', []) if v.get('_id') == variant_id), None)
                    if variant:
                        stock = variant.get('stock', {}).get('quantity', 0)
                        reserved = variant.get('stock', {}).get('reserved', 0)
                        price = variant.get('price', product.get('pricing', {}).get('basePrice', 0))
                    else:
                        stock = 0
                        reserved = 0
                        price = product.get('pricing', {}).get('basePrice', 0)
                else:
                    stock = product.get('inventory', {}).get('stock', 0)
                    reserved = product.get('inventory', {}).get('reserved', 0)
                    price = product.get('pricing', {}).get('salePrice') or product.get('pricing', {}).get('basePrice', 0)
                
                return {
                    '_id': product['_id'],
                    'name': product.get('name', 'Unknown'),
                    'variant_id': variant_id,
                    'current_stock': stock,
                    'reserved_stock': reserved,
                    'available_stock': stock - reserved,
                    'low_stock_threshold': product.get('inventory', {}).get('lowStockThreshold', 10),
                    'base_price': price,
                    'cost_price': product.get('pricing', {}).get('costPrice', 0),
                    'current_price': price,
                    'discount': product.get('pricing', {}).get('discount', {}),
                    'status': product.get('status', 'unknown'),
                    'category': product.get('category'),
                    'pet_type': product.get('petType', []),
                    'has_variants': product.get('hasVariants', False),
                    'expiry_date': product.get('attributes', {}).get('expiryDate'),
                    'shelf_life': product.get('attributes', {}).get('shelfLife'),
                    'is_perishable': bool(product.get('attributes', {}).get('expiryDate') or product.get('attributes', {}).get('shelfLife'))
                }
                
            return None
            
        except Exception as e:
            logger.error(f"Error fetching product details: {str(e)}")
            return None
    
    def get_all_products_for_analysis(self, store_id=None):
        """
        Get all active products that need inventory analysis.
        
        Args:
            store_id: Optional store ID to filter products
            
        Returns:
            List of product dictionaries
        """
        try:
            query = {
                'status': {'$in': ['active', 'out_of_stock']},
                'inventory.trackInventory': {'$ne': False}
            }
            
            if store_id:
                query['storeId'] = store_id
            
            products = self.db.products.find(
                query,
                {
                    '_id': 1,
                    'name': 1,
                    'inventory.stock': 1,
                    'inventory.reserved': 1,
                    'inventory.lowStockThreshold': 1,
                    'pricing.basePrice': 1,
                    'pricing.costPrice': 1,
                    'status': 1,
                    'storeId': 1,
                    'category': 1,
                    'petType': 1
                }
            ).limit(500)  # Limit for performance
            
            result = []
            for product in products:
                result.append({
                    '_id': product['_id'],
                    'name': product.get('name', 'Unknown'),
                    'current_stock': product.get('inventory', {}).get('stock', 0),
                    'reserved_stock': product.get('inventory', {}).get('reserved', 0),
                    'available_stock': (
                        product.get('inventory', {}).get('stock', 0) - 
                        product.get('inventory', {}).get('reserved', 0)
                    ),
                    'low_stock_threshold': product.get('inventory', {}).get('lowStockThreshold', 10),
                    'base_price': product.get('pricing', {}).get('basePrice', 0),
                    'cost_price': product.get('pricing', {}).get('costPrice', 0),
                    'status': product.get('status', 'unknown'),
                    'store_id': product.get('storeId'),
                    'category': str(product.get('category', '')) if product.get('category') else None,
                    'pet_type': product.get('petType', [])
                })
            
            logger.info(f"Found {len(result)} products for analysis")
            return result
            
        except Exception as e:
            logger.error(f"Error fetching products for analysis: {str(e)}")
            return []
    
    def get_category_sales_trends(self, category_id, days=90):
        """
        Get sales trends for an entire category.
        
        Args:
            category_id: Category ObjectId or string
            days: Number of days to analyze
            
        Returns:
            DataFrame with category-level sales data
        """
        try:
            if isinstance(category_id, str):
                category_id = ObjectId(category_id)
                
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            # Get all products in category
            products_in_category = self.db.products.distinct('_id', {'category': category_id})
            
            if not products_in_category:
                return self._create_empty_dataframe(start_date, end_date)
            
            pipeline = [
                {
                    '$match': {
                        'createdAt': {'$gte': start_date, '$lte': end_date},
                        'status': {'$in': ['confirmed', 'processing', 'packed', 'shipped', 'delivered']}
                    }
                },
                {'$unwind': '$items'},
                {
                    '$match': {
                        'items.product': {'$in': products_in_category}
                    }
                },
                {
                    '$group': {
                        '_id': {
                            '$dateToString': {
                                'format': '%Y-%m-%d',
                                'date': '$createdAt'
                            }
                        },
                        'units_sold': {'$sum': '$items.quantity'},
                        'revenue': {'$sum': '$items.total'},
                        'orders_count': {'$sum': 1}
                    }
                },
                {'$sort': {'_id': 1}}
            ]
            
            results = list(self.db.orders.aggregate(pipeline))
            
            if not results:
                return self._create_empty_dataframe(start_date, end_date)
            
            df = pd.DataFrame(results)
            df.rename(columns={'_id': 'date'}, inplace=True)
            df['date'] = pd.to_datetime(df['date'])
            df = self._fill_missing_dates(df, start_date, end_date)
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching category sales trends: {str(e)}")
            return self._create_empty_dataframe(
                datetime.now() - timedelta(days=days),
                datetime.now()
            )
    
    def get_seasonal_context(self):
        """
        Get current season and upcoming events context for India.
        
        Returns:
            dict with season info and relevant events
        """
        now = datetime.now()
        month = now.month
        
        # Indian seasons and pet-related events
        season_data = {
            'current_month': month,
            'current_date': now.isoformat(),
            'season': None,
            'season_factor': 1.0,
            'events': [],
            'pet_trends': []
        }
        
        if month in [3, 4, 5]:
            season_data['season'] = 'summer'
            season_data['season_factor'] = 1.2  # Higher demand
            season_data['events'] = ['Summer vacation', 'School holidays']
            season_data['pet_trends'] = [
                'Cooling products demand UP',
                'Pet grooming services UP',
                'Water accessories UP',
                'Pet travel gear UP'
            ]
        elif month in [6, 7, 8, 9]:
            season_data['season'] = 'monsoon'
            season_data['season_factor'] = 0.9  # Slightly lower
            season_data['events'] = ['Monsoon season', 'Indoor activities']
            season_data['pet_trends'] = [
                'Raincoats and boots demand UP',
                'Anti-fungal medicines UP',
                'Indoor toys UP',
                'Dehumidifier pet beds UP'
            ]
        elif month in [10, 11]:
            season_data['season'] = 'festival'
            season_data['season_factor'] = 1.4  # Highest demand
            season_data['events'] = ['Diwali', 'Dussehra', 'Festival season']
            season_data['pet_trends'] = [
                'Pet treats and gifts UP',
                'Pet clothing UP',
                'Pet calming products UP (fireworks)',
                'New pet adoptions UP'
            ]
        else:  # Dec, Jan, Feb
            season_data['season'] = 'winter'
            season_data['season_factor'] = 1.1
            season_data['events'] = ['Winter season', 'New Year', 'Republic Day']
            season_data['pet_trends'] = [
                'Pet sweaters and jackets UP',
                'Warm beds UP',
                'Joint supplements (cold weather) UP',
                'Indoor heating products UP'
            ]
        
        return season_data
    
    def _create_empty_dataframe(self, start_date, end_date):
        """Create empty dataframe with date range"""
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        return pd.DataFrame({
            'date': date_range,
            'units_sold': 0,
            'revenue': 0.0,
            'orders_count': 0,
            'returns_count': 0,
            'net_units_sold': 0,
            'avg_price': 0.0
        })
    
    def _fill_missing_dates(self, df, start_date, end_date):
        """Fill missing dates with 0 values"""
        # Create full date range
        full_range = pd.date_range(start=start_date, end=end_date, freq='D')
        
        # Set date as index and reindex
        df = df.set_index('date')
        df = df.reindex(full_range, fill_value=0)
        df = df.reset_index()
        df.rename(columns={'index': 'date'}, inplace=True)
        
        return df
    
    def get_category_average_velocity(self, category_id):
        """
        Get average sales velocity for a category (for new product predictions).
        
        Args:
            category_id: Category ObjectId
            
        Returns:
            dict with average velocity metrics
        """
        try:
            if isinstance(category_id, str):
                category_id = ObjectId(category_id)
            
            # Get category sales data
            df = self.get_category_sales_trends(category_id, days=30)
            
            if df is None or len(df) == 0 or df['units_sold'].sum() == 0:
                return {'daily_avg': 0, 'confidence': 'low'}
            
            return {
                'daily_avg': df['units_sold'].mean(),
                'weekly_avg': df['units_sold'].sum() / (len(df) / 7),
                'confidence': 'medium',
                'data_points': len(df)
            }
        except Exception as e:
            logger.error(f"Error getting category velocity: {str(e)}")
            return {'daily_avg': 0, 'confidence': 'low'}
    
    def get_price_history(self, product_id, variant_id=None, days=90):
        """
        Track price changes over time to detect price impact on demand.
        
        Args:
            product_id: Product ObjectId
            variant_id: Optional variant ID
            days: Days to look back
            
        Returns:
            DataFrame with date and price changes
        """
        try:
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)
            
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            item_match = {'items.product': product_id}
            if variant_id:
                if isinstance(variant_id, str):
                    variant_id = ObjectId(variant_id)
                item_match['items.variant'] = variant_id
            
            # Get price from orders (actual selling price)
            pipeline = [
                {'$match': {
                    'createdAt': {'$gte': start_date, '$lte': end_date},
                    'status': {'$nin': ['cancelled']}
                }},
                {'$unwind': '$items'},
                {'$match': item_match},
                {'$group': {
                    '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$createdAt'}},
                    'avg_price': {'$avg': '$items.price'},
                    'min_price': {'$min': '$items.price'},
                    'max_price': {'$max': '$items.price'}
                }},
                {'$sort': {'_id': 1}}
            ]
            
            results = list(self.db.orders.aggregate(pipeline))
            
            if not results:
                return pd.DataFrame()
            
            df = pd.DataFrame(results)
            df.rename(columns={'_id': 'date'}, inplace=True)
            df['date'] = pd.to_datetime(df['date'])
            
            # Calculate price change percentage
            df['price_change_pct'] = df['avg_price'].pct_change() * 100
            
            return df
            
        except Exception as e:
            logger.error(f"Error getting price history: {str(e)}")
            return pd.DataFrame()
    
    def calculate_shelf_life_constraint(self, product_details, suggested_quantity, daily_demand):
        """
        Calculate maximum restock quantity based on shelf life.
        
        Args:
            product_details: Product dict with expiry info
            suggested_quantity: AI suggested quantity
            daily_demand: Average daily sales
            
        Returns:
            dict with adjusted quantity and warnings
        """
        result = {
            'original_quantity': suggested_quantity,
            'adjusted_quantity': suggested_quantity,
            'constraint_applied': False,
            'warning': None,
            'days_to_sell': None
        }
        
        if not product_details.get('is_perishable'):
            return result
        
        # Parse shelf life (e.g., \"6 months\", \"180 days\")
        shelf_life_str = product_details.get('shelf_life', '')
        shelf_life_days = None
        
        if 'month' in shelf_life_str.lower():
            months = int(''.join(filter(str.isdigit, shelf_life_str)) or 0)
            shelf_life_days = months * 30
        elif 'day' in shelf_life_str.lower():
            shelf_life_days = int(''.join(filter(str.isdigit, shelf_life_str)) or 0)
        elif product_details.get('expiry_date'):
            expiry = product_details['expiry_date']
            if isinstance(expiry, str):
                expiry = datetime.fromisoformat(expiry.replace('Z', '+00:00'))
            shelf_life_days = (expiry - datetime.now()).days
        
        if shelf_life_days and shelf_life_days > 0 and daily_demand > 0:
            # Maximum stock = shelf_life * daily_demand * 0.8 (safety margin)
            max_quantity = int(shelf_life_days * daily_demand * 0.8)
            
            result['days_to_sell'] = suggested_quantity / daily_demand if daily_demand > 0 else 0
            
            if suggested_quantity > max_quantity:
                result['adjusted_quantity'] = max_quantity
                result['constraint_applied'] = True
                result['warning'] = f"⚠️ Reduced from {suggested_quantity} to {max_quantity} due to {shelf_life_days}-day shelf life. Excess would expire before selling."
            
        return result
        
        # Ensure numeric types
        df['units_sold'] = pd.to_numeric(df['units_sold'], errors='coerce').fillna(0).astype(int)
        df['revenue'] = pd.to_numeric(df['revenue'], errors='coerce').fillna(0.0)
        df['orders_count'] = pd.to_numeric(df['orders_count'], errors='coerce').fillna(0).astype(int)
        
        return df
    
    def save_prediction_to_db(self, product_id, prediction_data):
        """
        Save ML prediction results to database.
        
        Args:
            product_id: Product ObjectId
            prediction_data: Prediction results dictionary
        """
        try:
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)
            
            # Update product with prediction data
            update_data = {
                'mlPredictions': {
                    'salesVelocity': prediction_data.get('sales_velocity', {}),
                    'demandForecast': {
                        'totalDemand': prediction_data.get('demand_forecast', {}).get('total_demand', 0),
                        'dailyAvg': prediction_data.get('demand_forecast', {}).get('daily_avg', 0),
                        'modelUsed': prediction_data.get('demand_forecast', {}).get('model_used', 'unknown'),
                        'confidence': prediction_data.get('demand_forecast', {}).get('accuracy_score', 0)
                    },
                    'stockoutPrediction': {
                        'daysUntilStockout': prediction_data.get('stockout_prediction', {}).get('days_until_stockout'),
                        'stockoutDate': prediction_data.get('stockout_prediction', {}).get('stockout_date'),
                        'urgencyScore': prediction_data.get('stockout_prediction', {}).get('urgency_score', 0)
                    },
                    'restockRecommendation': {
                        'suggestedQuantity': prediction_data.get('restock_recommendation', {}).get('suggested_quantity', 0),
                        'urgency': prediction_data.get('restock_recommendation', {}).get('urgency', 'low'),
                        'reorderPoint': prediction_data.get('restock_recommendation', {}).get('reorder_point', 0)
                    },
                    'lastAnalyzedAt': datetime.now(),
                    'insights': prediction_data.get('insights', [])
                }
            }
            
            self.db.products.update_one(
                {'_id': product_id},
                {'$set': update_data}
            )
            
            logger.info(f"Saved prediction data for product {product_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving prediction to DB: {str(e)}")
            return False
    
    def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
