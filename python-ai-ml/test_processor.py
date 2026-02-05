from modules.ecommerce.inventory.data_processor import InventoryDataProcessor
from bson import ObjectId

dp = InventoryDataProcessor()
product_id = '698311c0117226c040ed46fb'

# Add debug logging
import logging
logging.basicConfig(level=logging.INFO)

print("Testing data processor...")
df = dp.get_product_sales_history(product_id, days=30)

print(f"\nDataFrame shape: {df.shape}")
print(f"\nColumns: {df.columns.tolist()}")
print(f"\nTotal units sold: {df['units_sold'].sum()}")
print(f"\nTotal revenue: {df['revenue'].sum()}")
print(f"\nDays with sales > 0: {(df['units_sold'] > 0).sum()}")

if df['units_sold'].sum() > 0:
    print("\nDays with sales:")
    print(df[df['units_sold'] > 0][['date', 'units_sold', 'revenue']])
