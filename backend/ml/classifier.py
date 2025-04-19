from transformers import pipeline
import os

class ContentModerator:
    def __init__(self):
        # Load a pre-trained model for text classification
        self.classifier = pipeline(
            "text-classification",
            model="unitary/toxic-bert",
            tokenizer="unitary/toxic-bert"
        )
    
    def has_inappropriate_content(self, text, threshold=0.8):
        if not text.strip():
            return False
            
        results = self.classifier(text)
        for result in results:
            if result['label'] in ['toxic', 'obscene', 'insult', 'threat'] and result['score'] > threshold:
                return True
        return False