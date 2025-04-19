import os
import sys
import json
import joblib
import numpy as np

class ContentModerator:
    def __init__(self, model_path=None):
        try:
            if model_path is None:
                model_path = os.path.join(
                    os.path.dirname(__file__),
                    'models',
                    'model.joblib'
                )
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found at {model_path}")
            
            self.model = joblib.load(model_path)
            
        except Exception as e:
            print(f"Failed to load model: {str(e)}", file=sys.stderr)
            raise

    def predict_toxicity(self, text):
        """Convert numpy types to native Python types for JSON serialization"""
        if not text or not text.strip():
            return {'probability': 0.0, 'is_toxic': False}
            
        try:
            prob = self.model.predict_proba([text])[0][1]
            return {
                'probability': float(prob),  # Convert numpy.float to Python float
                'is_toxic': bool(prob > 0.5)  # Convert numpy.bool_ to Python bool
            }
        except Exception as e:
            print(f"Prediction error: {e}", file=sys.stderr)
            return {'probability': 1.0, 'is_toxic': True}

if __name__ == '__main__':
    try:
        text = sys.argv[1] if len(sys.argv) > 1 else ""
        moderator = ContentModerator()
        result = moderator.predict_toxicity(text)
        
        # Create a custom JSON encoder to handle numpy types
        class NumpyEncoder(json.JSONEncoder):
            def default(self, obj):
                if isinstance(obj, np.integer):
                    return int(obj)
                elif isinstance(obj, np.floating):
                    return float(obj)
                elif isinstance(obj, np.bool_):
                    return bool(obj)
                return super().default(obj)
        
        print(json.dumps(result, cls=NumpyEncoder))
    except Exception as e:
        print(json.dumps({'error': str(e)}))