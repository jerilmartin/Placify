"""
ML Placement Risk Predictor
Scikit-Learn RandomForest model to predict placement probability

The production path trains only from real student outcomes supplied by the API.
"""

import numpy as np
import logging
import os
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "placement_predictor_v2.pkl")


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
    - work_experience_count: Number of recorded roles
    - active_backlogs: Current unresolved backlogs
    - mock_interview_score: Average completed mock-interview score
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
        "active_backlogs",
        "mock_interview_score",
    ]

    def __init__(self):
        self.model = None
        self._trained = False

    def extract_features(self, profile: dict) -> List[float]:
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
            float(profile.get("active_backlogs") or 0),
            (
                float(profile.get("mock_interview_score") or 0) / 100
                if float(profile.get("mock_interview_score") or 0) > 10
                else float(profile.get("mock_interview_score") or 0) / 10
            ),
        ]

    def train(self, X, y) -> None:
        """Train the model from labeled historical placement records."""
        try:
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.preprocessing import StandardScaler
            from sklearn.pipeline import Pipeline
            from sklearn.model_selection import cross_val_score
            import joblib

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

            class_counts = np.bincount(np.asarray(y, dtype=int))
            cv_folds = min(5, int(class_counts.min())) if len(class_counts) > 1 else 0
            if cv_folds >= 2:
                scores = cross_val_score(pipeline, X, y, cv=cv_folds, scoring="accuracy")
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

    def is_ready(self) -> bool:
        """Return whether a trained model is in memory or available on disk."""
        return self._trained or self.load()

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
                raise RuntimeError("No historical placement model has been trained yet")

        features = np.array([self.extract_features(profile)])

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
                "raw_features": dict(zip(self.FEATURE_NAMES, self.extract_features(profile))),
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
