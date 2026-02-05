from config.database import get_db
from bson import ObjectId
from datetime import datetime, timedelta
import pandas as pd

db = get_db()
end_date = datetime.now()
start_date = end_date - timedelta(days=30)
product_id = ObjectId('698311c0117226c040ed46fb')

# Fetch orders
orders = list(db.orders.find({
    'createdAt': {'$gte': start_date, '$lte': end_date},
    'status': {'$in': ['confirmed', 'processing', 'packed', 'shipped', 'delivered']},
    'items.product': product_id
}, {
    'createdAt': 1,
    'items': 1
}))

# Process results
results = []
for order in orders:
    for item in order.get('items', []):
        if item.get('product') == product_id:
            results.append({
                'createdAt': order['createdAt'],
                'quantity': item.get('quantity', 0),
                'total': item.get('total', 0),
                'price': item.get('price', 0)
            })

print(f"Step 1 - Raw results: {len(results)} items, total quantity: {sum(r['quantity'] for r in results)}")

# Create DataFrame
df = pd.DataFrame(results)
print(f"Step 2 - DataFrame created: shape={df.shape}, quantity sum={df['quantity'].sum()}")

df['date'] = pd.to_datetime(df['createdAt']).dt.date
print(f"Step 3 - Date column added: {df['date'].unique()}")

# Group by date
df_grouped = df.groupby('date').agg({
    'quantity': 'sum',
    'total': 'sum',
    'price': 'mean'
}).reset_index()
df_grouped.columns = ['date', 'units_sold', 'revenue', 'avg_price']
print(f"Step 4 - After grouping: shape={df_grouped.shape}, units_sold sum={df_grouped['units_sold'].sum()}")
print(df_grouped)

df_grouped['orders_count'] = df_grouped.groupby('date')['date'].transform('count')
print(f"Step 5 - After orders_count: shape={df_grouped.shape}, units_sold sum={df_grouped['units_sold'].sum()}")

df_grouped['date'] = pd.to_datetime(df_grouped['date'])
print(f"Step 6 - After date conversion: shape={df_grouped.shape}, units_sold sum={df_grouped['units_sold'].sum()}")

df_grouped['returns_count'] = 0
df_grouped['net_units_sold'] = df_grouped['units_sold'] - df_grouped['returns_count']
print(f"Step 7 - After returns: shape={df_grouped.shape}, units_sold sum={df_grouped['units_sold'].sum()}")

# Fill missing dates - OLD WAY
print("\nTesting OLD _fill_missing_dates:")
df_test = df_grouped.copy()
full_range = pd.date_range(start=start_date, end=end_date, freq='D')
df_test = df_test.set_index('date')
df_test = df_test.reindex(full_range, fill_value=0)
df_test = df_test.reset_index()
df_test.rename(columns={'index': 'date'}, inplace=True)
print(f"OLD way: shape={df_test.shape}, units_sold sum={df_test['units_sold'].sum()}")

# Fill missing dates - NEW WAY
print("\nTesting NEW _fill_missing_dates:")
df_test2 = df_grouped.copy()
full_range = pd.date_range(start=start_date, end=end_date, freq='D')
full_df = pd.DataFrame({'date': full_range})
df_test2 = full_df.merge(df_test2, on='date', how='left')
numeric_columns = df_test2.select_dtypes(include=['float64', 'int64']).columns
df_test2[numeric_columns] = df_test2[numeric_columns].fillna(0)
print(f"NEW way: shape={df_test2.shape}, units_sold sum={df_test2['units_sold'].sum()}")
print("\nDays with sales:")
print(df_test2[df_test2['units_sold'] > 0][['date', 'units_sold', 'revenue']])
