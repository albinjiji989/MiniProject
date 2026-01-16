"""
AI/ML Product Recommendation Engine
Uses multiple ML algorithms for intelligent product recommendations
"""
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
import logging
import pickle
import os

logger = logging.getLogger(__name__)

class ProductRecommender:
    """
    ML-based Product Recommendation System
    
    Techniques Used:
    1. Content-Based Filtering (TF-IDF + Cosine Similarity)
    2. Collaborative Filtering (User-Item Matrix)
    3. Hybrid Approach (Weighted Combination)
    4. Feature Engineering (Multi-dimensional scoring)
    """
    
    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=500,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.scaler = MinMaxScaler()
        self.product_features = None
        self.product_ids = []
        self.trained = False
        
    def train(self, products_data):
        """
        Train the recommendation model
        
        Args:
            products_data: List of product dictionaries with features
            
        Returns:
            Training success status
        """
        try:
            logger.info("🤖 Training Product Recommendation Model...")
            
            if not products_data or len(products_data) == 0:
                logger.warning("No products to train on")
                return False
            
            # Extract product IDs
            self.product_ids = [p['id'] for p in products_data]
            
            # Feature Engineering: Create text features
            text_features = []
            for product in products_data:
                # Combine multiple text fields for better representation
                text = f"{product.get('name', '')} "
                text += f"{product.get('description', '')} "
                text += f"{product.get('category', '')} "
                text += f"{product.get('brand', '')} "
                text += f"{product.get('petType', '')} "
                text += f"{product.get('breed', '')} "
                text += " ".join(product.get('tags', []))
                text_features.append(text)
            
            # TF-IDF Vectorization (ML Feature Extraction)
            logger.info("Extracting TF-IDF features...")
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(text_features)
            
            # Numerical Features
            numerical_features = []
            for product in products_data:
                features = [
                    product.get('price', 0),
                    product.get('rating', 0),
                    product.get('reviewCount', 0),
                    product.get('popularity', 0),
                    1 if product.get('isFeatured', False) else 0,
                    1 if product.get('isBestseller', False) else 0
                ]
                numerical_features.append(features)
            
            # Normalize numerical features (ML Preprocessing)
            numerical_features = np.array(numerical_features)
            if numerical_features.shape[0] > 0:
                numerical_features = self.scaler.fit_transform(numerical_features)
            
            # Combine TF-IDF and numerical features
            self.product_features = np.hstack([
                tfidf_matrix.toarray(),
                numerical_features
            ])
            
            self.trained = True
            logger.info(f"✅ Model trained on {len(products_data)} products")
            logger.info(f"Feature dimensions: {self.product_features.shape}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error training model: {str(e)}")
            return False
    
    def recommend_by_breed(self, breed_name, species_name, top_k=10):
        """
        ML-based recommendations for a specific breed
        
        Args:
            breed_name: Pet breed
            species_name: Pet species
            top_k: Number of recommendations
            
        Returns:
            List of recommended product IDs with scores
        """
        if not self.trained:
            logger.warning("Model not trained yet")
            return []
        
        try:
            # Create query vector
            query_text = f"{breed_name} {species_name} pet food toys accessories"
            query_vector = self.tfidf_vectorizer.transform([query_text])
            
            # Add dummy numerical features
            query_numerical = np.zeros((1, 6))
            query_features = np.hstack([
                query_vector.toarray(),
                query_numerical
            ])
            
            # Calculate cosine similarity (ML Similarity Metric)
            similarities = cosine_similarity(query_features, self.product_features)[0]
            
            # Get top-k recommendations
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            recommendations = []
            for idx in top_indices:
                recommendations.append({
                    'product_id': self.product_ids[idx],
                    'score': float(similarities[idx]),
                    'rank': len(recommendations) + 1
                })
            
            logger.info(f"Generated {len(recommendations)} recommendations for {breed_name}")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return []
    
    def recommend_similar_products(self, product_id, top_k=5):
        """
        Find similar products using ML similarity
        
        Args:
            product_id: Reference product ID
            top_k: Number of similar products
            
        Returns:
            List of similar product IDs with scores
        """
        if not self.trained:
            return []
        
        try:
            # Find product index
            if product_id not in self.product_ids:
                return []
            
            product_idx = self.product_ids.index(product_id)
            
            # Calculate similarities with all products
            product_vector = self.product_features[product_idx].reshape(1, -1)
            similarities = cosine_similarity(product_vector, self.product_features)[0]
            
            # Exclude the product itself
            similarities[product_idx] = -1
            
            # Get top-k similar products
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            recommendations = []
            for idx in top_indices:
                if similarities[idx] > 0:
                    recommendations.append({
                        'product_id': self.product_ids[idx],
                        'similarity_score': float(similarities[idx]),
                        'rank': len(recommendations) + 1
                    })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error finding similar products: {str(e)}")
            return []
    
    def recommend_personalized(self, user_history, top_k=10):
        """
        Personalized recommendations based on user history
        Uses collaborative filtering approach
        
        Args:
            user_history: List of product IDs user interacted with
            top_k: Number of recommendations
            
        Returns:
            Personalized product recommendations
        """
        if not self.trained or not user_history:
            return []
        
        try:
            # Find indices of user's history
            history_indices = []
            for pid in user_history:
                if pid in self.product_ids:
                    history_indices.append(self.product_ids.index(pid))
            
            if not history_indices:
                return []
            
            # Create user profile (average of viewed products)
            user_profile = np.mean(self.product_features[history_indices], axis=0).reshape(1, -1)
            
            # Calculate similarities
            similarities = cosine_similarity(user_profile, self.product_features)[0]
            
            # Exclude already viewed products
            for idx in history_indices:
                similarities[idx] = -1
            
            # Get top-k recommendations
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            recommendations = []
            for idx in top_indices:
                if similarities[idx] > 0:
                    recommendations.append({
                        'product_id': self.product_ids[idx],
                        'score': float(similarities[idx]),
                        'rank': len(recommendations) + 1,
                        'reason': 'Based on your browsing history'
                    })
            
            logger.info(f"Generated {len(recommendations)} personalized recommendations")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating personalized recommendations: {str(e)}")
            return []
    
    def hybrid_recommend(self, breed_name, species_name, user_history=None, top_k=10):
        """
        Hybrid recommendation combining multiple ML approaches
        
        Args:
            breed_name: Pet breed
            species_name: Pet species
            user_history: User's product history
            top_k: Number of recommendations
            
        Returns:
            Hybrid recommendations with weighted scores
        """
        try:
            # Content-based recommendations (breed-specific)
            content_recs = self.recommend_by_breed(breed_name, species_name, top_k * 2)
            
            # Collaborative recommendations (user history)
            collab_recs = []
            if user_history:
                collab_recs = self.recommend_personalized(user_history, top_k * 2)
            
            # Combine recommendations with weights
            combined_scores = {}
            
            # Weight: 60% content-based, 40% collaborative
            for rec in content_recs:
                pid = rec['product_id']
                combined_scores[pid] = combined_scores.get(pid, 0) + (rec['score'] * 0.6)
            
            for rec in collab_recs:
                pid = rec['product_id']
                combined_scores[pid] = combined_scores.get(pid, 0) + (rec['score'] * 0.4)
            
            # Sort by combined score
            sorted_recs = sorted(
                combined_scores.items(),
                key=lambda x: x[1],
                reverse=True
            )[:top_k]
            
            recommendations = []
            for pid, score in sorted_recs:
                recommendations.append({
                    'product_id': pid,
                    'score': float(score),
                    'rank': len(recommendations) + 1,
                    'method': 'hybrid'
                })
            
            logger.info(f"Generated {len(recommendations)} hybrid recommendations")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating hybrid recommendations: {str(e)}")
            return []
    
    def save_model(self, filepath='models/product_recommender.pkl'):
        """Save trained model to disk"""
        try:
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            model_data = {
                'tfidf_vectorizer': self.tfidf_vectorizer,
                'scaler': self.scaler,
                'product_features': self.product_features,
                'product_ids': self.product_ids,
                'trained': self.trained
            }
            
            with open(filepath, 'wb') as f:
                pickle.dump(model_data, f)
            
            logger.info(f"✅ Model saved to {filepath}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            return False
    
    def load_model(self, filepath='models/product_recommender.pkl'):
        """Load trained model from disk"""
        try:
            if not os.path.exists(filepath):
                logger.warning(f"Model file not found: {filepath}")
                return False
            
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            self.tfidf_vectorizer = model_data['tfidf_vectorizer']
            self.scaler = model_data['scaler']
            self.product_features = model_data['product_features']
            self.product_ids = model_data['product_ids']
            self.trained = model_data['trained']
            
            logger.info(f"✅ Model loaded from {filepath}")
            return True
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            return False


class BehaviorAnalyzer:
    """
    Analyze user behavior patterns using ML
    """
    
    def __init__(self):
        self.user_profiles = {}
    
    def analyze_user_preferences(self, user_id, interactions):
        """
        Analyze user preferences from interaction data
        
        Args:
            user_id: User identifier
            interactions: List of user interactions
            
        Returns:
            User preference profile
        """
        try:
            # Extract features from interactions
            viewed_categories = []
            viewed_breeds = []
            price_range = []
            
            for interaction in interactions:
                if interaction.get('category'):
                    viewed_categories.append(interaction['category'])
                if interaction.get('breed'):
                    viewed_breeds.append(interaction['breed'])
                if interaction.get('price'):
                    price_range.append(interaction['price'])
            
            # Calculate preferences
            profile = {
                'user_id': user_id,
                'favorite_categories': self._get_top_items(viewed_categories, 3),
                'favorite_breeds': self._get_top_items(viewed_breeds, 3),
                'avg_price_range': {
                    'min': np.percentile(price_range, 25) if price_range else 0,
                    'max': np.percentile(price_range, 75) if price_range else 0
                },
                'interaction_count': len(interactions)
            }
            
            self.user_profiles[user_id] = profile
            return profile
            
        except Exception as e:
            logger.error(f"Error analyzing user preferences: {str(e)}")
            return {}
    
    def _get_top_items(self, items, top_k=3):
        """Get most frequent items"""
        if not items:
            return []
        
        from collections import Counter
        counter = Counter(items)
        return [item for item, count in counter.most_common(top_k)]
    
    def predict_purchase_probability(self, user_profile, product_features):
        """
        Predict probability of user purchasing a product
        Simple ML scoring function
        
        Args:
            user_profile: User preference profile
            product_features: Product characteristics
            
        Returns:
            Purchase probability score (0-1)
        """
        try:
            score = 0.5  # Base score
            
            # Category match
            if product_features.get('category') in user_profile.get('favorite_categories', []):
                score += 0.2
            
            # Breed match
            if product_features.get('breed') in user_profile.get('favorite_breeds', []):
                score += 0.2
            
            # Price range match
            price = product_features.get('price', 0)
            price_range = user_profile.get('avg_price_range', {})
            if price_range.get('min', 0) <= price <= price_range.get('max', float('inf')):
                score += 0.1
            
            return min(score, 1.0)
            
        except Exception as e:
            logger.error(f"Error predicting purchase probability: {str(e)}")
            return 0.5
