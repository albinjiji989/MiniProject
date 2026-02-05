import requests
import json

response = requests.get('http://localhost:5000/api/v1/ecommerce/inventory/predictions?manager_id=69607fa8f40cca3e87444c3e')
print('Status:', response.status_code)

data = response.json()
predictions = data.get('data', {}).get('predictions', [])
print(f'Products: {len(predictions)}')

# Find Pedigree Dog Food
pred = next((p for p in predictions if p.get('product', {}).get('_id') == '698311c0117226c040ed46fb'), None)

if pred:
    print('\n✅ Pedigree Dog Food Analytics:')
    print(f"  Daily Sales: {pred['analytics']['daily_sales']}")
    print(f"  30-Day Forecast: {pred['prediction']['quantity_needed']} units")
    print(f"  Total Sold (30 days): {pred['analytics']['total_sold']}")
    print(f"  Weekly Average: {pred['analytics']['weekly_avg']}")
    print(f"  Sales Trend: {pred['analytics']['trend']}")
    print(f"  Method: {pred['prediction']['method']}")
else:
    print('\n❌ Product not found in predictions')
