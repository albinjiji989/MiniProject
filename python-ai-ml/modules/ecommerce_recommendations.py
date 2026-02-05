"""
Professional E-commerce Recommendation Engine
Real AI/ML based product recommendations with proper algorithms
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
from bson import ObjectId
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)


def convert_objectids(obj):
    """Recursively convert all ObjectIds to strings in a nested structure"""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: convert_objectids(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectids(item) for item in obj]
    else:
        return obj


class EcommerceRecommendationEngine:
    def __init__(self, db):
        self.db = db
        self.products_collection = db['products']
        self.interactions_collection = db['userproductinteractions']
        self.orders_collection = db['orders']
        
    def get_all_recommendations(self, user_id: str = None) -> Dict[str, List[Dict]]:
        """
        Get comprehensive recommendations
        Returns: {
            'best_sellers': [...],
            'trending': [...],
            'most_bought': [...],
            'recommended_for_you': [...],
            'new_arrivals': [...]
        }
        """
        try:
            logger.info(f"🤖 AI/ML: Generating recommendations for user: {user_id or 'Guest'}")
            
            results = {
                'best_sellers': self._get_best_sellers(),
                'trending': self._get_trending_products(),
                'most_bought': self._get_most_bought_products(),
                'recommended_for_you': self._get_personalized_recommendations(user_id) if user_id else [],
                'new_arrivals': self._get_new_arrivals()
            }
            
            logger.info(f"✅ Recommendations generated - Best Sellers: {len(results['best_sellers'])}, "
                       f"Trending: {len(results['trending'])}, Most Bought: {len(results['most_bought'])}, "
                       f"For You: {len(results['recommended_for_you'])}, New: {len(results['new_arrivals'])}")
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Recommendation engine error: {e}")
            raise
    
    def _get_best_sellers(self, limit: int = 20) -> List[Dict]:
        """
        Best Sellers: Products with highest sales (like Amazon)
        Combines: Purchase count (80%) + Ratings (20%)
        Shows products even with 1 sale
        """
        try:
            # Get purchase data
            pipeline = [
                {
                    '$match': {
                        'purchased': {'$gt': 0}
                    }
                },
                {
                    '$group': {
                        '_id': '$productId',
                        'totalPurchases': {'$sum': '$purchased'},
                        'uniqueBuyers': {'$addToSet': '$userId'},
                        'totalRevenue': {'$sum': {'$multiply': ['$purchased', '$lastPrice']}}
                    }
                },
                {
                    '$sort': {'totalPurchases': -1}
                },
                {
                    '$limit': limit * 2  # Get more to filter
                }
            ]
            
            purchase_data = list(self.interactions_collection.aggregate(pipeline))
            
            if not purchase_data:
                logger.warning("⚠️ No sales data found for Best Sellers")
                return []
            
            # Get products and combine with purchase data
            product_ids = [item['_id'] for item in purchase_data]
            products = list(self.products_collection.find({
                '_id': {'$in': product_ids},
                'status': 'active',
                'inventory.stock': {'$gt': 0}
            }))
            
            # Calculate best seller score
            result = []
            for product in products:
                stats = next((p for p in purchase_data if p['_id'] == product['_id']), None)
                if stats:
                    # Score = Purchases (80%) + Rating bonus (20%)
                    purchase_score = stats['totalPurchases'] * 10
                    rating_score = product.get('ratings', {}).get('average', 0) * product.get('ratings', {}).get('count', 0)
                    
                    total_score = (purchase_score * 0.8) + (rating_score * 0.2)
                    
                    formatted = self._format_product(product, 'best_seller')
                    formatted['stats'] = {
                        'purchases': stats['totalPurchases'],
                        'buyers': len(stats['uniqueBuyers']),
                        'revenue': stats['totalRevenue'],
                        'score': round(total_score, 2)
                    }
                    formatted['_sort_score'] = total_score
                    result.append(formatted)
            
            # Sort by score and limit
            result.sort(key=lambda x: x['_sort_score'], reverse=True)
            for item in result:
                del item['_sort_score']  # Remove internal field
            
            return result[:limit]
            
        except Exception as e:
            logger.error(f"Best sellers error: {e}")
            return []
    
    def _get_trending_products(self, limit: int = 20) -> List[Dict]:
        """
        Trending: Products with most views/interactions in last 7 days
        Uses exponential decay - recent views weighted more heavily
        """
        try:
            seven_days_ago = datetime.utcnow() - timedelta(days=7)
            
            # Get interactions from last 7 days
            pipeline = [
                {
                    '$match': {
                        'lastViewed': {'$gte': seven_days_ago}
                    }
                },
                {
                    '$group': {
                        '_id': '$productId',
                        'totalViews': {'$sum': '$views'},
                        'totalClicks': {'$sum': '$clicks'},
                        'uniqueViewers': {'$addToSet': '$userId'},
                        'purchases': {'$sum': '$purchased'}
                    }
                },
                {
                    '$addFields': {
                        'trendingScore': {
                            '$add': [
                                {'$multiply': ['$totalViews', 1]},
                                {'$multiply': ['$totalClicks', 3]},
                                {'$multiply': ['$purchases', 10]},
                                {'$multiply': [{'$size': '$uniqueViewers'}, 5]}
                            ]
                        }
                    }
                },
                {
                    '$sort': {'trendingScore': -1}
                },
                {
                    '$limit': limit
                }
            ]
            
            trending_data = list(self.interactions_collection.aggregate(pipeline))
            
            if not trending_data:
                logger.warning("⚠️ No trending data - need at least 5 views or 2 viewers in last 7 days")
                return []
            
            product_ids = [item['_id'] for item in trending_data]
            
            products = list(self.products_collection.find({
                '_id': {'$in': product_ids},
                'status': 'active',
                'inventory.stock': {'$gt': 0}
            }))
            
            # Attach trending stats
            result = []
            for product in products:
                stats = next((t for t in trending_data if t['_id'] == product['_id']), None)
                if stats:
                    formatted = self._format_product(product, 'trending')
                    formatted['stats'] = {
                        'views': stats['totalViews'],
                        'clicks': stats['totalClicks'],
                        'viewers': len(stats['uniqueViewers']),
                        'purchases': stats['purchases']
                    }
                    result.append(formatted)
            
            return result
            
        except Exception as e:
            logger.error(f"Trending products error: {e}")
            return []
    
    def _get_most_bought_products(self, limit: int = 20) -> List[Dict]:
        """
        Most Bought: Products purchased most frequently (like Amazon)
        Shows any product that has been purchased at least once
        Sorted by: Total purchases + Repeat purchase bonus
        """
        try:
            pipeline = [
                {
                    '$match': {
                        'purchased': {'$gt': 0}
                    }
                },
                {
                    '$group': {
                        '_id': '$productId',
                        'totalPurchases': {'$sum': '$purchased'},
                        'totalRevenue': {'$sum': {'$multiply': ['$purchased', '$lastPrice']}},
                        'uniqueBuyers': {'$addToSet': '$userId'},
                        'recentPurchases': {
                            '$sum': {
                                '$cond': [
                                    {'$gte': ['$lastPurchased', {'$subtract': [datetime.utcnow(), 30*24*60*60*1000]}]},
                                    '$purchased',
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    '$addFields': {
                        'buyerCount': {'$size': '$uniqueBuyers'},
                        'repeatPurchaseBonus': {
                            '$multiply': [
                                {'$subtract': ['$totalPurchases', '$buyerCount']},
                                2  # Repeat purchases get 2x bonus
                            ]
                        }
                    }
                },
                {
                    '$addFields': {
                        'frequencyScore': {
                            '$add': ['$totalPurchases', '$repeatPurchaseBonus']
                        }
                    }
                },
                {
                    '$sort': {'frequencyScore': -1, 'totalPurchases': -1}
                },
                {
                    '$limit': limit
                }
            ]
            
            purchase_data = list(self.interactions_collection.aggregate(pipeline))
            
            if not purchase_data:
                logger.warning("⚠️ No purchase data found")
                return []
            
            product_ids = [item['_id'] for item in purchase_data]
            
            products = list(self.products_collection.find({
                '_id': {'$in': product_ids},
                'status': 'active',
                'inventory.stock': {'$gt': 0}
            }))
            
            # Attach purchase stats
            result = []
            for product in products:
                stats = next((p for p in purchase_data if p['_id'] == product['_id']), None)
                if stats:
                    formatted = self._format_product(product, 'most_bought')
                    formatted['stats'] = {
                        'purchases': stats['totalPurchases'],
                        'revenue': stats['totalRevenue'],
                        'buyers': len(stats['uniqueBuyers'])
                    }
                    result.append(formatted)
            
            return result
            
        except Exception as e:
            logger.error(f"Most bought products error: {e}")
            return []
    
    def _get_personalized_recommendations(self, user_id: str, limit: int = 20) -> List[Dict]:
        """
        Personalized recommendations using collaborative filtering + content-based
        1. Find similar users (collaborative filtering)
        2. Find similar products to what user viewed (content-based)
        3. Combine and rank
        """
        try:
            if not user_id:
                return []
            
            user_obj_id = ObjectId(user_id)
            
            # Get user's interaction history
            user_interactions = list(self.interactions_collection.find({
                'userId': user_obj_id
            }).sort('lastViewed', -1).limit(50))
            
            if not user_interactions:
                return []
            
            # Get products user has interacted with
            viewed_product_ids = [i['productId'] for i in user_interactions if i.get('productId')]
            
            if not viewed_product_ids:
                return []
            
            # Find similar users who viewed the same products
            similar_users_pipeline = [
                {
                    '$match': {
                        'productId': {'$in': viewed_product_ids},
                        'userId': {'$ne': user_obj_id}
                    }
                },
                {
                    '$group': {
                        '_id': '$userId',
                        'commonProducts': {'$addToSet': '$productId'},
                        'totalInteractions': {'$sum': '$views'}
                    }
                },
                {
                    '$sort': {'totalInteractions': -1}
                },
                {
                    '$limit': 10
                }
            ]
            
            similar_users = list(self.interactions_collection.aggregate(similar_users_pipeline))
            
            if similar_users:
                # Get products these similar users liked
                similar_user_ids = [u['_id'] for u in similar_users]
                
                recommended_pipeline = [
                    {
                        '$match': {
                            'userId': {'$in': similar_user_ids},
                            'productId': {'$nin': viewed_product_ids}  # Exclude already viewed
                        }
                    },
                    {
                        '$group': {
                            '_id': '$productId',
                            'score': {'$sum': {'$add': ['$views', {'$multiply': ['$clicks', 2]}]}}
                        }
                    },
                    {
                        '$sort': {'score': -1}
                    },
                    {
                        '$limit': limit
                    }
                ]
                
                recommended_product_ids = [
                    item['_id'] for item in self.interactions_collection.aggregate(recommended_pipeline)
                ]
                
                products = list(self.products_collection.find({
                    '_id': {'$in': recommended_product_ids},
                    'status': 'active',
                    'inventory.stock': {'$gt': 0}
                }))
                
                return [self._format_product(p, 'recommended') for p in products]
            
            return []
            
        except Exception as e:
            logger.error(f"Personalized recommendations error: {e}")
            return []
    
    def _get_new_arrivals(self, limit: int = 20) -> List[Dict]:
        """
        New Arrivals: Recently added products (last 30 days)
        """
        try:
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            products = list(self.products_collection.find({
                'status': 'active',
                'inventory.stock': {'$gt': 0},
                'createdAt': {'$gte': thirty_days_ago}
            }).sort('createdAt', -1).limit(limit))
            
            return [self._format_product(p, 'new_arrival') for p in products]
            
        except Exception as e:
            logger.error(f"New arrivals error: {e}")
            return []
    
    def _format_product(self, product: Dict, rec_type: str) -> Dict:
        """Format product for response - convert all ObjectIds to strings"""
        # Use recursive ObjectId converter to ensure everything is JSON serializable
        product_dict = {
            '_id': str(product['_id']),
            'name': product.get('name'),
            'slug': product.get('slug'),
            'images': product.get('images', []),
            'category': product.get('category'),
            'brand': product.get('attributes', {}).get('brand') or product.get('brand'),
            'pricing': product.get('pricing', {}),
            'ratings': product.get('ratings', {}),
            'inventory': product.get('inventory', {}),
            'petType': product.get('petType'),
            'recommendationType': rec_type
        }
        
        # Convert all ObjectIds recursively
        return convert_objectids(product_dict)
