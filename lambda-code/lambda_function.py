import json
import boto3
from datetime import datetime

def lambda_handler(event, context):
    """
    Sample Lambda function for Bedrock Agent Action Group
    This is a placeholder - replace with your actual business logic
    """
    
    # Extract the action and parameters from the event
    action = event.get('actionGroup', '')
    function_name = event.get('function', '')
    parameters = event.get('parameters', {})
    
    print(f"Action: {action}, Function: {function_name}")
    print(f"Parameters: {json.dumps(parameters)}")
    
    # Sample responses based on function name
    if function_name == 'get_fitness_plan':
        response_body = {
            "fitness_plan": "Here's a sample fitness plan: 30 minutes cardio, 20 minutes strength training, 3 times per week.",
            "duration": "4 weeks",
            "difficulty": "beginner"
        }
    elif function_name == 'calculate_bmi':
        weight = float(parameters.get('weight', 70))
        height = float(parameters.get('height', 1.75))
        bmi = weight / (height ** 2)
        response_body = {
            "bmi": round(bmi, 2),
            "category": "normal" if 18.5 <= bmi < 25 else "other",
            "weight": weight,
            "height": height
        }
    elif function_name == 'get_diet_plan':
        response_body = {
            "diet_plan": "Sample diet plan: Balanced meals with proteins, carbs, and vegetables.",
            "calories_per_day": 2000,
            "meals": ["Breakfast", "Lunch", "Dinner", "2 Snacks"]
        }
    else:
        response_body = {
            "message": f"Function {function_name} not implemented yet.",
            "available_functions": ["get_fitness_plan", "calculate_bmi", "get_diet_plan"]
        }
    
    # Return the response in the format expected by Bedrock Agent
    return {
        'statusCode': 200,
        'body': json.dumps({
            'application/json': {
                'body': json.dumps(response_body)
            }
        })
    }
