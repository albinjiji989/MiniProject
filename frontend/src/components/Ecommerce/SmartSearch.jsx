import React, { useState } from 'react';
import { Search, Sparkles, Loader, Brain, Tag } from 'lucide-react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';

/**
 * Smart Search Component
 * NLP-powered semantic search with natural language understanding
 */
const SmartSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [queryAnalysis, setQueryAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const exampleQueries = [
        'organic food for senior cats with kidney issues',
        'grain-free puppy food for small breeds',
        'natural treats for training dogs',
        'toys for senior cats with arthritis',
        'hypoallergenic food for sensitive stomach'
    ];

    const handleSearch = async (searchQuery = query) => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/ecommerce/ai/search/semantic', {
                query: searchQuery,
                top_k: 20
            });

            if (response.data.success) {
                setResults(response.data.data.results);
                setQueryAnalysis(response.data.data.query_analysis);
            } else {
                setError('Search failed. Please try again.');
            }
        } catch (err) {
            console.error('Semantic search error:', err);
            setError('Failed to search. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleExampleClick = (exampleQuery) => {
        setQuery(exampleQuery);
        handleSearch(exampleQuery);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Brain className="w-8 h-8 text-indigo-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Smart Search</h1>
                </div>
                <p className="text-gray-600">
                    Search using natural language - AI understands what you need
                </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-semibold text-gray-700">
                        AI-Powered Search
                    </span>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Try: organic food for senior cats with kidney issues"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                        />
                    </div>
                    <button
                        onClick={() => handleSearch()}
                        disabled={loading || !query.trim()}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Searching...
                            </>
                        ) : (
                            <>
                                <Search className="w-5 h-5" />
                                Search
                            </>
                        )}
                    </button>
                </div>

                {/* Example Queries */}
                <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Try these examples:</p>
                    <div className="flex flex-wrap gap-2">
                        {exampleQueries.map((example, index) => (
                            <button
                                key={index}
                                onClick={() => handleExampleClick(example)}
                                className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}
            </div>

            {/* Query Understanding */}
            {queryAnalysis && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 mb-8 border border-indigo-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Brain className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-gray-900">AI Understanding</h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {queryAnalysis.entities.pet_type && (
                            <div className="bg-white px-4 py-2 rounded-lg border border-indigo-200">
                                <span className="text-xs text-gray-500">Pet Type</span>
                                <div className="font-semibold text-gray-900 capitalize">
                                    {queryAnalysis.entities.pet_type}
                                </div>
                            </div>
                        )}

                        {queryAnalysis.entities.age_group && (
                            <div className="bg-white px-4 py-2 rounded-lg border border-indigo-200">
                                <span className="text-xs text-gray-500">Age</span>
                                <div className="font-semibold text-gray-900 capitalize">
                                    {queryAnalysis.entities.age_group}
                                </div>
                            </div>
                        )}

                        {queryAnalysis.entities.health_condition && (
                            <div className="bg-white px-4 py-2 rounded-lg border border-indigo-200">
                                <span className="text-xs text-gray-500">Health Condition</span>
                                <div className="font-semibold text-gray-900 capitalize">
                                    {queryAnalysis.entities.health_condition}
                                </div>
                            </div>
                        )}

                        {queryAnalysis.entities.dietary_preference && (
                            <div className="bg-white px-4 py-2 rounded-lg border border-indigo-200">
                                <span className="text-xs text-gray-500">Dietary</span>
                                <div className="font-semibold text-gray-900 capitalize">
                                    {queryAnalysis.entities.dietary_preference}
                                </div>
                            </div>
                        )}

                        {queryAnalysis.entities.category && (
                            <div className="bg-white px-4 py-2 rounded-lg border border-indigo-200">
                                <span className="text-xs text-gray-500">Category</span>
                                <div className="font-semibold text-gray-900 capitalize">
                                    {queryAnalysis.entities.category}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Results */}
            {results.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Search Results ({results.length})
                        </h2>
                        <span className="text-sm text-gray-500">
                            Powered by AI • Sentence-Transformers
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && results.length === 0 && !queryAnalysis && (
                <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        Start searching
                    </h3>
                    <p className="text-gray-500">
                        Use natural language to find exactly what you need
                    </p>
                </div>
            )}

            {/* No Results */}
            {!loading && results.length === 0 && queryAnalysis && (
                <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No products found
                    </h3>
                    <p className="text-gray-500">
                        Try adjusting your search or browse our categories
                    </p>
                </div>
            )}
        </div>
    );
};

// Product Card Component
const ProductCard = ({ product }) => {
    const finalPrice = product.pricing?.salePrice || product.pricing?.basePrice || 0;
    const discount = product.pricing?.salePrice && product.pricing?.basePrice
        ? Math.round(((product.pricing.basePrice - product.pricing.salePrice) / product.pricing.basePrice) * 100)
        : 0;

    return (
        <Link
            to={`/user/ecommerce/product/${product.slug}`}
            className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-200 group"
        >
            <div className="relative">
                <img
                    src={product.images?.[0]?.url || '/placeholder-product.png'}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                />

                {/* Match Score */}
                <div className="absolute top-2 left-2 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {Math.round(product.final_score * 100)}% Match
                </div>

                {discount > 0 && (
                    <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                        {discount}% OFF
                    </div>
                )}
            </div>

            <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 h-10">
                    {product.name}
                </h3>

                {product.attributes?.brand && (
                    <p className="text-xs text-gray-500 mb-2">{product.attributes.brand}</p>
                )}

                {/* Matched Entities */}
                {product.matched_entities && product.matched_entities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {product.matched_entities.slice(0, 3).map((entity, idx) => (
                            <span
                                key={idx}
                                className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1"
                            >
                                <Tag className="w-3 h-3" />
                                {entity.split(':')[1]}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-gray-900">₹{finalPrice.toFixed(0)}</span>
                    {discount > 0 && (
                        <span className="text-sm text-gray-500 line-through">
                            ₹{product.pricing.basePrice.toFixed(0)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default SmartSearch;
