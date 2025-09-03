import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InventoryItem, Recipe, Order, User, Supplier, PurchaseOrder, PayrollRecord, StockMovement } from '../types';
import { DatabaseService, subscribeToTable, supabase } from '../lib/supabaseClient';
import * as dataClient from '../lib/dataClient';
import { mockInventoryItems } from '../data/mockData';

interface AppContextType {
  // Data
  inventoryItems: InventoryItem[];
  recipes: Recipe[];
  orders: Order[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  payrollRecords: PayrollRecord[];
  stockMovements: StockMovement[];
  deliveryConfirmations: any[];
  staffMembers: any[];
  
  // Staff Actions
  addStaffMember: (staffData: any) => Promise<{ success: boolean; data: any }>;
  updateStaffMember: (id: string, updates: any) => Promise<any>;
  
  // Inventory Actions
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  deleteInventoryItem: (id: string) => void;
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => void;
  
  // Recipe Actions
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  
  // Order Actions
  updateOrderStatus: (orderId: string, status: Order['status'], assignedStaff?: string) => void;
  addOrder: (order: Omit<Order, 'id'>) => void;
  
  // Supplier Actions
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  // Delivery Actions
  getDeliveryConfirmation: (orderId: string) => any | null;
  
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markNotificationRead: (id: string) => void;
  
  // Real-time updates
  lastUpdated: string;
  loading: boolean;
  error: string | null;
}

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userId?: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [deliveryConfirmations, setDeliveryConfirmations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Supabase on mount
  useEffect(() => {
    initializeData();
    
    // Set up real-time subscriptions
    setupRealtimeSubscriptions();
  }, []);

  const setupRealtimeSubscriptions = () => {
    if (!supabase) {
      console.log('Supabase not configured, skipping real-time subscriptions');
      return;
    }
    
    try {
      const suppliersSubscription = subscribeToTable('suppliers', (payload) => {
        console.log('Suppliers table changed:', payload);
        loadSuppliersData();
      });

      const inventorySubscription = subscribeToTable('inventory_items', (payload) => {
        console.log('Inventory table changed:', payload);
        loadInventoryData();
      });

      const stockMovementsSubscription = subscribeToTable('stock_movements', (payload) => {
        console.log('Stock movements table changed:', payload);
        loadStockMovementsData();
      });

      const ordersSubscription = subscribeToTable('orders', (payload) => {
        console.log('Orders table changed:', payload);
        loadOrdersData();
      });

      const deliveryConfirmationsSubscription = subscribeToTable('delivery_confirmations', (payload) => {
        console.log('Delivery confirmations table changed:', payload);
        loadDeliveryConfirmationsData();
      });

      return () => {
        suppliersSubscription?.unsubscribe();
        inventorySubscription?.unsubscribe();
        stockMovementsSubscription?.unsubscribe();
        ordersSubscription?.unsubscribe();
        deliveryConfirmationsSubscription?.unsubscribe();
      };
    } catch (error) {
      console.log('Real-time subscriptions not available:', error);
    }
  };

  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Initializing data from Supabase...');
      
      // Always use Supabase - no fallbacks
      if (!DatabaseService.isConnected()) {
        throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
      }
      
      await loadAllDataFromDatabase();
      
      console.log('Data initialization completed');
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(`Failed to connect to Supabase: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliersData = async () => {
    console.log('Loading suppliers from Supabase...');
    
    if (!DatabaseService.isConnected()) {
      throw new Error('Supabase not configured. Please click "Connect to Supabase" button.');
    }
    
    const data = await DatabaseService.getSuppliers();

    console.log('Suppliers loaded from Supabase:', data);
    const mappedSuppliers = data.map(s => ({
      id: s.id,
      name: s.name,
      contact: s.contact,
      email: s.email,
      address: s.address,
      categories: s.categories || [],
      rating: s.rating,
      isActive: s.is_active,
      is_active: s.is_active
    }));
    
    console.log('Mapped suppliers:', mappedSuppliers);
    setSuppliers(mappedSuppliers);
    updateLastUpdated();
  };

  const loadInventoryData = async () => {
    console.log('Loading inventory from database...');
    
    if (!DatabaseService.isConnected()) {
      throw new Error('Supabase not configured. Please click "Connect to Supabase" button.');
    }
    
    const data = await DatabaseService.getInventoryItems();
    
    const mappedInventory = (data || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      currentStock: item.current_stock,
      unit: item.unit,
      minStock: item.min_stock,
      maxStock: item.max_stock,
      costPerUnit: item.cost_per_unit,
      supplier: item.supplier,
      lastRestocked: item.last_restocked,
      expiryDate: item.expiry_date
    }));
    
    console.log('Mapped inventory items from database:', mappedInventory);
    setInventoryItems(mappedInventory);
    updateLastUpdated();
  };

  const loadStockMovementsData = async () => {
    console.log('Loading stock movements from database...');
    
    if (!DatabaseService.isConnected()) {
      throw new Error('Supabase not configured. Please click "Connect to Supabase" button.');
    }
    
    const data = await DatabaseService.getStockMovements();
    
    const mappedStockMovements = data.map(sm => ({
      id: sm.id,
      inventoryItemId: sm.inventory_item_id,
      movementType: sm.movement_type,
      quantity: sm.quantity,
      reason: sm.reason,
      referenceNumber: sm.reference_number,
      unitCost: sm.unit_cost,
      totalCost: sm.total_cost,
      performedBy: sm.performed_by,
      notes: sm.notes,
      movementDate: sm.movement_date,
      createdAt: sm.created_at
    }));
    console.log('Mapped stock movements from database:', mappedStockMovements);
    setStockMovements(mappedStockMovements);
    updateLastUpdated();
  };

  const loadOrdersData = async () => {
    console.log('Loading orders from database...');
    
    if (!DatabaseService.isConnected()) {
      throw new Error('Supabase not configured. Please click "Connect to Supabase" button.');
    }
    
    const data = await DatabaseService.getOrders();
    
    const mappedOrders = data.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      deliveryAddress: order.delivery_address,
      items: order.items || [],
      status: order.status,
      orderTime: order.order_time,
      estimatedDelivery: order.estimated_delivery,
      totalAmount: order.total_amount,
      assignedStaff: order.assigned_staff,
      priority: order.priority
    }));
    console.log('Mapped orders from database:', mappedOrders);
    setOrders(mappedOrders);
    updateLastUpdated();
  };

  const loadCustomersData = async () => {
    console.log('Loading customers from database...');
    
    if (!DatabaseService.isConnected()) {
      throw new Error('Supabase not configured. Please click "Connect to Supabase" button.');
    }
    
    const data = await DatabaseService.getCustomers();
    
    // Customers are generated from orders in the component, so we don't need to store them separately
    console.log('Customers available in database:', data.length);
    updateLastUpdated();
  };

  const loadAllDataFromDatabase = async () => {
    console.log('Loading data from database...');
    
    try {
      // Load all data from database - throw errors if any fail
      await Promise.all([
        loadSuppliersData(),
        loadInventoryData(), 
        loadRecipesData(),
        loadOrdersData(),
        loadCustomersData(),
        loadPurchaseOrdersData(),
        loadStockMovementsData(),
        loadDeliveryConfirmationsData(),
        loadStaffMembersData()
      ]);
      
      console.log('✅ All data loaded from database successfully');
    } catch (error) {
      console.error('Database load failed:', error);
      throw error; // Re-throw to be handled by caller
    }
    
    updateLastUpdated();
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await loadAllDataFromDatabase();
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data from database');
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadRecipesData = async () => {
    console.log('Loading recipes from database...');
    
    if (!DatabaseService.isConnected()) {
      throw new Error('Supabase not configured. Please click "Connect to Supabase" button.');
    }
    
    const data = await DatabaseService.getRecipes();
    const mappedRecipes = data.map(recipe => ({
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      prepTime: recipe.prep_time,
      cookTime: recipe.cook_time,
      servings: recipe.servings,
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      image: recipe.image
    }));
    setRecipes(mappedRecipes);
    updateLastUpdated();
  };

  const loadPurchaseOrdersData = async () => {
    console.log('Loading purchase orders from database...');
    
    if (!DatabaseService.isConnected()) {
      throw new Error('Supabase not configured. Please click "Connect to Supabase" button.');
    }
    
    const data = await DatabaseService.getPurchaseOrders();
    const mappedPurchaseOrders = data.map(po => ({
      id: po.id,
      supplierId: po.supplier_id,
      status: po.status,
      orderDate: po.order_date,
      expectedDelivery: po.expected_delivery,
      totalAmount: po.total_amount,
      items: []
    }));
    setPurchaseOrders(mappedPurchaseOrders);
    updateLastUpdated();
  };

  const loadDeliveryConfirmationsData = async () => {
    console.log('Loading delivery confirmations from database...');
    
    if (!DatabaseService.isConnected()) {
      throw new Error('Supabase not configured. Please click "Connect to Supabase" button.');
    }
    
    const data = await DatabaseService.getDeliveryConfirmations();
    
    console.log('Delivery confirmations loaded from database:', data);
    setDeliveryConfirmations(data);
    updateLastUpdated();
  };

  const loadStaffMembersData = async () => {
    console.log('Loading staff members from database...');
    
    if (!DatabaseService.isConnected()) {
      throw new Error('Supabase not configured. Please click "Connect to Supabase" button.');
    }
    
    const data = await DatabaseService.getStaffMembers();
    
    console.log('Staff members loaded from database:', data);
    setStaffMembers(data);
    updateLastUpdated();
  };

  const loadMockData = () => {
    console.log('Loading mock data as fallback...');
    
    // Load mock inventory items
    setInventoryItems(mockInventoryItems);
    
    // Load mock suppliers
    setSuppliers([
      {
        id: 'supplier-1',
        name: 'Tamil Nadu Rice Mills',
        contact: '+91 9876543220',
        email: 'info@tnricemills.com',
        address: 'Industrial Area, Hosur - 635109',
        categories: ['grains'],
        rating: 4.5,
        isActive: true
      },
      {
        id: 'supplier-2',
        name: 'Fresh Meat Co.',
        contact: '+91 9876543221',
        email: 'orders@freshmeat.com',
        address: 'Meat Market Complex, Hosur - 635110',
        categories: ['meat'],
        rating: 4.2,
        isActive: true
      }
    ]);
    
    // Load mock recipes
    setRecipes([
      {
        id: 'recipe-1',
        name: 'Chicken Biryani',
        category: 'Main Course',
        prepTime: 30,
        cookTime: 45,
        servings: 4,
        ingredients: [],
        instructions: ['Prepare rice', 'Cook chicken', 'Layer and cook']
      },
      {
        id: 'recipe-2',
        name: 'Vegetable Curry',
        category: 'Main Course',
        prepTime: 15,
        cookTime: 25,
        servings: 4,
        ingredients: [],
        instructions: ['Chop vegetables', 'Cook with spices']
      }
    ]);
    
    // Load mock orders
    setOrders([]);
    
    // Initialize empty arrays for other data
    setStockMovements([]);
    setDeliveryConfirmations([]);
    setPurchaseOrders([]);
    setPayrollRecords([]);
    setStaffMembers([]);
    
    console.log('Mock data loaded successfully');
    updateLastUpdated();
  };

  // Staff Actions
  const addStaffMember = async (staffData: any) => {
    try {
      console.log('Adding staff member to database:', staffData);
      
      // Use database transaction to ensure both records are created
      const { data: transactionResult, error: transactionError } = await DatabaseService.supabase!
        .rpc('create_staff_with_login', {
          p_name: staffData.name,
          p_email: staffData.email.toLowerCase(),
          p_phone: staffData.phone,
          p_role: staffData.role,
          p_username: staffData.username,
          p_password: staffData.password,
          p_salary: staffData.salary || 25000,
          p_department: staffData.department || getDepartmentFromRole(staffData.role),
          p_is_active: staffData.isActive !== false
        });

      if (transactionError) {
        console.error('Error creating staff with login:', transactionError);
        throw new Error(`Failed to create staff member: ${transactionError.message}`);
      }

      console.log('✅ Staff member created with login credentials:', transactionResult);

      // Fetch the created staff member
      const { data: newStaffData, error: fetchError } = await DatabaseService.supabase!
        .from('staff_members')
        .select('*')
        .eq('username', staffData.username)
        .single();

      if (fetchError) {
        console.error('Error fetching created staff:', fetchError);
        throw new Error(`Failed to fetch created staff: ${fetchError.message}`);
      }

      const newStaffMember = newStaffData;
      
      setStaffMembers(prev => [newStaffMember, ...prev]);
      updateLastUpdated();
      
      addNotification({
        type: 'success',
        title: 'Staff Member Added',
        message: `${staffData.name} has been added to the team with login credentials`
      });
      
      return { success: true, data: newStaffMember };
    } catch (err) {
      console.error('Error adding staff member:', err);
      addNotification({
        type: 'error',
        title: 'Add Staff Failed',
        message: 'Failed to add staff member: ' + (err as Error).message
      });
      throw err;
    }
  };

  const updateStaffMember = async (id: string, updates: any) => {
    try {
      console.log('Updating staff member in database:', id, updates);
      
      const dbUpdates = {
        name: updates.name,
        email: updates.email?.toLowerCase(),
        phone: updates.phone,
        role: updates.role,
        department: updates.department,
        salary: updates.salary,
        is_active: updates.isActive,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key as keyof typeof dbUpdates] === undefined) {
          delete dbUpdates[key as keyof typeof dbUpdates];
        }
      });

      const data = await DatabaseService.updateStaffMember(id, dbUpdates);
      console.log('Staff member updated in database:', data);

      setStaffMembers(prev => 
        prev.map(staff => staff.id === id ? { ...staff, ...updates } : staff)
      );
      updateLastUpdated();
      
      addNotification({
        type: 'success',
        title: 'Staff Updated',
        message: 'Staff member has been updated successfully'
      });
      
      return data;
    } catch (err) {
      console.error('Error updating staff member:', err);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update staff member: ' + (err as Error).message
      });
      throw err;
    }
  };

  const getDepartmentFromRole = (role: string): string => {
    switch (role) {
      case 'admin': return 'Management';
      case 'kitchen_staff': return 'Kitchen';
      case 'inventory_manager': return 'Operations';
      case 'delivery_staff': return 'Delivery';
      default: return 'General';
    }
  };

  // Enhanced inventory update with database sync
  const updateInventoryItemInDatabase = async (id: string, updates: any) => {
    try {
      await DatabaseService.updateInventoryItem(id, updates);
      console.log('Inventory item updated in database:', id, updates);
    } catch (error) {
      console.error('Error updating inventory in database:', error);
      throw error;
    }
  };

  // Enhanced stock movement with proper database sync
  const addStockMovement = async (movement: Omit<StockMovement, 'id' | 'createdAt'>) => {
    try {
      console.log('Adding stock movement:', movement);
      
      const dbMovement = {
        inventory_item_id: movement.inventoryItemId,
        movement_type: movement.movementType,
        quantity: movement.quantity,
        reason: movement.reason,
        reference_number: movement.referenceNumber || null,
        unit_cost: movement.unitCost,
        total_cost: movement.totalCost,
        performed_by: movement.performedBy,
        notes: movement.notes || '',
        movement_date: movement.movementDate
      };

      const data = await DatabaseService.addStockMovement(dbMovement);

      const newMovement: StockMovement = {
        id: data.id,
        inventoryItemId: data.inventory_item_id,
        movementType: data.movement_type,
        quantity: data.quantity,
        reason: data.reason,
        referenceNumber: data.reference_number,
        unitCost: data.unit_cost,
        totalCost: data.total_cost,
        performedBy: data.performed_by,
        notes: data.notes,
        movementDate: data.movement_date,
        createdAt: data.created_at
      };
      
      setStockMovements(prev => [newMovement, ...prev]);
      console.log('Stock movement added to database:', newMovement);
      
      // Update inventory levels in database
      const inventoryItem = inventoryItems.find(item => item.id === movement.inventoryItemId);
      if (inventoryItem) {
        const newStock = movement.movementType === 'in' 
          ? Math.round(inventoryItem.currentStock + movement.quantity)
          : Math.max(0, Math.round(inventoryItem.currentStock - movement.quantity));
        
        console.log(`Updating ${inventoryItem.name}: ${inventoryItem.currentStock} -> ${newStock}`);
        
        const dbUpdates = {
          current_stock: newStock,
          last_restocked: movement.movementType === 'in' ? new Date().toISOString().split('T')[0] : inventoryItem.lastRestocked,
          updated_at: new Date().toISOString()
        };
        
        await DatabaseService.updateInventoryItem(movement.inventoryItemId, dbUpdates);
        console.log('Inventory updated in database');
        
        // Update local state
        setInventoryItems(prev => 
          prev.map(item => {
            if (item.id === movement.inventoryItemId) {
              return { 
                ...item, 
                currentStock: Math.round(newStock),
                lastRestocked: movement.movementType === 'in' ? new Date().toISOString().split('T')[0] : item.lastRestocked
              };
            }
            return item;
          })
        );
      }
      
      updateLastUpdated();
      
      addNotification({
        type: 'success',
        title: 'Stock Movement Recorded',
        message: `${movement.movementType === 'in' ? 'Added' : 'Removed'} ${movement.quantity} units successfully`
      });
      
    } catch (err) {
      console.error('Error adding stock movement:', err);
      addNotification({
        type: 'error',
        title: 'Stock Movement Failed',
        message: 'Failed to record stock movement: ' + (err as Error).message
      });
      throw err;
    }
  };

  const updateLastUpdated = () => {
    setLastUpdated(new Date().toISOString());
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // Inventory Actions
  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const dbUpdates = {
        name: updates.name,
        category: updates.category,
        current_stock: updates.currentStock !== undefined ? Math.round(updates.currentStock) : undefined,
        unit: updates.unit,
        min_stock: updates.minStock !== undefined ? Math.round(updates.minStock) : undefined,
        max_stock: updates.maxStock !== undefined ? Math.round(updates.maxStock) : undefined,
        cost_per_unit: updates.costPerUnit,
        supplier: updates.supplier,
        last_restocked: updates.lastRestocked,
        expiry_date: updates.expiryDate,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key as keyof typeof dbUpdates] === undefined) {
          delete dbUpdates[key as keyof typeof dbUpdates];
        }
      });

      await DatabaseService.updateInventoryItem(id, dbUpdates);

      setInventoryItems(prev => 
        prev.map(item => item.id === id ? { ...item, ...updates } : item)
      );
      updateLastUpdated();
      
      addNotification({
        type: 'success',
        title: 'Inventory Updated',
        message: 'Inventory item has been updated successfully'
      });
    } catch (err) {
      console.error('Error updating inventory item:', err);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update inventory item'
      });
    }
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    try {
      console.log('Adding inventory item:', item);
      
      const dbItem = {
        name: item.name,
        category: item.category,
        current_stock: Math.round(item.currentStock),
        unit: item.unit,
        min_stock: Math.round(item.minStock),
        max_stock: Math.round(item.maxStock),
        cost_per_unit: item.costPerUnit,
        supplier: item.supplier,
        last_restocked: item.lastRestocked,
        expiry_date: item.expiryDate || null
      };

      const data = await DatabaseService.addInventoryItem(dbItem);

      const newItem: InventoryItem = {
        id: data.id,
        name: data.name,
        category: data.category,
        currentStock: data.current_stock,
        unit: data.unit,
        minStock: data.min_stock,
        maxStock: data.max_stock,
        costPerUnit: data.cost_per_unit,
        supplier: data.supplier,
        lastRestocked: data.last_restocked,
        expiryDate: data.expiry_date
      };
      
      console.log('Inventory item added to database:', newItem);
      setInventoryItems(prev => [newItem, ...prev]);
      updateLastUpdated();
      
      addNotification({
        type: 'success',
        title: 'New Item Added',
        message: `${item.name} has been added to inventory`
      });
      
    } catch (err) {
      console.error('Error adding inventory item:', err);
      addNotification({
        type: 'error',
        title: 'Add Failed',
        message: 'Failed to add inventory item: ' + (err as Error).message
      });
      throw err;
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      const item = inventoryItems.find(i => i.id === id);
      
      await DatabaseService.deleteInventoryItem(id);

      setInventoryItems(prev => prev.filter(i => i.id !== id));
      updateLastUpdated();
      
      addNotification({
        type: 'success',
        title: 'Item Deleted',
        message: `${item?.name} has been removed from inventory`
      });
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete inventory item'
      });
    }
  };

  // Recipe Actions
  const addRecipe = async (recipe: Omit<Recipe, 'id'>) => {
    try {
      const dbRecipe = {
        name: recipe.name,
        category: recipe.category,
        prep_time: recipe.prepTime,
        cook_time: recipe.cookTime,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        image: recipe.image || null,
        difficulty: (recipe as any).difficulty || 'medium',
        cuisine: (recipe as any).cuisine || null,
        tags: (recipe as any).tags || [],
        nutrition_info: (recipe as any).nutritionInfo || { calories: 0, protein: 0, carbs: 0, fat: 0 },
        cost: (recipe as any).cost || 0,
        allergens: (recipe as any).allergens || []
      };

      const data = await DatabaseService.addRecipe(dbRecipe);

      const newRecipe: Recipe = {
        id: data.id,
        name: data.name,
        category: data.category,
        prepTime: data.prep_time,
        cookTime: data.cook_time,
        servings: data.servings,
        ingredients: data.ingredients,
        instructions: data.instructions,
        image: data.image
      };
      
      setRecipes(prev => [newRecipe, ...prev]);
      updateLastUpdated();
      
      addNotification({
        type: 'success',
        title: 'New Recipe Added',
        message: `${recipe.name} has been added to the menu`
      });
    } catch (err) {
      console.error('Error adding recipe:', err);
      addNotification({
        type: 'error',
        title: 'Add Failed',
        message: 'Failed to add recipe'
      });
    }
  };

  const updateRecipe = async (id: string, updates: Partial<Recipe>) => {
    try {
      const dbUpdates = {
        name: updates.name,
        category: updates.category,
        prep_time: updates.prepTime,
        cook_time: updates.cookTime,
        servings: updates.servings,
        ingredients: updates.ingredients,
        instructions: updates.instructions,
        image: updates.image,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key as keyof typeof dbUpdates] === undefined) {
          delete dbUpdates[key as keyof typeof dbUpdates];
        }
      });

      await DatabaseService.updateRecipe(id, dbUpdates);

      setRecipes(prev => 
        prev.map(recipe => recipe.id === id ? { ...recipe, ...updates } : recipe)
      );
      updateLastUpdated();
      
      addNotification({
        type: 'success',
        title: 'Recipe Updated',
        message: 'Recipe has been updated successfully'
      });
    } catch (err) {
      console.error('Error updating recipe:', err);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update recipe'
      });
    }
  };

  const deleteRecipe = async (id: string) => {
    if (!DatabaseService.isConnected()) {
      throw new Error('Database not connected. Please check Supabase configuration.');
    }

    const recipe = recipes.find(r => r.id === id);
    
    await DatabaseService.deleteRecipe(id);

    setRecipes(prev => prev.filter(r => r.id !== id));
    updateLastUpdated();
    
    addNotification({
      type: 'success',
      title: 'Recipe Deleted',
      message: `${recipe?.name} has been removed from the menu`
    });
  };

  // Order Actions
  const updateOrderStatus = async (orderId: string, status: Order['status'], assignedStaff?: string, deliveryData?: {quantity?: number, notes?: string}) => {
    if (!DatabaseService.isConnected()) {
      throw new Error('Database not connected. Please check Supabase configuration.');
    }

    // If marking as delivered, save delivery confirmation to database
    if (status === 'delivered' && deliveryData) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const deliveryConfirmation = {
          order_id: orderId,
          delivered_quantity: deliveryData.quantity || 0,
          ordered_quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
          delivery_notes: deliveryData.notes || '',
          delivered_by: assignedStaff || 'Unknown',
          delivery_date: new Date().toISOString(),
          delivery_status: deliveryData.quantity === order.items.reduce((sum, item) => sum + item.quantity, 0) 
            ? 'completed' as const
            : deliveryData.quantity && deliveryData.quantity > order.items.reduce((sum, item) => sum + item.quantity, 0)
              ? 'completed' as const
              : 'partial' as const
        };
        
        const savedConfirmation = await DatabaseService.addDeliveryConfirmation(deliveryConfirmation);
        console.log('Delivery confirmation saved to database:', savedConfirmation);
        
        // Update local delivery confirmations state immediately
        setDeliveryConfirmations(prev => {
          const filtered = prev.filter(dc => dc.order_id !== orderId);
          return [savedConfirmation, ...filtered];
        });
      }
    }
    
    // Update order status in database
    const dbUpdates = {
      status,
      assigned_staff: assignedStaff,
      updated_at: new Date().toISOString()
    };

    await DatabaseService.updateOrder(orderId, dbUpdates);
    console.log('Order status updated in database:', orderId, status);

    // Update local state after successful database update
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status, 
              assignedStaff: assignedStaff || order.assignedStaff,
            }
          : order
      )
    );
    updateLastUpdated();

    const statusMessages = {
      cooking: 'Order is now being prepared',
      out_for_delivery: 'Order is out for delivery',
      delivered: deliveryData?.quantity 
        ? `Order has been delivered (${deliveryData.quantity} meals)`
        : 'Order has been delivered',
      cancelled: 'Order has been cancelled'
    };
    
    addNotification({
      type: status === 'delivered' ? 'success' : 'info',
      title: 'Order Status Updated',
      message: `Order #${orderId}: ${statusMessages[status]}`
    });
  };

  const generateOrderId = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    
    // Get today's orders to determine sequence number
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.orderTime).toISOString().slice(0, 10).replace(/-/g, '');
      return orderDate === dateStr;
    });
    
    const sequenceNumber = (todayOrders.length + 1).toString().padStart(3, '0');
    return `ORD-${dateStr}-${sequenceNumber}`;
  };

  const addOrder = async (order: Omit<Order, 'id'>) => {
    try {
      let newOrder: Order;
      
      if (DatabaseService.isConnected()) {
        try {
          // Generate order number using database function
          const { data: orderNumberData, error: orderNumberError } = await DatabaseService.supabase!
            .rpc('generate_order_number');
          
          if (orderNumberError) {
            console.error('Error generating order number:', orderNumberError);
            throw orderNumberError;
          }
          
          const orderNumber = orderNumberData;
          
          const dbOrder = {
            order_number: orderNumber,
            customer_name: order.customerName,
            customer_phone: order.customerPhone,
            customer_email: (order as any).customerEmail || null,
            delivery_address: order.deliveryAddress,
            items: order.items,
            status: order.status,
            order_time: order.orderTime,
            estimated_delivery: order.estimatedDelivery,
            total_amount: order.totalAmount,
            assigned_staff: order.assignedStaff || null,
            priority: (order as any).priority || 'normal',
            special_instructions: (order as any).specialInstructions || null,
            payment_method: (order as any).paymentMethod || 'cash',
            order_source: (order as any).orderSource || 'admin'
          };

          const data = await DatabaseService.addOrder(dbOrder);

          newOrder = {
            id: data.id,
            orderNumber: data.order_number,
            customerName: data.customer_name,
            customerPhone: data.customer_phone,
            deliveryAddress: data.delivery_address,
            items: data.items,
            status: data.status,
            orderTime: data.order_time,
            estimatedDelivery: data.estimated_delivery,
            totalAmount: data.total_amount,
            assignedStaff: data.assigned_staff
          };
        } catch (dbError) {
          console.error('Database order creation failed, using local fallback:', dbError);
          // Fallback to local order creation
          newOrder = {
            id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            orderNumber: generateOrderId(),
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            deliveryAddress: order.deliveryAddress,
            items: order.items,
            status: order.status,
            orderTime: order.orderTime,
            estimatedDelivery: order.estimatedDelivery,
            totalAmount: order.totalAmount,
            assignedStaff: order.assignedStaff
          };
        }
      } else {
        // Database not connected, create order locally
        newOrder = {
          id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          orderNumber: generateOrderId(),
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          deliveryAddress: order.deliveryAddress,
          items: order.items,
          status: order.status,
          orderTime: order.orderTime,
          estimatedDelivery: order.estimatedDelivery,
          totalAmount: order.totalAmount,
          assignedStaff: order.assignedStaff
        };
      }
      
      setOrders(prev => [newOrder, ...prev]);
      updateLastUpdated();
      
      addNotification({
        type: 'success',
        title: 'New Order Created',
        message: `Order ${newOrder.orderNumber} from ${order.customerName} has been created`
      });
    } catch (err) {
      console.error('Error adding order:', err);
      addNotification({
        type: 'error',
        title: 'Order Failed',
        message: 'Failed to create order: ' + (err as Error).message
      });
      throw err;
    }
  };

  // Supplier Actions
  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    try {
      console.log('Adding supplier to Supabase:', supplier);
      
      const dbSupplier = {
        name: supplier.name,
        contact: supplier.contact,
        email: supplier.email,
        address: supplier.address,
        categories: supplier.categories || [],
        rating: supplier.rating,
        is_active: supplier.isActive !== false
      };

      const data = await DatabaseService.addSupplier(dbSupplier);

      console.log('Supplier added to Supabase successfully:', data);
      
      const newSupplier: Supplier = {
        id: data.id,
        name: data.name,
        contact: data.contact,
        email: data.email,
        address: data.address,
        categories: data.categories,
        rating: data.rating,
        isActive: data.is_active,
        is_active: data.is_active
      };
      
      setSuppliers(prev => [newSupplier, ...prev]);
      updateLastUpdated();
      
      addNotification({
        type: 'success',
        title: 'Supplier Added',
        message: `${supplier.name} has been added as a supplier`
      });
      
    } catch (err) {
      console.error('Error adding supplier:', err);
      addNotification({
        type: 'error',
        title: 'Add Failed',
        message: 'Failed to add supplier: ' + (err as Error).message
      });
      throw err;
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      const dbUpdates = {
        name: updates.name,
        contact: updates.contact,
        email: updates.email,
        address: updates.address,
        categories: updates.categories,
        rating: updates.rating,
        is_active: updates.isActive,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key as keyof typeof dbUpdates] === undefined) {
          delete dbUpdates[key as keyof typeof dbUpdates];
        }
      });

      await DatabaseService.updateSupplier(id, dbUpdates);

      setSuppliers(prev => 
        prev.map(supplier => supplier.id === id ? { ...supplier, ...updates } : supplier)
      );
      
      updateLastUpdated();
      
      addNotification({
        type: 'success',
        title: 'Supplier Updated',
        message: 'Supplier has been updated successfully'
      });
      
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update supplier: ' + (err as Error).message
      });
      throw err;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const supplier = suppliers.find(s => s.id === id);
      
      if (DatabaseService.isConnected()) {
        // Delete from database
        const { error } = await DatabaseService.supabase!
          .from('suppliers')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error deleting supplier from database:', error);
          throw error;
        }
        
        console.log('Supplier deleted from database:', id);
      }

      // Update local state
      setSuppliers(prev => prev.filter(s => s.id !== id));
      updateLastUpdated();
      
      addNotification({
        type: 'success',
        title: 'Supplier Deleted',
        message: `${supplier?.name} has been removed from suppliers`
      });
      
    } catch (err) {
      console.error('Error deleting supplier:', err);
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete supplier: ' + (err as Error).message
      });
      throw err;
    }
  };

  // Get delivery confirmation for an order
  const getDeliveryConfirmation = (orderId: string) => {
    return deliveryConfirmations.find(dc => dc.order_id === orderId) || null;
  };

  return (
    <AppContext.Provider value={{
      inventoryItems,
      recipes,
      orders,
      suppliers,
      purchaseOrders,
      payrollRecords,
      stockMovements,
      deliveryConfirmations,
      staffMembers,
      updateInventoryItem,
      addInventoryItem,
      deleteInventoryItem,
      addStockMovement,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      updateOrderStatus,
      addOrder,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      getDeliveryConfirmation,
      notifications,
      addNotification,
      markNotificationRead,
      addStaffMember,
      updateStaffMember,
      lastUpdated,
      loading,
      error
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}