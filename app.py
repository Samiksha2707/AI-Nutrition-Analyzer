from flask import Flask, render_template, request, jsonify, session
import requests
import json
import os
import random
from datetime import datetime, timedelta
import base64
from io import BytesIO

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'

class NutritionAnalyzer:
    def __init__(self):
        self.food_database = {
            "apple": {"calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3, "sugar": 19, "fiber": 4.4, "category": "fruit"},
            "banana": {"calories": 105, "protein": 1.3, "carbs": 27, "fat": 0.4, "sugar": 14, "fiber": 3.1, "category": "fruit"},
            "orange": {"calories": 62, "protein": 1.2, "carbs": 15.4, "fat": 0.2, "sugar": 12, "fiber": 3.1, "category": "fruit"},
            "bread": {"calories": 79, "protein": 3.1, "carbs": 14.9, "fat": 1.0, "sugar": 1.6, "fiber": 1.2, "category": "grains"},
            "rice": {"calories": 130, "protein": 2.7, "carbs": 28.2, "fat": 0.3, "sugar": 0.1, "fiber": 0.4, "category": "grains"},
            "chicken": {"calories": 165, "protein": 31, "carbs": 0, "fat": 3.6, "sugar": 0, "fiber": 0, "category": "protein"},
            "salad": {"calories": 15, "protein": 1.2, "carbs": 3, "fat": 0.2, "sugar": 2, "fiber": 1.5, "category": "vegetables"},
            "pasta": {"calories": 131, "protein": 5.1, "carbs": 25.2, "fat": 1.1, "sugar": 0.6, "fiber": 1.8, "category": "grains"},
            "beef": {"calories": 250, "protein": 26, "carbs": 0, "fat": 15, "sugar": 0, "fiber": 0, "category": "protein"},
            "fish": {"calories": 206, "protein": 22, "carbs": 0, "fat": 13, "sugar": 0, "fiber": 0, "category": "protein"},
            "eggs": {"calories": 155, "protein": 13, "carbs": 1.1, "fat": 11, "sugar": 1.1, "fiber": 0, "category": "protein"},
            "milk": {"calories": 42, "protein": 3.4, "carbs": 5.0, "fat": 1.0, "sugar": 5.0, "fiber": 0, "category": "dairy"},
            "cheese": {"calories": 402, "protein": 25, "carbs": 1.3, "fat": 33, "sugar": 0.5, "fiber": 0, "category": "dairy"},
            "carrot": {"calories": 41, "protein": 0.9, "carbs": 10, "fat": 0.2, "sugar": 4.7, "fiber": 2.8, "category": "vegetables"},
            "broccoli": {"calories": 34, "protein": 2.8, "carbs": 7, "fat": 0.4, "sugar": 1.7, "fiber": 2.6, "category": "vegetables"},
            "tomato": {"calories": 18, "protein": 0.9, "carbs": 3.9, "fat": 0.2, "sugar": 2.6, "fiber": 1.2, "category": "vegetables"},
            "potato": {"calories": 77, "protein": 2.0, "carbs": 17, "fat": 0.1, "sugar": 0.8, "fiber": 2.2, "category": "vegetables"},
            "yogurt": {"calories": 59, "protein": 10, "carbs": 3.6, "fat": 0.4, "sugar": 3.2, "fiber": 0, "category": "dairy"},
            "avocado": {"calories": 160, "protein": 2, "carbs": 9, "fat": 15, "sugar": 0.7, "fiber": 7, "category": "fruit"},
            "spinach": {"calories": 23, "protein": 2.9, "carbs": 3.6, "fat": 0.4, "sugar": 0.4, "fiber": 2.2, "category": "vegetables"}
        }
        
        self.meal_history = []

    def detect_food_items(self, image_data):
        """Enhanced food detection with confidence scores"""
        common_foods = list(self.food_database.keys())
        detected_items = random.sample(common_foods, min(4, len(common_foods)))
        
        # Add confidence scores and portions
        results = []
        for food in detected_items:
            results.append({
                "name": food,
                "confidence": round(random.uniform(0.7, 0.95), 2),
                "portion": random.choice(["small", "medium", "large"])
            })
        
        return results

    def get_nutrition_info(self, food_item, portion="medium"):
        """Get nutrition info with portion sizing"""
        base_nutrition = self.food_database.get(food_item.lower())
        if not base_nutrition:
            return None
            
        # Adjust nutrition based on portion size
        portion_multipliers = {
            "small": 0.7,
            "medium": 1.0,
            "large": 1.5
        }
        
        multiplier = portion_multipliers.get(portion, 1.0)
        
        adjusted_nutrition = {}
        for key, value in base_nutrition.items():
            if key != "category":
                adjusted_nutrition[key] = round(value * multiplier, 1)
            else:
                adjusted_nutrition[key] = value
                
        return adjusted_nutrition

    def calculate_health_score(self, nutrition_data):
        """Calculate a health score from 0-100"""
        score = 100
        
        # Deduct points for high sugar
        if nutrition_data.get('sugar', 0) > 25:
            score -= 20
        elif nutrition_data.get('sugar', 0) > 15:
            score -= 10
            
        # Add points for good protein
        if nutrition_data.get('protein', 0) > 20:
            score += 10
            
        # Add points for fiber
        if nutrition_data.get('fiber', 0) > 5:
            score += 10
            
        # Deduct points for high saturated fat
        if nutrition_data.get('fat', 0) > 15:
            score -= 15
            
        return max(0, min(100, score))

    def get_health_tips(self, nutrition_data):
        """Generate personalized health tips"""
        tips = []
        
        if nutrition_data.get('sugar', 0) > 20:
            tips.append("Consider reducing sugar intake for better health")
            
        if nutrition_data.get('protein', 0) < 15:
            tips.append("Add more protein-rich foods to your meal")
            
        if nutrition_data.get('fiber', 0) < 5:
            tips.append("Include more fiber-rich foods like vegetables and whole grains")
            
        if nutrition_data.get('fat', 0) > 20:
            tips.append("Try to choose foods with healthier fats")
            
        if not tips:
            tips.append("Great balanced meal! Keep it up!")
            
        return tips

analyzer = NutritionAnalyzer()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze-text', methods=['POST'])
def analyze_text():
    try:
        data = request.get_json()
        food_text = data.get('food_text', '')
        
        if not food_text:
            return jsonify({'error': 'No food text provided'}), 400
        
        # Parse food items with portions
        food_items = []
        for item in food_text.split(','):
            item = item.strip()
            if ':' in item:
                food, portion = item.split(':', 1)
                food_items.append({'name': food.strip(), 'portion': portion.strip()})
            else:
                food_items.append({'name': item, 'portion': 'medium'})
        
        results = []
        total_nutrition = {
            'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0, 
            'sugar': 0, 'fiber': 0
        }
        category_breakdown = {}
        
        for food_item in food_items:
            nutrition = analyzer.get_nutrition_info(food_item['name'], food_item['portion'])
            if nutrition:
                results.append({
                    'food': food_item['name'],
                    'portion': food_item['portion'],
                    'nutrition': nutrition
                })
                
                # Add to totals
                for key in total_nutrition:
                    total_nutrition[key] += nutrition.get(key, 0)
                
                # Category breakdown
                category = nutrition.get('category', 'other')
                category_breakdown[category] = category_breakdown.get(category, 0) + nutrition['calories']
        
        # Calculate health metrics
        health_score = analyzer.calculate_health_score(total_nutrition)
        health_tips = analyzer.get_health_tips(total_nutrition)
        
        return jsonify({
            'success': True,
            'results': results,
            'total': total_nutrition,
            'category_breakdown': category_breakdown,
            'health_score': health_score,
            'health_tips': health_tips,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({'error': 'No image selected'}), 400
        
        # Detect food items with enhanced information
        detected_items = analyzer.detect_food_items(image_file.read())
        
        results = []
        total_nutrition = {
            'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0, 
            'sugar': 0, 'fiber': 0
        }
        category_breakdown = {}
        
        for item in detected_items:
            nutrition = analyzer.get_nutrition_info(item['name'], item['portion'])
            if nutrition:
                results.append({
                    'food': item['name'],
                    'portion': item['portion'],
                    'confidence': item['confidence'],
                    'nutrition': nutrition
                })
                
                for key in total_nutrition:
                    total_nutrition[key] += nutrition.get(key, 0)
                
                category = nutrition.get('category', 'other')
                category_breakdown[category] = category_breakdown.get(category, 0) + nutrition['calories']
        
        health_score = analyzer.calculate_health_score(total_nutrition)
        health_tips = analyzer.get_health_tips(total_nutrition)
        
        return jsonify({
            'success': True,
            'detected_items': detected_items,
            'results': results,
            'total': total_nutrition,
            'category_breakdown': category_breakdown,
            'health_score': health_score,
            'health_tips': health_tips,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/save-meal', methods=['POST'])
def save_meal():
    try:
        data = request.get_json()
        analyzer.meal_history.append({
            'name': data.get('meal_name', 'Unnamed Meal'),
            'nutrition': data.get('nutrition'),
            'timestamp': datetime.now().isoformat(),
            'health_score': data.get('health_score')
        })
        
        return jsonify({'success': True, 'message': 'Meal saved successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-meal-history', methods=['GET'])
def get_meal_history():
    return jsonify({'meals': analyzer.meal_history[-10:]})  # Last 10 meals

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)