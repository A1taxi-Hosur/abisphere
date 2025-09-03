import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not configured.');
  console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  console.warn('Click "Connect to Supabase" button in the top right to set up Supabase');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;

export const supabaseAdmin = supabase;

export class DatabaseService {
  static supabase = supabase;
  
  static isConnected() {
    return supabase !== null && 
           import.meta.env.VITE_SUPABASE_URL && 
           import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
  
  // Suppliers
  static async getSuppliers() {
    if (!this.isConnected()) {
      throw new Error('Supabase not configured - missing environment variables');
    }
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase suppliers query error:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  static async addSupplier(supplier: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplier])
        .select();
      
      if (error) {
        console.error('Supabase supplier insert error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from insert');
      }
      
      return data[0];
    } catch (error) {
      console.error('Database supplier insert error:', error);
      throw error;
    }
  }

  static async updateSupplier(id: string, updates: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Supabase supplier update error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from update');
      }
      
      return data[0];
    } catch (error) {
      console.error('Database supplier update error:', error);
      throw error;
    }
  }

  // Inventory Items
  static async getInventoryItems() {
    if (!this.isConnected()) {
      throw new Error('Supabase not configured - missing environment variables');
    }
    
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Supabase inventory items query error:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Database inventory items load failed:', error);
      throw error;
    }
  }

  static async addInventoryItem(item: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([item])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateInventoryItem(id: string, updates: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteInventoryItem(id: string) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Stock Movements
  static async getStockMovements() {
    if (!this.isConnected()) {
      throw new Error('Supabase not configured - missing environment variables');
    }
    
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase stock movements query error:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Database stock movements load failed:', error);
      throw error;
    }
  }

  static async addStockMovement(movement: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    const { data, error } = await supabase
      .from('stock_movements')
      .insert([movement])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Recipes
  static async getRecipes() {
    if (!this.isConnected()) {
      throw new Error('Supabase not configured - missing environment variables');
    }
    
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Supabase recipes query error:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Database recipes load failed:', error);
      throw error;
    }
  }

  static async addRecipe(recipe: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    const { data, error } = await supabase
      .from('recipes')
      .insert([recipe])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateRecipe(id: string, updates: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    const { data, error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteRecipe(id: string) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Orders
  static async getOrders() {
    if (!this.isConnected()) {
      throw new Error('Supabase not configured - missing environment variables');
    }
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_number')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase orders query error:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Database orders load failed:', error);
      throw error;
    }
  }

  static async addOrder(order: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select('*, order_number')
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateOrder(id: string, updates: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delivery Confirmations
  static async getDeliveryConfirmations() {
    if (!this.isConnected()) {
      throw new Error('Supabase not configured - missing environment variables');
    }
    
    try {
      const { data, error } = await supabase
        .from('delivery_confirmations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase delivery confirmations query error:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Database delivery confirmations load failed:', error);
      throw error;
    }
  }

  static async addDeliveryConfirmation(confirmation: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    console.log('Adding delivery confirmation to database:', confirmation);
    
    const { data, error } = await supabase
      .from('delivery_confirmations')
      .insert([confirmation])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase delivery confirmation insert error:', error);
      throw new Error(`Failed to save delivery confirmation: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from delivery confirmation insert');
    }
    
    console.log('Delivery confirmation saved successfully:', data);
    return data;
  }

  static async getDeliveryConfirmationByOrderId(orderId: string) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    const { data, error } = await supabase
      .from('delivery_confirmations')
      .select('*')
      .eq('order_id', orderId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }
  // Staff Members
  static async getStaffMembers() {
    if (!this.isConnected()) {
      throw new Error('Supabase not configured - missing environment variables');
    }
    
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase staff members query error:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Database staff members load failed:', error);
      throw error;
    }
  }

  static async addStaffMember(user: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .insert([user])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase staff member insert error:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('No data returned from staff member insert');
      }
      
      return data;
    } catch (error) {
      console.error('Database staff member insert error:', error);
      throw error;
    }
  }

  static async updateStaffMember(id: string, updates: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase staff member update error:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('No data returned from staff member update');
      }
      
      return data;
    } catch (error) {
      console.error('Database staff member update error:', error);
      throw error;
    }
  }

  // Update customers to use proper database operations
  static async addCustomer(customer: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateCustomer(id: string, updates: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Customers
  static async getCustomers() {
    if (!this.isConnected()) {
      throw new Error('Supabase not configured - missing environment variables');
    }
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase customers query error:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Database customers load failed:', error);
      throw error;
    }
  }

  // Purchase Orders
  static async getPurchaseOrders() {
    if (!this.isConnected()) {
      throw new Error('Supabase not configured - missing environment variables');
    }
    
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase purchase orders query error:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Database purchase orders load failed:', error);
      throw error;
    }
  }

  static async addPurchaseOrder(purchaseOrder: any) {
    if (!supabase) {
      throw new Error('Database not configured');
    }
    
    const { data, error } = await supabase
      .from('purchase_orders')
      .insert([purchaseOrder])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

// Real-time subscription helpers
export const subscribeToTable = (table: string, callback: (payload: any) => void) => {
  if (!supabase) {
    console.warn('Supabase not configured, skipping subscription');
    return { unsubscribe: () => {} };
  }
  
  try {
    return supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe();
  } catch (error) {
    console.log(`Failed to subscribe to ${table}:`, error);
    return { unsubscribe: () => {} };
  }
};