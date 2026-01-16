"""
Test script for AI/ML service
Run this to verify the service is working correctly
"""
import requests
import sys

AI_SERVICE_URL = 'http://localhost:5001'

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f'{AI_SERVICE_URL}/health')
        data = response.json()
        
        if data['success'] and data['status'] == 'healthy':
            print("✅ Health check passed")
            print(f"   Services: {data['services']}")
            return True
        else:
            print("❌ Health check failed")
            return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_home():
    """Test home endpoint"""
    print("\n🔍 Testing home endpoint...")
    try:
        response = requests.get(f'{AI_SERVICE_URL}/')
        data = response.json()
        
        if data['success']:
            print("✅ Home endpoint working")
            print(f"   Version: {data['version']}")
            print(f"   Model: {data['model']}")
            return True
        else:
            print("❌ Home endpoint failed")
            return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("🤖 AI/ML Service Test Suite")
    print("=" * 60)
    
    tests_passed = 0
    total_tests = 2
    
    if test_home():
        tests_passed += 1
    
    if test_health():
        tests_passed += 1
    
    print("\n" + "=" * 60)
    print(f"📊 Results: {tests_passed}/{total_tests} tests passed")
    print("=" * 60)
    
    if tests_passed == total_tests:
        print("✅ All tests passed! Service is ready.")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Please check the service.")
        sys.exit(1)

if __name__ == '__main__':
    main()
