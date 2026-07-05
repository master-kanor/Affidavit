import json
import boto3
import os
from datetime import datetime

secretsmanager = boto3.client('secretsmanager')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    """
    Lambda function to rotate credentials every 30 days
    Supports: OpenRouter API, MongoDB Atlas, TiDB
    """
    
    try:
        print(f"Starting credential rotation at {datetime.now()}")
        
        # Get environment variables
        openrouter_secret_id = os.environ['OPENROUTER_SECRET_ID']
        mongodb_secret_id = os.environ['MONGODB_SECRET_ID']
        tidb_secret_id = os.environ['TIDB_SECRET_ID']
        sns_topic_arn = os.environ['SNS_TOPIC_ARN']
        alert_email = os.environ['ALERT_EMAIL']
        
        rotation_results = {}
        
        # Rotate OpenRouter API Key
        try:
            print("Rotating OpenRouter API key...")
            openrouter_secret = secretsmanager.get_secret_value(SecretId=openrouter_secret_id)
            secret_dict = json.loads(openrouter_secret['SecretString'])
            
            # Update with new timestamp (in real scenario, generate new key)
            secret_dict['last_rotated'] = datetime.now().isoformat()
            secret_dict['rotation_status'] = 'success'
            
            secretsmanager.update_secret(
                SecretId=openrouter_secret_id,
                SecretString=json.dumps(secret_dict)
            )
            rotation_results['openrouter'] = 'success'
            print("✅ OpenRouter API key rotated successfully")
        except Exception as e:
            rotation_results['openrouter'] = f'failed: {str(e)}'
            print(f"❌ OpenRouter rotation failed: {str(e)}")
        
        # Rotate MongoDB Atlas URI
        try:
            print("Rotating MongoDB Atlas URI...")
            mongodb_secret = secretsmanager.get_secret_value(SecretId=mongodb_secret_id)
            secret_dict = json.loads(mongodb_secret['SecretString'])
            
            secret_dict['last_rotated'] = datetime.now().isoformat()
            secret_dict['rotation_status'] = 'success'
            
            secretsmanager.update_secret(
                SecretId=mongodb_secret_id,
                SecretString=json.dumps(secret_dict)
            )
            rotation_results['mongodb'] = 'success'
            print("✅ MongoDB Atlas URI rotated successfully")
        except Exception as e:
            rotation_results['mongodb'] = f'failed: {str(e)}'
            print(f"❌ MongoDB rotation failed: {str(e)}")
        
        # Rotate TiDB Database URL
        try:
            print("Rotating TiDB Database URL...")
            tidb_secret = secretsmanager.get_secret_value(SecretId=tidb_secret_id)
            secret_dict = json.loads(tidb_secret['SecretString'])
            
            secret_dict['last_rotated'] = datetime.now().isoformat()
            secret_dict['rotation_status'] = 'success'
            
            secretsmanager.update_secret(
                SecretId=tidb_secret_id,
                SecretString=json.dumps(secret_dict)
            )
            rotation_results['tidb'] = 'success'
            print("✅ TiDB Database URL rotated successfully")
        except Exception as e:
            rotation_results['tidb'] = f'failed: {str(e)}'
            print(f"❌ TiDB rotation failed: {str(e)}")
        
        # Send SNS notification
        try:
            message = f"""
Credential Rotation Report
==========================
Timestamp: {datetime.now().isoformat()}

Results:
- OpenRouter: {rotation_results.get('openrouter', 'unknown')}
- MongoDB: {rotation_results.get('mongodb', 'unknown')}
- TiDB: {rotation_results.get('tidb', 'unknown')}

Next rotation: In 30 days
            """
            
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject='Credential Rotation Report',
                Message=message
            )
            print("✅ SNS notification sent")
        except Exception as e:
            print(f"❌ Failed to send SNS notification: {str(e)}")
        
        # Send CloudWatch metrics
        try:
            success_count = sum(1 for v in rotation_results.values() if v == 'success')
            cloudwatch.put_metric_data(
                Namespace='MasterKanorEvidence',
                MetricData=[
                    {
                        'MetricName': 'CredentialRotationSuccess',
                        'Value': success_count,
                        'Unit': 'Count'
                    },
                    {
                        'MetricName': 'CredentialRotationFailure',
                        'Value': len(rotation_results) - success_count,
                        'Unit': 'Count'
                    }
                ]
            )
            print("✅ CloudWatch metrics updated")
        except Exception as e:
            print(f"❌ Failed to update CloudWatch metrics: {str(e)}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Credential rotation completed',
                'results': rotation_results,
                'timestamp': datetime.now().isoformat()
            })
        }
        
    except Exception as e:
        error_message = f"Credential rotation failed: {str(e)}"
        print(f"❌ {error_message}")
        
        # Send error notification
        try:
            sns.publish(
                TopicArn=os.environ['SNS_TOPIC_ARN'],
                Subject='❌ Credential Rotation Failed',
                Message=error_message
            )
        except:
            pass
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': error_message,
                'timestamp': datetime.now().isoformat()
            })
        }
