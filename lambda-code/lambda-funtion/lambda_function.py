## Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
## SPDX-License-Identifier: MIT-0

import json
import boto3
from datetime import datetime

def lambda_handler(event, context):
    """
    Lambda function for PECARN medical data analysis actions
    Supports various medical data processing tasks
    """
    try:
        # Extract parameters from the event
        request_body = event.get('requestBody', {}).get('content', {}).get('application/json', {}).get('properties', [])
        
        # Extract action type and parameters
        action_type = None
        parameters = {}
        
        for prop in request_body:
            if prop['name'] == 'action_type':
                action_type = prop['value']
            else:
                parameters[prop['name']] = prop['value']
        
        # Handle different PECARN medical actions
        if action_type == 'analyze_patient_data':
            result = analyze_patient_data(parameters)
        elif action_type == 'calculate_statistics':
            result = calculate_medical_statistics(parameters)
        elif action_type == 'extract_demographics':
            result = extract_patient_demographics(parameters)
        elif action_type == 'calculate_bmi':
            result = calculate_bmi(parameters)
        else:
            result = {
                'error': f'Unknown action type: {action_type}',
                'available_actions': ['analyze_patient_data', 'calculate_statistics', 'extract_demographics', 'calculate_bmi']
            }
        
        # Format the response for Bedrock Agent
        response = {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": event.get('actionGroup', 'pecarn-medical-actions'),
                "apiPath": event.get('apiPath', '/medical_action'),
                "httpMethod": event.get('httpMethod', 'POST'),
                "httpStatusCode": 200,
                "responseBody": {
                    "application/json": {
                        "body": json.dumps(result)
                    }
                }
            }
        }
        
        return response
        
    except Exception as e:
        # Error response
        error_response = {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": event.get('actionGroup', 'pecarn-medical-actions'),
                "apiPath": event.get('apiPath', '/medical_action'),
                "httpMethod": event.get('httpMethod', 'POST'),
                "httpStatusCode": 500,
                "responseBody": {
                    "application/json": {
                        "body": json.dumps({
                            "error": str(e),
                            "timestamp": datetime.now().isoformat()
                        })
                    }
                }
            }
        }
        return error_response

def analyze_patient_data(parameters):
    """Analyze patient data from PECARN records"""
    patient_id = parameters.get('patient_id', 'unknown')
    analysis_type = parameters.get('analysis_type', 'general')
    
    return {
        'patient_id': patient_id,
        'analysis_type': analysis_type,
        'status': 'Analysis completed',
        'message': f'Patient {patient_id} data analyzed for {analysis_type}',
        'timestamp': datetime.now().isoformat()
    }

def calculate_medical_statistics(parameters):
    """Calculate medical statistics from PECARN data"""
    stat_type = parameters.get('stat_type', 'summary')
    date_range = parameters.get('date_range', 'last_30_days')
    
    return {
        'statistic_type': stat_type,
        'date_range': date_range,
        'status': 'Statistics calculated',
        'message': f'Medical statistics for {stat_type} over {date_range} calculated',
        'timestamp': datetime.now().isoformat()
    }

def extract_patient_demographics(parameters):
    """Extract patient demographics from PECARN records"""
    record_id = parameters.get('record_id', 'unknown')
    
    return {
        'record_id': record_id,
        'demographics': {
            'age_group': 'pediatric',
            'extracted': True,
            'status': 'Demographics extracted successfully'
        },
        'timestamp': datetime.now().isoformat()
    }

def calculate_bmi(parameters):
    """Calculate BMI for pediatric patients"""
    try:
        weight = float(parameters.get('weight', 0))
        height = float(parameters.get('height', 0))
        
        if weight <= 0 or height <= 0:
            return {'error': 'Weight and height must be positive numbers'}
        
        bmi = weight / (height ** 2)
        
        # Pediatric BMI categories (simplified)
        if bmi < 18.5:
            category = 'Underweight'
        elif bmi < 25:
            category = 'Normal weight'
        elif bmi < 30:
            category = 'Overweight'
        else:
            category = 'Obese'
        
        return {
            'bmi': round(bmi, 2),
            'category': category,
            'message': f'BMI calculated: {round(bmi, 2)} ({category})',
            'note': 'Pediatric BMI interpretation may require age and sex-specific percentiles'
        }
        
    except (ValueError, TypeError) as e:
        return {'error': f'Invalid weight or height values: {str(e)}'}
            "response": {
                "actionGroup": event.get("actionGroup"),
                "apiPath": event.get("apiPath"),
                "httpMethod": event.get("httpMethod"),
                "httpStatusCode": 200,
                "responseBody": {
                    "application/json": {
                        "body": json.dumps(response)
                    }
                },
                "sessionAttributes": {},
                "promptSessionAttributes": {}
            }
        }
        return result
    except KeyError as e:
        error_response = f"Missing parameter: {str(e)}"
        print(error_response)
        return format_error_response(400, error_response)
    except ValueError as e:
        error_response = f"Invalid parameter value: {str(e)}"
        print(error_response)
        return format_error_response(400, error_response)
    except Exception as e:
        error_response = f"An error occurred: {str(e)}"
        print(error_response)
        return format_error_response(500, error_response)
def format_error_response(status_code, error_message):
    return {
        "messageVersion": "1.0",
        "response": {
            "actionGroup": None,
            "apiPath": None,
            "httpMethod": None,
            "httpStatusCode": status_code,
            "responseBody": {
                "application/json": {
                    "body": json.dumps({"error": error_message})
                }
            },
            "sessionAttributes": {},
            "promptSessionAttributes": {}
        }
    }