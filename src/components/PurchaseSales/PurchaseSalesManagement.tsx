import React, { useState, useEffect } from 'react';
import { ShoppingCart, TrendingUp, Plus, Search, Filter, Edit2, Trash2, Download, Calendar, DollarSign, Package, Users, Eye, X, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Purchase, Sale } from '../../types';

export function PurchaseSalesManagement() {
  const { 
    purchases, 
    sales, 
    suppliers, 
    addPurchase, 
    updatePurchase, 
    deletePurchase,
    addSale,
    updateSale,
    deleteSale,
    loading, 
    error 
  } = useApp();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales' | 'analytics'>('purchases');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Purchase Modal States
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [showEditPurchaseModal, setShowEditPurchaseModal] = useState(false);
  
  // Sale Modal States
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  
  const [newPurchase, setNewPurchase] = useState({
    productName: '',
    category: 'vegetables' as const,
    supplierId: '',
    quantity: 0,
    unit: '',
    purchasePricePerUnit: 0,
    totalPurchaseCost: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    notes: ''
  });
  
  const [newSale, setNewSale] = useState({
    productName: '',
    category: 'prepared_food' as const,
    quantity: 0,
    unit: '',
    salePricePerUnit: 0,
    totalSaleAmount: 0,
    saleDate: new Date().toISOString().split('T')[0],
    customerName: '',
    customerPhone: '',
    paymentMethod: 'cash' as const,
    notes: ''
  });

  // Auto-calculate total cost when quantity or price changes
  useEffect(() => {
    const total = newPurchase.quantity * newPurchase.purchasePricePerUnit;
    setNewPurchase(prev => ({ ...prev, totalPurchaseCost: total }));
  }, [newPurchase.quantity, newPurchase.purchasePricePerUnit]);

  useEffect(() => {
    const total = newSale.quantity * newSale.salePricePerUnit;
    setNewSale(prev => ({ ...prev, totalSaleAmount: total }));
  }, [newSale.quantity, newSale.salePricePerUnit]);

  const categories = ['all', 'vegetables', 'meat', 'dairy', 'spices', 'grains', 'other', 'prepared_food', 'beverages'];
  const units = ['kg', 'g', 'pieces', 'liters', 'ml', 'packets', 'boxes', 'bottles', 'plates', 'portions'];

  // Filter functions
  const getFilteredData = (data: Purchase[] | Sale[]) => {
    return data.filter(item => {
      const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const itemDate = new Date('purchaseDate' in item ? item.purchaseDate : item.saleDate);
        const today = new Date();
        
        switch (dateFilter) {
          case 'today':
            matchesDate = itemDate.toDateString() === today.toDateString();
            break;
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            matchesDate = itemDate.toDateString() === yesterday.toDateString();
            break;
          case 'this_week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            matchesDate = itemDate >= weekStart;
            break;
          case 'this_month':
            matchesDate = itemDate.getMonth() === today.getMonth() && 
                        itemDate.getFullYear() === today.getFullYear();
            break;
          case 'custom':
            if (selectedDate) {
              const selected = new Date(selectedDate);
              matchesDate = itemDate.toDateString() === selected.toDateString();
            }
            break;
        }
      }
      
      return matchesSearch && matchesCategory && matchesDate;
    });
  };

  const filteredPurchases = getFilteredData(purchases) as Purchase[];
  const filteredSales = getFilteredData(sales) as Sale[];

  // Analytics calculations
  const totalPurchaseValue = filteredPurchases.reduce((sum, p) => sum + p.totalPurchaseCost, 0);
  const totalSalesValue = filteredSales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
  const grossProfit = totalSalesValue - totalPurchaseValue;
  const profitMargin = totalSalesValue > 0 ? (grossProfit / totalSalesValue) * 100 : 0;

  // Purchase handlers
  const handleAddPurchase = async () => {
    try {
      const errors = validatePurchaseData(newPurchase);
      if (errors.length > 0) {
        alert(`Please fix the following errors:\n\n${errors.join('\n')}`);
        return;
      }

      await addPurchase({
        ...newPurchase,
        createdBy: user?.name || 'Admin'
      });
      
      resetPurchaseForm();
      setShowAddPurchaseModal(false);
    } catch (error) {
      console.error('Error adding purchase:', error);
    }
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setShowEditPurchaseModal(true);
  };

  const handleSavePurchaseEdit = async () => {
    if (!editingPurchase) return;
    
    try {
      await updatePurchase(editingPurchase.id, editingPurchase);
      setShowEditPurchaseModal(false);
      setEditingPurchase(null);
    } catch (error) {
      console.error('Error updating purchase:', error);
    }
  };

  const handleDeletePurchase = async (purchase: Purchase) => {
    if (confirm(`Are you sure you want to delete this purchase record?\n\nProduct: ${purchase.productName}\nAmount: ₹${purchase.totalPurchaseCost}`)) {
      try {
        await deletePurchase(purchase.id);
      } catch (error) {
        console.error('Error deleting purchase:', error);
      }
    }
  };

  // Sale handlers
  const handleAddSale = async () => {
    try {
      const errors = validateSaleData(newSale);
      if (errors.length > 0) {
        alert(`Please fix the following errors:\n\n${errors.join('\n')}`);
        return;
      }

      await addSale({
        ...newSale,
        createdBy: user?.name || 'Admin'
      });
      
      resetSaleForm();
      setShowAddSaleModal(false);
    } catch (error) {
      console.error('Error adding sale:', error);
    }
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setShowEditSaleModal(true);
  };

  const handleSaveSaleEdit = async () => {
    if (!editingSale) return;
    
    try {
      await updateSale(editingSale.id, editingSale);
      setShowEditSaleModal(false);
      setEditingSale(null);
    } catch (error) {
      console.error('Error updating sale:', error);
    }
  };

  const handleDeleteSale = async (sale: Sale) => {
    if (confirm(`Are you sure you want to delete this sale record?\n\nProduct: ${sale.productName}\nAmount: ₹${sale.totalSaleAmount}`)) {
      try {
        await deleteSale(sale.id);
      } catch (error) {
        console.error('Error deleting sale:', error);
      }
    }
  };

  // Validation functions
  const validatePurchaseData = (data: typeof newPurchase) => {
    const errors = [];
    if (!data.productName.trim()) errors.push('Product name is required');
    if (!data.unit.trim()) errors.push('Unit is required');
    if (data.quantity <= 0) errors.push('Quantity must be greater than 0');
    if (data.purchasePricePerUnit <= 0) errors.push('Purchase price must be greater than 0');
    return errors;
  };

  const validateSaleData = (data: typeof newSale) => {
    const errors = [];
    if (!data.productName.trim()) errors.push('Product name is required');
    if (!data.unit.trim()) errors.push('Unit is required');
    if (data.quantity <= 0) errors.push('Quantity must be greater than 0');
    if (data.salePricePerUnit <= 0) errors.push('Sale price must be greater than 0');
    return errors;
  };

  // Reset forms
  const resetPurchaseForm = () => {
    setNewPurchase({
      productName: '',
      category: 'vegetables',
      supplierId: '',
      quantity: 0,
      unit: '',
      purchasePricePerUnit: 0,
      totalPurchaseCost: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      invoiceNumber: '',
      notes: ''
    });
  };

  const resetSaleForm = () => {
    setNewSale({
      productName: '',
      category: 'prepared_food',
      quantity: 0,
      unit: '',
      salePricePerUnit: 0,
      totalSaleAmount: 0,
      saleDate: new Date().toISOString().split('T')[0],
      customerName: '',
      customerPhone: '',
      paymentMethod: 'cash',
      notes: ''
    });
  };

  // Export functions
  const handleExportPurchases = () => {
    try {
      const headers = ['Date', 'Product Name', 'Category', 'Supplier', 'Quantity', 'Unit', 'Price per Unit', 'Total Cost', 'Invoice Number', 'Notes'];
      const csvContent = [
        headers.join(','),
        ...filteredPurchases.map(purchase => [
          purchase.purchaseDate,
          `"${purchase.productName}"`,
          purchase.category,
          `"${purchase.supplier?.name || 'Unknown'}"`,
          purchase.quantity,
          purchase.unit,
          purchase.purchasePricePerUnit,
          purchase.totalPurchaseCost,
          purchase.invoiceNumber || '',
          `"${purchase.notes}"`
        ].join(','))
      ].join('\n');

      downloadCSV(csvContent, `purchases_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Error exporting purchases. Please try again.');
    }
  };

  const handleExportSales = () => {
    try {
      const headers = ['Date', 'Product Name', 'Category', 'Quantity', 'Unit', 'Price per Unit', 'Total Amount', 'Customer', 'Phone', 'Payment Method', 'Notes'];
      const csvContent = [
        headers.join(','),
        ...filteredSales.map(sale => [
          sale.saleDate,
          `"${sale.productName}"`,
          sale.category,
          sale.quantity,
          sale.unit,
          sale.salePricePerUnit,
          sale.totalSaleAmount,
          `"${sale.customerName || ''}"`,
          sale.customerPhone || '',
          sale.paymentMethod,
          `"${sale.notes}"`
        ].join(','))
      ].join('\n');

      downloadCSV(csvContent, `sales_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Error exporting sales. Please try again.');
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const renderTabNavigation = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex space-x-2">
        {[
          { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
          { id: 'sales', label: 'Sales', icon: TrendingUp },
          { id: 'analytics', label: 'Analytics', icon: DollarSign }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none bg-white"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              if (e.target.value !== 'custom') {
                setSelectedDate('');
              }
            }}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none bg-white"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="custom">Custom Date</option>
          </select>
        </div>
        
        {dateFilter === 'custom' && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        )}
      </div>
    </div>
  );

  const renderPurchasesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Purchase Records</h3>
          <p className="text-gray-600">Track all product purchases and supplier transactions</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportPurchases}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowAddPurchaseModal(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Purchase</span>
          </button>
        </div>
      </div>

      {/* Purchase Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold text-gray-900">{filteredPurchases.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalPurchaseValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Purchase Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{filteredPurchases.length > 0 ? Math.round(totalPurchaseValue / filteredPurchases.length) : 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{suppliers.filter(s => s.isActive).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price per Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{purchase.productName}</div>
                      <div className="text-sm text-gray-500 capitalize">{purchase.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{purchase.supplier?.name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{purchase.invoiceNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{purchase.quantity} {purchase.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">₹{purchase.purchasePricePerUnit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">₹{purchase.totalPurchaseCost.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(purchase.purchaseDate).toLocaleDateString('en-IN')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPurchase(purchase)}
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
      </div>
    </div>
  );

  const renderSalesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Sales Records</h3>
          <p className="text-gray-600">Track all product sales and customer transactions</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportSales}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowAddSaleModal(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Sale</span>
          </button>
        </div>
      </div>

      {/* Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{filteredSales.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalSalesValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Sale Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{filteredSales.length > 0 ? Math.round(totalSalesValue / filteredSales.length) : 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unique Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(filteredSales.filter(s => s.customerPhone).map(s => s.customerPhone)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price per Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sale.productName}</div>
                      <div className="text-sm text-gray-500 capitalize">{sale.category.replace('_', ' ')}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{sale.customerName || 'Walk-in Customer'}</div>
                    <div className="text-sm text-gray-500">{sale.customerPhone || 'No phone'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{sale.quantity} {sale.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">₹{sale.salePricePerUnit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-blue-600">₹{sale.totalSaleAmount.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                      sale.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800' :
                      sale.paymentMethod === 'online' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {sale.paymentMethod.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(sale.saleDate).toLocaleDateString('en-IN')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditSale(sale)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
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
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">Purchase & Sales Analytics</h3>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold text-red-600">₹{totalPurchaseValue.toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-green-600">₹{totalSalesValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Gross Profit</p>
              <p className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ₹{grossProfit.toLocaleString()}
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
              <p className="text-sm text-gray-600">Profit Margin</p>
              <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Purchase by Category</h4>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {categories.slice(1).map(category => {
                const categoryPurchases = filteredPurchases.filter(p => p.category === category);
                const categoryValue = categoryPurchases.reduce((sum, p) => sum + p.totalPurchaseCost, 0);
                const percentage = totalPurchaseValue > 0 ? (categoryValue / totalPurchaseValue) * 100 : 0;
                
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">₹{categoryValue.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Sales by Category</h4>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {categories.slice(1).map(category => {
                const categorySales = filteredSales.filter(s => s.category === category);
                const categoryValue = categorySales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
                const percentage = totalSalesValue > 0 ? (categoryValue / totalSalesValue) * 100 : 0;
                
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">₹{categoryValue.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase & Sales Management</h2>
          <p className="text-gray-600">Track purchases from suppliers and sales to customers</p>
        </div>
      </div>

      {renderTabNavigation()}
      {renderFilters()}

      {activeTab === 'purchases' && renderPurchasesTab()}
      {activeTab === 'sales' && renderSalesTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}

      {/* Add Purchase Modal */}
      {showAddPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Purchase</h3>
              <button
                onClick={() => setShowAddPurchaseModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPurchase.productName}
                    onChange={(e) => setNewPurchase({...newPurchase, productName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newPurchase.category}
                    onChange={(e) => setNewPurchase({...newPurchase, category: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {categories.slice(1, 6).map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                  <select
                    value={newPurchase.supplierId}
                    onChange={(e) => setNewPurchase({...newPurchase, supplierId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.filter(s => s.isActive).map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPurchase.quantity}
                    onChange={(e) => setNewPurchase({...newPurchase, quantity: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select Unit</option>
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
                  <input
                    type="text"
                    value={newPurchase.invoiceNumber}
                    onChange={(e) => setNewPurchase({...newPurchase, invoiceNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Optional invoice number"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newPurchase.notes}
                  onChange={(e) => setNewPurchase({...newPurchase, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Additional notes about this purchase..."
                />
              </div>
              
              {/* Total Cost Display */}
              {newPurchase.quantity > 0 && newPurchase.purchasePricePerUnit > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">Total Purchase Cost:</span>
                    <span className="text-xl font-bold text-green-600">
                      ₹{newPurchase.totalPurchaseCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddPurchaseModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPurchase}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Sale</h3>
              <button
                onClick={() => setShowAddSaleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSale.productName}
                    onChange={(e) => setNewSale({...newSale, productName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newSale.category}
                    onChange={(e) => setNewSale({...newSale, category: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {categories.slice(1).map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSale.quantity}
                    onChange={(e) => setNewSale({...newSale, quantity: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select Unit</option>
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    min="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sale Date</label>
                  <input
                    type="date"
                    value={newSale.saleDate}
                    onChange={(e) => setNewSale({...newSale, saleDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={newSale.customerName}
                    onChange={(e) => setNewSale({...newSale, customerName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Optional customer name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
                  <input
                    type="tel"
                    value={newSale.customerPhone}
                    onChange={(e) => setNewSale({...newSale, customerPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Optional phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={newSale.paymentMethod}
                    onChange={(e) => setNewSale({...newSale, paymentMethod: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newSale.notes}
                  onChange={(e) => setNewSale({...newSale, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Additional notes about this sale..."
                />
              </div>
              
              {/* Total Amount Display */}
              {newSale.quantity > 0 && newSale.salePricePerUnit > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-800">Total Sale Amount:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ₹{newSale.totalSaleAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddSaleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSale}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Add Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Purchase Modal */}
      {showEditPurchaseModal && editingPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Purchase</h3>
              <button
                onClick={() => setShowEditPurchaseModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPurchase.quantity}
                    onChange={(e) => setEditingPurchase({
                      ...editingPurchase, 
                      quantity: parseFloat(e.target.value) || 0,
                      totalPurchaseCost: (parseFloat(e.target.value) || 0) * editingPurchase.purchasePricePerUnit
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price per Unit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPurchase.purchasePricePerUnit}
                    onChange={(e) => setEditingPurchase({
                      ...editingPurchase, 
                      purchasePricePerUnit: parseFloat(e.target.value) || 0,
                      totalPurchaseCost: editingPurchase.quantity * (parseFloat(e.target.value) || 0)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={editingPurchase.notes}
                    onChange={(e) => setEditingPurchase({...editingPurchase, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                  />
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Cost:</span>
                    <span className="font-bold text-green-600">₹{editingPurchase.totalPurchaseCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditPurchaseModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePurchaseEdit}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sale Modal */}
      {showEditSaleModal && editingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Sale</h3>
              <button
                onClick={() => setShowEditSaleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSale.quantity}
                    onChange={(e) => setEditingSale({
                      ...editingSale, 
                      quantity: parseFloat(e.target.value) || 0,
                      totalSaleAmount: (parseFloat(e.target.value) || 0) * editingSale.salePricePerUnit
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price per Unit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSale.salePricePerUnit}
                    onChange={(e) => setEditingSale({
                      ...editingSale, 
                      salePricePerUnit: parseFloat(e.target.value) || 0,
                      totalSaleAmount: editingSale.quantity * (parseFloat(e.target.value) || 0)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={editingSale.customerName || ''}
                    onChange={(e) => setEditingSale({...editingSale, customerName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={editingSale.paymentMethod}
                    onChange={(e) => setEditingSale({...editingSale, paymentMethod: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={editingSale.notes}
                    onChange={(e) => setEditingSale({...editingSale, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                  />
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-bold text-blue-600">₹{editingSale.totalSaleAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditSaleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSaleEdit}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}