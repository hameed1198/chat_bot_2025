import requests
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key exists: {bool(api_key)}")
print(f"API Key starts with: {api_key[:10] if api_key else 'None'}")

if api_key:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{
                "text": "I am suffering with fever. What should I do?"
            }]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 500,
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.text[:500]}...")
        
        if response.status_code == 200:
            data = response.json()
            if 'candidates' in data and len(data['candidates']) > 0:
                ai_response = data['candidates'][0]['content']['parts'][0]['text']
                print("SUCCESS!")
                print("AI Response:", ai_response[:200])
            else:
                print("No candidates found in response")
        else:
            print("Error:", response.text)
            
    except Exception as e:
        print(f"Exception: {e}")
else:
    print("No API key found")
