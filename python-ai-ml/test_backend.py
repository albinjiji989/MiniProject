import requests

# Test the Node.js backend endpoint that the frontend calls
url = 'http://localhost:3000/api/ecommerce/manager/inventory/predictions'

# You'll need to add authentication token
# Get it from browser DevTools > Application > Local Storage > auth token
headers = {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'  # Replace with actual token
}

try:
    response = requests.get(url, headers=headers)
    print(f'Status: {response.status_code}')
    
    if response.status_code == 200:
        data = response.json()
        predictions = data.get('data', {}).get('predictions', [])
        print(f'\n✅ SUCCESS - Found {len(predictions)} products')
        
        # Find Pedigree Dog Food
        for pred in predictions[:3]:  # Show first 3
            product = pred.get('product', {})
            analytics = pred.get('analytics', {})
            print(f"\n📦 {product.get('name', 'Unknown')}")
            print(f"   Total Sold: {analytics.get('total_sold', 0)} units")
            print(f"   Daily Sales: {analytics.get('daily_sales', 0)}")
            print(f"   Weekly Avg: {analytics.get('weekly_avg', 0)}")
    else:
        print(f'Error: {response.text}')
        
except Exception as e:
    print(f'❌ Connection failed: {e}')
    print('\nMake sure:')
    print('1. Node backend is running on port 3000')
    print('2. Python ML service is running on port 5001')
    print('3. You are logged in and have a valid token')
