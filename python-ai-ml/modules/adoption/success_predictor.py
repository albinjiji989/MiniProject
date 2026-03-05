"""
XGBoost Success Predictor for Pet Adoption
Predicts probability of successful adoption based on user-pet compatibility
Uses Gradient Boosting for high accuracy classification
"""

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support,
    roc_auc_score, confusion_matrix, classification_report
)
import joblib
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class SuccessPredictor:
    """
    XGBoost-based predictor for adoption success
    Predicts whether a user-pet match will result in successful long-term adoption
    """
    
    def __init__(self):
        """Initialize XGBoost classifier"""
        self.model = None
        self.scaler = StandardScaler()
        self.encoders = {}
        self.feature_names = []
        self.feature_importance = []
        self.model_path = 'models/adoption_xgboost_model.pkl'
        self.scaler_path = 'models/adoption_scaler.pkl'
        self.encoders_path = 'models/adoption_encoders.pkl'
        self.trained = False
        self.training_date = None
        self.metrics = {}
    
    @staticmethod
    def _safe_num(value, default=0.0):
        """Safely convert any value to a float number (handles MongoDB data quirks)"""
        if value is None:
            return float(default)
        if isinstance(value, bool):
            return 1.0 if value else 0.0
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            # Handle 'true'/'false'/'yes'/'no' strings
            low = value.strip().lower()
            if low in ('true', 'yes'):
                return 1.0
            if low in ('false', 'no'):
                return 0.0
            try:
                return float(value)
            except (ValueError, TypeError):
                return float(default)
        # For lists, dicts, or any complex types - return default
        return float(default)
    
    @staticmethod
    def _safe_bool(value, default=False):
        """Safely convert any value to boolean"""
        if value is None:
            return default
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return value > 0
        if isinstance(value, str):
            return value.strip().lower() in ('true', 'yes', '1')
        return default
        
    def engineer_features(self, user_profile, pet_profile, content_match_score):
        """
        Engineer features from user and pet profiles.
        Uses _safe_num/_safe_bool for robust handling of real MongoDB data.
        
        Args:
            user_profile: User's adoption profile
            pet_profile: Pet's compatibility profile
            content_match_score: Score from content-based matching
            
        Returns:
            numpy array of features
        """
        # Ensure inputs are dicts
        if not isinstance(user_profile, dict):
            user_profile = {}
        if not isinstance(pet_profile, dict):
            pet_profile = {}
        
        features = {}
        
        # === USER FEATURES ===
        # Living situation
        home_type_map = {'apartment': 1, 'house': 2, 'farm': 3, 'condo': 1.5}
        features['homeType_encoded'] = home_type_map.get(str(user_profile.get('homeType', 'house')).lower(), 2.0)
        features['homeSize'] = self._safe_num(user_profile.get('homeSize'), 1000)
        features['hasYard'] = 1.0 if self._safe_bool(user_profile.get('hasYard'), False) else 0.0
        # yardSize in MongoDB is a string enum: 'none', 'small', 'medium', 'large'
        yard_size_map = {'none': 0, 'small': 100, 'medium': 300, 'large': 800}
        raw_yard = user_profile.get('yardSize', 'none')
        features['yardSize'] = yard_size_map.get(str(raw_yard).lower(), 0.0) if isinstance(raw_yard, str) else self._safe_num(raw_yard, 0)
        
        # Lifestyle
        features['activityLevel'] = self._safe_num(user_profile.get('activityLevel'), 3)
        work_schedule_map = {'full_time': 1, 'part_time': 2, 'remote': 3, 'home_all_day': 4, 'retired': 4, 'frequent_travel': 1, 'unemployed': 5}
        features['workSchedule_encoded'] = work_schedule_map.get(str(user_profile.get('workSchedule', 'full_time')).lower(), 1.0)
        features['hoursAlonePerDay'] = self._safe_num(user_profile.get('hoursAlonePerDay'), 8)
        
        # Experience
        exp_map = {'beginner': 1, 'first_time': 1, 'some_experience': 2, 'intermediate': 2, 'experienced': 3, 'advanced': 3, 'expert': 4}
        features['experienceLevel_encoded'] = exp_map.get(str(user_profile.get('experienceLevel', 'beginner')).lower(), 1.0)
        # previousPets can be an array of species strings in MongoDB (e.g. ['dog', 'cat'])
        raw_prev_pets = user_profile.get('previousPets', 0)
        features['previousPets'] = float(len(raw_prev_pets)) if isinstance(raw_prev_pets, list) else self._safe_num(raw_prev_pets, 0)
        
        # Family
        features['hasChildren'] = 1.0 if self._safe_bool(user_profile.get('hasChildren'), False) else 0.0
        features['hasOtherPets'] = 1.0 if self._safe_bool(user_profile.get('hasOtherPets'), False) else 0.0
        
        # Budget
        features['monthlyBudget'] = self._safe_num(user_profile.get('monthlyBudget'), 100)
        features['maxAdoptionFee'] = self._safe_num(user_profile.get('maxAdoptionFee'), 500)
        
        # === PET FEATURES ===
        # Size & Energy
        size_map = {'small': 1, 'medium': 2, 'large': 3}
        features['petSize_encoded'] = size_map.get(str(pet_profile.get('size', 'medium')).lower(), 2.0)
        features['energyLevel'] = self._safe_num(pet_profile.get('energyLevel'), 3)
        
        # Training
        training_map = {'low': 1, 'moderate': 2, 'high': 3}
        features['trainingNeeds_encoded'] = training_map.get(str(pet_profile.get('trainingNeeds', 'moderate')).lower(), 2.0)
        trained_map = {'untrained': 1, 'basic': 2, 'intermediate': 3, 'advanced': 4}
        features['trainedLevel_encoded'] = trained_map.get(str(pet_profile.get('trainedLevel', 'untrained')).lower(), 1.0)
        
        # Social scores
        features['childFriendlyScore'] = self._safe_num(pet_profile.get('childFriendlyScore'), 5)
        features['petFriendlyScore'] = self._safe_num(pet_profile.get('petFriendlyScore'), 5)
        features['strangerFriendlyScore'] = self._safe_num(pet_profile.get('strangerFriendlyScore'), 5)
        
        # Living requirements
        features['needsYard'] = 1.0 if self._safe_bool(pet_profile.get('needsYard'), False) else 0.0
        features['canLiveInApartment'] = 1.0 if self._safe_bool(pet_profile.get('canLiveInApartment'), True) else 0.0
        features['canBeLeftAlone'] = 1.0 if self._safe_bool(pet_profile.get('canBeLeftAlone'), True) else 0.0
        features['maxHoursAlone'] = self._safe_num(pet_profile.get('maxHoursAlone'), 8)
        
        # Care requirements
        features['estimatedMonthlyCost'] = self._safe_num(pet_profile.get('estimatedMonthlyCost'), 100)
        noise_map = {'quiet': 1, 'moderate': 2, 'vocal': 3}
        features['noiseLevel_encoded'] = noise_map.get(str(pet_profile.get('noiseLevel', 'moderate')).lower(), 2.0)
        
        # === INTERACTION FEATURES ===
        features['contentMatchScore'] = self._safe_num(content_match_score, 50)
        
        # Calculated compatibility features
        features['activityMatch'] = 5.0 - abs(features['activityLevel'] - features['energyLevel'])
        features['budgetMatch'] = 1.0 if features['monthlyBudget'] >= features['estimatedMonthlyCost'] else 0.0
        features['yardMatch'] = 1.0 if (not features['needsYard'] or features['hasYard']) else 0.0
        features['childSafety'] = features['childFriendlyScore'] if features['hasChildren'] else 10.0
        features['petCompatibility'] = features['petFriendlyScore'] if features['hasOtherPets'] else 10.0
        features['aloneTimeMatch'] = 1.0 if features['hoursAlonePerDay'] <= features['maxHoursAlone'] else 0.0
        
        # Convert to list in consistent order - ALL values guaranteed to be float
        feature_list = [float(features[key]) for key in sorted(features.keys())]
        self.feature_names = sorted(features.keys())
        
        return np.array(feature_list, dtype=np.float64).reshape(1, -1)
    
    def prepare_training_data(self, training_data):
        """
        Prepare training data from adoption records
        
        Args:
            training_data: List of adoption records with outcomes
            
        Returns:
            X, y: Feature matrix and target labels
        """
        X_list = []
        y_list = []
        
        for record in training_data:
            try:
                # Extract features
                features = self.engineer_features(
                    record.get('userProfile', {}),
                    record.get('petProfile', {}),
                    record.get('matchScore', 50)
                )
                
                # Target: successful adoption (1) or returned (0)
                target = 1 if record.get('successfulAdoption') else 0
                
                X_list.append(features[0])
                y_list.append(target)
                
            except Exception as e:
                logger.warning(f"Skipping record due to error: {str(e)}")
                continue
        
        X = np.array(X_list)
        y = np.array(y_list)
        
        logger.info(f"Prepared {len(X)} training samples")
        logger.info(f"Successful: {sum(y)}, Failed: {len(y) - sum(y)}")
        
        return X, y
    
    def train(self, training_data, test_size=0.2):
        """
        Train XGBoost model
        
        Args:
            training_data: List of adoption records
            test_size: Fraction for testing
            
        Returns:
            dict: Training metrics
        """
        try:
            logger.info("Starting XGBoost training...")
            
            # Prepare data
            X, y = self.prepare_training_data(training_data)
            
            if len(X) < 10:
                raise ValueError(f"Not enough training data. Need at least 10 samples, got {len(X)}")
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42, stratify=y if len(np.unique(y)) > 1 else None
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Initialize XGBoost
            self.model = xgb.XGBClassifier(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                objective='binary:logistic',
                eval_metric='logloss',
                random_state=42,
                use_label_encoder=False
            )
            
            # Train model
            logger.info("Training XGBoost model...")
            self.model.fit(
                X_train_scaled, y_train,
                eval_set=[(X_test_scaled, y_test)],
                verbose=False
            )
            
            # Predictions
            y_pred = self.model.predict(X_test_scaled)
            y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='binary')
            
            # AUC-ROC
            try:
                auc_roc = roc_auc_score(y_test, y_pred_proba)
            except:
                auc_roc = 0.5
            
            # Confusion matrix
            cm = confusion_matrix(y_test, y_pred)
            
            # Cross-validation
            logger.info("Performing 5-fold cross-validation...")
            cv_scores = cross_val_score(self.model, X_train_scaled, y_train, cv=min(5, len(X_train)//2), scoring='accuracy')
            
            # Feature importance
            self.feature_importance = [
                {
                    'feature': self.feature_names[i],
                    'importance': float(importance),
                    'rank': i + 1
                }
                for i, importance in enumerate(self.model.feature_importances_)
            ]
            self.feature_importance.sort(key=lambda x: x['importance'], reverse=True)
            
            # Update ranks
            for i, feat in enumerate(self.feature_importance):
                feat['rank'] = i + 1
            
            self.metrics = {
                'accuracy': float(accuracy * 100),
                'precision': float(precision * 100),
                'recall': float(recall * 100),
                'f1Score': float(f1 * 100),
                'aucRoc': float(auc_roc),
                'confusionMatrix': cm.tolist(),
                'cvScores': cv_scores.tolist(),
                'cvMean': float(cv_scores.mean() * 100),
                'cvStd': float(cv_scores.std() * 100),
                'trainingDataCount': len(X),
                'testDataCount': len(X_test)
            }
            
            self.trained = True
            self.training_date = datetime.now()
            
            logger.info(f"XGBoost Training Complete!")
            logger.info(f"Accuracy: {accuracy*100:.2f}%, Precision: {precision*100:.2f}%, Recall: {recall*100:.2f}%")
            logger.info(f"F1: {f1*100:.2f}%, AUC-ROC: {auc_roc:.4f}")
            logger.info(f"Cross-validation: {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")
            
            # Save model
            self.save_model()
            
            return self.metrics
            
        except Exception as e:
            logger.error(f"Error training XGBoost model: {str(e)}")
            raise
    
    def predict_success_probability(self, user_profile, pet_profile, content_match_score):
        """
        Predict probability of successful adoption
        
        Args:
            user_profile: User's adoption profile
            pet_profile: Pet's compatibility profile
            content_match_score: Score from content-based matching
            
        Returns:
            dict: Success probability and confidence
        """
        if not self.trained:
            # Return neutral prediction if not trained
            logger.warning("Model not trained, returning neutral prediction")
            return {
                'successProbability': 75.0,
                'confidence': 50.0,
                'trained': False
            }
        
        try:
            # Engineer features
            features = self.engineer_features(user_profile, pet_profile, content_match_score)
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Predict probability
            proba = self.model.predict_proba(features_scaled)[0]
            success_prob = proba[1] * 100  # Probability of class 1 (success)
            
            # Confidence based on how decisive the prediction is
            # High confidence when probability is close to 0 or 100
            confidence = abs(success_prob - 50) * 2
            
            return {
                'successProbability': float(success_prob),
                'failureProbability': float(proba[0] * 100),
                'confidence': float(confidence),
                'trained': True
            }
            
        except Exception as e:
            logger.error(f"Error predicting success: {str(e)}")
            return {
                'successProbability': 75.0,
                'confidence': 50.0,
                'trained': True,
                'error': str(e)
            }
    
    def get_feature_importance(self, top_n=10):
        """Get top N most important features"""
        return self.feature_importance[:top_n]
    
    def save_model(self):
        """Save trained model and scalers"""
        try:
            os.makedirs('models', exist_ok=True)
            
            model_data = {
                'model': self.model,
                'trained': self.trained,
                'training_date': self.training_date,
                'metrics': self.metrics,
                'feature_names': self.feature_names,
                'feature_importance': self.feature_importance
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
                self.trained = model_data['trained']
                self.training_date = model_data['training_date']
                self.metrics = model_data['metrics']
                self.feature_names = model_data.get('feature_names', [])
                self.feature_importance = model_data.get('feature_importance', [])
                
                self.scaler = joblib.load(self.scaler_path)
                
                logger.info(f"Model loaded from {self.model_path}")
                logger.info(f"Trained on: {self.training_date}, Accuracy: {self.metrics.get('accuracy', 0):.2f}%")
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
            'algorithm': 'XGBoost (Extreme Gradient Boosting)',
            'type': 'Classification (Success Prediction)',
            'trained': self.trained,
            'training_date': self.training_date.isoformat() if self.training_date else None,
            'metrics': self.metrics,
            'feature_count': len(self.feature_names),
            'top_features': self.get_feature_importance(5)
        }


# Global instance
_xgboost_instance = None

def get_success_predictor():
    """Get singleton XGBoost instance"""
    global _xgboost_instance
    if _xgboost_instance is None:
        _xgboost_instance = SuccessPredictor()
        _xgboost_instance.load_model()  # Try to load existing model
    return _xgboost_instance
