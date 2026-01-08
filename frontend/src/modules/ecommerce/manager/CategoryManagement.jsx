import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent: null,
    displayOrder: 0
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/ecommerce/manager/categories/tree`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingId 
        ? `${API_URL}/ecommerce/manager/categories/${editingId}`
        : `${API_URL}/ecommerce/manager/categories`;
      
      const method = editingId ? 'put' : 'post';
      
      const response = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(editingId ? 'Category updated!' : 'Category created!');
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', description: '', parent: null, displayOrder: 0 });
        fetchCategories();
      }
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      parent: category.parent?._id || null,
      displayOrder: category.displayOrder || 0
    });
    setEditingId(category._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/ecommerce/manager/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Category deleted!');
      fetchCategories();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const renderCategoryTree = (categories, level = 0) => {
    return categories.map((category) => (
      <div key={category._id}>
        <div
          className={`flex items-center justify-between p-3 border-b hover:bg-gray-50`}
          style={{ paddingLeft: `${level * 2 + 1}rem` }}
        >
          <div>
            <span className="font-medium">{category.name}</span>
            <span className="text-xs text-gray-500 ml-2">Level {category.level}</span>
            {category.productCount > 0 && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {category.productCount} products
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(category)}
              className="text-indigo-600 hover:text-indigo-900 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(category._id)}
              className="text-red-600 hover:text-red-900 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
        {category.children && category.children.length > 0 && renderCategoryTree(category.children, level + 1)}
      </div>
    ));
  };

  const getAllCategoriesFlat = (categories, result = []) => {
    categories.forEach(cat => {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        getAllCategoriesFlat(cat.children, result);
      }
    });
    return result;
  };

  const flatCategories = getAllCategoriesFlat(categories);

  if (loading) {
    return <div className="text-center py-8">Loading categories...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Category Management</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: '', description: '', parent: null, displayOrder: 0 });
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : '+ Add Category'}
        </button>
      </div>

      {showForm && (
        <div className="p-6 border-b bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Category' : 'New Category'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Dog Food"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category</label>
                <select
                  value={formData.parent || ''}
                  onChange={(e) => setFormData({ ...formData, parent: e.target.value || null })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">None (Top Level)</option>
                  {flatCategories.map((cat) => (
                    <option key={cat._id} value={cat._id} disabled={cat._id === editingId}>
                      {'—'.repeat(cat.level)} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              {editingId ? 'Update Category' : 'Create Category'}
            </button>
          </form>
        </div>
      )}

      <div className="divide-y">
        {categories.length > 0 ? (
          renderCategoryTree(categories)
        ) : (
          <div className="text-center py-12 text-gray-500">
            No categories yet. Create your first category!
          </div>
        )}
      </div>
    </div>
  );
}
