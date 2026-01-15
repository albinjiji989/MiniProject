import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Edit, Trash2, Folder, FolderOpen, ChevronRight } from 'lucide-react';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parent: null
    });

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
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.put(`/ecommerce/manager/categories/${editingCategory._id}`, formData);
            } else {
                await api.post('/ecommerce/manager/categories', formData);
            }
            setShowForm(false);
            setEditingCategory(null);
            setFormData({ name: '', description: '', parent: null });
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Failed to save category');
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Are you sure? This will delete the category.')) return;
        try {
            await api.delete(`/ecommerce/manager/categories/${id}`);
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert(error.response?.data?.message || 'Failed to delete category');
        }
    };

    const renderCategoryTree = (cats, level = 0) => {
        return cats.map((cat) => (
            <div key={cat._id} className="ml-4">
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg mb-2 hover:border-blue-500">
                    <div className="flex items-center gap-3">
                        {cat.hasChildren ? <FolderOpen className="w-5 h-5 text-blue-600" /> : <Folder className="w-5 h-5 text-gray-600" />}
                        <div>
                            <p className="font-medium text-gray-900">{cat.name}</p>
                            {cat.description && <p className="text-sm text-gray-600">{cat.description}</p>}
                            <p className="text-xs text-gray-500">Level {cat.level} • {cat.productCount} products</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setFormData({ name: '', description: '', parent: cat._id });
                                setShowForm(true);
                            }}
                            className="text-green-600 hover:text-green-700 p-2"
                            title="Add subcategory"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                setEditingCategory(cat);
                                setFormData({ name: cat.name, description: cat.description || '', parent: cat.parent });
                                setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 p-2"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(cat._id)}
                            className="text-red-600 hover:text-red-700 p-2"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {cat.children && cat.children.length > 0 && (
                    <div className="ml-6 border-l-2 border-gray-200 pl-2">
                        {renderCategoryTree(cat.children, level + 1)}
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Category Management</h1>
                    <p className="text-gray-600">Organize your products with categories</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ name: '', description: '', parent: null });
                        setEditingCategory(null);
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Add Root Category
                </button>
            </div>

            {/* Category Tree */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : categories.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories yet</h3>
                    <p className="text-gray-600 mb-6">Create your first category to organize products</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Create Category
                    </button>
                </div>
            ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                    {renderCategoryTree(categories)}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            {editingCategory ? 'Edit Category' : 'Add Category'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Dog Food, Pet Toys"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Brief description of this category"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingCategory(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingCategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManagement;
