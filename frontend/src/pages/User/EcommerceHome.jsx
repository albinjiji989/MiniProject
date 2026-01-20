import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ChevronRight, Star, TrendingUp, Zap } from 'lucide-react';

/**
 * User Ecommerce Home - Flipkart Style
 */
const EcommerceHome = () => {
    const [categories, setCategories] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHomeData();
    }, []);

    const fetchHomeData = async () => {
        try {
            setLoading(true);
            const [categoriesRes, featuredRes, dealsRes] = await Promise.all([
                api.get('/ecommerce/categories?parent=root&limit=8'),
                api.get('/ecommerce/products/featured?limit=12'),
                api.get('/ecommerce/products/deals?limit=8')
            ]);

            setCategories(categoriesRes.data.data || []);

            // If no featured products, fetch all active products
            let featured = featuredRes.data.data || [];
            if (featured.length === 0) {
                const allProductsRes = await api.get('/ecommerce/products?limit=12&sortBy=newest');
                featured = allProductsRes.data.data || [];
            }
            setFeaturedProducts(featured);

            setDeals(dealsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching home data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <div className="max-w-7xl mx-auto px-4 py-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Everything Your Pet Needs
                    </h1>
                    <p className="text-xl mb-8 text-blue-100">
                        Quality products at unbeatable prices
                    </p>
                    <Link
                        to="/user/ecommerce/shop"
                        className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                    >
                        Shop Now
                    </Link>
                </div>
            </div>

            {/* AI Features Section */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="w-8 h-8 text-purple-600" />
                        <h2 className="text-2xl font-bold text-gray-900">AI-Powered Shopping</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Visual Search */}
                        <Link
                            to="/user/ecommerce/visual-search"
                            className="bg-white rounded-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-300"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Visual Search</h3>
                            </div>
                            <p className="text-gray-600 mb-4">
                                Upload a photo to find similar products instantly
                            </p>
                            <div className="flex items-center text-purple-600 font-semibold">
                                Try it now <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                        </Link>

                        {/* Bundle Generator */}
                        <Link
                            to="/user/ecommerce/bundle-generator"
                            className="bg-white rounded-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-300"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Gift className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Bundle Generator</h3>
                            </div>
                            <p className="text-gray-600 mb-4">
                                Get personalized starter kits for your pet
                            </p>
                            <div className="flex items-center text-blue-600 font-semibold">
                                Create bundle <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                        </Link>

                        {/* Smart Search */}
                        <Link
                            to="/user/ecommerce/smart-search"
                            className="bg-white rounded-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-300"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <Brain className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Smart Search</h3>
                            </div>
                            <p className="text-gray-600 mb-4">
                                Search using natural language - AI understands you
                            </p>
                            <div className="flex items-center text-indigo-600 font-semibold">
                                Search now <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
                    <Link to="/user/ecommerce/categories" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        View All <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {categories.map((category) => (
                        <Link
                            key={category._id}
                            to={`/user/ecommerce/shop?category=${category._id}`}
                            className="bg-white rounded-lg p-4 text-center hover:shadow-lg transition-shadow"
                        >
                            {category.image ? (
                                <img
                                    src={category.image}
                                    alt={category.name}
                                    className="w-16 h-16 mx-auto mb-2 object-cover rounded-full"
                                />
                            ) : (
                                <div className="w-16 h-16 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">{category.icon || '📦'}</span>
                                </div>
                            )}
                            <p className="text-sm font-medium text-gray-900">{category.name}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Deals of the Day */}
            {deals.length > 0 && (
                <div className="bg-white py-12">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                            <h2 className="text-2xl font-bold text-gray-900">Deals of the Day</h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {deals.map((product) => (
                                <ProductCard key={product._id} product={product} showDiscount />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Featured Products */}
            {featuredProducts.length > 0 ? (
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                        <h2 className="text-2xl font-bold text-gray-900">
                            {deals.length === 0 ? 'Latest Products' : 'Featured Products'}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {featuredProducts.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <Link
                            to="/user/ecommerce/shop"
                            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            View All Products
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">🛍️</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Products Yet</h3>
                        <p className="text-gray-600 mb-6">
                            Products will appear here once they are added by store managers
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// Product Card Component
const ProductCard = ({ product, showDiscount }) => {
    const finalPrice = product.pricing?.salePrice || product.pricing?.basePrice || 0;
    const discount = product.pricing?.salePrice && product.pricing?.basePrice
        ? Math.round(((product.pricing.basePrice - product.pricing.salePrice) / product.pricing.basePrice) * 100)
        : 0;

    return (
        <Link
            to={`/user/ecommerce/product/${product.slug}`}
            className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-200"
        >
            <div className="relative">
                <img
                    src={product.images?.[0]?.url || '/placeholder-product.png'}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                />
                {discount > 0 && showDiscount && (
                    <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                        {discount}% OFF
                    </div>
                )}
                {product.isBestseller && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                        Bestseller
                    </div>
                )}
            </div>

            <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 h-10">
                    {product.name}
                </h3>

                {product.attributes?.brand && (
                    <p className="text-xs text-gray-500 mb-2">{product.attributes.brand}</p>
                )}

                <div className="flex items-center gap-1 mb-2">
                    {product.ratings?.average > 0 && (
                        <>
                            <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                                <span className="font-semibold">{product.ratings.average.toFixed(1)}</span>
                                <Star className="w-3 h-3 fill-white" />
                            </div>
                            <span className="text-xs text-gray-500">({product.ratings.count})</span>
                        </>
                    )}
                </div>

                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-gray-900">₹{finalPrice.toFixed(0)}</span>
                    {discount > 0 && (
                        <>
                            <span className="text-sm text-gray-500 line-through">
                                ₹{product.pricing.basePrice.toFixed(0)}
                            </span>
                            <span className="text-xs text-green-600 font-semibold">{discount}%</span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default EcommerceHome;
