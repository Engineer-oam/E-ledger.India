import { ProductionOrder, InventoryItem, SaleOrder, User, Sector } from '../types';

// ERP System types
export enum ERPType {
  SAP = 'SAP',
  ORACLE_NETSUITE = 'ORACLE_NETSUITE',
  MICROSOFT_DYNAMICS = 'MICROSOFT_DYNAMICS',
  CUSTOM = 'CUSTOM',
  MANUAL = 'MANUAL'
}

// ERP Connection Status
export enum ERPConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  PENDING = 'PENDING',
  ERROR = 'ERROR'
}

// Interface for ERP adapter
export interface ERPSyncAdapter {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  syncProductionOrders(): Promise<ProductionOrder[]>;
  syncInventory(): Promise<InventoryItem[]>;
  syncSales(): Promise<SaleOrder[]>;
  createProductionOrder(order: Partial<ProductionOrder>): Promise<ProductionOrder>;
  updateInventoryLevel(sku: string, adjustment: number): Promise<void>;
  createSale(sale: Partial<SaleOrder>): Promise<SaleOrder>;
  getStatus(): Promise<ERPConnectionStatus>;
}

// Base ERP Adapter Class
abstract class BaseERPSyncAdapter implements ERPSyncAdapter {
  protected user: User;
  
  constructor(user: User) {
    this.user = user;
  }
  
  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract syncProductionOrders(): Promise<ProductionOrder[]>;
  abstract syncInventory(): Promise<InventoryItem[]>;
  abstract syncSales(): Promise<SaleOrder[]>;
  abstract createProductionOrder(order: Partial<ProductionOrder>): Promise<ProductionOrder>;
  abstract updateInventoryLevel(sku: string, adjustment: number): Promise<void>;
  abstract createSale(sale: Partial<SaleOrder>): Promise<SaleOrder>;
  abstract getStatus(): Promise<ERPConnectionStatus>;
}

// Mock ERP Adapter for manual entry
class MockERPSyncAdapter extends BaseERPSyncAdapter {
  private STORAGE_KEYS = {
    PRODUCTION: 'erp_production_orders',
    INVENTORY: 'erp_inventory',
    SALES: 'erp_sales'
  };

  async connect(): Promise<boolean> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  }

  async disconnect(): Promise<void> {
    // Nothing to disconnect for mock
  }

  async syncProductionOrders(): Promise<ProductionOrder[]> {
    const stored = localStorage.getItem(`${this.STORAGE_KEYS.PRODUCTION}_${this.user.gln}`);
    if (stored) return JSON.parse(stored);
    
    const initial: ProductionOrder[] = [
      { 
        id: 'PO-1001', 
        productName: this.user.sector === Sector.PHARMA ? 'Amoxicillin 500mg' : 'Premium Reserve', 
        plannedQty: 5000, 
        actualQty: 4800, 
        startDate: new Date().toISOString(), 
        status: 'COMPLETED',
        sectorSpecifics: this.user.sector === Sector.EXCISE ? { abv: 42.8, vatId: 'V-09' } : { temp: '25C', batchCode: 'ST-01' }
      }
    ];
    localStorage.setItem(`${this.STORAGE_KEYS.PRODUCTION}_${this.user.gln}`, JSON.stringify(initial));
    return initial;
  }

  async syncInventory(): Promise<InventoryItem[]> {
    const stored = localStorage.getItem(`${this.STORAGE_KEYS.INVENTORY}_${this.user.gln}`);
    if (stored) return JSON.parse(stored);

    const initial: InventoryItem[] = [
      { id: 'SKU-01', name: 'Standard Packaging 1L', sku: 'PKG-100', stockLevel: 1200, minLevel: 200, unit: 'pcs' },
      { id: 'SKU-02', name: 'Raw Material Blend A', sku: 'RAW-500', stockLevel: 45, minLevel: 10, unit: 'kg' }
    ];
    localStorage.setItem(`${this.STORAGE_KEYS.INVENTORY}_${this.user.gln}`, JSON.stringify(initial));
    return initial;
  }

  async syncSales(): Promise<SaleOrder[]> {
    const stored = localStorage.getItem(`${this.STORAGE_KEYS.SALES}_${this.user.gln}`);
    if (stored) return JSON.parse(stored);

    const initial: SaleOrder[] = [
      { 
        id: 'SO-9923', 
        customerName: 'Regional Distributor Alpha', 
        totalAmount: 145000, 
        date: new Date().toISOString(),
        items: [{ name: 'Mixed Cases', qty: 10, price: 14500 }],
        syncStatus: 'SYNCED'
      }
    ];
    localStorage.setItem(`${this.STORAGE_KEYS.SALES}_${this.user.gln}`, JSON.stringify(initial));
    return initial;
  }

  async createProductionOrder(order: Partial<ProductionOrder>): Promise<ProductionOrder> {
    const orders = await this.syncProductionOrders();
    const newOrder: ProductionOrder = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      productName: order.productName || 'New Product',
      plannedQty: order.plannedQty || 0,
      actualQty: 0,
      startDate: new Date().toISOString(),
      status: 'PENDING',
      sectorSpecifics: order.sectorSpecifics || {}
    };
    orders.unshift(newOrder);
    localStorage.setItem(`${this.STORAGE_KEYS.PRODUCTION}_${this.user.gln}`, JSON.stringify(orders));
    return newOrder;
  }

  async updateInventoryLevel(sku: string, adjustment: number): Promise<void> {
    const inv = await this.syncInventory();
    const item = inv.find(i => i.sku === sku);
    if (item) {
      item.stockLevel += adjustment;
      localStorage.setItem(`${this.STORAGE_KEYS.INVENTORY}_${this.user.gln}`, JSON.stringify(inv));
    }
  }

  async createSale(sale: Partial<SaleOrder>): Promise<SaleOrder> {
    const sales = await this.syncSales();
    const newSale: SaleOrder = {
      id: `SO-${Date.now().toString().slice(-4)}`,
      customerName: sale.customerName || 'Walk-in Customer',
      totalAmount: sale.totalAmount || 0,
      date: new Date().toISOString(),
      items: sale.items || [],
      syncStatus: 'PENDING'
    };
    sales.unshift(newSale);
    localStorage.setItem(`${this.STORAGE_KEYS.SALES}_${this.user.gln}`, JSON.stringify(sales));
    return newSale;
  }

  async getStatus(): Promise<ERPConnectionStatus> {
    // Simulate API network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    // Logic: Manual ERP is always "connected", others simulate a healthy response
    return ERPConnectionStatus.CONNECTED;
  }
}

// SAP ERP Adapter
class SAPErpAdapter extends BaseERPSyncAdapter {
  private sapClient: any; // In a real implementation, this would be the SAP SDK client
  
  async connect(): Promise<boolean> {
    // Simulate connecting to SAP system
    console.log(`Connecting to SAP for GLN: ${this.user.gln}`);
    // In real implementation: initialize SAP SDK and authenticate
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate connection time
    return true;
  }

  async disconnect(): Promise<void> {
    // Disconnect from SAP
    console.log(`Disconnecting from SAP for GLN: ${this.user.gln}`);
  }

  async syncProductionOrders(): Promise<ProductionOrder[]> {
    // In real implementation: fetch from SAP using RFC or IDoc
    console.log(`Syncing production orders from SAP for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    // Return mock data for demonstration
    return [
      { 
        id: 'SAP-PO-1001', 
        productName: this.user.sector === Sector.PHARMA ? 'Amoxicillin 500mg' : 'Premium Reserve', 
        plannedQty: 5000, 
        actualQty: 4800, 
        startDate: new Date().toISOString(), 
        status: 'COMPLETED',
        sectorSpecifics: this.user.sector === Sector.EXCISE ? { abv: 42.8, vatId: 'V-09' } : { temp: '25C', batchCode: 'ST-01' }
      }
    ];
  }

  async syncInventory(): Promise<InventoryItem[]> {
    // In real implementation: fetch inventory from SAP
    console.log(`Syncing inventory from SAP for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    return [
      { id: 'SAP-SKU-01', name: 'Standard Packaging 1L', sku: 'PKG-100', stockLevel: 1200, minLevel: 200, unit: 'pcs' },
      { id: 'SAP-SKU-02', name: 'Raw Material Blend A', sku: 'RAW-500', stockLevel: 45, minLevel: 10, unit: 'kg' }
    ];
  }

  async syncSales(): Promise<SaleOrder[]> {
    // In real implementation: fetch sales from SAP
    console.log(`Syncing sales from SAP for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    return [
      { 
        id: 'SAP-SO-9923', 
        customerName: 'Regional Distributor Alpha', 
        totalAmount: 145000, 
        date: new Date().toISOString(),
        items: [{ name: 'Mixed Cases', qty: 10, price: 14500 }],
        syncStatus: 'SYNCED'
      }
    ];
  }

  async createProductionOrder(order: Partial<ProductionOrder>): Promise<ProductionOrder> {
    // In real implementation: create order in SAP
    console.log(`Creating production order in SAP for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    const newOrder: ProductionOrder = {
      id: `SAP-PO-${Date.now().toString().slice(-4)}`,
      productName: order.productName || 'New Product',
      plannedQty: order.plannedQty || 0,
      actualQty: 0,
      startDate: new Date().toISOString(),
      status: 'PENDING',
      sectorSpecifics: order.sectorSpecifics || {}
    };
    
    return newOrder;
  }

  async updateInventoryLevel(sku: string, adjustment: number): Promise<void> {
    // In real implementation: update inventory in SAP
    console.log(`Updating inventory in SAP for SKU: ${sku}, adjustment: ${adjustment}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
  }

  async createSale(sale: Partial<SaleOrder>): Promise<SaleOrder> {
    // In real implementation: create sale in SAP
    console.log(`Creating sale in SAP for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    const newSale: SaleOrder = {
      id: `SAP-SO-${Date.now().toString().slice(-4)}`,
      customerName: sale.customerName || 'Walk-in Customer',
      totalAmount: sale.totalAmount || 0,
      date: new Date().toISOString(),
      items: sale.items || [],
      syncStatus: 'PENDING'
    };
    
    return newSale;
  }

  async getStatus(): Promise<ERPConnectionStatus> {
    // In real implementation: check SAP connection status
    try {
      console.log(`Checking SAP connection status for GLN: ${this.user.gln}`);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
      return ERPConnectionStatus.CONNECTED;
    } catch (error) {
      console.error(`SAP connection error: ${error}`);
      return ERPConnectionStatus.ERROR;
    }
  }
}

// Oracle NetSuite ERP Adapter
class OracleNetSuiteErpAdapter extends BaseERPSyncAdapter {
  private netsuiteClient: any; // In a real implementation, this would be the Netsuite SDK client
  
  async connect(): Promise<boolean> {
    // Simulate connecting to Oracle NetSuite
    console.log(`Connecting to Oracle NetSuite for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate connection time
    return true;
  }

  async disconnect(): Promise<void> {
    // Disconnect from Oracle NetSuite
    console.log(`Disconnecting from Oracle NetSuite for GLN: ${this.user.gln}`);
  }

  async syncProductionOrders(): Promise<ProductionOrder[]> {
    // In real implementation: fetch from Oracle NetSuite using REST API
    console.log(`Syncing production orders from Oracle NetSuite for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    return [
      { 
        id: 'NS-PO-1001', 
        productName: this.user.sector === Sector.PHARMA ? 'Amoxicillin 500mg' : 'Premium Reserve', 
        plannedQty: 5000, 
        actualQty: 4800, 
        startDate: new Date().toISOString(), 
        status: 'COMPLETED',
        sectorSpecifics: this.user.sector === Sector.EXCISE ? { abv: 42.8, vatId: 'V-09' } : { temp: '25C', batchCode: 'ST-01' }
      }
    ];
  }

  async syncInventory(): Promise<InventoryItem[]> {
    // In real implementation: fetch inventory from Oracle NetSuite
    console.log(`Syncing inventory from Oracle NetSuite for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    return [
      { id: 'NS-SKU-01', name: 'Standard Packaging 1L', sku: 'PKG-100', stockLevel: 1200, minLevel: 200, unit: 'pcs' },
      { id: 'NS-SKU-02', name: 'Raw Material Blend A', sku: 'RAW-500', stockLevel: 45, minLevel: 10, unit: 'kg' }
    ];
  }

  async syncSales(): Promise<SaleOrder[]> {
    // In real implementation: fetch sales from Oracle NetSuite
    console.log(`Syncing sales from Oracle NetSuite for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    return [
      { 
        id: 'NS-SO-9923', 
        customerName: 'Regional Distributor Alpha', 
        totalAmount: 145000, 
        date: new Date().toISOString(),
        items: [{ name: 'Mixed Cases', qty: 10, price: 14500 }],
        syncStatus: 'SYNCED'
      }
    ];
  }

  async createProductionOrder(order: Partial<ProductionOrder>): Promise<ProductionOrder> {
    // In real implementation: create order in Oracle NetSuite
    console.log(`Creating production order in Oracle NetSuite for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    const newOrder: ProductionOrder = {
      id: `NS-PO-${Date.now().toString().slice(-4)}`,
      productName: order.productName || 'New Product',
      plannedQty: order.plannedQty || 0,
      actualQty: 0,
      startDate: new Date().toISOString(),
      status: 'PENDING',
      sectorSpecifics: order.sectorSpecifics || {}
    };
    
    return newOrder;
  }

  async updateInventoryLevel(sku: string, adjustment: number): Promise<void> {
    // In real implementation: update inventory in Oracle NetSuite
    console.log(`Updating inventory in Oracle NetSuite for SKU: ${sku}, adjustment: ${adjustment}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
  }

  async createSale(sale: Partial<SaleOrder>): Promise<SaleOrder> {
    // In real implementation: create sale in Oracle NetSuite
    console.log(`Creating sale in Oracle NetSuite for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    const newSale: SaleOrder = {
      id: `NS-SO-${Date.now().toString().slice(-4)}`,
      customerName: sale.customerName || 'Walk-in Customer',
      totalAmount: sale.totalAmount || 0,
      date: new Date().toISOString(),
      items: sale.items || [],
      syncStatus: 'PENDING'
    };
    
    return newSale;
  }

  async getStatus(): Promise<ERPConnectionStatus> {
    // In real implementation: check Oracle NetSuite connection status
    try {
      console.log(`Checking Oracle NetSuite connection status for GLN: ${this.user.gln}`);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
      return ERPConnectionStatus.CONNECTED;
    } catch (error) {
      console.error(`Oracle NetSuite connection error: ${error}`);
      return ERPConnectionStatus.ERROR;
    }
  }
}

// Microsoft Dynamics ERP Adapter
class MicrosoftDynamicsErpAdapter extends BaseERPSyncAdapter {
  private dynamicsClient: any; // In a real implementation, this would be the Dynamics SDK client
  
  async connect(): Promise<boolean> {
    // Simulate connecting to Microsoft Dynamics
    console.log(`Connecting to Microsoft Dynamics for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate connection time
    return true;
  }

  async disconnect(): Promise<void> {
    // Disconnect from Microsoft Dynamics
    console.log(`Disconnecting from Microsoft Dynamics for GLN: ${this.user.gln}`);
  }

  async syncProductionOrders(): Promise<ProductionOrder[]> {
    // In real implementation: fetch from Microsoft Dynamics using OData or SOAP
    console.log(`Syncing production orders from Microsoft Dynamics for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    return [
      { 
        id: 'MD-PO-1001', 
        productName: this.user.sector === Sector.PHARMA ? 'Amoxicillin 500mg' : 'Premium Reserve', 
        plannedQty: 5000, 
        actualQty: 4800, 
        startDate: new Date().toISOString(), 
        status: 'COMPLETED',
        sectorSpecifics: this.user.sector === Sector.EXCISE ? { abv: 42.8, vatId: 'V-09' } : { temp: '25C', batchCode: 'ST-01' }
      }
    ];
  }

  async syncInventory(): Promise<InventoryItem[]> {
    // In real implementation: fetch inventory from Microsoft Dynamics
    console.log(`Syncing inventory from Microsoft Dynamics for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    return [
      { id: 'MD-SKU-01', name: 'Standard Packaging 1L', sku: 'PKG-100', stockLevel: 1200, minLevel: 200, unit: 'pcs' },
      { id: 'MD-SKU-02', name: 'Raw Material Blend A', sku: 'RAW-500', stockLevel: 45, minLevel: 10, unit: 'kg' }
    ];
  }

  async syncSales(): Promise<SaleOrder[]> {
    // In real implementation: fetch sales from Microsoft Dynamics
    console.log(`Syncing sales from Microsoft Dynamics for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    return [
      { 
        id: 'MD-SO-9923', 
        customerName: 'Regional Distributor Alpha', 
        totalAmount: 145000, 
        date: new Date().toISOString(),
        items: [{ name: 'Mixed Cases', qty: 10, price: 14500 }],
        syncStatus: 'SYNCED'
      }
    ];
  }

  async createProductionOrder(order: Partial<ProductionOrder>): Promise<ProductionOrder> {
    // In real implementation: create order in Microsoft Dynamics
    console.log(`Creating production order in Microsoft Dynamics for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    const newOrder: ProductionOrder = {
      id: `MD-PO-${Date.now().toString().slice(-4)}`,
      productName: order.productName || 'New Product',
      plannedQty: order.plannedQty || 0,
      actualQty: 0,
      startDate: new Date().toISOString(),
      status: 'PENDING',
      sectorSpecifics: order.sectorSpecifics || {}
    };
    
    return newOrder;
  }

  async updateInventoryLevel(sku: string, adjustment: number): Promise<void> {
    // In real implementation: update inventory in Microsoft Dynamics
    console.log(`Updating inventory in Microsoft Dynamics for SKU: ${sku}, adjustment: ${adjustment}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
  }

  async createSale(sale: Partial<SaleOrder>): Promise<SaleOrder> {
    // In real implementation: create sale in Microsoft Dynamics
    console.log(`Creating sale in Microsoft Dynamics for GLN: ${this.user.gln}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    const newSale: SaleOrder = {
      id: `MD-SO-${Date.now().toString().slice(-4)}`,
      customerName: sale.customerName || 'Walk-in Customer',
      totalAmount: sale.totalAmount || 0,
      date: new Date().toISOString(),
      items: sale.items || [],
      syncStatus: 'PENDING'
    };
    
    return newSale;
  }

  async getStatus(): Promise<ERPConnectionStatus> {
    // In real implementation: check Microsoft Dynamics connection status
    try {
      console.log(`Checking Microsoft Dynamics connection status for GLN: ${this.user.gln}`);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
      return ERPConnectionStatus.CONNECTED;
    } catch (error) {
      console.error(`Microsoft Dynamics connection error: ${error}`);
      return ERPConnectionStatus.ERROR;
    }
  }
}

// Main ERP Service with factory pattern
export class ERPService {
  private static adapters = new Map<string, ERPSyncAdapter>();

  static getAdapter(user: User): ERPSyncAdapter {
    const key = user.gln;
    
    // Check if adapter already exists
    if (this.adapters.has(key)) {
      return this.adapters.get(key)!;
    }
    
    // Create new adapter based on user's ERP type
    let adapter: ERPSyncAdapter;
    
    switch (user.erpType) {
      case ERPType.SAP:
        adapter = new SAPErpAdapter(user);
        break;
      case ERPType.ORACLE_NETSUITE:
        adapter = new OracleNetSuiteErpAdapter(user);
        break;
      case ERPType.MICROSOFT_DYNAMICS:
        adapter = new MicrosoftDynamicsErpAdapter(user);
        break;
      case ERPType.CUSTOM:
      case ERPType.MANUAL:
      default:
        adapter = new MockERPSyncAdapter(user);
        break;
    }
    
    this.adapters.set(key, adapter);
    return adapter;
  }

  // Convenience methods that delegate to the appropriate adapter
  static async getProductionOrders(user: User): Promise<ProductionOrder[]> {
    const adapter = this.getAdapter(user);
    return await adapter.syncProductionOrders();
  }

  static async createProductionOrder(user: User, order: Partial<ProductionOrder>): Promise<ProductionOrder> {
    const adapter = this.getAdapter(user);
    return await adapter.createProductionOrder(order);
  }

  static async updateProductionStatus(user: User, id: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED', actualQty?: number) {
    // In a real implementation, this would update the status in the ERP
    console.log(`Updating production order ${id} status to ${status} for GLN: ${user.gln}`);
  }

  static async getInventory(user: User): Promise<InventoryItem[]> {
    const adapter = this.getAdapter(user);
    return await adapter.syncInventory();
  }

  static async updateInventoryLevel(user: User, sku: string, adjustment: number) {
    const adapter = this.getAdapter(user);
    await adapter.updateInventoryLevel(sku, adjustment);
  }

  static async getSales(user: User): Promise<SaleOrder[]> {
    const adapter = this.getAdapter(user);
    return await adapter.syncSales();
  }

  static async createSale(user: User, sale: Partial<SaleOrder>): Promise<SaleOrder> {
    const adapter = this.getAdapter(user);
    return await adapter.createSale(sale);
  }

  static async checkConnection(user: User): Promise<ERPConnectionStatus> {
    const adapter = this.getAdapter(user);
    return await adapter.getStatus();
  }

  // Method to manually trigger synchronization
  static async synchronizeAll(user: User): Promise<{ production: ProductionOrder[], inventory: InventoryItem[], sales: SaleOrder[] }> {
    const adapter = this.getAdapter(user);
    
    const [production, inventory, sales] = await Promise.all([
      adapter.syncProductionOrders(),
      adapter.syncInventory(),
      adapter.syncSales()
    ]);
    
    return { production, inventory, sales };
  }
}

// Export the ERP types for use elsewhere
export { ERPType, ERPConnectionStatus };