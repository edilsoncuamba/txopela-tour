"""
AI Service using SambaNova API for chat recommendations and responses.
"""

import os
import requests
from typing import Optional, List, Dict

class SambaNovAIService:
    """Service for interacting with SambaNova AI API."""
    
    def __init__(self):
        self.api_key = os.environ.get('SAMBANOVA_API_KEY')
        self.base_url = os.environ.get('SAMBANOVA_BASE_URL', 'https://api.sambanova.ai/v1')
        self.model = os.environ.get('SAMBANOVA_MODEL', 'DeepSeek-R1-0528')
        
        if not self.api_key:
            raise ValueError("SAMBANOVA_API_KEY not set in environment variables")
    
    def get_chat_response(self, user_message: str, conversation_history: Optional[List[Dict]] = None) -> str:
        """
        Get AI response for a chat message.
        
        Args:
            user_message: The user's message
            conversation_history: Previous messages in the conversation
        
        Returns:
            AI response text
        """
        try:
            messages = []
            
            # Add system message
            messages.append({
                "role": "system",
                "content": "You are a helpful travel assistant for Txopela Tour. Help users with travel recommendations, location information, and booking assistance. Be friendly and concise."
            })
            
            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history)
            
            # Add current user message
            messages.append({
                "role": "user",
                "content": user_message
            })
            
            # Make API request
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.7,
                "top_p": 0.9,
                "max_tokens": 500
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content']
            else:
                print(f"SambaNova API error: {response.status_code} - {response.text}")
                return "Sorry, I couldn't process your request. Please try again."
        
        except Exception as e:
            print(f"Error calling SambaNova API: {e}")
            return "Sorry, I encountered an error. Please try again."
    
    def get_location_recommendations(self, user_preferences: str) -> str:
        """
        Get location recommendations based on user preferences.
        
        Args:
            user_preferences: Description of what the user is looking for
        
        Returns:
            Recommendations text
        """
        prompt = f"""Based on the following preferences, suggest 3-5 travel locations with brief descriptions:

Preferences: {user_preferences}

Format your response as a numbered list with location name and 1-2 sentence description."""
        
        return self.get_chat_response(prompt)
    
    def get_travel_tips(self, location: str, activity: str) -> str:
        """
        Get travel tips for a specific location and activity.
        
        Args:
            location: The location name
            activity: The activity type
        
        Returns:
            Travel tips text
        """
        prompt = f"""Provide 3-4 practical travel tips for {activity} in {location}. 
Keep each tip concise (1-2 sentences). Focus on safety, cost-effectiveness, and local insights."""
        
        return self.get_chat_response(prompt)
    
    def get_booking_advice(self, location: str, travel_dates: str, budget: str) -> str:
        """
        Get booking advice for a location.
        
        Args:
            location: The location name
            travel_dates: When the user wants to travel
            budget: User's budget
        
        Returns:
            Booking advice text
        """
        prompt = f"""Provide booking advice for {location} during {travel_dates} with a budget of {budget}.
Include tips on best time to book, accommodation options, and cost-saving strategies."""
        
        return self.get_chat_response(prompt)


# Create singleton instance
ai_service = SambaNovAIService()
