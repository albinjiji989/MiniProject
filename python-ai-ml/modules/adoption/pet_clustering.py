"""
K-Means Pet Clustering for Adoption
Groups pets into personality clusters for better recommendations
Unsupervised learning to discover pet personality types
"""

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
import joblib
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class PetClusterer:
    """
    K-Means clustering to group pets into personality types
    Helps users discover pets with similar characteristics
    """
    
    def __init__(self):
        """Initialize K-Means clusterer"""
        self.model = None
        self.scaler = StandardScaler()
        self.pca = None
        self.optimal_k = None
        self.cluster_names = {}
        self.cluster_characteristics = {}
        self.feature_names = [
            'energyLevel', 'size_encoded', 'trainedLevel_encoded',
            'childFriendlyScore', 'petFriendlyScore', 'noiseLevel_encoded',
            'exerciseNeeds_encoded', 'groomingNeeds_encoded'
        ]
        self.model_path = 'models/adoption_kmeans_model.pkl'
        self.scaler_path = 'models/adoption_kmeans_scaler.pkl'
        self.trained = False
        self.training_date = None
        self.metrics = {}
        
    @staticmethod
    def _safe_num(value, default=0.0):
        """Safely convert any value to float (handles MongoDB data quirks)"""
        if value is None:
            return float(default)
        if isinstance(value, bool):
            return 1.0 if value else 0.0
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            try:
                return float(value)
            except (ValueError, TypeError):
                return float(default)
        return float(default)
    
    def extract_features(self, pet_profile):
        """
        Extract features from pet compatibility profile.
        Uses _safe_num for robust handling of real MongoDB data.
        
        Args:
            pet_profile: Pet's compatibility profile
            
        Returns:
            numpy array of features
        """
        if not isinstance(pet_profile, dict):
            pet_profile = {}
            
        features = {}
        
        # Energy level (1-5)
        features['energyLevel'] = self._safe_num(pet_profile.get('energyLevel'), 3)
        
        # Size (small=1, medium=2, large=3)
        size_map = {'small': 1, 'medium': 2, 'large': 3}
        size_val = pet_profile.get('size', 'medium')
        features['size_encoded'] = float(size_map.get(str(size_val).lower() if size_val else 'medium', 2))
        
        # Trained level (untrained=1, basic=2, intermediate=3, advanced=4)
        trained_map = {'untrained': 1, 'basic': 2, 'intermediate': 3, 'advanced': 4}
        trained_val = pet_profile.get('trainedLevel', 'untrained')
        features['trainedLevel_encoded'] = float(trained_map.get(str(trained_val).lower() if trained_val else 'untrained', 1))
        
        # Social scores (0-10)
        features['childFriendlyScore'] = self._safe_num(pet_profile.get('childFriendlyScore'), 5)
        features['petFriendlyScore'] = self._safe_num(pet_profile.get('petFriendlyScore'), 5)
        
        # Noise level (quiet=1, moderate=2, vocal=3)
        noise_map = {'quiet': 1, 'moderate': 2, 'vocal': 3}
        noise_val = pet_profile.get('noiseLevel', 'moderate')
        features['noiseLevel_encoded'] = float(noise_map.get(str(noise_val).lower() if noise_val else 'moderate', 2))
        
        # Exercise needs (minimal=1, moderate=2, high=3, very_high=4)
        exercise_map = {'minimal': 1, 'moderate': 2, 'high': 3, 'very_high': 4}
        exercise_val = pet_profile.get('exerciseNeeds', 'moderate')
        features['exerciseNeeds_encoded'] = float(exercise_map.get(str(exercise_val).lower() if exercise_val else 'moderate', 2))
        
        # Grooming needs (low=1, moderate=2, high=3)
        grooming_map = {'low': 1, 'moderate': 2, 'high': 3}
        grooming_val = pet_profile.get('groomingNeeds', 'moderate')
        features['groomingNeeds_encoded'] = float(grooming_map.get(str(grooming_val).lower() if grooming_val else 'moderate', 2))
        
        # Return as array in consistent order - all values guaranteed float
        feature_array = np.array([float(features[key]) for key in self.feature_names], dtype=np.float64)
        return feature_array.reshape(1, -1)
    
    def prepare_training_data(self, pets):
        """
        Prepare feature matrix from pets
        
        Args:
            pets: List of pets with compatibility profiles
            
        Returns:
            X: Feature matrix
            pet_ids: List of pet IDs
        """
        X_list = []
        pet_ids = []
        
        for pet in pets:
            try:
                # Extract compatibility profile
                compat_profile = pet.get('compatibilityProfile', {})
                
                # Skip if profile is incomplete
                if not compat_profile:
                    continue
                
                # Extract features
                features = self.extract_features(compat_profile)
                
                X_list.append(features[0])
                pet_ids.append(str(pet.get('_id', pet.get('petId', ''))))
                
            except Exception as e:
                logger.warning(f"Skipping pet due to error: {str(e)}")
                continue
        
        X = np.array(X_list)
        
        logger.info(f"Prepared {len(X)} pets for clustering")
        
        return X, pet_ids
    
    def find_optimal_k(self, X, k_range=(3, 8)):
        """
        Find optimal number of clusters using elbow method and silhouette score
        
        Args:
            X: Feature matrix
            k_range: Tuple of (min_k, max_k)
            
        Returns:
            optimal_k: Best number of clusters
        """
        inertias = []
        silhouette_scores = []
        k_values = range(k_range[0], k_range[1] + 1)
        
        for k in k_values:
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            kmeans.fit(X)
            
            inertias.append(kmeans.inertia_)
            
            # Calculate silhouette score
            if k > 1:
                score = silhouette_score(X, kmeans.labels_)
                silhouette_scores.append(score)
            else:
                silhouette_scores.append(0)
        
        # Find k with best silhouette score
        best_idx = np.argmax(silhouette_scores)
        optimal_k = k_values[best_idx]
        
        logger.info(f"Optimal K: {optimal_k} (Silhouette: {silhouette_scores[best_idx]:.3f})")
        
        return optimal_k, {
            'k_values': list(k_values),
            'inertias': inertias,
            'silhouette_scores': silhouette_scores,
            'optimal_k': optimal_k,
            'best_silhouette': silhouette_scores[best_idx]
        }
    
    def assign_cluster_names(self, X, labels):
        """
        Assign meaningful names to clusters based on characteristics
        
        Args:
            X: Feature matrix
            labels: Cluster labels
            
        Returns:
            dict: Cluster names and characteristics
        """
        cluster_names = {}
        cluster_characteristics = {}
        
        for cluster_id in range(self.optimal_k):
            # Get all pets in this cluster
            cluster_mask = labels == cluster_id
            cluster_data = X[cluster_mask]
            
            if len(cluster_data) == 0:
                continue
            
            # Calculate average characteristics
            avg_features = cluster_data.mean(axis=0)
            
            characteristics = {
                'energyLevel': float(avg_features[0]),
                'size': float(avg_features[1]),
                'trainedLevel': float(avg_features[2]),
                'childFriendly': float(avg_features[3]),
                'petFriendly': float(avg_features[4]),
                'noiseLevel': float(avg_features[5]),
                'exerciseNeeds': float(avg_features[6]),
                'groomingNeeds': float(avg_features[7]),
                'count': int(cluster_mask.sum())
            }
            
            # Assign name based on characteristics
            name = self._generate_cluster_name(characteristics)
            
            cluster_names[cluster_id] = name
            cluster_characteristics[cluster_id] = characteristics
        
        return cluster_names, cluster_characteristics
    
    def _generate_cluster_name(self, chars):
        """Generate cluster name based on characteristics"""
        energy = chars['energyLevel']
        size = chars['size']
        child_friendly = chars['childFriendly']
        noise = chars['noiseLevel']
        trained = chars['trainedLevel']
        
        # High energy + needs exercise
        if energy >= 4 and chars['exerciseNeeds'] >= 3:
            return "Energetic Athletes"
        
        # Low energy + quiet
        elif energy <= 2 and noise <= 1.5:
            return "Calm Companions"
        
        # Child-friendly + medium energy
        elif child_friendly >= 7 and 2 <= energy <= 3.5:
            return "Family Friends"
        
        # Low maintenance + can be alone
        elif chars['groomingNeeds'] <= 1.5 and trained <= 2:
            return "Independent Spirits"
        
        # Large + calm
        elif size >= 2.5 and energy <= 2.5:
            return "Gentle Giants"
        
        # Small + playful
        elif size <= 1.5 and energy >= 3:
            return "Playful Companions"
        
        # Default
        else:
            return f"Cluster {int(energy * 10) % 10}"
    
    def train(self, pets, k=None):
        """
        Train K-Means clustering model
        
        Args:
            pets: List of pets with compatibility profiles
            k: Number of clusters (None = auto-detect)
            
        Returns:
            dict: Training metrics
        """
        try:
            logger.info("Starting K-Means clustering...")
            
            # Prepare data
            X, pet_ids = self.prepare_training_data(pets)
            
            if len(X) < 10:
                raise ValueError(f"Not enough pets for clustering. Need at least 10, got {len(X)}")
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Find optimal K if not provided
            if k is None:
                self.optimal_k, elbow_data = self.find_optimal_k(X_scaled)
            else:
                self.optimal_k = k
                elbow_data = {}
            
            # Train K-Means
            logger.info(f"Training K-Means with {self.optimal_k} clusters...")
            self.model = KMeans(
                n_clusters=self.optimal_k,
                random_state=42,
                n_init=20,
                max_iter=300
            )
            
            labels = self.model.fit_predict(X_scaled)
            
            # Calculate silhouette score
            silhouette = silhouette_score(X_scaled, labels)
            
            # Assign cluster names
            self.cluster_names, self.cluster_characteristics = self.assign_cluster_names(X, labels)
            
            # PCA for visualization
            self.pca = PCA(n_components=2)
            X_pca = self.pca.fit_transform(X_scaled)
            
            self.metrics = {
                'optimal_k': self.optimal_k,
                'silhouette_score': float(silhouette),
                'inertia': float(self.model.inertia_),
                'total_pets': len(X),
                'cluster_sizes': {
                    name: int(self.cluster_characteristics[cid]['count'])
                    for cid, name in self.cluster_names.items()
                },
                'elbow_data': elbow_data
            }
            
            self.trained = True
            self.training_date = datetime.now()
            
            logger.info(f"K-Means Training Complete!")
            logger.info(f"Clusters: {self.optimal_k}, Silhouette: {silhouette:.3f}")
            logger.info(f"Cluster Names: {list(self.cluster_names.values())}")
            
            # Save model
            self.save_model()
            
            return self.metrics
            
        except Exception as e:
            logger.error(f"Error training K-Means: {str(e)}")
            raise
    
    def assign_pet_to_cluster(self, pet_profile):
        """
        Assign a pet to a cluster
        
        Args:
            pet_profile: Pet's compatibility profile
            
        Returns:
            dict: Cluster ID and name
        """
        if not self.trained:
            logger.warning("Model not trained, returning default cluster")
            return {
                'clusterId': 0,
                'clusterName': 'Uncategorized',
                'trained': False
            }
        
        try:
            # Extract features
            features = self.extract_features(pet_profile)
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Predict cluster
            cluster_id = int(self.model.predict(features_scaled)[0])
            
            # Get cluster name
            cluster_name = self.cluster_names.get(cluster_id, f'Cluster {cluster_id}')
            
            # Get cluster characteristics
            characteristics = self.cluster_characteristics.get(cluster_id, {})
            
            return {
                'clusterId': cluster_id,
                'clusterName': cluster_name,
                'characteristics': characteristics,
                'trained': True
            }
            
        except Exception as e:
            logger.error(f"Error assigning cluster: {str(e)}")
            return {
                'clusterId': 0,
                'clusterName': 'Uncategorized',
                'trained': True,
                'error': str(e)
            }
    
    def calculate_cluster_affinity(self, user_profile, pet_cluster_id):
        """
        Calculate how well a user's preferences match a pet cluster.
        Uses robust type handling for real MongoDB user profiles.
        
        Args:
            user_profile: User's adoption profile
            pet_cluster_id: Pet's cluster ID
            
        Returns:
            float: Affinity score (0-100)
        """
        if not isinstance(user_profile, dict):
            user_profile = {}
            
        if pet_cluster_id not in self.cluster_characteristics:
            logger.debug(f"Cluster {pet_cluster_id} not in characteristics, returning neutral")
            return 50.0  # Neutral score
        
        cluster_chars = self.cluster_characteristics[pet_cluster_id]
        score = 50.0  # Base score
        
        # Activity level match (up to ±40 points)
        user_activity = self._safe_num(user_profile.get('activityLevel'), 3)
        cluster_energy = float(cluster_chars.get('energyLevel', 3))
        activity_match = 5.0 - abs(user_activity - cluster_energy)
        score += activity_match * 8
        
        # Size preference match (up to ±15 points)
        # preferredSize can be array in MongoDB
        raw_size_pref = user_profile.get('preferredSize', 'medium')
        size_map = {'small': 1, 'medium': 2, 'large': 3}
        if isinstance(raw_size_pref, list) and raw_size_pref:
            user_size_pref = float(size_map.get(str(raw_size_pref[0]).lower(), 2))
        else:
            user_size_pref = float(size_map.get(str(raw_size_pref).lower(), 2))
        cluster_size = float(cluster_chars.get('size', 2))
        size_match = 3.0 - abs(user_size_pref - cluster_size)
        score += size_match * 5
        
        # Child-friendliness if user has children (up to 15 points)
        has_children = bool(user_profile.get('hasChildren', False))
        if has_children:
            child_score = float(cluster_chars.get('childFriendly', 5))
            if child_score >= 7:
                score += 15
            elif child_score >= 5:
                score += 8
            else:
                score -= 10  # Penalty for child-unsafe cluster
        else:
            score += 5  # Neutral
        
        # Experience match (up to 10 points)
        exp_map = {'beginner': 1, 'first_time': 1, 'some_experience': 2, 'intermediate': 2, 'experienced': 3, 'advanced': 3, 'expert': 4}
        user_exp = exp_map.get(str(user_profile.get('experienceLevel', 'beginner')).lower(), 1)
        cluster_trained = float(cluster_chars.get('trainedLevel', 2))
        if user_exp >= cluster_trained:
            score += 10
        else:
            score += max(0, 10 - (cluster_trained - user_exp) * 4)
        
        final = min(100, max(0, score))
        logger.debug(f"Cluster affinity: cluster={pet_cluster_id}, activity_match={activity_match:.1f}, size_match={size_match:.1f}, children={has_children}, final={final:.1f}")
        return final
    
    def find_similar_pets(self, pet_id, all_pets, top_n=5):
        """
        Find pets similar to a given pet (same cluster)
        
        Args:
            pet_id: Pet ID to find similar pets for
            all_pets: List of all pets
            top_n: Number of similar pets to return
            
        Returns:
            list: Similar pets
        """
        if not self.trained:
            return []
        
        try:
            # Find the target pet
            target_pet = next((p for p in all_pets if str(p.get('_id', p.get('petId'))) == str(pet_id)), None)
            
            if not target_pet:
                return []
            
            # Get target pet's cluster
            target_cluster = self.assign_pet_to_cluster(target_pet.get('compatibilityProfile', {}))
            cluster_id = target_cluster['clusterId']
            
            # Find pets in same cluster
            similar_pets = []
            
            for pet in all_pets:
                pet_id_str = str(pet.get('_id', pet.get('petId')))
                
                # Skip the target pet itself
                if pet_id_str == str(pet_id):
                    continue
                
                # Check if pet is in same cluster
                pet_cluster = self.assign_pet_to_cluster(pet.get('compatibilityProfile', {}))
                
                if pet_cluster['clusterId'] == cluster_id:
                    similar_pets.append({
                        'petId': pet_id_str,
                        'petName': pet.get('name', 'Unknown'),
                        'breed': pet.get('breed', ''),
                        'species': pet.get('species', ''),
                        'clusterName': pet_cluster['clusterName']
                    })
            
            # Return top N
            return similar_pets[:top_n]
            
        except Exception as e:
            logger.error(f"Error finding similar pets: {str(e)}")
            return []
    
    def get_cluster_info(self):
        """Get information about all clusters"""
        return {
            'optimal_k': self.optimal_k,
            'cluster_names': self.cluster_names,
            'cluster_characteristics': self.cluster_characteristics,
            'trained': self.trained,
            'training_date': self.training_date.isoformat() if self.training_date else None
        }
    
    def save_model(self):
        """Save trained model and scaler"""
        try:
            os.makedirs('models', exist_ok=True)
            
            model_data = {
                'model': self.model,
                'pca': self.pca,
                'optimal_k': self.optimal_k,
                'cluster_names': self.cluster_names,
                'cluster_characteristics': self.cluster_characteristics,
                'trained': self.trained,
                'training_date': self.training_date,
                'metrics': self.metrics
            }
            
            joblib.dump(model_data, self.model_path)
            joblib.dump(self.scaler, self.scaler_path)
            
            logger.info(f"Model saved to {self.model_path}")
            
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
    
    def load_model(self):
        """Load trained model from disk"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                model_data = joblib.load(self.model_path)
                self.model = model_data['model']
                self.pca = model_data.get('pca')
                self.optimal_k = model_data['optimal_k']
                self.cluster_names = model_data['cluster_names']
                self.cluster_characteristics = model_data['cluster_characteristics']
                self.trained = model_data['trained']
                self.training_date = model_data['training_date']
                self.metrics = model_data['metrics']
                
                self.scaler = joblib.load(self.scaler_path)
                
                logger.info(f"Model loaded from {self.model_path}")
                logger.info(f"Clusters: {self.optimal_k}, Names: {list(self.cluster_names.values())}")
                return True
            else:
                logger.warning(f"No saved model found")
                return False
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            return False
    
    def get_model_info(self):
        """Get model information for API response"""
        return {
            'algorithm': 'K-Means Clustering',
            'type': 'Unsupervised Learning (Pet Personality Grouping)',
            'trained': self.trained,
            'training_date': self.training_date.isoformat() if self.training_date else None,
            'metrics': self.metrics,
            'optimal_k': self.optimal_k,
            'cluster_names': list(self.cluster_names.values()) if self.cluster_names else []
        }


# Global instance
_kmeans_instance = None

def get_pet_clusterer():
    """Get singleton K-Means instance"""
    global _kmeans_instance
    if _kmeans_instance is None:
        _kmeans_instance = PetClusterer()
        _kmeans_instance.load_model()  # Try to load existing model
    return _kmeans_instance
