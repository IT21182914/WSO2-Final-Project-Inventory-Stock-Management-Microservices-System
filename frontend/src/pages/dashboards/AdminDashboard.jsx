import { useState, useEffect } from "react";
import {
  Users,
  Package,
  TrendingUp,
  AlertCircle,
  Activity,
  Box,
} from "lucide-react";
import Card from "../../components/common/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { productService } from "../../services/productService";
import { inventoryService } from "../../services/inventoryService";
import { userService } from "../../services/userService";
import { orderService } from "../../services/orderService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import axios from "axios";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalInventory: 0,
    lowStockItems: 0,
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalSuppliers: 0,
  });
  const [stockMovements, setStockMovements] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [products, inventory, users, movements, orderStats, suppliers] =
        await Promise.all([
          productService.getAllProducts(),
          inventoryService.getAllInventory(),
          userService.getAllUsers().catch(() => ({ data: [] })),
          inventoryService
            .getStockMovements({ limit: 30 })
            .catch(() => ({ data: [] })),
          orderService.getOrderStats().catch(() => ({ data: null })),
          axios
            .get("http://localhost:3004/api/suppliers")
            .catch(() => ({ data: { data: [] } })),
        ]);

      // Calculate stats
      const orderData = orderStats?.data || {};
      setStats({
        totalProducts: products.data?.length || 0,
        totalInventory:
          inventory.data?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        lowStockItems:
          inventory.data?.filter((item) => item.quantity < item.min_quantity)
            .length || 0,
        totalUsers: users.data?.length || 0,
        totalOrders: orderData.total || 0,
        pendingOrders: orderData.pending || 0,
        totalRevenue: orderData.totalRevenue || 0,
        totalSuppliers: suppliers?.data?.data?.length || 0,
      });

      // Process stock movements for chart (group by date)
      if (movements.data && movements.data.length > 0) {
        const movementsByDate = {};
        movements.data.forEach((movement) => {
          const date = new Date(movement.created_at);
          const dateKey = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          if (!movementsByDate[dateKey]) {
            movementsByDate[dateKey] = { date, in: 0, out: 0 };
          }
          const qty = Math.abs(movement.quantity);
          if (
            movement.movement_type === "in" ||
            movement.movement_type === "return"
          ) {
            movementsByDate[dateKey].in += qty;
          } else {
            movementsByDate[dateKey].out += qty;
          }
        });

        // Sort by date and take last 7 days
        const sortedMovements = Object.entries(movementsByDate)
          .sort(([, a], [, b]) => a.date - b.date)
          .slice(-7)
          .map(([name, data]) => ({
            name,
            in: data.in,
            out: data.out,
          }));

        setStockMovements(sortedMovements);
      } else {
        // Default data
        setStockMovements([
          { name: "Dec 1", in: 100, out: 50 },
          { name: "Dec 2", in: 80, out: 60 },
          { name: "Dec 3", in: 120, out: 40 },
        ]);
      }

      // Process category data for chart
      if (products.data && products.data.length > 0) {
        const categoryCounts = {};
        products.data.forEach((product) => {
          const category = product.category_name || "Uncategorized";
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
        setCategoryData(
          Object.entries(categoryCounts).map(([name, value]) => ({
            name,
            value,
          }))
        );
      } else {
        setCategoryData([
          { name: "Electronics", value: 12 },
          { name: "Clothing", value: 8 },
          { name: "Food", value: 15 },
        ]);
      }

      // Recent activities with product names
      if (movements.data && movements.data.length > 0) {
        // Get unique product IDs from movements
        const productIds = [
          ...new Set(movements.data.map((m) => m.product_id)),
        ];

        // Fetch product names
        let productMap = {};
        try {
          const productsResponse = await productService.getProductsByIds(
            productIds
          );
          if (productsResponse.data) {
            productMap = productsResponse.data.reduce((acc, p) => {
              acc[p.id] = p.name;
              return acc;
            }, {});
          }
        } catch (error) {
          console.log("Could not fetch product names for activities");
        }

        setRecentActivities(
          movements.data.slice(0, 5).map((movement) => ({
            type: movement.movement_type,
            product:
              productMap[movement.product_id] ||
              `Product #${movement.product_id}`,
            sku: movement.sku,
            quantity: movement.quantity,
            time: new Date(movement.created_at).toLocaleString(),
            notes: movement.notes,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-5xl font-bold text-dark-900"
          style={{
            fontFamily: "Outfit, sans-serif",
            fontWeight: "800",
            letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #111827 0%, #f97316 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Admin Dashboard
        </h1>
        <p
          className="text-dark-600 mt-3 text-lg"
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontWeight: "400",
            letterSpacing: "0.01em",
          }}
        >
          Welcome back! Here's what's happening in your inventory.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-primary text-white">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm opacity-90"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Total Products
              </p>
              <h3
                className="text-4xl font-bold mt-2"
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: "700",
                }}
              >
                {stats.totalProducts}
              </h3>
              <p
                className="text-xs mt-1 opacity-75"
                style={{ fontFamily: "DM Sans, sans-serif", fontWeight: "400" }}
              >
                Active products only
              </p>
            </div>
            <Package size={40} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-gradient-dark text-white">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm opacity-90"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Total Stock Units
              </p>
              <h3
                className="text-4xl font-bold mt-2"
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: "700",
                }}
              >
                {stats.totalInventory.toLocaleString()}
              </h3>
              <p
                className="text-xs mt-1 opacity-75"
                style={{ fontFamily: "DM Sans, sans-serif", fontWeight: "400" }}
              >
                Across all products
              </p>
            </div>
            <Box size={40} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-gradient-orange text-white">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm opacity-90"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Low Stock Alerts
              </p>
              <h3
                className="text-4xl font-bold mt-2"
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: "700",
                }}
              >
                {stats.lowStockItems}
              </h3>
              <p
                className="text-xs mt-1 opacity-75"
                style={{ fontFamily: "DM Sans, sans-serif", fontWeight: "400" }}
              >
                Below minimum threshold
              </p>
            </div>
            <AlertCircle size={40} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-gradient-dark text-white">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm opacity-90"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Total Orders
              </p>
              <h3
                className="text-4xl font-bold mt-2"
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: "700",
                }}
              >
                {stats.totalOrders}
              </h3>
              <p
                className="text-xs mt-1 opacity-75"
                style={{ fontFamily: "DM Sans, sans-serif", fontWeight: "400" }}
              >
                {stats.pendingOrders} pending
              </p>
            </div>
            <TrendingUp size={40} className="opacity-80" />
          </div>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm text-dark-600"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Active Users
              </p>
              <h3
                className="text-3xl font-bold text-dark-900 mt-1"
                style={{ fontFamily: "Sora, sans-serif", fontWeight: "700" }}
              >
                {stats.totalUsers}
              </h3>
            </div>
            <Users size={32} className="text-primary" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm text-dark-600"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Total Suppliers
              </p>
              <h3
                className="text-3xl font-bold text-dark-900 mt-1"
                style={{ fontFamily: "Sora, sans-serif", fontWeight: "700" }}
              >
                {stats.totalSuppliers}
              </h3>
            </div>
            <Activity size={32} className="text-primary" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm text-dark-600"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Revenue (Delivered)
              </p>
              <h3
                className="text-3xl font-bold text-dark-900 mt-1"
                style={{ fontFamily: "Sora, sans-serif", fontWeight: "700" }}
              >
                ${stats.totalRevenue.toFixed(2)}
              </h3>
            </div>
            <TrendingUp size={32} className="text-primary" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3
            className="text-xl font-semibold text-dark-900 mb-4 flex items-center"
            style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: "700",
              letterSpacing: "-0.02em",
            }}
          >
            <TrendingUp size={22} className="mr-2 text-primary" />
            Stock Movements (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockMovements}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="in" fill="#F97316" name="Stock In" />
              <Bar dataKey="out" fill="#111827" name="Stock Out" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3
            className="text-xl font-semibold text-dark-900 mb-4 flex items-center"
            style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: "700",
              letterSpacing: "-0.02em",
            }}
          >
            <Activity size={22} className="mr-2 text-primary" />
            Products by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#F97316" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3
          className="text-xl font-semibold text-dark-900 mb-4"
          style={{
            fontFamily: "Outfit, sans-serif",
            fontWeight: "700",
            letterSpacing: "-0.02em",
          }}
        >
          Recent Stock Activity
        </h3>
        <div className="space-y-3">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-start p-3 bg-dark-50 rounded-lg hover:bg-dark-100 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                    activity.type === "in" || activity.type === "return"
                      ? "bg-primary"
                      : activity.type === "out"
                      ? "bg-dark-800"
                      : activity.type === "adjustment"
                      ? "bg-primary-700"
                      : "bg-primary-600"
                  }`}
                >
                  <Activity size={20} />
                </div>
                <div className="ml-4 flex-1">
                  <p
                    className="text-sm font-medium text-dark-900"
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontWeight: "700",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {activity.type === "in"
                      ? "Stock Added"
                      : activity.type === "out"
                      ? "Stock Removed"
                      : activity.type === "return"
                      ? "Stock Returned"
                      : activity.type === "adjustment"
                      ? "Stock Adjusted"
                      : activity.type === "damaged"
                      ? "Stock Damaged"
                      : activity.type === "expired"
                      ? "Stock Expired"
                      : "Stock Movement"}
                  </p>
                  <p
                    className="text-sm text-dark-700 mt-1"
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontWeight: "500",
                    }}
                  >
                    {activity.product} ({activity.sku})
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`text-base font-semibold ${
                        activity.quantity > 0 ? "text-primary" : "text-dark-700"
                      }`}
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontWeight: "700",
                      }}
                    >
                      {activity.quantity > 0 ? "+" : ""}
                      {activity.quantity} units
                    </span>
                    <span
                      className="text-xs text-dark-500"
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontWeight: "500",
                      }}
                    >
                      {activity.time}
                    </span>
                  </div>
                  {activity.notes && (
                    <p
                      className="text-xs text-dark-500 mt-1 italic"
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontWeight: "400",
                      }}
                    >
                      {activity.notes}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p
              className="text-center text-dark-500 py-4"
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontWeight: "500",
                letterSpacing: "0.01em",
              }}
            >
              No recent activities
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
