from config.database import get_db
from bson import ObjectId
from datetime import datetime, timedelta
import pandas as pd

db = get_db()
end_date = datetime.now()
start_date = end_date - timedelta(days=30)
product_id = ObjectId('698311c0117226c040ed46fb')
variant_id = None

print("Fetching orders...")
orders = list(db.orders.find({
    'createdAt': {'$gte': start_date, '$lte': end_date},
    'status': {'$in': ['confirmed', 'processing', 'packed', 'shipped', 'delivered']},
    'items.product': product_id
}, {
    'createdAt': 1,
    'items': 1
}))

print(f"Found {len(orders)} orders")

# Process in Python to extract matching items
results = []
for order in orders:
    print(f"\nOrder {order.get('_id')}:")
    print(f"  Items count: {len(order.get('items', []))}")
    for item in order.get('items', []):
        print(f"  Item product: {item.get('product')}, target: {product_id}, match: {item.get('product') == product_id}")
        if item.get('product') == product_id:
            if variant_id is None or item.get('variant') == variant_id:
                result = {
                    'createdAt': order['createdAt'],
                    'quantity': item.get('quantity', 0),
                    'total': item.get('total', 0),
                    'price': item.get('price', 0)
                }
                print(f"  Added to results: {result}")
                results.append(result)

print(f"\nTotal results: {len(results)}")
print(f"Results: {results}")

if results:
    # Create DataFrame from results
    df = pd.DataFrame(results)
    print(f"\nDataFrame before grouping:")
    print(df)
    print(f"\nSum of quantity column: {df['quantity'].sum()}")
    
    df['date'] = pd.to_datetime(df['createdAt']).dt.date
    
    # Group by date
    df_grouped = df.groupby('date').agg({
        'quantity': 'sum',
        'total': 'sum',
        'price': 'mean'
    }).reset_index()
    
    print(f"\nDataFrame after grouping:")
    print(df_grouped)
    print(f"\nSum of quantity column: {df_grouped['quantity'].sum()}")
