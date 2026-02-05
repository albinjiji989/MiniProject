"""
Inventory Predictor - Main AI/ML Engine

This is the main orchestrator for inventory predictions.
It combines data processing, demand forecasting, and seasonal analysis
to provide comprehensive restock recommendations.
"""

import logging
from datetime import datetime, timedelta
from bson import ObjectId

from .data_processor import InventoryDataProcessor
from .demand_forecaster import DemandForecaster
from .seasonal_analyzer import SeasonalAnalyzer
from .advanced_forecaster import AdvancedForecaster, AnomalyDetector

logger = logging.getLogger(__name__)


class InventoryPredictor:
    """
    Main AI/ML Inventory Prediction Engine.
    
    Features:
    - Sales velocity analysis
    - AI-powered demand forecasting
    - Stockout prediction
    - Smart restock recommendations
    - Seasonal adjustments
    - Actionable insights
    """
    
    # Default configuration
    DEFAULT_LEAD_TIME = 7  # days to receive new stock
    DEFAULT_SAFETY_STOCK_DAYS = 7  # days of safety buffer
    DEFAULT_FORECAST_DAYS = 30  # days to forecast ahead
    
    def __init__(self):
        """Initialize predictor with all components"""
        self.data_processor = InventoryDataProcessor()
        self.forecaster = DemandForecaster()
        self.seasonal_analyzer = SeasonalAnalyzer()
        self.advanced_forecaster = AdvancedForecaster()
        self.anomaly_detector = AnomalyDetector()
        logger.info("InventoryPredictor initialized with ALL AI/ML components (Prophet, ARIMA, XGBoost, LightGBM, Ensemble)")
    
    def analyze_product(self, product_id, variant_id=None, lead_time_days=None, save_to_db=False):
        """
        Complete AI analysis for a single product.
        
        Args:
            product_id: MongoDB ObjectId or string
            variant_id: Optional variant ObjectId (currently not used, for future support)
            lead_time_days: Days to receive stock (for restock calc)
            save_to_db: Whether to save results to database
            
        Returns:
            dict: Complete analysis with predictions and recommendations
        """
        try:
            if lead_time_days is None:
                lead_time_days = self.DEFAULT_LEAD_TIME
                
            # Convert to ObjectId if string
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)
            
            logger.info(f"Starting AI analysis for product {product_id}")
            
            # 1. Get product details
            product = self.data_processor.get_product_details(product_id)
            if not product:
                return {
                    'success': False,
                    'error': 'Product not found',
                    'product_id': str(product_id)
                }
            
            # 2. Get historical sales data
            sales_df = self.data_processor.get_product_sales_history(product_id, days=90)
            
            # 3. Calculate sales velocity (with AI category predictions if no sales)
            velocity = self._calculate_sales_velocity(sales_df, product)
            
            # 4. Get seasonal adjustments
            pet_type = product.get('pet_type', ['all'])[0] if product.get('pet_type') else 'all'
            seasonal_data = self.seasonal_analyzer.get_adjustment_factors(
                sales_df, 
                pet_type=pet_type
            )
            
            # 5. AI Demand Forecasting (using ensemble of models)
            # If no sales data, use category-based AI prediction
            if sales_df is None or len(sales_df) == 0:
                logger.info("📊 No sales data - generating AI forecast from category analysis")
                predicted_daily = velocity.get('daily_avg_30d', 0.5)
                
                base_forecast = {
                    'total_demand': int(predicted_daily * self.DEFAULT_FORECAST_DAYS),
                    'daily_avg': predicted_daily,
                    'next_7_days': int(predicted_daily * 7),
                    'next_30_days': int(predicted_daily * 30),
                    'accuracy_score': 65,  # Lower confidence for category predictions
                    'model_used': 'Category AI Analysis',
                    'predictions': [predicted_daily] * self.DEFAULT_FORECAST_DAYS,
                    'prediction_source': velocity.get('prediction_source', 'category_ai')
                }
                forecast = base_forecast
                logger.info(f"🤖 AI Category Forecast: {predicted_daily}/day → {base_forecast['total_demand']} units/30d")
            else:
                # Use real ML models for products with sales history
                base_forecast = self.forecaster.forecast_demand(
                    sales_df, 
                    days_ahead=self.DEFAULT_FORECAST_DAYS,
                    method='auto'
                )
                
                # Try advanced ML models (XGBoost, LightGBM)
                advanced_forecasts = []
                
                # Try XGBoost
                xgb_forecast = self.advanced_forecaster.forecast_xgboost(sales_df, self.DEFAULT_FORECAST_DAYS)
                if xgb_forecast:
                    advanced_forecasts.append(xgb_forecast)
                    logger.info(f"✅ XGBoost model applied with {xgb_forecast['accuracy_score']}% accuracy")
                
                # Try LightGBM
                lgb_forecast = self.advanced_forecaster.forecast_lightgbm(sales_df, self.DEFAULT_FORECAST_DAYS)
                if lgb_forecast:
                    advanced_forecasts.append(lgb_forecast)
                    logger.info(f"✅ LightGBM model applied with {lgb_forecast['accuracy_score']}% accuracy")
                
                # Use advanced ensemble if ML models succeeded
                if advanced_forecasts:
                    forecast = self.advanced_forecaster.forecast_ensemble_advanced(
                        sales_df, 
                        self.DEFAULT_FORECAST_DAYS,
                        base_forecasts=[base_forecast]
                    )
                    if not forecast:
                        forecast = base_forecast
                        logger.info("Using base forecast (Prophet/ARIMA)")
                    else:
                        logger.info(f"✅ Advanced Ensemble model with {len(advanced_forecasts)} ML models")
                else:
                    forecast = base_forecast
                    logger.info(f"Using traditional model: {base_forecast.get('model_used', 'unknown')}")
            
            # Detect anomalies in sales patterns (only if we have sales data)
            if sales_df is not None and len(sales_df) > 0:
                anomalies = self.anomaly_detector.detect_anomalies(sales_df)
            else:
                anomalies = {'has_anomalies': False, 'anomaly_dates': [], 'anomaly_count': 0}
            
            # 6. Apply seasonal adjustments to forecast
            adjusted_forecast = self._apply_seasonal_adjustment(forecast, seasonal_data)
            
            # 7. Predict stockout
            stockout = self._predict_stockout(
                product['available_stock'],
                velocity,
                adjusted_forecast
            )
            
            # 8. Calculate restock recommendation (with shelf-life constraints)
            restock = self._calculate_restock(
                product['available_stock'],
                velocity,
                adjusted_forecast,
                lead_time_days,
                product.get('low_stock_threshold', 10),
                product  # Pass product details for shelf-life checking
            )
            
            # 9. Generate AI insights
            insights = self._generate_insights(
                product,
                velocity,
                adjusted_forecast,
                stockout,
                restock,
                seasonal_data
            )
            
            # Build result
            result = {
                'success': True,
                'product_id': str(product_id),
                'product_name': product.get('name', 'Unknown'),
                'current_stock': product.get('current_stock', 0),
                'available_stock': product.get('available_stock', 0),
                'reserved_stock': product.get('reserved_stock', 0),
                'status': product.get('status', 'unknown'),
                'sales_velocity': velocity,
                'demand_forecast': adjusted_forecast,
                'stockout_prediction': stockout,
                'restock_recommendation': restock,
                'seasonal_analysis': seasonal_data,
                'anomaly_detection': anomalies,
                'insights': insights,
                'analyzed_at': datetime.now().isoformat(),
                'model_info': {
                    'version': '2.0.0',
                    'algorithm': adjusted_forecast.get('model_used', 'unknown'),
                    'confidence': adjusted_forecast.get('accuracy_score', 0),
                    'data_points_used': len(sales_df) if sales_df is not None else 0,
                    'ml_models_used': adjusted_forecast.get('model_details', {}).get('models', [adjusted_forecast.get('model_used', 'unknown')]),
                    'anomalies_detected': anomalies.get('anomalies_detected', False)
                }
            }
            
            # 10. Optionally save to database
            if save_to_db:
                self.data_processor.save_prediction_to_db(product_id, result)
            
            logger.info(f"Completed AI analysis for product {product_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing product {product_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'product_id': str(product_id) if product_id else None
            }
    
    def analyze_all_products(self, store_id=None, save_to_db=False):
        """
        Analyze all active products for inventory predictions.
        
        Args:
            store_id: Optional store filter
            save_to_db: Whether to save results
            
        Returns:
            dict: Summary with all product analyses
        """
        try:
            logger.info(f"Starting batch analysis for all products{f' in store {store_id}' if store_id else ''}")
            
            products = self.data_processor.get_all_products_for_analysis(store_id)
            
            if not products:
                return {
                    'success': True,
                    'total_analyzed': 0,
                    'products': [],
                    'message': 'No products found for analysis'
                }
            
            results = []
            critical_count = 0
            high_count = 0
            
            for product in products:
                try:
                    analysis = self.analyze_product(
                        product['_id'],
                        save_to_db=save_to_db
                    )
                    
                    if analysis.get('success'):
                        results.append(analysis)
                        
                        urgency = analysis.get('restock_recommendation', {}).get('urgency', 'low')
                        if urgency == 'critical':
                            critical_count += 1
                        elif urgency == 'high':
                            high_count += 1
                            
                except Exception as e:
                    logger.error(f"Error analyzing product {product['_id']}: {str(e)}")
                    results.append({
                        'success': False,
                        'product_id': str(product['_id']),
                        'product_name': product.get('name', 'Unknown'),
                        'error': str(e)
                    })
            
            # Sort by urgency
            results.sort(
                key=lambda x: x.get('stockout_prediction', {}).get('urgency_score', 0),
                reverse=True
            )
            
            return {
                'success': True,
                'total_analyzed': len(results),
                'critical_items': critical_count,
                'high_priority_items': high_count,
                'summary': {
                    'total_products': len(products),
                    'analyzed_successfully': sum(1 for r in results if r.get('success')),
                    'failed_analysis': sum(1 for r in results if not r.get('success')),
                    'needs_immediate_action': critical_count,
                    'needs_attention': high_count
                },
                'products': results,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in batch analysis: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_critical_items(self, store_id=None, limit=20):
        """
        Get products needing urgent restocking.
        
        Returns products sorted by urgency.
        """
        try:
            all_results = self.analyze_all_products(store_id)
            
            if not all_results.get('success'):
                return all_results
            
            # Filter critical and high priority items
            critical = [
                p for p in all_results['products']
                if p.get('success') and 
                p.get('restock_recommendation', {}).get('urgency') in ['critical', 'high']
            ]
            
            return {
                'success': True,
                'count': len(critical),
                'items': critical[:limit],
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting critical items: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_restock_report(self, store_id=None):
        """
        Generate a comprehensive restock report.
        """
        try:
            all_results = self.analyze_all_products(store_id)
            
            if not all_results.get('success'):
                return all_results
            
            products = all_results.get('products', [])
            
            # Categorize by urgency
            critical = []
            high = []
            medium = []
            low = []
            
            total_restock_quantity = 0
            total_restock_value = 0
            
            for p in products:
                if not p.get('success'):
                    continue
                    
                urgency = p.get('restock_recommendation', {}).get('urgency', 'low')
                qty = p.get('restock_recommendation', {}).get('suggested_quantity', 0)
                
                # Estimate value (if cost price available)
                # value = qty * p.get('cost_price', 0)
                
                total_restock_quantity += qty
                
                if urgency == 'critical':
                    critical.append(p)
                elif urgency == 'high':
                    high.append(p)
                elif urgency == 'medium':
                    medium.append(p)
                else:
                    low.append(p)
            
            return {
                'success': True,
                'report_date': datetime.now().isoformat(),
                'summary': {
                    'total_products_analyzed': len(products),
                    'critical_items': len(critical),
                    'high_priority_items': len(high),
                    'medium_priority_items': len(medium),
                    'low_priority_items': len(low),
                    'total_restock_quantity': total_restock_quantity
                },
                'critical_items': critical,
                'high_priority_items': high,
                'medium_priority_items': medium,
                'seasonal_context': self.seasonal_analyzer.get_adjustment_factors(),
                'recommendations': self._generate_report_recommendations(critical, high)
            }
            
        except Exception as e:
            logger.error(f"Error generating restock report: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _calculate_sales_velocity(self, sales_df, product_details=None):
        """Calculate sales velocity metrics with AI category predictions for products without sales"""
        if sales_df is None or len(sales_df) == 0:
            # Use AI to predict sales based on category average
            if product_details:
                category = product_details.get('category')
                pet_type = product_details.get('pet_type', [None])[0] if product_details.get('pet_type') else None
                
                if category:
                    logger.info(f"📊 No sales history - using AI category analysis for velocity prediction")
                    category_data = self.data_processor.get_category_average_sales(category, pet_type, days=30)
                    
                    predicted_daily = category_data.get('daily_avg_per_product', 0.5)
                    predicted_weekly = predicted_daily * 7
                    predicted_monthly = predicted_daily * 30
                    
                    logger.info(f"🤖 AI Predicted Velocity: {predicted_daily}/day based on {category_data.get('products_count', 0)} similar products")
                    
                    return {
                        'daily_avg_7d': round(predicted_daily, 2),
                        'daily_avg_30d': round(predicted_daily, 2),
                        'daily_avg_90d': round(predicted_daily, 2),
                        'weekly_total': int(predicted_weekly),
                        'monthly_total': int(predicted_monthly),
                        'trend': 'predicted',
                        'trend_percentage': 0,
                        'prediction_source': 'category_ai',
                        'category_products_analyzed': category_data.get('products_count', 0)
                    }
            
            # Fallback to conservative baseline
            return {
                'daily_avg_7d': 0.5,
                'daily_avg_30d': 0.5,
                'daily_avg_90d': 0.5,
                'weekly_total': 3,
                'monthly_total': 15,
                'trend': 'no_data',
                'trend_percentage': 0,
                'prediction_source': 'baseline'
            }
        
        last_7_days = sales_df.tail(7)['units_sold'].sum()
        last_30_days = sales_df.tail(30)['units_sold'].sum()
        last_90_days = sales_df['units_sold'].sum()
        
        # Calculate trend
        if len(sales_df) >= 14:
            recent_week = sales_df.tail(7)['units_sold'].sum()
            previous_week = sales_df.iloc[-14:-7]['units_sold'].sum()
            
            if previous_week > 0:
                trend_pct = ((recent_week - previous_week) / previous_week) * 100
                if trend_pct > 10:
                    trend = 'increasing'
                elif trend_pct < -10:
                    trend = 'decreasing'
                else:
                    trend = 'stable'
            else:
                trend = 'increasing' if recent_week > 0 else 'stable'
                trend_pct = 100 if recent_week > 0 else 0
        else:
            trend = 'insufficient_data'
            trend_pct = 0
        
        return {
            'daily_avg_7d': round(last_7_days / 7, 2),
            'daily_avg_30d': round(last_30_days / 30, 2),
            'daily_avg_90d': round(last_90_days / max(len(sales_df), 1), 2),
            'weekly_total': int(last_7_days),
            'monthly_total': int(last_30_days),
            'trend': trend,
            'trend_percentage': round(trend_pct, 1),
            'prediction_source': 'actual_sales'
        }
    
    def _apply_seasonal_adjustment(self, forecast, seasonal_data):
        """Apply seasonal factors to forecast"""
        adjustment_factor = seasonal_data.get('combined_adjustment_factor', 1.0)
        
        if adjustment_factor == 1.0:
            return forecast
        
        adjusted = forecast.copy()
        adjusted['total_demand'] = int(forecast['total_demand'] * adjustment_factor)
        adjusted['daily_avg'] = round(forecast['daily_avg'] * adjustment_factor, 2)
        adjusted['confidence_lower'] = int(forecast['confidence_lower'] * adjustment_factor)
        adjusted['confidence_upper'] = int(forecast['confidence_upper'] * adjustment_factor)
        adjusted['seasonal_adjustment_applied'] = adjustment_factor
        
        if forecast.get('predictions'):
            adjusted['predictions'] = [p * adjustment_factor for p in forecast['predictions']]
        
        return adjusted
    
    def _predict_stockout(self, available_stock, velocity, forecast):
        """Predict when stock will run out"""
        daily_demand = velocity['daily_avg_30d']
        
        if daily_demand <= 0:
            return {
                'will_stockout': False,
                'days_until_stockout': None,
                'stockout_date': None,
                'urgency': 'none',
                'urgency_score': 0,
                'message': 'No recent sales - unable to predict'
            }
        
        days_remaining = available_stock / daily_demand if daily_demand > 0 else float('inf')
        
        if days_remaining == float('inf'):
            stockout_date = None
            # CRITICAL FIX: Check absolute stock levels even without sales data
            if available_stock < 10:
                urgency = 'critical'
                urgency_score = 100
            elif available_stock < 20:
                urgency = 'high'
                urgency_score = 80
            elif available_stock < 40:
                urgency = 'medium'
                urgency_score = 50
            else:
                urgency = 'none'
                urgency_score = 0
        else:
            stockout_date = (datetime.now() + timedelta(days=days_remaining)).isoformat()
            
            # Check BOTH days remaining AND absolute stock levels
            if days_remaining <= 3 or available_stock < 10:
                urgency = 'critical'
                urgency_score = 100
            elif days_remaining <= 7 or available_stock < 20:
                urgency = 'high'
                urgency_score = 80
            elif days_remaining <= 14 or available_stock < 40:
                urgency = 'medium'
                urgency_score = 50
            elif days_remaining <= 30:
                urgency = 'low'
                urgency_score = 25
            else:
                urgency = 'none'
                urgency_score = 10
        
        return {
            'will_stockout': days_remaining < 30,
            'days_until_stockout': round(days_remaining, 1) if days_remaining != float('inf') else None,
            'stockout_date': stockout_date,
            'urgency': urgency,
            'urgency_score': urgency_score,
            'confidence': forecast.get('accuracy_score', 70),
            'based_on_daily_demand': daily_demand
        }
    
    def _calculate_restock(self, available_stock, velocity, forecast, lead_time, low_threshold, product_details=None):
        """Calculate smart restock recommendation with shelf-life constraints"""
        daily_demand = velocity['daily_avg_30d']
        
        # CRITICAL FIX: For products with no sales, use AI-based category predictions
        if daily_demand <= 0:
            # Get category-based predictions using AI
            category = product_details.get('category') if product_details else None
            pet_type = product_details.get('pet_type', [None])[0] if product_details and product_details.get('pet_type') else None
            
            if category:
                logger.info(f"📊 Product has no sales - using AI category analysis for {category}")
                category_data = self.data_processor.get_category_average_sales(category, pet_type, days=30)
                
                # Use category average as predicted demand
                predicted_daily_demand = category_data.get('daily_avg_per_product', 1.0)
                
                # Calculate intelligent restock based on category performance
                safety_stock = predicted_daily_demand * self.DEFAULT_SAFETY_STOCK_DAYS
                lead_time_demand = predicted_daily_demand * (lead_time or self.DEFAULT_LEAD_TIME)
                future_demand_30d = predicted_daily_demand * 30
                
                ideal_stock = future_demand_30d + safety_stock + lead_time_demand
                suggested_quantity = max(0, int(ideal_stock - available_stock))
                
                logger.info(f"🤖 AI Prediction: {predicted_daily_demand}/day → Suggest {suggested_quantity} units")
            else:
                # Fallback to intelligent minimum
                predicted_daily_demand = 1.0
                suggested_quantity = max(30, low_threshold * 2)
                logger.warning(f"No category data - using baseline: {suggested_quantity} units")
            
            # Determine urgency based on absolute stock levels
            if available_stock < 10:
                urgency = 'critical'
                priority = 1
                message = '🚨 CRITICAL: Very low stock! Order immediately.'
            elif available_stock < 20:
                urgency = 'high'
                priority = 2
                message = '⚠️ HIGH: Low stock - place order soon'
            elif available_stock < 40:
                urgency = 'medium'
                priority = 3
                message = '📋 MEDIUM: Stock below ideal level'
            else:
                urgency = 'none'
                priority = 5
                message = '✅ Stock adequate based on category trends'
            
            return {
                'suggested_quantity': suggested_quantity,
                'urgency': urgency,
                'priority': priority,
                'safety_stock': int(predicted_daily_demand * self.DEFAULT_SAFETY_STOCK_DAYS),
                'lead_time_demand': int(predicted_daily_demand * (lead_time or self.DEFAULT_LEAD_TIME)),
                'reorder_point': low_threshold,
                'ideal_stock_level': int(ideal_stock) if category else suggested_quantity,
                'based_on_daily_demand': predicted_daily_demand,
                'prediction_source': 'category_ai' if category else 'baseline',
                'message': message
            }
        
        # Calculate components for products WITH sales data
        safety_stock = daily_demand * self.DEFAULT_SAFETY_STOCK_DAYS
        lead_time_demand = daily_demand * lead_time
        
        # Future demand from forecast
        future_demand = forecast.get('total_demand', daily_demand * 30)
        
        # Ideal stock = future demand + safety stock + lead time demand
        ideal_stock = future_demand + safety_stock + lead_time_demand
        
        # Restock quantity = ideal - current
        restock_quantity = max(0, ideal_stock - available_stock)
        
        # Apply shelf-life constraint for perishable products
        shelf_life_warning = None
        if product_details and product_details.get('is_perishable'):
            constraint = self.data_processor.calculate_shelf_life_constraint(
                product_details, 
                restock_quantity, 
                daily_demand
            )
            if constraint['constraint_applied']:
                restock_quantity = constraint['adjusted_quantity']
                shelf_life_warning = constraint['warning']
        
        # Reorder point = when to trigger order
        reorder_point = safety_stock + lead_time_demand
        
        # Determine urgency based on BOTH days until stockout AND absolute stock levels
        days_until_stockout = available_stock / daily_demand if daily_demand > 0 else float('inf')
        
        # CRITICAL FIX: Consider absolute stock levels for products with no/low sales data
        # This ensures low stock items are flagged even without sales history
        if available_stock < 10 or days_until_stockout <= 3:
            urgency = 'critical'
            priority = 1
            message = '🚨 CRITICAL: Order immediately to prevent stockout!'
        elif available_stock < 20 or days_until_stockout <= 7:
            urgency = 'high'
            priority = 2
            message = '⚠️ HIGH: Place order within 2 days'
        elif available_stock < 40 or days_until_stockout <= 14:
            urgency = 'medium'
            priority = 3
            message = '📋 MEDIUM: Schedule restock this week'
        elif available_stock <= reorder_point:
            urgency = 'low'
            priority = 4
            message = '📝 LOW: Stock below reorder point - plan restock'
        else:
            urgency = 'none'
            priority = 5
            message = '✅ Stock levels adequate'
        
        # DEBUG: Log urgency calculation
        logger.info(f"🔍 URGENCY DEBUG - Stock: {available_stock}, Days: {days_until_stockout:.1f}, Reorder: {reorder_point} → Urgency: {urgency}")
        
        result = {
            'suggested_quantity': int(restock_quantity),
            'urgency': urgency,
            'priority': priority,
            'safety_stock': int(safety_stock),
            'lead_time_demand': int(lead_time_demand),
            'ideal_stock_level': int(ideal_stock),
            'reorder_point': int(reorder_point),
            'current_vs_ideal': round(available_stock / max(ideal_stock, 1) * 100, 1),
            'message': message
        }
        
        # Add shelf-life warning if applicable
        if shelf_life_warning:
            result['shelf_life_warning'] = shelf_life_warning
            result['perishable_product'] = True
        
        return result
    
    def _generate_insights(self, product, velocity, forecast, stockout, restock, seasonal):
        """Generate human-readable AI insights"""
        insights = []
        
        # Stockout warning
        if stockout['urgency'] == 'critical':
            insights.append({
                'type': 'stockout_warning',
                'severity': 'critical',
                'icon': '🚨',
                'title': 'Critical Stock Alert',
                'message': f"Stock will run out in {stockout['days_until_stockout']:.0f} days! Order {restock['suggested_quantity']} units immediately."
            })
        elif stockout['urgency'] == 'high':
            insights.append({
                'type': 'stockout_warning',
                'severity': 'high',
                'icon': '⚠️',
                'title': 'Low Stock Warning',
                'message': f"Only {stockout['days_until_stockout']:.0f} days of stock remaining at current sales rate."
            })
        
        # Sales trend insight
        trend_pct = velocity.get('trend_percentage', 0)
        if velocity['trend'] == 'increasing':
            insights.append({
                'type': 'trend',
                'severity': 'info',
                'icon': '📈',
                'title': 'Sales Trending Up',
                'message': f"Sales increased by {trend_pct:.0f}% compared to previous week. Consider increasing restock quantity."
            })
        elif velocity['trend'] == 'decreasing':
            insights.append({
                'type': 'trend',
                'severity': 'warning',
                'icon': '📉',
                'title': 'Sales Declining',
                'message': f"Sales decreased by {abs(trend_pct):.0f}% compared to previous week. Review pricing and promotions."
            })
        
        # Seasonal insight
        if seasonal.get('event_impact', {}).get('has_event'):
            event = seasonal['event_impact']
            insights.append({
                'type': 'seasonal',
                'severity': 'info',
                'icon': '📅',
                'title': event.get('event_name', 'Upcoming Event'),
                'message': event.get('recommendation', 'Consider adjusting stock levels')
            })
        
        # AI confidence insight
        insights.append({
            'type': 'ai_info',
            'severity': 'info',
            'icon': '🤖',
            'title': 'AI Prediction Info',
            'message': f"Using {forecast.get('model_used', 'ML')} model with {forecast.get('accuracy_score', 70)}% confidence"
        })
        
        # Restock action
        if restock['urgency'] in ['critical', 'high']:
            insights.append({
                'type': 'action',
                'severity': restock['urgency'],
                'icon': '📦',
                'title': 'Recommended Action',
                'message': f"Order {restock['suggested_quantity']} units to maintain optimal stock levels"
            })
        
        return insights
    
    def _validate_data_quality(self, sales_df, product):
        """Validate if product has sufficient data for ML predictions"""
        if sales_df is None or len(sales_df) == 0:
            return {
                'is_new_product': True,
                'has_sufficient_data': False,
                'days_of_data': 0,
                'total_sales': 0,
                'reason': 'No sales history'
            }
        
        days_of_data = len(sales_df[sales_df['units_sold'] > 0])
        total_sales = sales_df['net_units_sold'].sum() if 'net_units_sold' in sales_df else sales_df['units_sold'].sum()
        
        # Minimum requirements for accurate ML predictions
        MIN_DAYS = 14
        MIN_SALES = 10
        
        is_new = days_of_data < MIN_DAYS or total_sales < MIN_SALES
        
        return {
            'is_new_product': is_new,
            'has_sufficient_data': not is_new,
            'days_of_data': days_of_data,
            'total_sales': total_sales,
            'reason': 'Insufficient data for ML' if is_new else 'Sufficient data'
        }
    
    def _handle_new_product(self, product, lead_time_days, save_to_db):
        """Handle cold start problem for new products using category-based prediction"""
        category_id = product.get('category')
        
        if category_id:
            category_velocity = self.data_processor.get_category_average_velocity(category_id)
            daily_demand = category_velocity.get('daily_avg', 1) * 0.7  # Conservative estimate
        else:
            daily_demand = 1  # Very conservative fallback
        
        # Conservative restock calculation
        safety_stock = daily_demand * 14  # 2 weeks
        lead_time_stock = daily_demand * lead_time_days
        suggested_quantity = int(safety_stock + lead_time_stock)
        
        return {
            'success': True,
            'product_id': str(product['_id']),
            'product_name': product.get('name', 'Unknown'),
            'current_stock': product.get('current_stock', 0),
            'available_stock': product.get('available_stock', 0),
            'is_new_product': True,
            'prediction_type': 'cold_start_category_based',
            'sales_velocity': {
                'daily_avg_7d': daily_demand,
                'daily_avg_30d': daily_demand,
                'confidence': 'low',
                'note': 'Based on category average (new product)'
            },
            'restock_recommendation': {
                'suggested_quantity': suggested_quantity,
                'urgency': 'medium',
                'priority': 3,
                'message': '📊 New product - using conservative category-based estimate',
                'based_on': 'category_average'
            },
            'insights': [{
                'type': 'warning',
                'severity': 'info',
                'icon': '🆕',
                'title': 'New Product',
                'message': f'Insufficient sales data. Using category average ({daily_demand:.1f} units/day). Update predictions after 2 weeks.'
            }],
            'analyzed_at': datetime.now().isoformat()
        }
    
    def _analyze_price_impact(self, price_df, sales_df):
        """Detect price changes and estimate impact on demand"""
        if price_df is None or len(price_df) == 0:
            return {
                'has_recent_change': False,
                'price_elasticity': 0,
                'impact_multiplier': 1.0
            }
        
        # Check last 7 days for price changes
        recent_price = price_df.tail(7)
        
        if len(recent_price) < 2:
            return {'has_recent_change': False, 'impact_multiplier': 1.0}
        
        price_change_pct = recent_price['price_change_pct'].abs().max()
        
        if price_change_pct > 5:  # More than 5% price change
            # Estimate elasticity (typically -1.5 for retail)
            # Price down 10% → Demand up 15%
            # Price up 10% → Demand down 15%
            direction = -1 if recent_price['avg_price'].iloc[-1] < recent_price['avg_price'].iloc[0] else 1
            impact_multiplier = 1 + (price_change_pct / 100 * 1.5 * -direction)
            
            return {
                'has_recent_change': True,
                'price_change_pct': price_change_pct * direction,
                'price_elasticity': -1.5,
                'impact_multiplier': impact_multiplier,
                'message': f"Price {'decreased' if direction < 0 else 'increased'} by {price_change_pct:.1f}%, expect {abs((impact_multiplier - 1) * 100):.0f}% {'higher' if impact_multiplier > 1 else 'lower'} demand"
            }
        
        return {'has_recent_change': False, 'impact_multiplier': 1.0}
    
    def _apply_price_elasticity(self, forecast, price_impact):
        """Adjust forecast based on price changes"""
        adjusted = forecast.copy()
        multiplier = price_impact.get('impact_multiplier', 1.0)
        
        if 'predictions' in adjusted:
            adjusted['predictions'] = [p * multiplier for p in adjusted['predictions']]
        if 'total_demand' in adjusted:
            adjusted['total_demand'] *= multiplier
        
        adjusted['price_adjustment_applied'] = True
        adjusted['price_impact'] = price_impact
        
        return adjusted
    
    def _calculate_sales_velocity(self, sales_df, use_net_sales=True):
        """Calculate sales velocity metrics (considering returns if use_net_sales=True)"""
        if sales_df is None or len(sales_df) == 0:
            return {
                'daily_avg_7d': 0,
                'daily_avg_30d': 0,
                'daily_avg_90d': 0,
                'weekly_avg': 0,
                'trend': 'unknown',
                'return_rate': 0
            }
        
        # Use net sales (after returns) if available
        sales_column = 'net_units_sold' if (use_net_sales and 'net_units_sold' in sales_df.columns) else 'units_sold'
        
        # Calculate return rate
        return_rate = 0
        if 'returns_count' in sales_df.columns and 'units_sold' in sales_df.columns:
            total_sold = sales_df['units_sold'].sum()
            total_returns = sales_df['returns_count'].sum()
            return_rate = (total_returns / total_sold * 100) if total_sold > 0 else 0
        
        # Time-based averages
        last_7d = sales_df.tail(7)[sales_column].mean()
        last_30d = sales_df.tail(30)[sales_column].mean()
        last_90d = sales_df[sales_column].mean()
        
        # Determine trend
        if last_7d > last_30d * 1.2:
            trend = 'increasing'
        elif last_7d < last_30d * 0.8:
            trend = 'decreasing'
        else:
            trend = 'stable'
        
        return {
            'daily_avg_7d': float(last_7d),
            'daily_avg_30d': float(last_30d),
            'daily_avg_90d': float(last_90d),
            'weekly_avg': float(last_30d * 7),
            'trend': trend,
            'return_rate': round(return_rate, 2),
            'using_net_sales': use_net_sales
        }
    
    def _generate_report_recommendations(self, critical, high):
        """Generate report-level recommendations"""
        recommendations = []
        
        if critical:
            recommendations.append({
                'priority': 'urgent',
                'message': f"🚨 {len(critical)} products need IMMEDIATE restocking to prevent stockouts",
                'action': 'Place emergency orders today'
            })
        
        if high:
            recommendations.append({
                'priority': 'high',
                'message': f"⚠️ {len(high)} products need restocking within the week",
                'action': 'Schedule orders for these items'
            })
        
        recommendations.append({
            'priority': 'routine',
            'message': 'Run inventory analysis weekly to stay ahead of stockouts',
            'action': 'Enable automated weekly analysis'
        })
        
        return recommendations
    
    def close(self):
        """Clean up resources"""
        self.data_processor.close()
        logger.info("InventoryPredictor resources cleaned up")
