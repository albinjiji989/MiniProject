from config.database import get_db
from bson import ObjectId
from datetime import datetime, timedelta
import pandas as pd

db = get_db()
end_date = datetime.now()
start_date = end_date - timedelta(days=30)
product_id = ObjectId('698311c0117226c040ed46fb')

# Quick test
orders = list(db.orders.find({
    'createdAt': {'$gte': start_date, '$lte': end_date},
    'status': {'$in': ['confirmed', 'processing', 'packed', 'shipped', 'delivered']},
    'items.product': product_id
}, {'createdAt': 1, 'items': 1}))

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

df = pd.DataFrame(results)
df['date'] = pd.to_datetime(df['createdAt']).dt.date
df_grouped = df.groupby('date').agg({
    'quantity': 'sum',
    'total': 'sum',
    'price': 'mean'
}).reset_index()
df_grouped.columns = ['date', 'units_sold', 'revenue', 'avg_price']
df_grouped['date'] = pd.to_datetime(df_grouped['date'])

print("df_grouped dates:")
print(df_grouped['date'])
print(f"Date dtype: {df_grouped['date'].dtype}")

full_range = pd.date_range(start=start_date, end=end_date, freq='D')
full_df = pd.DataFrame({'date': full_range})

print("\nfull_df dates (first 5 and last 5):")
print(full_df['date'].head())
print("...")
print(full_df['date'].tail())
print(f"Date dtype: {full_df['date'].dtype}")

print("\nMerging...")
merged = full_df.merge(df_grouped, on='date', how='left')
print(f"Merged shape: {merged.shape}")
print(f"Units sold sum: {merged['units_sold'].sum()}")
print("\nRows with sales:")
print(merged[merged['units_sold'].notna()][['date', 'units_sold']])

# Try normalizing dates
print("\n\nTrying with normalized dates:")
df_grouped['date_normalized'] = pd.to_datetime(df_grouped['date']).dt.normalize()
full_df['date_normalized'] = pd.to_datetime(full_df['date']).dt.normalize()

merged2 = full_df[['date_normalized']].merge(df_grouped[['date_normalized', 'units_sold', 'revenue']], on='date_normalized', how='left')
print(f"Merged shape: {merged2.shape}")
print(f"Units sold sum: {merged2['units_sold'].sum()}")
print("\nRows with sales:")
print(merged2[merged2['units_sold'].notna()][['date_normalized', 'units_sold']])
