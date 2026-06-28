"""
ML Placement Risk Predictor
Scikit-Learn RandomForest model to predict placement probability

Usage:
    predictor = PlacementPredictor()
    predictor.train()  # with sample data
    result = predictor.predict(student_profile)
"""

import numpy as np
import logging
import os
import json
from typing import Optional, List, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "placement_predictor.pkl")


class PlacementPredictor:
    """
    Random Forest classifier to predict student placement probability.
    
    Features used:
    - skills_count: Number of skills listed
    - cgpa: CGPA (normalized to 0-10)
    - projects_count: Number of projects
    - has_internship: Boolean (0/1)
    - profile_completion: Profile strength %
    - has_github: Boolean
    - has_linkedin: Boolean
    - graduation_year: Proximity to graduation
    """

    FEATURE_NAMES = [
        "skills_count",
        "cgpa",
        "projects_count",
        "has_internship",
        "profile_completion",
        "has_github",
        "has_linkedin",
        "work_experience_count",
    ]

    def __init__(self):
        self.model = None
        self._trained = False

    def _extract_features(self, profile: dict) -> List[float]:
        """Extract ML features from student profile dict"""
        skills = profile.get("skills") or []
        projects = profile.get("projects") or []
        work_exp = profile.get("work_experience") or []

        return [
            len(skills),
            float(profile.get("cgpa") or 0),
            len(projects),
            1.0 if len(work_exp) > 0 else 0.0,
            float(profile.get("profile_completion") or 0) / 100,
            1.0 if profile.get("github_url") else 0.0,
            1.0 if profile.get("linkedin_url") else 0.0,
            len(work_exp),
        ]

    def _generate_synthetic_data(self, n_samples: int = 1000):
        """
        Generate synthetic training data for initial model training.
        In production, replace with real historical placement data.
        """
        np.random.seed(42)

        X = []
        y = []

        for _ in range(n_samples):
            skills_count = np.random.randint(0, 20)
            cgpa = np.random.uniform(4.0, 10.0)
            projects_count = np.random.randint(0, 8)
            has_internship = np.random.binomial(1, 0.4)
            profile_completion = np.random.uniform(0.2, 1.0)
            has_github = np.random.binomial(1, 0.6)
            has_linkedin = np.random.binomial(1, 0.5)
            work_exp = np.random.randint(0, 3)

            features = [
                skills_count, cgpa, projects_count, has_internship,
                profile_completion, has_github, has_linkedin, work_exp
            ]

            # Placement probability based on features
            score = (
                skills_count * 0.3 +
                (cgpa - 4) / 6 * 3.0 +
                projects_count * 0.4 +
                has_internship * 1.5 +
                profile_completion * 2.0 +
                has_github * 0.5 +
                has_linkedin * 0.3 +
                work_exp * 0.5
            )
            placed = 1 if score + np.random.normal(0, 0.5) > 4.0 else 0

            X.append(features)
            y.append(placed)

        return np.array(X), np.array(y)

    def train(self, X=None, y=None) -> None:
        """
        Train the placement prediction model.
        If no data provided, uses synthetic data for demonstration.
        """
        try:
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.preprocessing import StandardScaler
            from sklearn.pipeline import Pipeline
            from sklearn.model_selection import cross_val_score
            import joblib

            if X is None or y is None:
                logger.info("Using synthetic training data (replace with real data for production)")
                X, y = self._generate_synthetic_data()

            pipeline = Pipeline([
                ("scaler", StandardScaler()),
                ("clf", RandomForestClassifier(
                    n_estimators=100,
                    max_depth=8,
                    min_samples_split=5,
                    random_state=42,
                    class_weight="balanced",
                ))
            ])

            # Cross-validate
            scores = cross_val_score(pipeline, X, y, cv=5, scoring="accuracy")
            logger.info(f"CV Accuracy: {scores.mean():.3f} ± {scores.std():.3f}")

            pipeline.fit(X, y)
            self.model = pipeline
            self._trained = True

            # Save model
            os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
            joblib.dump(pipeline, MODEL_PATH)
            logger.info(f"✅ Model saved to {MODEL_PATH}")

        except ImportError:
            logger.error("scikit-learn not installed. Run: pip install scikit-learn joblib")
            raise

    def load(self) -> bool:
        """Load trained model from disk"""
        if not os.path.exists(MODEL_PATH):
            return False
        try:
            import joblib
            self.model = joblib.load(MODEL_PATH)
            self._trained = True
            logger.info(f"✅ Placement predictor loaded from {MODEL_PATH}")
            return True
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False

    def predict(self, profile: dict) -> Dict[str, Any]:
        """
        Predict placement probability for a student.
        
        Returns:
            {
                "probability": 0-100,
                "risk_level": "Low"/"Medium"/"High",
                "confidence": 0-100,
                "feature_importance": {...}
            }
        """
        if not self._trained:
            if not self.load():
                logger.info("Model not trained. Training with synthetic data...")
                self.train()

        features = np.array([self._extract_features(profile)])

        try:
            proba = self.model.predict_proba(features)[0]
            placement_probability = round(proba[1] * 100, 1)
            confidence = round(max(proba) * 100, 1)

            if placement_probability >= 70:
                risk_level = "Low"
            elif placement_probability >= 45:
                risk_level = "Medium"
            else:
                risk_level = "High"

            # Feature importance
            try:
                rf = self.model.named_steps["clf"]
                importances = dict(zip(self.FEATURE_NAMES, rf.feature_importances_))
            except Exception:
                importances = {}

            return {
                "probability": placement_probability,
                "risk_level": risk_level,
                "confidence": confidence,
                "feature_importance": importances,
                "raw_features": dict(zip(self.FEATURE_NAMES, self._extract_features(profile))),
            }
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {"probability": 50.0, "risk_level": "Medium", "confidence": 0}


# Global singleton
_predictor: Optional[PlacementPredictor] = None


def get_predictor() -> PlacementPredictor:
    global _predictor
    if _predictor is None:
        _predictor = PlacementPredictor()
    return _predictor


if __name__ == "__main__":
    # Quick training test
    logging.basicConfig(level=logging.INFO)
    predictor = PlacementPredictor()
    predictor.train()

    sample = {
        "skills": ["Python", "ML", "SQL", "FastAPI", "React"],
        "cgpa": 8.2,
        "projects": [{"name": "P1"}, {"name": "P2"}, {"name": "P3"}],
        "work_experience": [{"company": "Startup"}],
        "profile_completion": 85,
        "github_url": "https://github.com/user",
        "linkedin_url": "https://linkedin.com/in/user",
    }
    result = predictor.predict(sample)
    print(f"\nPlacement Probability: {result['probability']}%")
    print(f"Risk Level: {result['risk_level']}")
    print(f"Confidence: {result['confidence']}%")
