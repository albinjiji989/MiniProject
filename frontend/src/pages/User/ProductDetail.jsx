import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Star, ShoppingCart, Heart, Share2, ChevronRight, Truck, Shield, RotateCcw } from 'lucide-react';
import ProductReviews from '../../components/User/ProductReviews';
import { getSessionId, getDeviceType } from '../../utils/session';

/**
 * Product Detail Page - Flipkart Style
 */
const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ecommerce/products/${slug}`);
      const productData = response.data.data;
      setProduct(productData);
      
      // Track product view for AI recommendations
      if (productData?._id) {
        trackProductView(productData._id);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackProductView = async (productId) => {
    try {
      await api.post(`/ecommerce/products/${productId}/view`, {
        source: 'direct',
        deviceType: getDeviceType(),
        sessionId: getSessionId()
      });
    } catch (error) {
      // Silently fail - don't disrupt user experience
      console.debug('View tracking failed:', error);
    }
  };

  const handleBuyNow = () => {
    navigate('/user/ecommerce/checkout', {
      state: {
        product,
        quantity
      }
    });
  };

  const handleAddToCart = async () => {
    try {
      await api.post('/ecommerce/cart', {
        productId: product._id,
        quantity
      });
      alert('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
    }
  };

  const handleAddToWishlist = async () => {
    try {
      await api.post('/ecommerce/wishlist', {
        productId: product._id
      });
      alert('Added to wishlist!');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
        <Link to="/shop" className="text-blue-600 hover:text-blue-700">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const finalPrice = product.pricing?.salePrice || product.pricing?.basePrice || 0;
  const discount = product.pricing?.salePrice && product.pricing?.basePrice
    ? Math.round(((product.pricing.basePrice - product.pricing.salePrice) / product.pricing.basePrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-4 h-4" />
            {product.categoryPath?.map((cat, index) => (
              <React.Fragment key={cat._id}>
                <Link to={`/shop?category=${cat._id}`} className="hover:text-blue-600">
                  {cat.name}
                </Link>
                {index < product.categoryPath.length - 1 && <ChevronRight className="w-4 h-4" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Images */}
          <div className="bg-white rounded-lg p-6">
            <div className="mb-4">
              <img
                src={product.images?.[selectedImage]?.url || '/placeholder-product.png'}
                alt={product.name}
                className="w-full h-96 object-contain"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden ${
                      selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-2 bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                ADD TO CART
              </button>
              <button
                onClick={handleBuyNow}
                className="flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                BUY NOW
              </button>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="bg-white rounded-lg p-6 mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
              {product.shortDescription && (
                <p className="text-gray-600 mb-4">{product.shortDescription}</p>
              )}

              {/* Rating */}
              {product.ratings?.average > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded">
                    <span className="font-semibold">{product.ratings.average.toFixed(1)}</span>
                    <Star className="w-4 h-4 fill-white" />
                  </div>
                  <span className="text-gray-600">
                    {product.ratings.count} ratings & reviews
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold text-gray-900">₹{finalPrice.toFixed(2)}</span>
                  {discount > 0 && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ₹{product.pricing.basePrice.toFixed(2)}
                      </span>
                      <span className="text-green-600 font-semibold text-lg">{discount}% off</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600">Inclusive of all taxes</p>
              </div>

              {/* Brand */}
              {product.attributes?.brand && (
                <div className="mb-4">
                  <span className="text-gray-600">Brand: </span>
                  <span className="font-semibold text-gray-900">{product.attributes.brand}</span>
                </div>
              )}

              {/* Pet Type */}
              {product.petType && product.petType.length > 0 && (
                <div className="mb-4">
                  <span className="text-gray-600">Suitable for: </span>
                  <span className="font-semibold text-gray-900">
                    {product.petType.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
                  </span>
                </div>
              )}

              {/* Stock Status */}
              <div className="mb-6">
                {product.inventory?.stock > 0 ? (
                  <span className="text-green-600 font-semibold">In Stock</span>
                ) : (
                  <span className="text-red-600 font-semibold">Out of Stock</span>
                )}
              </div>

              {/* Quantity Selector */}
              {product.inventory?.stock > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {[...Array(Math.min(10, product.inventory.stock))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Wishlist & Share */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToWishlist}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Heart className="w-5 h-5" />
                  Wishlist
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Delivery & Services</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700">Free Delivery on orders above ₹499</span>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700">7 Days Return Policy</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700">100% Authentic Products</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description & Specifications */}
        <div className="bg-white rounded-lg p-6 mb-8">
          <div className="border-b border-gray-200 mb-6">
            <h2 className="text-xl font-bold text-gray-900 pb-4">Product Description</h2>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
          </div>
        </div>

        {/* Specifications */}
        {product.specifications && product.specifications.length > 0 && (
          <div className="bg-white rounded-lg p-6 mb-8">
            <div className="border-b border-gray-200 mb-6">
              <h2 className="text-xl font-bold text-gray-900 pb-4">Specifications</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.specifications.map((spec, index) => (
                <div key={index} className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">{spec.name}</span>
                  <span className="text-gray-900">{spec.value} {spec.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="bg-white rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {product.relatedProducts.map((related) => (
                <Link
                  key={related._id}
                  to={`/product/${related.slug}`}
                  className="border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-shadow"
                >
                  <img
                    src={related.images?.[0]?.url || '/placeholder-product.png'}
                    alt={related.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {related.name}
                  </h3>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{(related.pricing?.salePrice || related.pricing?.basePrice || 0).toFixed(0)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Customer Reviews */}
        <ProductReviews productId={product._id} />
      </div>
    </div>
  );
};

export default ProductDetail;
