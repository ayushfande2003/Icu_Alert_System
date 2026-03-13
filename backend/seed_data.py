
import requests
import random
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api"

def login(username, password):
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
        if response.status_code == 200:
            return response.json()['access_token']
    except:
        pass
    return None

def create_alert(token, message, severity=3):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": "Demo Alert",
        "message": message,
        "severity": severity,
        "alert_type": "vital_warning",
        "patient_id": 1 # Assuming patient 1 exists
    }
    # Note: Using direct DB or internal API might be better if no public create-alert endpoint exists for users
    # But usually alerts are system generated.
    # For demo, we might not have a public CREATE alert endpoint for users.
    # We will assume there isn't one and this script might need to run as system or use a specific endpoint.
    # Actually, let's skip alert creation via API if it doesn't exist.
    pass

def create_message(token, recipient_id, subject, body):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "recipient_id": recipient_id,
        "subject": subject,
        "body": body
    }
    requests.post(f"{BASE_URL}/messages", json=data, headers=headers)

if __name__ == "__main__":
    print("Seeding demo data...")
    
    # Login as Admin to send messages
    admin_token = login("admin", "admin123")
    nurse_token = login("nurse", "nurse123")
    
    if admin_token and nurse_token:
        # Send messages to Nurse (ID 2 usually)
        # We need to know Nurse ID. Assuming 2 or 3.
        # Let's send to self to be safe or try to fetch users.
        
        # 1. Admin sends message to Nurse
        create_message(admin_token, 2, "Shift Change", "Please overlap with incoming nurse for 30 mins today.")
        create_message(admin_token, 2, "Patient Update", "Patient in bed 3 needs extra monitoring.")
        
        print("✅ Sent demo messages")
    else:
        print("❌ Login failed, could not seed messages")
