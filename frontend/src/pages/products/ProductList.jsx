import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import ProductFormModal from '../../components/products/ProductFormModal';
import ProductDetailsModal from '../../components/products/ProductDetailsModal';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Archive,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Info
} from 'lucide-react';

const ProductList = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Products state
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [summaryStats, setSummaryStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Deletion blocked warning alert modal
  const [blockedAlert, setBlockedAlert] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchProducts = async (page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 8);
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('productType', typeFilter);

      const [prodRes, statsRes] = await Promise.all([
        api.get(`/products?${params.toString()}`),
        api.get('/products/stats/summary')
      ]);

      if (prodRes.data.success) {
        setProducts(prodRes.data.products);
        setTotalProducts(prodRes.data.totalProducts);
        setTotalPages(prodRes.data.totalPages);
        setCurrentPage(prodRes.data.currentPage);
      }

      if (statsRes.data.success) {
        setSummaryStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailsModal = (product) => {
    setSelectedProduct(product);
    setIsDetailsModalOpen(true);
  };

  const handleSaveProduct = async (formData, productId) => {
    if (productId) {
      await api.put(`/products/${productId}`, formData);
      setToastMessage('Product updated successfully');
    } else {
      await api.post('/products', formData);
      setToastMessage('New product created successfully');
    }
    fetchProducts(currentPage);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete '${product.name}'?`)) return;

    try {
      const res = await api.delete(`/products/${product._id}`);
      if (res.data.success) {
        setToastMessage(`Product '${product.name}' deleted successfully`);
        fetchProducts(currentPage);
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      // Catch active subscription deletion block
      if (err.response?.status === 400 && err.response?.data?.canArchive) {
        setBlockedAlert({
          product,
          message: err.response.data.message,
          activeSubscriptionsCount: err.response.data.activeSubscriptionsCount
        });
      } else {
        alert(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  const handleArchiveProduct = async (product) => {
    try {
      const res = await api.patch(`/products/${product._id}/archive`);
      if (res.data.success) {
        setBlockedAlert(null);
        setToastMessage(`Product '${product.name}' safely archived`);
        fetchProducts(currentPage);
        setTimeout(() => setToastMessage(''), 3500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Module 3: Product Management
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs font-semibold text-slate-600">
              {isAdmin ? 'Admin Full Access' : 'Staff View Only'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Products & Subscription Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage reusable products, dynamic variants (Brand, Edition), and automatic price calculations.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Success Toast */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Catalog</span>
          <p className="text-2xl font-extrabold text-slate-900">{summaryStats?.totalProducts ?? 0}</p>
          <span className="text-[11px] text-slate-500">Products & Add-ons</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">Active for Sale</span>
          <p className="text-2xl font-extrabold text-emerald-600">{summaryStats?.activeProducts ?? 0}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Available for subscriptions</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block mb-1">Archived Safe</span>
          <p className="text-2xl font-extrabold text-purple-600">{summaryStats?.archivedProducts ?? 0}</p>
          <span className="text-[11px] text-slate-400">Preserved for active subs</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Draft Products</span>
          <p className="text-2xl font-extrabold text-slate-700">{summaryStats?.draftProducts ?? 0}</p>
          <span className="text-[11px] text-slate-400">Under preparation</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, description, variant (e.g. Odoo)..."
            className="w-full pl-9 pr-20 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Archived">Archived</option>
            <option value="Draft">Draft</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Types</option>
            <option value="Software">Software</option>
            <option value="Service">Service</option>
            <option value="Add-on">Add-on</option>
            <option value="Subscription Plan">Subscription Plan</option>
            <option value="Hardware">Hardware</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Fetching catalog products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-2">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No products found</p>
            <p className="text-slate-400">Try adjusting your search query or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Base Pricing</th>
                  <th className="px-6 py-3.5">Configured Variants</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => {
                  const sym = prod.currencySymbol || '₹';
                  const base = prod.salesPrice || 0;
                  const cost = prod.costPrice || 0;
                  const margin = base > 0 ? Math.round(((base - cost) / base) * 100) : 0;

                  return (
                    <tr key={prod._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Image */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 font-bold flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{prod.name}</p>
                            <p className="text-slate-400 text-[11px] line-clamp-1 max-w-xs mt-0.5">
                              {prod.description || 'No description provided.'}
                            </p>
                            {prod.activeSubscriptionsCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold border border-amber-200 mt-1">
                                <ShieldAlert className="w-3 h-3" />
                                <span>{prod.activeSubscriptionsCount} active subscription(s)</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Product Type */}
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {prod.productType}
                        </span>
                      </td>

                      {/* Pricing & Margin */}
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-slate-900 text-sm">
                          {sym}{base.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Cost: {sym}{cost} &middot; <span className="text-emerald-600 font-semibold">{margin}% margin</span>
                        </p>
                      </td>

                      {/* Variants & Options */}
                      <td className="px-6 py-4">
                        {prod.variants && prod.variants.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {prod.variants.map((v, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium border border-blue-200"
                              >
                                <strong>{v.name}:</strong>
                                <span>{v.options?.length || 0} options</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No variants</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            prod.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : prod.status === 'Archived'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : prod.status === 'Draft'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              prod.status === 'Active'
                                ? 'bg-emerald-600'
                                : prod.status === 'Archived'
                                ? 'bg-purple-600'
                                : prod.status === 'Draft'
                                ? 'bg-slate-500'
                                : 'bg-red-600'
                            }`}
                          />
                          {prod.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View & Calculate (Staff & Admin) */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetailsModal(prod)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Details & Price Calculator"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Admin Only Actions */}
                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(prod)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit Product"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {prod.status !== 'Archived' && (
                                <button
                                  type="button"
                                  onClick={() => handleArchiveProduct(prod)}
                                  className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="Safe Archive"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span>
              Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalProducts} total products)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fetchProducts(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => fetchProducts(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Safe Deletion Protection Modal Alert */}
      {blockedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Deletion Blocked by System</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {blockedAlert.message}
              </p>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-left text-xs text-purple-900">
              <p className="font-semibold flex items-center gap-1">
                <Archive className="w-3.5 h-3.5" />
                <span>Recommended Action: Safe Archiving</span>
              </p>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Archiving marks the product as retired so existing subscribers continue to be billed without contract disruption.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBlockedAlert(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleArchiveProduct(blockedAlert.product)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-500/20"
              >
                Archive Product Instead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal (Create / Edit) */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSaved={handleSaveProduct}
        initialData={editingProduct}
      />

      {/* Product Details & Variant Calculator Modal */}
      <ProductDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
};

export default ProductList;

