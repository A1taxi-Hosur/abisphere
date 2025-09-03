import axios from 'axios';
import { getToken, setToken, clearToken } from './token';
import { DatabaseService } from './supabaseClient';

// API client configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  timeout: 10000,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

const API_MODE = import.meta.env.VITE_API_MODE || 'supabase';

// Authentication
export const login = async (email: string, password: string) => {
  try {
    const response = await apiClient.post('/api/auth/login', { email, password });
    const { access_token, user } = response.data;
    setToken(access_token);
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || 'Login failed' };
  }
};

export const loginWithUsername = async (username: string, password: string) => {
  try {
    const response = await apiClient.post('/api/auth/login', { username, password });
    const { access_token, user } = response.data;
    setToken(access_token);
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || 'Login failed' };
  }
};

export const getMe = async () => {
  try {
    const response = await apiClient.get('/api/auth/me');
    return response.data.user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

// Inventory
export const getInventory = async () => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.getInventoryItems();
  } else {
    try {
      const response = await apiClient.get('/api/inventory');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }
};

export const createInventory = async (item: any) => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.addInventoryItem(item);
  } else {
    try {
      const response = await apiClient.post('/api/inventory', item);
      return response.data;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }
};

export const updateInventory = async (id: string, data: any) => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.updateInventoryItem(id, data);
  } else {
    try {
      const response = await apiClient.put(`/api/inventory/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }
};

export const deleteInventory = async (id: string) => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.deleteInventoryItem(id);
  } else {
    try {
      await apiClient.delete(`/api/inventory/${id}`);
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }
};

// Orders
export const getOrders = async () => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.getOrders();
  } else {
    try {
      const response = await apiClient.get('/api/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }
};

export const createOrder = async (payload: any) => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.addOrder(payload);
  } else {
    try {
      const response = await apiClient.post('/api/orders', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
};

// Staff
export const getStaff = async () => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.getStaffMembers();
  } else {
    try {
      const response = await apiClient.get('/api/staff');
      return response.data;
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
  }
};

export const createStaff = async (data: any) => {
  if (API_MODE === 'supabase') {
    try {
      const staffData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        department: getDepartmentFromRole(data.role),
        salary: data.salary || 25000,
        username: data.username,
        password_hash: data.password, // In production, this should be properly hashed
        is_active: true
      };
      
      const result = await DatabaseService.addStaffMember(staffData);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error creating staff in database:', error);
      return { success: false, error: (error as Error).message };
    }
  } else {
    try {
      const response = await apiClient.post('/api/staff', data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating staff member:', error);
      return { success: false, error: (error as any).response?.data?.message || 'Failed to create staff' };
    }
  }
};

function getDepartmentFromRole(role: string): string {
  switch (role) {
    case 'admin': return 'Management';
    case 'kitchen_staff': return 'Kitchen';
    case 'inventory_manager': return 'Operations';
    case 'delivery_staff': return 'Delivery';
    default: return 'General';
  }
}
export const updateStaff = async (id: string, data: any) => {
  if (API_MODE === 'supabase') {
    try {
      const dbUpdates = {
        name: data.name,
        email: data.email?.toLowerCase(),
        phone: data.phone,
        role: data.role,
        department: data.department,
        salary: data.salary,
        is_active: data.isActive,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key as keyof typeof dbUpdates] === undefined) {
          delete dbUpdates[key as keyof typeof dbUpdates];
        }
      });

      return await DatabaseService.updateStaffMember(id, dbUpdates);
    } catch (error) {
      console.error('Error updating staff in database:', error);
      throw error;
    }
  } else {
    try {
      const response = await apiClient.put(`/api/staff/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating staff member:', error);
      throw error;
    }
  }
};

export const deleteStaff = async (id: string) => {
  if (API_MODE === 'supabase') {
    // TODO: Implement staff deletion in Supabase
    throw new Error('Staff deletion not implemented for Supabase mode');
  } else {
    try {
      await apiClient.delete(`/api/staff/${id}`);
    } catch (error) {
      console.error('Error deleting staff member:', error);
      throw error;
    }
  }
};

// Suppliers
export const getSuppliers = async () => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.getSuppliers();
  } else {
    try {
      const response = await apiClient.get('/api/suppliers');
      return response.data;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  }
};

export const createSupplier = async (data: any) => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.addSupplier(data);
  } else {
    try {
      const response = await apiClient.post('/api/suppliers', data);
      return response.data;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }
};

export const updateSupplier = async (id: string, data: any) => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.updateSupplier(id, data);
  } else {
    try {
      const response = await apiClient.put(`/api/suppliers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }
};

export const deleteSupplier = async (id: string) => {
  if (API_MODE === 'supabase') {
    // TODO: Implement supplier deletion in Supabase
    throw new Error('Supplier deletion not implemented for Supabase mode');
  } else {
    try {
      await apiClient.delete(`/api/suppliers/${id}`);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }
};

// Stock Movements
export const getStockMovements = async () => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.getStockMovements();
  } else {
    try {
      const response = await apiClient.get('/api/stock-movements');
      return response.data;
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      throw error;
    }
  }
};

export const createStockMovement = async (data: any) => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.addStockMovement(data);
  } else {
    try {
      const response = await apiClient.post('/api/stock-movements', data);
      return response.data;
    } catch (error) {
      console.error('Error creating stock movement:', error);
      throw error;
    }
  }
};

// Recipes
export const getRecipes = async () => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.getRecipes();
  } else {
    try {
      const response = await apiClient.get('/api/recipes');
      return response.data;
    } catch (error) {
      console.error('Error fetching recipes:', error);
      throw error;
    }
  }
};

export const createRecipe = async (data: any) => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.addRecipe(data);
  } else {
    try {
      const response = await apiClient.post('/api/recipes', data);
      return response.data;
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  }
};

export const updateRecipe = async (id: string, data: any) => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.updateRecipe(id, data);
  } else {
    try {
      const response = await apiClient.put(`/api/recipes/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  }
};

export const deleteRecipe = async (id: string) => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.deleteRecipe(id);
  } else {
    try {
      await apiClient.delete(`/api/recipes/${id}`);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }
};

// Delivery Confirmations
export const getDeliveryConfirmations = async () => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.getDeliveryConfirmations();
  } else {
    try {
      const response = await apiClient.get('/api/delivery-confirmations');
      return response.data;
    } catch (error) {
      console.error('Error fetching delivery confirmations:', error);
      throw error;
    }
  }
};

export const createDeliveryConfirmation = async (data: any) => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.addDeliveryConfirmation(data);
  } else {
    try {
      const response = await apiClient.post('/api/delivery-confirmations', data);
      return response.data;
    } catch (error) {
      console.error('Error creating delivery confirmation:', error);
      throw error;
    }
  }
};

export const getDeliveryConfirmationByOrderId = async (orderId: string) => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.getDeliveryConfirmationByOrderId(orderId);
  } else {
    try {
      const response = await apiClient.get(`/api/delivery-confirmations/order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching delivery confirmation:', error);
      return null;
    }
  }
};

// Customers
export const getCustomers = async () => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.getCustomers();
  } else {
    try {
      const response = await apiClient.get('/api/customers');
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }
};

export const createCustomer = async (data: any) => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.addCustomer(data);
  } else {
    try {
      const response = await apiClient.post('/api/customers', data);
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }
};

export const updateCustomer = async (id: string, data: any) => {
  if (API_MODE === 'supabase') {
    return await DatabaseService.updateCustomer(id, data);
  } else {
    try {
      const response = await apiClient.put(`/api/customers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }
};