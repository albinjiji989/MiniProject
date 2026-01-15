import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Check } from 'lucide-react';
import ProductBasicInfo from '../../components/Manager/ProductWizard/ProductBasicInfo';
import ProductCategory from '../../components/Manager/ProductWizard/ProductCategory';
import ProductPricing from '../../components/Manager/ProductWizard/ProductPricing';
import ProductImages from '../../components/Manager/ProductWizard/ProductImages';
import ProductSpecifications from '../../components/Manager/ProductWizard/ProductSpecifications';
import ProductInventory from '../../components/Manager/ProductWizard/ProductInventory';
import ProductReview from '../../components/Manager/ProductWizard/ProductReview';

/**
 * Multi-Step Product Wizard - Amazon/Flipkart Style
 * Supports both creating new products and editing existing ones
 */
const AddProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get product ID from URL for edit mode
  const [currentStep, setCurrentStep] = useState(0);
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: null,
    categoryPath: [],
    pricing: { basePrice: 0, salePrice: null },
    images: [],
    specifications: [],
    inventory: { sku: '', stock: 0, trackInventory: true },
    petType: ['all'],
    attributes: {},
    tags: []
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [productId, setProductId] = useState(id || null);

  const steps = [
    { id: 0, name: 'Basic Info', component: ProductBasicInfo },
    { id: 1, name: 'Category', component: ProductCategory },
    { id: 2, name: 'Pricing', component: ProductPricing },
    { id: 3, name: 'Images', component: ProductImages },
    { id: 4, name: 'Specifications', component: ProductSpecifications },
    { id: 5, name: 'Inventory', component: ProductInventory },
    { id: 6, name: 'Review', component: ProductReview }
  ];

  const CurrentStepComponent = steps[currentStep].component;

  // Load existing product data when editing
  useEffect(() => {
    if (id) {
      loadProductData();
    }
  }, [id]);

  const loadProductData = async () => {
    try {
      setInitialLoading(true);
      const response = await api.get(`/ecommerce/manager/products/${id}`);
      const product = response.data.data;
      
      setProductData({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        category: product.category?._id || null,
        categoryPath: product.categoryPath || [],
        pricing: product.pricing || { basePrice: 0, salePrice: null },
        images: product.images || [],
        specifications: product.specifications || [],
        inventory: product.inventory || { sku: '', stock: 0, trackInventory: true },
        petType: product.petType || ['all'],
        attributes: product.attributes || {},
        tags: product.tags || []
      });
    } catch (error) {
      console.error('Error loading product:', error);
      alert('Failed to load product data');
      navigate('/manager/ecommerce/products');
    } finally {
      setInitialLoading(false);
    }
  };

  const cleanDataForUpdate = (data) => {
    // Remove undefined, null, and empty string values
    const cleaned = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Recursively clean nested objects
          const cleanedNested = cleanDataForUpdate(value);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else if (Array.isArray(value) && value.length > 0) {
          cleaned[key] = value;
        } else if (typeof value !== 'object') {
          cleaned[key] = value;
        }
      }
    });
    return cleaned;
  };

  const handleNext = async (stepData) => {
    const updatedData = { ...productData, ...stepData };
    setProductData(updatedData);

    if (currentStep === 0 && !productId) {
      // Create draft product after basic info
      try {
        setLoading(true);
        const cleanedData = cleanDataForUpdate(updatedData);
        const response = await api.post('/ecommerce/manager/products', cleanedData);
        setProductId(response.data.data._id);
      } catch (error) {
        console.error('Error creating product:', error);
        const errorMsg = error.response?.data?.message || 'Failed to create product';
        alert(errorMsg);
        return;
      } finally {
        setLoading(false);
      }
    } else if (productId) {
      // Update existing product
      try {
        setLoading(true);
        const cleanedData = cleanDataForUpdate(updatedData);
        await api.put(`/ecommerce/manager/products/${productId}`, cleanedData);
      } catch (error) {
        console.error('Error updating product:', error);
        const errorMsg = error.response?.data?.message || 'Failed to update product';
        alert(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
 
 const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      await api.patch(`/ecommerce/manager/products/${productId}/status`, {
        status: 'active'
      });
      alert('Product published successfully!');
      navigate('/manager/ecommerce/products');
    } catch (error) {
      console.error('Error publishing product:', error);
      alert('Failed to publish product');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {id ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="text-gray-600">
          {id ? 'Update your product information' : 'Follow the steps to create your product listing'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    index < currentStep
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className={`text-xs mt-2 ${
                  index === currentStep ? 'text-blue-600 font-semibold' : 'text-gray-600'
                }`}>
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${
                  index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <CurrentStepComponent
          data={productData}
          onNext={handleNext}
          onBack={handleBack}
          onPublish={handlePublish}
          loading={loading}
          isFirstStep={currentStep === 0}
          isLastStep={currentStep === steps.length - 1}
        />
      </div>
    </div>
  );
};

export default AddProduct;
