import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Package, RefreshCw } from "lucide-react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Table from "../../components/common/Table";
import toast from "react-hot-toast";

const LowStockAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("alerts");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [alertsRes, suggestionsRes] = await Promise.all([
        fetch("http://localhost:3003/api/inventory/alerts"),
        fetch("http://localhost:3003/api/inventory/reorder-suggestions"),
      ]);

      const alertsData = await alertsRes.json();
      const suggestionsData = await suggestionsRes.json();

      setAlerts(alertsData.data || []);
      setSuggestions(suggestionsData.data || []);

      // Calculate stats from alerts
      const activeAlerts = (alertsData.data || []).filter(
        (a) => a.status === "active"
      );
      setStats({
        activeAlerts: activeAlerts.length,
        resolvedToday: (alertsData.data || []).filter(
          (a) => a.status === "resolved"
        ).length,
        totalValue: activeAlerts.reduce(
          (sum, alert) => sum + (alert.estimated_value || 0),
          0
        ),
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStock = async () => {
    try {
      console.log("=== CHECKING STOCK LEVELS ===");
      console.log(
        "Token:",
        localStorage.getItem("asgardeo_token") ? "Found" : "Missing"
      );

      const response = await fetch("http://localhost:3003/api/alerts/check", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("asgardeo_token")}`,
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.message || "Failed to check stock");
      }

      const data = await response.json();
      console.log("Success response:", data);
      toast.success(data.message);
      fetchData();
    } catch (error) {
      console.error("Error checking stock:", error);
      toast.error(error.message || "Failed to check stock");
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:3003/api/alerts/${id}/resolve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("asgardeo_token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to resolve alert");

      toast.success("Alert resolved successfully");
      fetchData();
    } catch (error) {
      console.error("Error resolving alert:", error);
      toast.error("Failed to resolve alert");
    }
  };

  const alertColumns = [
    {
      header: "Product ID",
      accessor: "product_id",
      render: (row) => `#${row.product_id}`,
    },
    {
      header: "Product Name",
      accessor: "product_name",
      render: (row) => (
        <span className="font-medium text-dark-900">
          {row.product_name || "Unknown Product"}
        </span>
      ),
    },
    {
      header: "SKU",
      accessor: "sku",
    },
    {
      header: "Current Stock",
      accessor: "current_quantity",
      render: (row) => (
        <span className="font-semibold text-primary">
          {row.current_quantity}
        </span>
      ),
    },
    {
      header: "Reorder Level",
      accessor: "reorder_level",
    },
    {
      header: "Location",
      accessor: "warehouse_location",
    },
    {
      header: "Alerted At",
      accessor: "alerted_at",
      render: (row) => new Date(row.alerted_at).toLocaleDateString(),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <Button
          size="sm"
          variant="success"
          onClick={() => handleResolveAlert(row.id)}
        >
          <CheckCircle size={16} className="mr-1" />
          Resolve
        </Button>
      ),
    },
  ];

  const suggestionColumns = [
    {
      header: "Product ID",
      accessor: "product_id",
      render: (row) => `#${row.product_id}`,
    },
    {
      header: "SKU",
      accessor: "sku",
    },
    {
      header: "Current",
      accessor: "current_quantity",
      render: (row) => (
        <span className="font-semibold text-red-600">
          {row.current_quantity}
        </span>
      ),
    },
    {
      header: "Max Level",
      accessor: "max_stock_level",
    },
    {
      header: "Suggested Order",
      accessor: "suggested_order_quantity",
      render: (row) => (
        <span className="font-semibold text-primary">
          {row.suggested_order_quantity}
        </span>
      ),
    },
    {
      header: "Location",
      accessor: "warehouse_location",
    },
  ];

  if (loading) return <LoadingSpinner text="Loading alerts..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dark-900">Low Stock Alerts</h1>
          <p className="text-dark-600 mt-2">
            Monitor and manage inventory alerts
          </p>
        </div>
        <Button variant="primary" onClick={handleCheckStock}>
          <RefreshCw size={20} className="mr-2" />
          Check Stock Levels
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-600 mb-1">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.activeAlerts}
                </p>
              </div>
              <AlertTriangle className="text-red-500" size={40} />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-600 mb-1">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.resolvedToday}
                </p>
              </div>
              <CheckCircle className="text-green-500" size={40} />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-gray-600">
                  ${stats.totalValue?.toFixed(2) || "0.00"}
                </p>
              </div>
              <Package className="text-gray-500" size={40} />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-600 mb-1">
                  Reorder Suggestions
                </p>
                <p className="text-2xl font-bold">{suggestions.length}</p>
              </div>
              <Package className="text-primary" size={40} />
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "alerts"
              ? "bg-primary text-white"
              : "bg-dark-100 text-dark-700 hover:bg-dark-200"
          }`}
        >
          Active Alerts ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab("suggestions")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "suggestions"
              ? "bg-primary text-white"
              : "bg-dark-100 text-dark-700 hover:bg-dark-200"
          }`}
        >
          Reorder Suggestions ({suggestions.length})
        </button>
      </div>

      {/* Content */}
      <Card>
        {activeTab === "alerts" ? (
          alerts.length === 0 ? (
            <div className="text-center py-8">
              <Package size={48} className="mx-auto text-dark-400 mb-3" />
              <p className="text-dark-600">No active low stock alerts</p>
            </div>
          ) : (
            <Table columns={alertColumns} data={alerts} />
          )
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Package size={48} className="mx-auto text-dark-400 mb-3" />
            <p className="text-dark-600">No reorder suggestions</p>
          </div>
        ) : (
          <Table columns={suggestionColumns} data={suggestions} />
        )}
      </Card>
    </div>
  );
};

export default LowStockAlerts;
