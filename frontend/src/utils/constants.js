export const API_ENDPOINTS = {
  // Note: User authentication is handled by Asgardeo
  // No local auth endpoints needed

  // Product Catalog Service
  PRODUCTS: {
    BASE: "/api/products",
    SEARCH: "/api/products/search",
    BY_IDS: "/api/products/by-ids",
  },
  CATEGORIES: "/api/categories",

  // Inventory Service
  INVENTORY: {
    BASE: "/api/inventory",
    ADJUST: "/api/inventory/adjust",
    RESERVE: "/api/inventory/reserve",
    RELEASE: "/api/inventory/release",
    MOVEMENTS: "/api/inventory/movements",
  },

  // Supplier Service
  SUPPLIERS: "/api/suppliers",
  PURCHASE_ORDERS: "/api/purchase-orders",

  // Order Service
  ORDERS: "/api/orders",

  // Identity Service (Asgardeo SCIM2 Proxy)
  IDENTITY: {
    SUPPLIERS: "/api/identity/suppliers",
    STAFF: "/api/identity/staff",
    USERS: "/api/identity/users",
    GROUPS: "/api/identity/groups",
  },

  // Health Checks
  HEALTH: {
    PRODUCT: "/health",
    INVENTORY: "/health",
    SUPPLIER: "/health",
    ORDER: "/health",
    IDENTITY: "/health",
  },
};

// Environment detection
const isDevelopment = import.meta.env.MODE === 'development';

// API Gateway URL for staging/production environments
const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || '';

// In development: call each microservice directly
// In staging/production: call through API gateway (services are at /api/*)
export const SERVICES = isDevelopment ? {
  PRODUCT: import.meta.env.VITE_PRODUCT_SERVICE_URL || "http://localhost:3002",
  INVENTORY: import.meta.env.VITE_INVENTORY_SERVICE_URL || "http://localhost:3003",
  SUPPLIER: import.meta.env.VITE_SUPPLIER_SERVICE_URL || "http://localhost:3004",
  ORDER: import.meta.env.VITE_ORDER_SERVICE_URL || "http://localhost:3005",
  IDENTITY: import.meta.env.VITE_IDENTITY_SERVICE_URL || "http://localhost:3006",
} : {
  // In production, all API calls go through the same gateway/proxy
  // The frontend nginx proxies /api/* to the API gateway
  PRODUCT: API_GATEWAY_URL,
  INVENTORY: API_GATEWAY_URL,
  SUPPLIER: API_GATEWAY_URL,
  ORDER: API_GATEWAY_URL,
  IDENTITY: API_GATEWAY_URL,
};
