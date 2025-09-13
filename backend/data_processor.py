import pandas as pd
import numpy as np
from typing import List, Dict, Any
import re
from datetime import datetime

class OmicronDataProcessor:
    def __init__(self, csv_path: str = "omicron_2025.csv"):
        """Initialize the data processor with omicron CSV data."""
        self.csv_path = csv_path
        self.data = None
        self.load_data()
    
    def load_data(self):
        """Load and preprocess the omicron CSV data."""
        try:
            self.data = pd.read_csv(self.csv_path)
            self.preprocess_data()
            print(f"Loaded {len(self.data)} omicron tweets")
        except Exception as e:
            print(f"Error loading data: {e}")
            self.data = pd.DataFrame()
    
    def preprocess_data(self):
        """Clean and preprocess the data."""
        if self.data.empty:
            return
        
        # Convert column names to lowercase for consistency
        self.data.columns = self.data.columns.str.lower()
        
        # Handle common column name variations
        column_mapping = {
            'tweet': 'text',
            'content': 'text',
            'message': 'text',
            'created_at': 'date',
            'timestamp': 'date',
            'time': 'date'
        }
        
        for old_col, new_col in column_mapping.items():
            if old_col in self.data.columns and new_col not in self.data.columns:
                self.data.rename(columns={old_col: new_col}, inplace=True)
        
        # Clean text data if available
        if 'text' in self.data.columns:
            self.data['text'] = self.data['text'].astype(str)
            self.data['text_clean'] = self.data['text'].apply(self.clean_text)
        
        # Process dates if available
        if 'date' in self.data.columns:
            self.data['date'] = pd.to_datetime(self.data['date'], errors='coerce')
    
    def clean_text(self, text: str) -> str:
        """Clean tweet text."""
        if pd.isna(text):
            return ""
        
        # Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        # Remove user mentions and hashtags symbols
        text = re.sub(r'@\w+|#', '', text)
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def search_tweets(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for tweets containing specific keywords."""
        if self.data.empty:
            return []
        
        # Convert query to lowercase for case-insensitive search
        query_lower = query.lower()
        
        # Search in text column if available
        if 'text' in self.data.columns:
            mask = self.data['text'].str.lower().str.contains(query_lower, na=False)
            results = self.data[mask].head(limit)
        else:
            # Search in all string columns
            mask = pd.Series([False] * len(self.data))
            for col in self.data.select_dtypes(include=['object']).columns:
                mask |= self.data[col].astype(str).str.lower().str.contains(query_lower, na=False)
            results = self.data[mask].head(limit)
        
        return results.to_dict('records')
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get basic statistics about the omicron data."""
        if self.data.empty:
            return {"error": "No data available"}
        
        stats = {
            "total_tweets": len(self.data),
            "columns": list(self.data.columns),
            "date_range": None,
            "sample_tweet": None
        }
        
        # Date statistics
        if 'date' in self.data.columns:
            valid_dates = self.data['date'].dropna()
            if not valid_dates.empty:
                stats["date_range"] = {
                    "start": valid_dates.min().strftime("%Y-%m-%d"),
                    "end": valid_dates.max().strftime("%Y-%m-%d")
                }
        
        # Sample tweet
        if 'text' in self.data.columns:
            sample_tweets = self.data['text'].dropna()
            if not sample_tweets.empty:
                stats["sample_tweet"] = sample_tweets.iloc[0][:200] + "..." if len(sample_tweets.iloc[0]) > 200 else sample_tweets.iloc[0]
        
        return stats
    
    def get_topic_summary(self, topic: str) -> str:
        """Get a summary of tweets related to a specific topic."""
        tweets = self.search_tweets(topic, limit=50)
        
        if not tweets:
            return f"No tweets found related to '{topic}'"
        
        # Extract text content
        texts = []
        for tweet in tweets:
            if 'text' in tweet and tweet['text']:
                texts.append(str(tweet['text']))
            elif 'text_clean' in tweet and tweet['text_clean']:
                texts.append(str(tweet['text_clean']))
        
        if not texts:
            return f"Found {len(tweets)} tweets about '{topic}' but no readable text content"
        
        # Create summary
        summary = f"Found {len(tweets)} tweets about '{topic}':\n\n"
        
        # Show first few tweets as examples
        for i, text in enumerate(texts[:3]):
            summary += f"Example {i+1}: {text[:150]}...\n\n"
        
        return summary
    
    def analyze_sentiment_keywords(self) -> Dict[str, int]:
        """Analyze basic sentiment keywords in the data."""
        if self.data.empty or 'text' not in self.data.columns:
            return {}
        
        # Define keyword categories
        positive_keywords = ['good', 'better', 'recovered', 'healing', 'hope', 'positive', 'mild']
        negative_keywords = ['bad', 'worse', 'sick', 'severe', 'death', 'fear', 'worried', 'negative']
        symptom_keywords = ['fever', 'cough', 'tired', 'headache', 'loss', 'taste', 'smell', 'sore', 'throat']
        
        # Count occurrences
        keyword_counts = {}
        all_text = ' '.join(self.data['text'].astype(str).str.lower())
        
        for keyword in positive_keywords + negative_keywords + symptom_keywords:
            keyword_counts[keyword] = all_text.count(keyword)
        
        return keyword_counts
