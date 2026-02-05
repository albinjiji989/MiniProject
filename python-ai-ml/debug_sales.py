from config.database import get_db
from bson import ObjectId
from datetime import datetime, timedelta
import json
from bson import json_util

db = get_db()
end_date = datetime.now()
start_date = end_date - timedelta(days=30)
product_id = ObjectId('698311c0117226c040ed46fb')

print(f"Searching from {start_date} to {end_date}")
print(f"Product ID: {product_id}")

# Test 1: Count all orders
all_orders = db.orders.count_documents({})
print(f"\nTotal orders in DB: {all_orders}")

# Test 2: Count orders with product
orders_with_product = db.orders.count_documents({'items.product': product_id})
print(f"Orders with product: {orders_with_product}")

# Test 3: Count delivered orders with product
delivered_orders = db.orders.count_documents({
    'items.product': product_id,
    'status': 'delivered'
})
print(f"Delivered orders with product: {delivered_orders}")

# Test 4: Fetch one order to inspect
sample_order = db.orders.find_one({'items.product': product_id, 'status': 'delivered'})
if sample_order:
    print(f"\nSample order:")
    print(json.dumps({
        '_id': str(sample_order['_id']),
        'orderNumber': sample_order['orderNumber'],
        'createdAt': sample_order['createdAt'].isoformat(),
        'status': sample_order['status'],
        'items': [{
            'product': str(item['product']),
            'quantity': item['quantity'],
            'total': item['total']
        } for item in sample_order['items']]
    }, indent=2))

# Test 5: Query with date range
orders_in_range = list(db.orders.find({
    'createdAt': {'$gte': start_date, '$lte': end_date},
    'status': {'$in': ['confirmed', 'processing', 'packed', 'shipped', 'delivered']},
    'items.product': product_id
}, {
    'createdAt': 1,
    'items': 1,
    'orderNumber': 1
}))

print(f"\nOrders in date range: {len(orders_in_range)}")
if orders_in_range:
    print("First order in range:")
    order = orders_in_range[0]
    print(json.dumps({
        'orderNumber': order['orderNumber'],
        'createdAt': order['createdAt'].isoformat(),
        'items_count': len(order['items'])
    }, indent=2))
