import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, Filter, Edit2, Trash2, Calendar, Package, TrendingUp, TrendingDown, Download, X, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export function PurchaseSalesManagement() {
  const { purchases, sales, suppliers, addPurchase, addSale, updatePurchase, updateSale, deletePurchase, deleteSale, loading, error } = useApp();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>('purchases');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false);
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const [editingSale, setEditingSale] = useState<any>(null);

  const [newPurchase, setNewPurchase] = useState({
    productName: '',
    category: 'vegetables' as const,
    supplierId: '',
    quantity: 0,
    unit: '',
    purchasePricePerUnit: 0,
    invoiceNumber: '',
    notes: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const [newSale, setNewSale] = useState({
    productName: '',
    category: 'prepared_food' as const,
    quantity: 0,
    unit: '',
    salePricePerUnit: 0,
    customerName: '',
    customerPhone: '',
    paymentMethod: 'cash' as const,
    notes: '',
    saleDate: new Date().toISOString().split('T')[0]
  });

  // Get unique product names from purchases for sales dropdown
  const purchasedProducts = [...new Set(purchases.map(p => p.product_name))].sort();

  const categories = ['all', 'vegetables', 'meat', 'dairy', 'spices', 'grains', 'other', 'prepared_food', 'beverages'];

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || purchase.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || sale.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddPurchase = async () => {
    try {
      if (!newPurchase.productName.trim()) {
        alert('Please enter a product name');
        return;
      }
      
      if (!newPurchase.supplierId) {
        alert('Please select a supplier');
        return;
      }
      
      if (newPurchase.quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
      }
      
      if (newPurchase.purchasePricePerUnit <= 0) {
        alert('Please enter a valid price per unit');
        return;
      }

      const purchaseData = {
        product_name: newPurchase.productName.trim(),
        category: newPurchase.category,
        supplier_id: newPurchase.supplierId,
        quantity: newPurchase.quantity,
        unit: newPurchase.unit.trim(),
        purchase_price_per_unit: newPurchase.purchasePricePerUnit,
        total_purchase_cost: newPurchase.quantity * newPurchase.purchasePricePerUnit,
        purchase_date: newPurchase.purchaseDate,
        invoice_number: newPurchase.invoiceNumber.trim() || null,
        notes: newPurchase.notes.trim(),
        created_by: user?.name || 'Unknown User'
      };

      await addPurchase(purchaseData);
      
      // Reset form
      setNewPurchase({
        productName: '',
        category: 'vegetables',
        supplierId: '',
        quantity: 0,
        unit: '',
        purchasePricePerUnit: 0,
        invoiceNumber: '',
        notes: '',
        purchaseDate: new Date().toISOString().split('T')[0]
      });
      
      setShowAddPurchaseModal(false);
      alert('✅ Purchase record added successfully!');
      
    } catch (error) {
      console.error('Error adding purchase:', error);
      alert('❌ Error adding purchase record. Please try again.');
    }
  };

  const handleAddSale = async () => {
    try {
      if (!newSale.productName.trim()) {
        alert('Please enter a product name');
        return;
      }
      
      if (newSale.quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
      }
      
      if (newSale.salePricePerUnit <= 0) {
        alert('Please enter a valid price per unit');
        return;
      }

      const saleData = {
        product_name: newSale.productName.trim(),
        category: newSale.category,
        quantity: newSale.quantity,
        unit: newSale.unit.trim(),
        sale_price_per_unit: newSale.salePricePerUnit,
        total_sale_amount: newSale.quantity * newSale.salePricePerUnit,
        sale_date: newSale.saleDate,
        customer_name: newSale.customerName.trim() || null,
        customer_phone: newSale.customerPhone.trim() || null,
        payment_method: newSale.paymentMethod,
        notes: newSale.notes.trim(),
        created_by: user?.name || 'Unknown User'
      };

      await addSale(saleData);
      
      // Reset form
      setNewSale({
        productName: '',
        category: 'prepared_food',
        quantity: 0,
        unit: '',
        salePricePerUnit: 0,
        customerName: '',
        customerPhone: '',
        paymentMethod: 'cash',
        notes: '',
        saleDate: new Date().toISOString().split('T')[0]
      });
      
      setShowAddSaleModal(false);
      alert('✅ Sale record added successfully!');
      
    } catch (error) {
      console.error('Error adding sale:', error);
      alert('❌ Error adding sale record. Please try again.');
    }
  };

  const handleDeletePurchase = async (purchase: any) => {
    if (confirm(`Are you sure you want to delete this purchase record for "${purchase.product_name}"?`)) {
      try {
        await deletePurchase(purchase.id);
        alert('✅ Purchase record deleted successfully!');
      } catch (error) {
        console.error('Error deleting purchase:', error);
        alert('❌ Error deleting purchase record. Please try again.');
      }
    }
  };

  const handleDeleteSale = async (sale: any) => {
    if (confirm(`Are you sure you want to delete this sale record for "${sale.product_name}"?`)) {
      try {
        await deleteSale(sale.id);
        alert('✅ Sale record deleted successfully!');
      } catch (error) {
        console.error('Error deleting sale:', error);
        alert('❌ Error deleting sale record. Please try again.');
      }
    }
  };

  const handleProductSelect = (productName: string) => {
    if (productName && purchases.length > 0) {
      // Find the most recent purchase of this product to get default values
      const recentPurchase = purchases
        .filter(p => p.product_name === productName)
        .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())[0];
      
      if (recentPurchase) {
        setNewSale(prev => ({
          ...prev,
          productName: productName,
          category: recentPurchase.category,
          unit: recentPurchase.unit,
          // Set a suggested sale price (cost + 40% markup)
          salePricePerUnit: Math.round(recentPurchase.purchase_price_per_unit * 1.4)
        }));
      }
    } else {
      setNewSale(prev => ({
        ...prev,
        productName: productName
      }));
    }
  };

  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.total_purchase_cost, 0);
  const totalSales = filteredSales.reduce((sum, s) => sum + s.total_sale_amount, 0);
  const profit = totalSales - totalPurchases;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading purchase and sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase & Sales Management</h2>
          <p className="text-gray-600">Track purchases from suppliers and sales to customers</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddPurchaseModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Purchase</span>
          </button>
          <button
            onClick={() => setShowAddSaleModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Sale</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalPurchases.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalSales.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`h-6 w-6 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Profit/Loss</p>
              <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.abs(profit).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Products</p>
              <p className="text-2xl font-bold text-gray-900">{purchasedProducts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'purchases'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Purchases ({purchases.length})
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sales'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sales ({sales.length})
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none bg-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'purchases' ? (
            <div className="space-y-4">
              {filteredPurchases.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No purchase records found</p>
                  <p className="text-sm text-gray-400">Add your first purchase record to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPurchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{purchase.product_name}</div>
                              {purchase.invoice_number && (
                                <div className="text-sm text-gray-500">Invoice: {purchase.invoice_number}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                              {purchase.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {purchase.supplier?.name || 'Unknown Supplier'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {purchase.quantity} {purchase.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{purchase.purchase_price_per_unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{purchase.total_purchase_cost.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(purchase.purchase_date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingPurchase(purchase)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="Edit Purchase"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePurchase(purchase)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Delete Purchase"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No sale records found</p>
                  <p className="text-sm text-gray-400">Add your first sale record to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{sale.product_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full capitalize">
                              {sale.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {sale.customer_name || 'Walk-in Customer'}
                              {sale.customer_phone && (
                                <div className="text-sm text-gray-500">{sale.customer_phone}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sale.quantity} {sale.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{sale.sale_price_per_unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{sale.total_sale_amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full capitalize">
                              {sale.payment_method}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(sale.sale_date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingSale(sale)}
                                className="text-green-600 hover:text-green-900 transition-colors"
                                title="Edit Sale"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSale(sale)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Delete Sale"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Purchase Modal */}
      {showAddPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Purchase Record</h3>
              <button
                onClick={() => setShowAddPurchaseModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPurchase.productName}
                    onChange={(e) => setNewPurchase({...newPurchase, productName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newPurchase.category}
                    onChange={(e) => setNewPurchase({...newPurchase, category: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="vegetables">Vegetables</option>
                    <option value="meat">Meat</option>
                    <option value="dairy">Dairy</option>
                    <option value="spices">Spices</option>
                    <option value="grains">Grains</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newPurchase.supplierId}
                    onChange={(e) => setNewPurchase({...newPurchase, supplierId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.filter(s => s.is_active !== false).map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPurchase.quantity}
                      onChange={(e) => setNewPurchase({...newPurchase, quantity: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newPurchase.unit}
                      onChange={(e) => setNewPurchase({...newPurchase, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Unit</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="pieces">Pieces</option>
                      <option value="liters">Liters (L)</option>
                      <option value="ml">Milliliters (ml)</option>
                      <option value="packets">Packets</option>
                      <option value="boxes">Boxes</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Unit (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPurchase.purchasePricePerUnit}
                    onChange={(e) => setNewPurchase({...newPurchase, purchasePricePerUnit: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
                  <input
                    type="date"
                    value={newPurchase.purchaseDate}
                    onChange={(e) => setNewPurchase({...newPurchase, purchaseDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number (Optional)</label>
                  <input
                    type="text"
                    value={newPurchase.invoiceNumber}
                    onChange={(e) => setNewPurchase({...newPurchase, invoiceNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter invoice number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={newPurchase.notes}
                    onChange={(e) => setNewPurchase({...newPurchase, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>

                {newPurchase.quantity > 0 && newPurchase.purchasePricePerUnit > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-800">Total Cost:</span>
                      <span className="text-xl font-bold text-blue-600">
                        ₹{(newPurchase.quantity * newPurchase.purchasePricePerUnit).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddPurchaseModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPurchase}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Sale Modal */}
      {showAddSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Sale Record</h3>
              <button
                onClick={() => setShowAddSaleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {purchasedProducts.length > 0 && (
                      <select
                        value={newSale.productName}
                        onChange={(e) => handleProductSelect(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select from purchased products</option>
                        {purchasedProducts.map((productName) => (
                          <option key={productName} value={productName}>
                            {productName}
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      type="text"
                      value={newSale.productName}
                      onChange={(e) => setNewSale({...newSale, productName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Or enter custom product name"
                      required
                    />
                  </div>
                  {purchasedProducts.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No purchased products available. Add purchases first to see them in the dropdown.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newSale.category}
                    onChange={(e) => setNewSale({...newSale, category: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="prepared_food">Prepared Food</option>
                    <option value="beverages">Beverages</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="meat">Meat</option>
                    <option value="dairy">Dairy</option>
                    <option value="spices">Spices</option>
                    <option value="grains">Grains</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newSale.quantity}
                      onChange={(e) => setNewSale({...newSale, quantity: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newSale.unit}
                      onChange={(e) => setNewSale({...newSale, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Select Unit</option>
                      <option value="plates">Plates</option>
                      <option value="pieces">Pieces</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="liters">Liters (L)</option>
                      <option value="ml">Milliliters (ml)</option>
                      <option value="packets">Packets</option>
                      <option value="boxes">Boxes</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sale Price per Unit (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSale.salePricePerUnit}
                    onChange={(e) => setNewSale({...newSale, salePricePerUnit: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name (Optional)</label>
                  <input
                    type="text"
                    value={newSale.customerName}
                    onChange={(e) => setNewSale({...newSale, customerName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter customer name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone (Optional)</label>
                  <input
                    type="tel"
                    value={newSale.customerPhone}
                    onChange={(e) => setNewSale({...newSale, customerPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="+91 9876543210"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={newSale.paymentMethod}
                    onChange={(e) => setNewSale({...newSale, paymentMethod: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sale Date</label>
                  <input
                    type="date"
                    value={newSale.saleDate}
                    onChange={(e) => setNewSale({...newSale, saleDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={newSale.notes}
                    onChange={(e) => setNewSale({...newSale, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>

                {newSale.quantity > 0 && newSale.salePricePerUnit > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-green-800">Total Amount:</span>
                      <span className="text-xl font-bold text-green-600">
                        ₹{(newSale.quantity * newSale.salePricePerUnit).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddSaleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSale}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Add Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}