
import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

MODEL_PATH = "burnout_model.joblib"

class BurnoutPredictor:
    def __init__(self):
        self.model = None
        self.is_trained = False
        self._train_model()

    def _train_model(self):
        # Try to load existing data
        data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Database", "session_data.csv")
        
        if os.path.exists(data_path):
            try:
                df = pd.read_csv(data_path)
                # print("Training on real data...")
                # Feature Engineering from CSV columns
                # We need features: cognitive_load, focus_score, keystrokes (rate?), mouse (activity?)
                # CSV has: cognitive_load, focus_score, keystroke_rate, mouse_activity, mental_state
                
                features = df[['cognitive_load', 'focus_score', 'keystroke_rate', 'mouse_activity']]
                target = df['mental_state']
                
                # Map target to Risk Level for simpler UI consumption if needed, or just use raw classes
                # Let's keep raw classes but ensure we map them to High/Med/Low in the API
                
                X = features.fillna(0)
                y = target
                
                self.model = RandomForestClassifier(n_estimators=100, random_state=42)
                self.model.fit(X, y)
                self.is_trained = True
                # joblib.dump(self.model, MODEL_PATH) 
                return
            except Exception as e:
                print(f"Failed to train on CSV: {e}")
        
        # Fallback: Synthetic Training Data
        print("Training on synthetic data with Custom Rules...")
        # Generate synthetic data
        # Logic: 
        #   > 600 KPM + Rapid Mouse (>8000px/5s) -> High/Moderate Risk
        
        n_samples = 2000
        cognitive_load = np.random.uniform(0, 100, n_samples)
        focus_score = np.random.uniform(0, 100, n_samples)
        keystrokes = np.random.uniform(0, 800, n_samples) # KPM
        mouse = np.random.uniform(0, 10000, n_samples) # Pixels per 5s
        
        X = pd.DataFrame({
            'cognitive_load': cognitive_load,
            'focus_score': focus_score,
            'keystroke_rate': keystrokes,
            'mouse_activity': mouse
        })
        
        y = []
        for i in range(n_samples):
            k = keystrokes[i]
            m = mouse[i]
            cl = cognitive_load[i]
            
            # Custom Rule for High Activity Burnout
            # CHANGED: Uses OR logic so frequent mouse OR frequent typing triggers it
            # Lowered thresholds for easier testing/demo
            if k > 300 or m > 3000: # High (was 600/7000)
                 y.append("High Risk")
            elif k > 100 or m > 1000: # Moderate (was 400/4000)
                 y.append("Moderate Risk")
            elif cl > 80:
                 y.append("Moderate Risk")
            else:
                 y.append("Low Risk")
                
        self.model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.model.fit(X, y)
        self.is_trained = True

    def predict(self, cognitive_load, focus_score, keystrokes, mouse_dist):
        # Deterministic overrides based on user thresholds
        # Rapid > 7000 or KPM > 600 -> Moderate (or High if very intense)
        if mouse_dist > 12000 or keystrokes > 1000:
             return "High Risk"
        elif mouse_dist > 7000 or keystrokes > 600:
             return "Moderate Risk"

        if not self.is_trained:
            return "Unknown"
            
        # Create DF for single prediction
        input_data = pd.DataFrame([{
            'cognitive_load': cognitive_load,
            'focus_score': focus_score,
            'keystroke_rate': keystrokes,
            'mouse_activity': mouse_dist
        }])
        
        try:
            prediction = self.model.predict(input_data)[0]
            return prediction
        except Exception as e:
            print(f"Prediction error: {e}")
            return "Error"

# Global instance
predictor = BurnoutPredictor()
