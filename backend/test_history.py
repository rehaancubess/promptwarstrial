import requests
import json
import uuid

# Change to local if testing locally, or use the cloud run URL
API_URL = "https://hemora-backend-713215250376.us-central1.run.app"
# API_URL = "http://localhost:8000"

# Generate a random user ID simulating the browser local storage
test_user_id = "test_user_" + str(uuid.uuid4())[:8]

print(f"--- Hemora History & Delta Test Script ---")
print(f"Testing with User ID: {test_user_id}\n")

print("1. Uploading First Report (Baseline)...")
# We submit a dummy text file to act as the report
files = {'file': ('report1.txt', b"Patient Hemoglobin is 14.5 g/dL. Vitamin D is 30 ng/mL", 'text/plain')}
data = {'user_id': test_user_id}

try:
    res1 = requests.post(f"{API_URL}/api/analyze", files=files, data=data)
    res1.raise_for_status()
    print("✓ Success! Baseline generated.")
    print("Metrics extracted:", [m['name'] for m in res1.json().get('extracted_metrics', [])])
except Exception as e:
    print("Error on Report 1:", e)
    if 'res1' in locals(): print(res1.text)

print("\n2. Uploading Second Report (Delta Test)...")
files2 = {'file': ('report2.txt', b"Patient Hemoglobin dropped to 13.0 g/dL. Vitamin D rose to 45 ng/mL", 'text/plain')}
data2 = {'user_id': test_user_id}

try:
    res2 = requests.post(f"{API_URL}/api/analyze", files=files2, data=data2)
    res2.raise_for_status()
    print("✓ Success! Comparison generated.")
    
    metrics = res2.json().get('extracted_metrics', [])
    for metric in metrics:
        delta = metric.get('delta')
        direction = metric.get('delta_direction')
        if delta is not None:
            print(f"  - {metric['name']}: {metric['value']} {metric['unit']} ({direction} {delta})")
        else:
            print(f"  - {metric['name']}: {metric['value']} {metric['unit']} (No delta tracking found)")
            
    print("\nAI Delta Insights:")
    for ins in res2.json().get('insights', []):
        print(f"  > {ins}")
except Exception as e:
    print("Error on Report 2:", e)
    if 'res2' in locals(): print(res2.text)

print("\n3. Testing /api/history Endpoint...")
try:
    history_res = requests.get(f"{API_URL}/api/history", params={'user_id': test_user_id})
    history_res.raise_for_status()
    history_data = history_res.json().get("history", [])
    print(f"✓ Success! Found {len(history_data)} reports in history.")
    for h in history_data:
        print(f"  - [{h['created_at']}] {h.get('filename')} -> {h.get('analysis', {}).get('risk_level')} Risk")
except Exception as e:
    print("Error fetching history:", e)

print("\n--- Test Complete ---")
