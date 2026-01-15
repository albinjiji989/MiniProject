import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { api } from '../../../services/api';

const ProductCategory = ({ data, onNext, onBack }) => {
  const [categories, setCategories] = useState([]);
  const [selectedPath, setSelectedPath] = useState(data.categoryPath || []);
  const [selectedCategory, setSelectedCategory] = useState(data.category || null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ecommerce/manager/categories/tree');
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const selectCategory = (category, path) => {
    setSelectedCategory(category._id);
    setSelectedPath(path);
  };

  const renderCategoryTree = (cats, path = []) => {
    return cats.map((cat) => {
      const currentPath = [...path, cat];
      const isExpanded = expandedCategories.has(cat._id);
      const isSelected = selectedCategory === cat._id;
      const hasChildren = cat.children && cat.children.length > 0;

      return (
        <div key={cat._id} className="ml-4">
          <div
            className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
              isSelected
                ? 'bg-blue-100 border-2 border-blue-500'
                : 'hover:bg-gray-100 border-2 border-transparent'
            }`}
            onClick={() => selectCategory(cat, currentPath)}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(cat._id);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isExpanded ? 'transform rotate-0' : 'transform -rotate-90'
                  }`}
                />
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            
            {isExpanded ? (
              <FolderOpen className="w-5 h-5 text-blue-600" />
            ) : (
              <Folder className="w-5 h-5 text-gray-600" />
            )}
            
            <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
              {cat.name}
            </span>
            
            {cat.productCount > 0 && (
              <span className="text-xs text-gray-500">({cat.productCount})</span>
            )}
          </div>

          {hasChildren && isExpanded && (
            <div className="mt-1">
              {renderCategoryTree(cat.children, currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      setError('Please select a category');
      return;
    }
    onNext({
      category: selectedCategory,
      categoryPath: selectedPath.map(c => c._id)
    });
  };

  if (loading) {
    return <div className="text-center py-12">Loading categories...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Category</h2>
        <p className="text-gray-600">Choose the most specific category for your product</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Selected Path Breadcrumb */}
      {selectedPath.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Selected Category Path:</p>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedPath.map((cat, index) => (
              <React.Fragment key={cat._id}>
                <span className="text-blue-700 font-medium">{cat.name}</span>
                {index < selectedPath.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Category Tree */}
      <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
        {categories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No categories available</p>
        ) : (
          renderCategoryTree(categories)
        )}
      </div>

      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <button
          type="submit"
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};

export default ProductCategory;
