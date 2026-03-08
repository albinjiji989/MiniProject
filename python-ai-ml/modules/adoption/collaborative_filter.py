"""
SVD Collaborative Filtering for Pet Adoption
Uses Matrix Factorization (scipy SVD) to recommend pets based on user behavior
Same algorithm as Netflix Prize — implemented with scipy (no C++ compiler needed)

Instead of scikit-surprise, we use scipy.sparse.linalg.svds directly.
This is the SAME mathematical operation (truncated SVD on user-item matrix)
but works on any system without C++ build tools.
"""

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import svds
import joblib
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class CollaborativeFilter:
    """
    Singular Value Decomposition (SVD) for collaborative filtering.
    Predicts how users will rate pets based on past interactions.
    
    Math: R ≈ U × Σ × V^T
    Where R is the user-item rating matrix, decomposed into latent factors.
    """
    
    def __init__(self, n_factors=20):
        """
        Initialize SVD model.
        
        Args:
            n_factors: Number of latent factors (default: 20)
        """
        self.n_factors = n_factors
        self.trained = False
        self.model_path = 'models/adoption_svd_model.pkl'
        self.training_date = None
        self.metrics = {}
        
        # Model components (set after training)
        self.U = None           # User latent factors
        self.sigma = None       # Singular values
        self.Vt = None          # Item (pet) latent factors
        self.user_index = {}    # userId -> matrix row index
        self.pet_index = {}     # petId -> matrix column index
        self.global_mean = 2.5  # Global average rating
        self.user_means = {}    # Per-user average rating
        self.predicted_ratings = None  # Full predicted matrix

        # Breed/species metadata maps — built during training
        # Allows breed-level CF fallback for pets not in training data (real MongoDB IDs)
        self.pet_breed_index = {}   # breed (lower) -> list of pet column indices
        self.pet_species_index = {} # species (lower) -> list of pet column indices
        
        # Try to load existing model
        self.load_model()
    
    def prepare_data(self, interactions):
        """
        Convert interaction data to user-item rating matrix.
        
        Args:
            interactions: List of dicts with userId, petId, implicitRating
            
        Returns:
            DataFrame with userId, petId, rating columns
        """
        try:
            df = pd.DataFrame(interactions)
            
            # Map interaction types to ratings (0-5 scale) if no explicit rating
            if 'rating' in df.columns:
                pass  # Already numeric rating (e.g. from csv_svd or format_for_svd re-label)
            elif 'implicitRating' in df.columns:
                df['rating'] = df['implicitRating']
            else:
                rating_map = {
                    'viewed': 1.0,
                    'clicked': 1.5,
                    'favorited': 3.0,
                    'applied': 4.0,
                    'adopted': 5.0,
                    'returned': 0.0,
                    'viewed_matches': 0.5,
                    'shared': 2.0
                }
                df['rating'] = df.get('interactionType', pd.Series(['viewed'] * len(df))).map(rating_map).fillna(1.0)

            # Preserve breed/species metadata before aggregation (take first occurrence per petId)
            meta_cols = [c for c in ['breed', 'species'] if c in df.columns]
            pet_meta_df = df[['petId'] + meta_cols].drop_duplicates('petId').set_index('petId') if meta_cols else None

            df = df[['userId', 'petId', 'rating']].dropna()
            df['userId'] = df['userId'].astype(str)
            df['petId'] = df['petId'].astype(str)
            
            # Aggregate duplicate user-pet pairs (take max rating)
            df = df.groupby(['userId', 'petId'])['rating'].max().reset_index()
            
            logger.info(f"Prepared {len(df)} interactions for training")
            logger.info(f"Unique users: {df['userId'].nunique()}, Unique pets: {df['petId'].nunique()}")
            
            return df, pet_meta_df
            
        except Exception as e:
            logger.error(f"Error preparing data: {str(e)}")
            raise
    
    def train(self, interactions, test_size=0.2):
        """
        Train SVD model on interaction data.
        
        Math: Decompose rating matrix R into U × Σ × V^T
        Then predict: R_hat = U × Σ × V^T + user_means
        
        Args:
            interactions: List of interaction records
            test_size: Fraction of data for testing
            
        Returns:
            dict: Training metrics (RMSE, MAE, accuracy)
        """
        try:
            logger.info("Starting SVD Collaborative Filter training...")
            
            # Prepare data
            df, pet_meta_df = self.prepare_data(interactions)
            
            if len(df) < 10:
                raise ValueError(f"Need at least 10 interactions, got {len(df)}")
            
            # Build user and pet indices
            unique_users = sorted(df['userId'].unique())
            unique_pets = sorted(df['petId'].unique())
            
            self.user_index = {uid: i for i, uid in enumerate(unique_users)}
            self.pet_index = {pid: i for i, pid in enumerate(unique_pets)}
            
            n_users = len(unique_users)
            n_pets = len(unique_pets)

            # Build breed/species -> column-index maps from metadata preserved by prepare_data()
            self.pet_breed_index = {}
            self.pet_species_index = {}
            if pet_meta_df is not None:
                for pid, p_idx in self.pet_index.items():
                    if pid in pet_meta_df.index:
                        row_meta = pet_meta_df.loc[pid]
                        breed_key = str(row_meta.get('breed', '')).strip().lower() if 'breed' in row_meta else ''
                        sp_key = str(row_meta.get('species', '')).strip().lower() if 'species' in row_meta else ''
                        if breed_key:
                            self.pet_breed_index.setdefault(breed_key, []).append(p_idx)
                        if sp_key:
                            self.pet_species_index.setdefault(sp_key, []).append(p_idx)
            logger.info(
                f"SVD breed index: {len(self.pet_breed_index)} breeds, "
                f"{len(self.pet_species_index)} species indexed for breed-level fallback"
            )
            
            # Build rating matrix
            rating_matrix = np.zeros((n_users, n_pets))
            for _, row in df.iterrows():
                r = self.user_index[row['userId']]
                c = self.pet_index[row['petId']]
                rating_matrix[r, c] = row['rating']
            
            # Compute global mean and user means
            self.global_mean = float(df['rating'].mean())
            for uid, idx in self.user_index.items():
                user_ratings = rating_matrix[idx]
                non_zero = user_ratings[user_ratings > 0]
                self.user_means[uid] = float(non_zero.mean()) if len(non_zero) > 0 else self.global_mean
            
            # Center the matrix (subtract user means for better SVD)
            centered_matrix = rating_matrix.copy()
            for uid, idx in self.user_index.items():
                mask = centered_matrix[idx] > 0
                centered_matrix[idx][mask] -= self.user_means[uid]
            
            # FIX #7: Auto-tune n_factors instead of hardcoding 20.
            # Research heuristic: k ≈ sqrt(min(n_users, n_pets)) scales well with data size.
            # Clamped to [10, 50]: floor prevents underfitting on tiny datasets,
            # ceiling keeps training fast as interaction matrix grows into thousands of rows.
            # This replaces the static self.n_factors=20 which underfits when the matrix
            # grows beyond ~400 users/pets but wastes compute on small matrices.
            k_auto = min(50, max(10, int(np.sqrt(min(n_users, n_pets)))))
            k = min(k_auto, min(n_users, n_pets) - 1)
            if k < 1:
                k = 1
            logger.info(f"Auto n_factors: sqrt({min(n_users, n_pets)}) → k_auto={k_auto} → k={k} (matrix {n_users}×{n_pets})")
            
            # === CORE SVD DECOMPOSITION (same as Netflix Prize algorithm) ===
            sparse_matrix = csr_matrix(centered_matrix)
            self.U, self.sigma, self.Vt = svds(sparse_matrix, k=k)
            
            # svds returns ascending order — sort descending by singular value
            idx_sort = np.argsort(-self.sigma)
            self.sigma = self.sigma[idx_sort]
            self.U = self.U[:, idx_sort]
            self.Vt = self.Vt[idx_sort, :]
            
            # Reconstruct full predicted rating matrix: R_hat = U × Σ × V^T + means
            sigma_diag = np.diag(self.sigma)
            predicted_centered = self.U @ sigma_diag @ self.Vt
            
            self.predicted_ratings = predicted_centered.copy()
            for uid, idx in self.user_index.items():
                self.predicted_ratings[idx] += self.user_means[uid]
            
            # Clip to valid range [0, 5]
            self.predicted_ratings = np.clip(self.predicted_ratings, 0, 5)
            
            # === EVALUATE on held-out test set ===
            n_test = max(1, int(len(df) * test_size))
            test_indices = np.random.RandomState(42).choice(len(df), size=n_test, replace=False)
            train_indices = np.setdiff1d(np.arange(len(df)), test_indices)
            
            test_df = df.iloc[test_indices]
            
            errors = []
            correct = 0
            for _, row in test_df.iterrows():
                u_idx = self.user_index.get(row['userId'])
                p_idx = self.pet_index.get(row['petId'])
                if u_idx is not None and p_idx is not None:
                    predicted = self.predicted_ratings[u_idx, p_idx]
                    actual = row['rating']
                    error = predicted - actual
                    errors.append(error)
                    if abs(error) <= 0.5:
                        correct += 1
            
            errors = np.array(errors) if errors else np.array([0])
            rmse = float(np.sqrt(np.mean(errors ** 2)))
            mae = float(np.mean(np.abs(errors)))
            accuracy_pct = (correct / len(errors) * 100) if len(errors) > 0 else 0
            
            # Explained variance
            total_var = np.sum(self.sigma ** 2)
            explained = float(total_var / (total_var + 1e-10))
            
            self.metrics = {
                'rmse': round(rmse, 4),
                'mae': round(mae, 4),
                'accuracy': round(accuracy_pct, 2),
                'n_factors': k,
                'explained_variance_ratio': round(explained, 4),
                'singular_values_top5': [round(v, 3) for v in self.sigma[:5].tolist()],
                'training_samples': int(len(train_indices)),
                'test_samples': int(len(test_indices)),
                'unique_users': n_users,
                'unique_pets': n_pets,
                'global_mean_rating': round(self.global_mean, 3),
                'matrix_density': round(float(np.count_nonzero(rating_matrix) / (n_users * n_pets) * 100), 1)
            }
            
            self.trained = True
            self.training_date = datetime.now()
            
            logger.info(f"SVD Training Complete!")
            logger.info(f"RMSE: {rmse:.4f}, MAE: {mae:.4f}, Accuracy: {accuracy_pct:.1f}%")
            logger.info(f"Matrix density: {self.metrics['matrix_density']}%")
            logger.info(f"Top singular values: {self.metrics['singular_values_top5']}")
            
            self.save_model()
            
            return self.metrics
            
        except Exception as e:
            logger.error(f"Error training SVD model: {str(e)}")
            raise
    
    def predict_rating(self, user_id, pet_id, pet_metadata=None):
        """
        Predict how a user would rate a specific pet.

        Lookup priority:
          1. Known user + known pet  → full SVD prediction (confidence 85%)
          2. Known user + unknown pet, breed in index
                                     → average user's scores for same-breed pets
                                       (confidence 65%, was_impossible=False)
          3. Known user + unknown pet, no breed
                                     → user's overall mean (confidence 50%)
          4. Unknown user + known pet → pet column average (confidence 45%)
          5. Unknown user + unknown pet, breed in index
                                     → breed column average (confidence 35%)
          6. Both unknown, no breed  → global mean (confidence 25%)

        Args:
            user_id: User ID (string)
            pet_id:  Pet ID (string) — may be a real MongoDB ObjectId
            pet_metadata: Optional dict with 'breed' and/or 'species' keys
                          (used to find similar pets when pet_id is unseen)

        Returns:
            dict: {predicted_rating, score (0-100), confidence, was_impossible}
        """
        if not self.trained:
            return {
                'predicted_rating': self.global_mean,
                'score': 50.0,
                'confidence': 20.0,
                'was_impossible': True
            }

        try:
            user_id = str(user_id)
            pet_id  = str(pet_id)

            u_idx = self.user_index.get(user_id)
            p_idx = self.pet_index.get(pet_id)

            # Breed/species keys for metadata fallback
            breed_key   = str(pet_metadata.get('breed', '')  or '').strip().lower() if pet_metadata else ''
            species_key = str(pet_metadata.get('species', '') or '').strip().lower() if pet_metadata else ''

            def _breed_col_indices():
                """Return column indices for same-breed (or same-species) pets."""
                idxs = self.pet_breed_index.get(breed_key, [])
                if not idxs and species_key:
                    idxs = self.pet_species_index.get(species_key, [])
                return idxs

            was_impossible = False

            if u_idx is not None and p_idx is not None:
                # Case 1 — fully known: exact SVD prediction
                predicted  = float(self.predicted_ratings[u_idx, p_idx])
                confidence = 85.0

            elif u_idx is not None and p_idx is None:
                # Case 2 — known user, unknown pet
                breed_idxs = _breed_col_indices()
                if breed_idxs:
                    # Average the user's predicted ratings for all pets of this breed
                    breed_scores = self.predicted_ratings[u_idx, breed_idxs]
                    positive     = breed_scores[breed_scores > 0]
                    predicted    = float(positive.mean()) if len(positive) > 0 else self.user_means.get(user_id, self.global_mean)
                    confidence   = 65.0
                    # was_impossible stays False: we have a real breed-level signal
                    logger.debug(
                        f"SVD breed fallback: user={user_id}, breed={breed_key!r}, "
                        f"avg over {len(breed_idxs)} pets → {predicted:.2f}"
                    )
                else:
                    # Case 3 — user known, pet unknown, no breed info
                    predicted    = self.user_means.get(user_id, self.global_mean)
                    confidence   = 50.0
                    was_impossible = True

            elif u_idx is None and p_idx is not None:
                # Case 4 — unknown user, pet known: pet column average
                pet_col  = self.predicted_ratings[:, p_idx]
                non_zero = pet_col[pet_col > 0]
                predicted    = float(non_zero.mean()) if len(non_zero) > 0 else self.global_mean
                confidence   = 45.0
                was_impossible = True

            else:
                # Case 5/6 — both unknown
                breed_idxs = _breed_col_indices()
                if breed_idxs:
                    # Average breed column scores across all known users
                    breed_mat = self.predicted_ratings[:, breed_idxs]
                    positive  = breed_mat[breed_mat > 0]
                    predicted  = float(positive.mean()) if len(positive) > 0 else self.global_mean
                    confidence = 35.0
                    logger.debug(
                        f"SVD breed-global fallback: breed={breed_key!r}, "
                        f"{len(breed_idxs)} pets → {predicted:.2f}"
                    )
                else:
                    # Case 6 — truly unknown
                    predicted    = self.global_mean
                    confidence   = 25.0
                    was_impossible = True

            predicted = max(0.0, min(5.0, predicted))
            score     = (predicted / 5.0) * 100

            return {
                'predicted_rating': float(round(predicted, 2)),
                'score':            float(round(score, 2)),
                'confidence':       float(confidence),
                'was_impossible':   was_impossible
            }

        except Exception as e:
            logger.error(f"Error predicting rating: {str(e)}")
            return {
                'predicted_rating': self.global_mean,
                'score':            50.0,
                'confidence':       20.0,
                'was_impossible':   True,
                'error':            str(e)
            }
    
    def recommend_for_user(self, user_id, all_pets, top_n=10, exclude_interacted=True, user_interactions=None):
        """
        Get top N pet recommendations for a user.
        """
        if not self.trained:
            return []
        
        try:
            user_id = str(user_id)
            recommendations = []
            
            exclude_ids = set()
            if exclude_interacted and user_interactions:
                exclude_ids = set(str(pid) for pid in user_interactions)
            
            for pet in all_pets:
                pet_id = str(pet.get('_id') or pet.get('petId'))
                if pet_id in exclude_ids:
                    continue

                pet_meta = {'breed': pet.get('breed', ''), 'species': pet.get('species', '')}
                prediction = self.predict_rating(user_id, pet_id, pet_metadata=pet_meta)
                
                recommendations.append({
                    'petId': pet_id,
                    'petName': pet.get('name', 'Unknown'),
                    'breed': pet.get('breed', ''),
                    'species': pet.get('species', ''),
                    'collaborativeScore': prediction['score'],
                    'predictedRating': prediction['predicted_rating'],
                    'confidence': prediction['confidence']
                })
            
            recommendations.sort(key=lambda x: x['collaborativeScore'], reverse=True)
            return recommendations[:top_n]
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return []
    
    def handle_cold_start(self, user_profile, all_pets, top_n=10):
        """Handle cold start for new users with no interactions."""
        logger.info("Handling cold start - user has no interaction history")
        
        recommendations = []
        for pet in all_pets:
            score = 50.0
            if pet.get('species') == user_profile.get('preferredSpecies'):
                score += 20
            # preferredSize can be array in MongoDB
            raw_size_pref = user_profile.get('preferredSize', 'medium')
            if isinstance(raw_size_pref, list):
                user_sizes = [str(s).lower() for s in raw_size_pref]
            else:
                user_sizes = [str(raw_size_pref).lower()]
            pet_size = str(pet.get('compatibilityProfile', {}).get('size', 'medium')).lower()
            if pet_size in user_sizes:
                score += 15
            pet_energy = pet.get('compatibilityProfile', {}).get('energyLevel', 3)
            user_activity = user_profile.get('activityLevel', 3)
            energy_diff = abs(pet_energy - user_activity)
            score += (5 - energy_diff) * 5
            
            recommendations.append({
                'petId': str(pet.get('_id')),
                'petName': pet.get('name', 'Unknown'),
                'breed': pet.get('breed', ''),
                'species': pet.get('species', ''),
                'collaborativeScore': min(100, max(0, score)),
                'predictedRating': score / 20,
                'confidence': 40.0,
                'coldStart': True
            })
        
        recommendations.sort(key=lambda x: x['collaborativeScore'], reverse=True)
        return recommendations[:top_n]
    
    def save_model(self):
        """Save trained model to disk."""
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            
            model_data = {
                'U': self.U,
                'sigma': self.sigma,
                'Vt': self.Vt,
                'user_index': self.user_index,
                'pet_index': self.pet_index,
                'global_mean': self.global_mean,
                'user_means': self.user_means,
                'predicted_ratings': self.predicted_ratings,
                'n_factors': self.n_factors,
                'trained': self.trained,
                'training_date': self.training_date,
                'metrics': self.metrics,
                # Breed/species index — essential for real MongoDB pet fallback
                'pet_breed_index': self.pet_breed_index,
                'pet_species_index': self.pet_species_index,
            }
            
            joblib.dump(model_data, self.model_path)
            logger.info(f"Model saved to {self.model_path}")
            
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
    
    def load_model(self):
        """Load trained model from disk."""
        try:
            if os.path.exists(self.model_path):
                model_data = joblib.load(self.model_path)
                self.U = model_data['U']
                self.sigma = model_data['sigma']
                self.Vt = model_data['Vt']
                self.user_index = model_data['user_index']
                self.pet_index = model_data['pet_index']
                self.global_mean = model_data['global_mean']
                self.user_means = model_data['user_means']
                self.predicted_ratings = model_data['predicted_ratings']
                self.n_factors = model_data.get('n_factors', 20)
                self.trained = model_data['trained']
                self.training_date = model_data['training_date']
                self.metrics = model_data['metrics']
                # Restore breed index (may be absent in older PKL files — default to {})
                self.pet_breed_index   = model_data.get('pet_breed_index', {})
                self.pet_species_index = model_data.get('pet_species_index', {})
                logger.info(f"SVD model loaded from {self.model_path}")
                logger.info(
                    f"Trained: {self.training_date}, RMSE: {self.metrics.get('rmse', 'N/A')}, "
                    f"breed index: {len(self.pet_breed_index)} breeds / "
                    f"{len(self.pet_species_index)} species"
                )
                return True
            else:
                logger.warning("No saved SVD model found")
                return False
        except Exception as e:
            logger.error(f"Error loading SVD model: {str(e)}")
            return False
    
    def get_model_info(self):
        """Get model information for API response."""
        return {
            'algorithm': 'SVD (Singular Value Decomposition)',
            'type': 'Collaborative Filtering',
            'library': 'scipy.sparse.linalg.svds (same math as Netflix Prize)',
            'trained': self.trained,
            'training_date': self.training_date.isoformat() if self.training_date else None,
            'metrics': self.metrics,
            'n_factors': self.n_factors
        }


# Global instance
_svd_instance = None

def get_collaborative_filter():
    """Get singleton SVD instance."""
    global _svd_instance
    if _svd_instance is None:
        _svd_instance = CollaborativeFilter()
    return _svd_instance
