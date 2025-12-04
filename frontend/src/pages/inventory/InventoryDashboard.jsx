import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  FiPackage,
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown,
  FiEdit,
} from "react-icons/fi";

const InventoryDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editFormData, setEditFormData] = useState({
    adjustment_type: "in",
    quantity_change: "",
    warehouse_location: "",
    reorder_level: "",
    max_stock_level: "",
    notes: "",
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:3003/api/inventory");
      const inventoryData = res.data.data || [];
      setInventory(inventoryData);

      // Calculate stats
      const totalItems = inventoryData.length;
      const lowStock = inventoryData.filter(
        (item) =>
          item.available_quantity <= item.reorder_level &&
          item.available_quantity > 0
      ).length;
      const outOfStock = inventoryData.filter(
        (item) => item.available_quantity === 0
      ).length;

      setStats({
        totalItems,
        lowStock,
        outOfStock,
        totalValue: inventoryData.reduce(
          (sum, item) =>
            sum + item.available_quantity * parseFloat(item.unit_price || 0),
          0
        ),
      });
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item) => {
    if (item.available_quantity === 0) {
      return { label: "Out of Stock", variant: "danger" };
    } else if (item.available_quantity <= item.reorder_level) {
      return { label: "Low Stock", variant: "warning" };
    } else if (item.available_quantity >= item.max_stock_level * 0.9) {
      return { label: "Overstock", variant: "info" };
    } else {
      return { label: "In Stock", variant: "success" };
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditFormData({
      adjustment_type: "in",
      quantity_change: "",
      warehouse_location: item.warehouse_location || "",
      reorder_level: item.reorder_level || "",
      max_stock_level: item.max_stock_level || "",
      notes: "",
    });
    setShowEditModal(true);
  };

  const handleUpdateInventory = async (e) => {
    e.preventDefault();
    try {
      // If quantity adjustment is provided, call adjust endpoint
      if (
        editFormData.quantity_change &&
        parseInt(editFormData.quantity_change) !== 0
      ) {
        await axios.post("http://localhost:3003/api/inventory/adjust", {
          product_id: selectedItem.product_id,
          sku: selectedItem.sku,
          movement_type: editFormData.adjustment_type,
          quantity: Math.abs(parseInt(editFormData.quantity_change)),
          notes:
            editFormData.notes ||
            `Stock ${editFormData.adjustment_type} adjustment`,
          performed_by: 1,
        });
      }

      // Update location and reorder levels if changed
      if (
        editFormData.warehouse_location !== selectedItem.warehouse_location ||
        editFormData.reorder_level !== selectedItem.reorder_level ||
        editFormData.max_stock_level !== selectedItem.max_stock_level
      ) {
        await axios.put(
          `http://localhost:3003/api/inventory/product/${selectedItem.product_id}`,
          {
            warehouse_location: editFormData.warehouse_location,
            reorder_level:
              parseInt(editFormData.reorder_level) ||
              selectedItem.reorder_level,
            max_stock_level:
              parseInt(editFormData.max_stock_level) ||
              selectedItem.max_stock_level,
          }
        );
      }

      toast.success("Inventory updated successfully!");
      setShowEditModal(false);
      fetchInventory();
    } catch (error) {
      console.error("Error updating inventory:", error);
      toast.error(
        error.response?.data?.message || "Failed to update inventory"
      );
    }
  };

  const columns = [
    {
      header: "SKU",
      accessor: "sku",
      cell: (row) => (
        <span className="font-medium text-dark-900">{row.sku}</span>
      ),
    },
    {
      header: "Product ID",
      accessor: "product_id",
    },
    {
      header: "Location",
      accessor: "warehouse_location",
    },
    {
      header: "Available",
      accessor: "available_quantity",
      cell: (row) => (
        <span className="font-semibold text-primary">
          {row.available_quantity}
        </span>
      ),
    },
    {
      header: "Reserved",
      accessor: "reserved_quantity",
      cell: (row) => (
        <span className="text-dark-600">{row.reserved_quantity}</span>
      ),
    },
    {
      header: "Total",
      accessor: "quantity",
      cell: (row) => <span className="font-medium">{row.quantity}</span>,
    },
    {
      header: "Reorder Level",
      accessor: "reorder_level",
    },
    {
      header: "Max Stock",
      accessor: "max_stock_level",
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => {
        const status = getStockStatus(row);
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <Button size="sm" variant="outline" onClick={() => handleEdit(row)}>
          <FiEdit size={16} className="mr-1" />
          Edit
        </Button>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-dark-900 mb-8">
        Inventory Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-600 text-sm mb-1">Total Items</p>
              <p className="text-3xl font-bold text-dark-900">
                {stats.totalItems}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <FiPackage size={24} className="text-primary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-600 text-sm mb-1">Low Stock Items</p>
              <p className="text-3xl font-bold text-warning">
                {stats.lowStock}
              </p>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg">
              <FiAlertTriangle size={24} className="text-warning" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-600 text-sm mb-1">Out of Stock</p>
              <p className="text-3xl font-bold text-danger">
                {stats.outOfStock}
              </p>
            </div>
            <div className="p-3 bg-danger/10 rounded-lg">
              <FiTrendingDown size={24} className="text-danger" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-600 text-sm mb-1">Total Value</p>
              <p className="text-3xl font-bold text-success">
                ${stats.totalValue.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-success/10 rounded-lg">
              <FiTrendingUp size={24} className="text-success" />
            </div>
          </div>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-dark-900">
            Current Inventory
          </h2>
          <p className="text-dark-600 text-sm">
            Real-time stock levels across all warehouses
          </p>
        </div>
        <Table columns={columns} data={inventory} />
      </Card>

      {/* Edit Inventory Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                Adjust Inventory - SKU: {selectedItem?.sku}
              </h2>
              <p className="text-sm text-dark-600 mb-4">
                Current Stock:{" "}
                <span className="font-bold text-primary">
                  {selectedItem?.quantity}
                </span>{" "}
                units (Available: {selectedItem?.available_quantity}, Reserved:{" "}
                {selectedItem?.reserved_quantity})
              </p>
              <form onSubmit={handleUpdateInventory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Adjustment Type
                  </label>
                  <select
                    value={editFormData.adjustment_type}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        adjustment_type: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-dark-900"
                  >
                    <option value="in">Stock In (Add)</option>
                    <option value="out">Stock Out (Remove)</option>
                    <option value="returned">Returned</option>
                    <option value="damaged">Damaged</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <Input
                  label="Quantity to Adjust"
                  type="number"
                  value={editFormData.quantity_change}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      quantity_change: e.target.value,
                    })
                  }
                  placeholder="Enter quantity (positive number)"
                  min="0"
                />

                <Input
                  label="Notes"
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Reason for adjustment (optional)"
                />

                <hr className="my-4" />

                <p className="text-sm font-semibold text-dark-700 mb-2">
                  Update Inventory Settings
                </p>

                <Input
                  label="Warehouse Location"
                  value={editFormData.warehouse_location}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      warehouse_location: e.target.value,
                    })
                  }
                  placeholder="e.g., Warehouse A, Shelf 12"
                />

                <Input
                  label="Reorder Level"
                  type="number"
                  value={editFormData.reorder_level}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      reorder_level: parseInt(e.target.value),
                    })
                  }
                  placeholder="Minimum stock level"
                />

                <Input
                  label="Max Stock Level"
                  type="number"
                  value={editFormData.max_stock_level}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      max_stock_level: parseInt(e.target.value),
                    })
                  }
                  placeholder="Maximum stock capacity"
                />

                <div className="flex justify-end gap-4 mt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Update Inventory
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InventoryDashboard;
