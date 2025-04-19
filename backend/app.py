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
    
    if moderator.has_inappropriate_content(text):
        return jsonify({
            "safe": False,
            "message": "Your post contains inappropriate language and cannot be published."
        }), 400
    else:
        return jsonify({"safe": True}), 200

if __name__ == '__main__':
    app.run(port=5001)