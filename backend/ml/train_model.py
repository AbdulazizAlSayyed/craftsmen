import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
import joblib
import os

def train_model():
    # Load Kaggle dataset
    main_df = pd.read_csv('ml/data/train.csv')
    main_df = main_df[['comment_text', 'toxic']]
    main_df.columns = ['text', 'label']
    main_df['label'] = (main_df['label'] >= 0.5).astype(int)

    # Load your cleaned custom data
    manual_df = pd.read_csv('ml/data/sample_data.csv')
    manual_df['label'] = manual_df['label'].astype(int)

    # Combine and shuffle both datasets
    df = pd.concat([main_df, manual_df], ignore_index=True)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        df['text'], df['label'], test_size=0.2, random_state=42
    )

    # Build pipeline
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 2),
            stop_words='english'
        )),
        ('clf', LogisticRegression(
            class_weight='balanced',
            max_iter=1000,
            C=0.3
        ))
    ])

    # Train & evaluate
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred))

    # Save model
    os.makedirs('ml/models', exist_ok=True)
    joblib.dump(pipeline, 'ml/models/model.joblib')
    print("✅ Model trained and saved!")

if __name__ == '__main__':
    train_model()
