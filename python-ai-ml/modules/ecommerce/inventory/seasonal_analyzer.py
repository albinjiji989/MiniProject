"""
Seasonal Analyzer - Detect and Adjust for Seasonal Patterns

This module analyzes seasonal patterns in sales data
and provides seasonal adjustment factors for better predictions.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class SeasonalAnalyzer:
    """
    Analyze seasonal patterns in pet product sales.
    
    Features:
    - Weekly pattern detection (weekday vs weekend)
    - Monthly seasonality
    - Festival/event impact analysis
    - Pet-specific seasonal trends
    """
    
    # Indian festivals and events that affect pet sales
    INDIAN_EVENTS = {
        # (month, day_range): event_name, impact_multiplier
        (1, (10, 26)): ('Makar Sankranti/Republic Day', 1.1),
        (3, (1, 31)): ('Holi Season', 0.9),  # Pets stay indoors
        (8, (15, 31)): ('Independence Day/Raksha Bandhan', 1.05),
        (9, (1, 30)): ('Ganesh Chaturthi/Navratri Start', 1.1),
        (10, (1, 31)): ('Dussehra/Pre-Diwali', 1.3),
        (11, (1, 15)): ('Diwali Week', 1.5),  # Highest pet calming products
        (12, (20, 31)): ('Christmas/New Year', 1.2),
    }
    
    # Pet type specific seasonal patterns
    PET_SEASONAL_PATTERNS = {
        'dog': {
            'summer': {'cooling_products': 1.5, 'grooming': 1.4, 'regular': 1.1},
            'monsoon': {'raincoats': 1.8, 'anti_fungal': 1.5, 'regular': 0.9},
            'winter': {'sweaters': 1.7, 'joint_care': 1.3, 'regular': 1.0},
            'festival': {'treats': 1.6, 'calming': 1.8, 'regular': 1.2}
        },
        'cat': {
            'summer': {'cooling_products': 1.3, 'regular': 1.0},
            'monsoon': {'indoor_toys': 1.4, 'regular': 0.95},
            'winter': {'warm_beds': 1.5, 'regular': 1.0},
            'festival': {'calming': 1.5, 'regular': 1.1}
        },
        'bird': {
            'summer': {'cage_covers': 1.2, 'regular': 1.0},
            'monsoon': {'regular': 0.9},
            'winter': {'cage_warmers': 1.4, 'regular': 1.0},
            'festival': {'calming': 1.3, 'regular': 1.0}
        }
    }
    
    def __init__(self):
        logger.info("SeasonalAnalyzer initialized")
    
    def get_current_season(self):
        """Get current season based on Indian calendar"""
        month = datetime.now().month
        
        if month in [3, 4, 5]:
            return 'summer'
        elif month in [6, 7, 8, 9]:
            return 'monsoon'
        elif month in [10, 11]:
            return 'festival'
        else:  # 12, 1, 2
            return 'winter'
    
    def get_seasonal_factor(self, pet_type='all', product_category='regular'):
        """
        Get seasonal adjustment factor for predictions.
        
        Args:
            pet_type: 'dog', 'cat', 'bird', etc.
            product_category: Product category for specific adjustments
            
        Returns:
            float: Multiplier for predictions (1.0 = no adjustment)
        """
        season = self.get_current_season()
        
        # Check for specific pet type patterns
        if pet_type in self.PET_SEASONAL_PATTERNS:
            pet_patterns = self.PET_SEASONAL_PATTERNS[pet_type]
            if season in pet_patterns:
                season_data = pet_patterns[season]
                return season_data.get(product_category, season_data.get('regular', 1.0))
        
        # Default seasonal factors
        default_factors = {
            'summer': 1.1,
            'monsoon': 0.9,
            'festival': 1.3,
            'winter': 1.0
        }
        
        return default_factors.get(season, 1.0)
    
    def get_event_impact(self, date=None):
        """
        Check if there's an upcoming event that might impact sales.
        
        Returns:
            dict with event info and impact multiplier
        """
        if date is None:
            date = datetime.now()
        
        month = date.month
        day = date.day
        
        for (event_month, day_range), (event_name, multiplier) in self.INDIAN_EVENTS.items():
            if month == event_month and day_range[0] <= day <= day_range[1]:
                return {
                    'has_event': True,
                    'event_name': event_name,
                    'impact_multiplier': multiplier,
                    'recommendation': self._get_event_recommendation(event_name)
                }
        
        # Check upcoming events (next 14 days)
        for days_ahead in range(1, 15):
            future_date = date + timedelta(days=days_ahead)
            future_month = future_date.month
            future_day = future_date.day
            
            for (event_month, day_range), (event_name, multiplier) in self.INDIAN_EVENTS.items():
                if future_month == event_month and day_range[0] <= future_day <= day_range[1]:
                    return {
                        'has_event': True,
                        'event_name': f"Upcoming: {event_name}",
                        'days_until': days_ahead,
                        'impact_multiplier': multiplier,
                        'recommendation': f"Stock up! {event_name} in {days_ahead} days"
                    }
        
        return {
            'has_event': False,
            'event_name': None,
            'impact_multiplier': 1.0
        }
    
    def analyze_weekly_pattern(self, sales_df):
        """
        Analyze day-of-week patterns in sales.
        
        Returns:
            dict with day-wise average sales and patterns
        """
        if sales_df is None or len(sales_df) < 7:
            return {'pattern_detected': False}
        
        try:
            df = sales_df.copy()
            df['date'] = pd.to_datetime(df['date'])
            df['day_of_week'] = df['date'].dt.day_name()
            df['day_number'] = df['date'].dt.dayofweek
            
            # Group by day of week
            daily_avg = df.groupby('day_of_week')['units_sold'].mean().to_dict()
            
            # Order by day
            ordered_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            ordered_avg = {day: daily_avg.get(day, 0) for day in ordered_days}
            
            # Calculate pattern metrics
            overall_avg = df['units_sold'].mean()
            weekend_avg = (ordered_avg.get('Saturday', 0) + ordered_avg.get('Sunday', 0)) / 2
            weekday_avg = sum(ordered_avg.get(d, 0) for d in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) / 5
            
            # Determine pattern
            if weekend_avg > weekday_avg * 1.2:
                pattern = 'weekend_heavy'
            elif weekday_avg > weekend_avg * 1.2:
                pattern = 'weekday_heavy'
            else:
                pattern = 'uniform'
            
            # Find peak day
            peak_day = max(ordered_avg, key=ordered_avg.get)
            low_day = min(ordered_avg, key=ordered_avg.get)
            
            return {
                'pattern_detected': True,
                'daily_averages': ordered_avg,
                'pattern_type': pattern,
                'peak_day': peak_day,
                'low_day': low_day,
                'weekend_vs_weekday_ratio': round(weekend_avg / max(weekday_avg, 0.01), 2),
                'recommendation': self._get_weekly_recommendation(pattern, peak_day)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing weekly pattern: {str(e)}")
            return {'pattern_detected': False, 'error': str(e)}
    
    def analyze_monthly_pattern(self, sales_df):
        """
        Analyze monthly patterns over available data.
        """
        if sales_df is None or len(sales_df) < 30:
            return {'pattern_detected': False}
        
        try:
            df = sales_df.copy()
            df['date'] = pd.to_datetime(df['date'])
            df['day_of_month'] = df['date'].dt.day
            
            # Group by day of month
            daily_pattern = df.groupby('day_of_month')['units_sold'].mean()
            
            # Divide into periods
            start_month = daily_pattern[daily_pattern.index <= 10].mean()
            mid_month = daily_pattern[(daily_pattern.index > 10) & (daily_pattern.index <= 20)].mean()
            end_month = daily_pattern[daily_pattern.index > 20].mean()
            
            # Determine pattern
            periods = {'start': start_month, 'mid': mid_month, 'end': end_month}
            peak_period = max(periods, key=periods.get)
            low_period = min(periods, key=periods.get)
            
            return {
                'pattern_detected': True,
                'start_month_avg': round(start_month, 2),
                'mid_month_avg': round(mid_month, 2),
                'end_month_avg': round(end_month, 2),
                'peak_period': peak_period,
                'low_period': low_period,
                'pattern_insight': f"Sales peak at {peak_period} of month"
            }
            
        except Exception as e:
            logger.error(f"Error analyzing monthly pattern: {str(e)}")
            return {'pattern_detected': False}
    
    def get_adjustment_factors(self, sales_df=None, pet_type='all', product_category='regular'):
        """
        Get all adjustment factors for predictions.
        
        Returns comprehensive adjustment information.
        """
        seasonal_factor = self.get_seasonal_factor(pet_type, product_category)
        event_impact = self.get_event_impact()
        
        weekly_pattern = {}
        monthly_pattern = {}
        
        if sales_df is not None:
            weekly_pattern = self.analyze_weekly_pattern(sales_df)
            monthly_pattern = self.analyze_monthly_pattern(sales_df)
        
        # Calculate combined factor
        combined_factor = seasonal_factor * event_impact['impact_multiplier']
        
        return {
            'current_season': self.get_current_season(),
            'seasonal_factor': seasonal_factor,
            'event_impact': event_impact,
            'weekly_pattern': weekly_pattern,
            'monthly_pattern': monthly_pattern,
            'combined_adjustment_factor': round(combined_factor, 2),
            'recommendations': self._generate_recommendations(
                seasonal_factor, event_impact, weekly_pattern
            )
        }
    
    def _get_event_recommendation(self, event_name):
        """Get recommendation based on event"""
        recommendations = {
            'Diwali Week': 'Stock up on pet calming products, treats, and comfortable beds',
            'Makar Sankranti/Republic Day': 'Increase stock of outdoor pet accessories',
            'Holi Season': 'Stock pet-safe cleaning products and anti-stain items',
            'Christmas/New Year': 'Increase stock of pet gifts, toys, and winter care'
        }
        return recommendations.get(event_name, 'Consider increasing stock levels')
    
    def _get_weekly_recommendation(self, pattern, peak_day):
        """Get recommendation based on weekly pattern"""
        if pattern == 'weekend_heavy':
            return f"Ensure full stock by Friday. Peak day is {peak_day}"
        elif pattern == 'weekday_heavy':
            return f"Focus restocking on Sunday evening. Peak day is {peak_day}"
        else:
            return "Sales are uniform throughout the week"
    
    def _generate_recommendations(self, seasonal_factor, event_impact, weekly_pattern):
        """Generate actionable recommendations"""
        recommendations = []
        
        if seasonal_factor > 1.2:
            recommendations.append({
                'type': 'seasonal',
                'priority': 'high',
                'message': f'High season detected. Increase stock by {int((seasonal_factor-1)*100)}%'
            })
        
        if event_impact.get('has_event') and event_impact.get('days_until', 0) <= 7:
            recommendations.append({
                'type': 'event',
                'priority': 'urgent',
                'message': event_impact.get('recommendation', 'Prepare for upcoming event')
            })
        
        if weekly_pattern.get('pattern_detected'):
            recommendations.append({
                'type': 'weekly',
                'priority': 'medium',
                'message': weekly_pattern.get('recommendation', '')
            })
        
        return recommendations
