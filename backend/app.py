from flask import Flask, request, jsonify
from ml.classifier import ContentModerator
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
moderator = ContentModerator()

@app.route('/api/check-content', methods=['POST'])
def check_content():
    data = request.get_json()
    text = data.get('text', '')
    
    prob, is_toxic = moderator.predict_toxicity(text)
    
    if is_toxic:
        return jsonify({
            "safe": False,
            "probability": float(prob),
            "message": "Content contains inappropriate language"
        }), 400
    
    return jsonify({
        "safe": True,
        "probability": float(prob),
        "message": "Content is appropriate"
    }), 200

if __name__ == '__main__':
    app.run(port=5001)