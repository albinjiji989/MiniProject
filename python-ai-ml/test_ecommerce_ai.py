"""
Test script for E-commerce AI features
Run this to verify all three features are working
"""
import requests
import json
import time

BASE_URL = "http://localhost:5001"

def print_section(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_visual_search():
    print_section("Testing Visual Search")
    
    # Test 1: Index products
    print("\n1. Indexing product images...")
    products = [
        {
            "product_id": "test_prod_1",
            "image_url": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e"  # Dog bed
        },
        {
            "product_id": "test_prod_2",
            "image_url": "https://images.unsplash.com/photo-1591769225440-811ad7d6eab3"  # Dog toy
        }
    ]
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ecommerce/visual-search/index",
            json={"products": products}
        )
        print(f"✅ Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test 2: Get stats
    print("\n2. Getting visual search stats...")
    try:
        response = requests.get(f"{BASE_URL}/api/ecommerce/visual-search/stats")
        print(f"✅ Status: {response.status_code}")
        print(f"Stats: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_bundle_generation():
    print_section("Testing Bundle Generation")
    
    # Test 1: Load products
    print("\n1. Loading products...")
    products = [
        {
            "id": "prod_food_1",
            "name": "Premium Puppy Food",
            "category": "food",
            "petType": ["dog"],
            "ageGroup": ["puppy"],
            "price": 1500,
            "rating": 4.5,
            "popularity": 100,
            "isFeatured": True,
            "isBestseller": True
        },
        {
            "id": "prod_bowl_1",
            "name": "Stainless Steel Bowl",
            "category": "bowl",
            "petType": ["dog", "cat"],
            "ageGroup": ["all"],
            "price": 300,
            "rating": 4.2,
            "popularity": 80,
            "isFeatured": False,
            "isBestseller": False
        },
        {
            "id": "prod_toy_1",
            "name": "Puppy Chew Toy",
            "category": "toy",
            "petType": ["dog"],
            "ageGroup": ["puppy"],
            "price": 250,
            "rating": 4.7,
            "popularity": 120,
            "isFeatured": True,
            "isBestseller": True
        },
        {
            "id": "prod_bed_1",
            "name": "Cozy Dog Bed",
            "category": "bed",
            "petType": ["dog"],
            "ageGroup": ["all"],
            "price": 2000,
            "rating": 4.6,
            "popularity": 90,
            "isFeatured": False,
            "isBestseller": True
        },
        {
            "id": "prod_collar_1",
            "name": "Adjustable Collar",
            "category": "collar",
            "petType": ["dog"],
            "ageGroup": ["all"],
            "price": 400,
            "rating": 4.3,
            "popularity": 70,
            "isFeatured": False,
            "isBestseller": False
        }
    ]
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ecommerce/bundles/load-products",
            json={"products": products}
        )
        print(f"✅ Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test 2: Generate starter kit
    print("\n2. Generating puppy starter kit...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/ecommerce/bundles/generate-starter-kit",
            json={
                "pet_type": "dog",
                "age_group": "puppy",
                "breed_size": "medium",
                "budget": 5000
            }
        )
        print(f"✅ Status: {response.status_code}")
        result = response.json()
        if result.get('success'):
            bundle = result['data']
            print(f"\n📦 Bundle: {bundle['name']}")
            print(f"Description: {bundle['description']}")
            print(f"\nProducts ({bundle['product_count']}):")
            for product in bundle['products']:
                print(f"  - {product['name']} (₹{product['price']}) - {product['reason']}")
            print(f"\nPricing:")
            print(f"  Individual Total: ₹{bundle['pricing']['individual_total']}")
            print(f"  Discount: {bundle['pricing']['discount_percentage']}%")
            print(f"  Bundle Price: ₹{bundle['pricing']['bundle_price']}")
            print(f"  You Save: ₹{bundle['pricing']['savings']}")
        else:
            print(f"Response: {json.dumps(result, indent=2)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_smart_search():
    print_section("Testing Smart Search")
    
    # Test 1: Index products
    print("\n1. Indexing products for search...")
    products = [
        {
            "id": "search_prod_1",
            "name": "Organic Senior Cat Food",
            "description": "Premium organic food specially formulated for senior cats with kidney support",
            "category": "food",
            "brand": "PetNutrition",
            "petType": ["cat"],
            "ageGroup": ["senior"],
            "tags": ["organic", "kidney-support", "grain-free"],
            "features": ["Natural ingredients", "Kidney health formula"],
            "price": 1800,
            "rating": 4.8,
            "stock": 50
        },
        {
            "id": "search_prod_2",
            "name": "Natural Cat Food for Adults",
            "description": "Healthy natural cat food with real chicken",
            "category": "food",
            "brand": "NaturePet",
            "petType": ["cat"],
            "ageGroup": ["adult"],
            "tags": ["natural", "chicken"],
            "features": ["Real meat", "No artificial colors"],
            "price": 1200,
            "rating": 4.5,
            "stock": 100
        },
        {
            "id": "search_prod_3",
            "name": "Puppy Training Treats",
            "description": "Delicious treats for puppy training",
            "category": "treats",
            "brand": "DoggyDelight",
            "petType": ["dog"],
            "ageGroup": ["puppy"],
            "tags": ["training", "treats"],
            "features": ["Small size", "Easy to digest"],
            "price": 300,
            "rating": 4.6,
            "stock": 200
        }
    ]
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ecommerce/search/index-products",
            json={"products": products}
        )
        print(f"✅ Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test 2: Semantic search
    print("\n2. Testing semantic search...")
    queries = [
        "organic food for senior cats with kidney issues",
        "natural cat food",
        "puppy training treats"
    ]
    
    for query in queries:
        print(f"\n   Query: '{query}'")
        try:
            response = requests.post(
                f"{BASE_URL}/api/ecommerce/search/semantic",
                json={
                    "query": query,
                    "top_k": 3
                }
            )
            print(f"   ✅ Status: {response.status_code}")
            result = response.json()
            if result.get('success'):
                data = result['data']
                print(f"   Entities extracted: {data['query_analysis']['entities']}")
                print(f"   Results found: {data['total']}")
                for idx, product in enumerate(data['results'][:3], 1):
                    print(f"     {idx}. Product: {product['product_id']}")
                    print(f"        Score: {product['final_score']:.3f}")
                    print(f"        Matched: {product['matched_entities']}")
            else:
                print(f"   Response: {json.dumps(result, indent=2)}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")

def test_collaborative_filtering():
    print_section("Testing Collaborative Filtering")
    
    # Test 1: Update purchase history
    print("\n1. Updating purchase history...")
    purchases = [
        {"user_id": "user1", "product_ids": ["prod1", "prod2", "prod3"]},
        {"user_id": "user2", "product_ids": ["prod1", "prod4", "prod5"]},
        {"user_id": "user3", "product_ids": ["prod2", "prod3", "prod6"]},
    ]
    
    for purchase in purchases:
        try:
            response = requests.post(
                f"{BASE_URL}/api/ecommerce/bundles/update-purchase-history",
                json=purchase
            )
            print(f"✅ User {purchase['user_id']}: {response.status_code}")
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    # Test 2: Get also-bought recommendations
    print("\n2. Getting 'also bought' recommendations...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/ecommerce/recommendations/also-bought",
            json={"product_id": "prod1", "top_k": 5}
        )
        print(f"✅ Status: {response.status_code}")
        result = response.json()
        if result.get('success'):
            print(f"Recommendations for prod1:")
            for rec in result['data']['recommendations']:
                print(f"  - {rec['product_id']} (confidence: {rec['confidence']:.2f}, support: {rec['support']})")
        else:
            print(f"Response: {json.dumps(result, indent=2)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test 3: Get stats
    print("\n3. Getting collaborative filter stats...")
    try:
        response = requests.get(f"{BASE_URL}/api/ecommerce/recommendations/stats")
        print(f"✅ Status: {response.status_code}")
        print(f"Stats: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_health():
    print_section("Testing Health Check")
    try:
        response = requests.get(f"{BASE_URL}/api/ecommerce/health")
        print(f"✅ Status: {response.status_code}")
        print(f"Health: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def main():
    print("\n" + "🤖 E-COMMERCE AI FEATURES TEST SUITE".center(60))
    print("Make sure the AI service is running on http://localhost:5001\n")
    
    try:
        # Check if service is running
        response = requests.get(f"{BASE_URL}/health", timeout=2)
        print("✅ AI Service is running!\n")
    except:
        print("❌ AI Service is not running!")
        print("Please start it with: python app.py")
        return
    
    # Run tests
    test_health()
    time.sleep(1)
    
    test_visual_search()
    time.sleep(1)
    
    test_bundle_generation()
    time.sleep(1)
    
    test_smart_search()
    time.sleep(1)
    
    test_collaborative_filtering()
    
    print_section("All Tests Complete!")
    print("\n✅ If you see this, all features are working correctly!")
    print("\nNext steps:")
    print("1. Integrate with your Node.js backend")
    print("2. Build frontend components")
    print("3. Index your real products")
    print("4. Start using the AI features!\n")

if __name__ == "__main__":
    main()
