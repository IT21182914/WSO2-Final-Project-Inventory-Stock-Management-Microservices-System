import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { orderService } from "../../services/orderService";
import { FiPlus, FiEye, FiEdit, FiTrash2, FiFilter } from "react-icons/fi";

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "", user_id: "" });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.user_id) params.user_id = filter.user_id;

      const response = await orderService.getAllOrders(params);
      setOrders(response.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      const errorMsg = error.response?.data?.message || error.message || "";

      if (errorMsg.includes("network") || errorMsg.includes("connection")) {
        toast.error(
          "Unable to load orders. Please check your internet connection."
        );
      } else if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        toast.error("You don't have permission to view orders.");
      } else {
        toast.error("Unable to load orders. Please refresh the page.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to translate technical errors to user-friendly messages
  const getUserFriendlyError = (error) => {
    const errorMsg = error.response?.data?.message || error.message || "";

    // Map technical errors to user-friendly messages
    if (errorMsg.includes("Invalid status transition")) {
      return "This order has already been processed. Please refresh the page.";
    }
    if (errorMsg.includes("circular structure")) {
      return "Order update failed. Please try again.";
    }
    if (errorMsg.includes("not found") || error.response?.status === 404) {
      return "Order not found. It may have been deleted.";
    }
    if (
      errorMsg.includes("Stock not available") ||
      errorMsg.includes("insufficient")
    ) {
      return "Cannot ship order: Not enough inventory available.";
    }
    if (errorMsg.includes("already shipped")) {
      return "This order has already been shipped.";
    }
    if (errorMsg.includes("cancelled")) {
      return "Cannot update a cancelled order.";
    }
    if (error.response?.status === 400) {
      return "Unable to update order status. Please check the order details.";
    }

    return "Failed to update order. Please try again.";
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success(
        `Order ${newStatus === "shipped" ? "shipped" : "updated"} successfully!`
      );
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      const friendlyMessage = getUserFriendlyError(error);
      toast.error(friendlyMessage);
    }
  };

  const handleDelete = async (orderId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this order? This action cannot be undone."
      )
    ) {
      try {
        await orderService.cancelOrder(orderId);
        toast.success("Order cancelled successfully!");
        fetchOrders();
      } catch (error) {
        console.error("Error deleting order:", error);

        const errorMsg = error.response?.data?.message || error.message || "";
        let friendlyMessage = "Unable to cancel the order. Please try again.";

        if (errorMsg.includes("shipped") || errorMsg.includes("delivered")) {
          friendlyMessage =
            "This order has already been shipped and cannot be cancelled.";
        } else if (errorMsg.includes("not found")) {
          friendlyMessage =
            "Order not found. It may have already been cancelled.";
        } else if (
          errorMsg.includes("permission") ||
          errorMsg.includes("unauthorized")
        ) {
          friendlyMessage = "You don't have permission to cancel this order.";
        }

        toast.error(friendlyMessage);
      }
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "warning",
      processing: "info",
      shipped: "primary",
      delivered: "success",
      cancelled: "danger",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const columns = [
    {
      header: "Order ID",
      accessor: "id",
      render: (row) => (
        <span className="font-semibold text-dark-900">#{row.id}</span>
      ),
    },
    {
      header: "Products & Quantities",
      accessor: "items",
      render: (row) => {
        const items = row.items || [];
        if (items.length === 0)
          return <span className="text-dark-500">No items</span>;

        return (
          <div className="max-w-md">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="text-sm mb-1 flex items-center justify-between"
              >
                <span className="text-dark-800">{item.product_name}</span>
                <span className="ml-3 px-2 py-0.5 bg-primary/10 text-primary rounded-md font-semibold text-xs">
                  {item.quantity}x
                </span>
              </div>
            ))}
            <div className="text-dark-500 text-xs mt-2 pt-1 border-t border-dark-200">
              Total:{" "}
              {items.reduce((sum, item) => sum + (item.quantity || 0), 0)} units
            </div>
          </div>
        );
      },
    },
    {
      header: "Total Amount",
      accessor: "total_amount",
      render: (row) => (
        <span className="font-semibold text-primary">
          ${parseFloat(row.total_amount).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => getStatusBadge(row.status),
    },
    {
      header: "Shipping Address",
      accessor: "shipping_address",
      render: (row) => (
        <span className="truncate max-w-xs text-dark-600 text-sm">
          {row.shipping_address || "N/A"}
        </span>
      ),
    },
    {
      header: "Order Date",
      accessor: "created_at",
      render: (row) => (
        <span className="text-dark-700 text-sm">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/orders/${row.id}`)}
          >
            <FiEye className="mr-1" /> View
          </Button>
          {row.status === "pending" && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleStatusChange(row.id, "processing")}
            >
              Process
            </Button>
          )}
          {row.status === "processing" && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleStatusChange(row.id, "shipped")}
            >
              Ship
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(row.id)}
          >
            <FiTrash2 />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-dark-900">Orders Management</h1>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter className="mr-2" /> Filters
          </Button>
          <Button onClick={() => navigate("/orders/create")}>
            <FiPlus className="mr-2" /> Create Order
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-dark-300 rounded-lg"
                value={filter.status}
                onChange={(e) =>
                  setFilter({ ...filter, status: e.target.value })
                }
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                User ID
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-dark-300 rounded-lg"
                value={filter.user_id}
                onChange={(e) =>
                  setFilter({ ...filter, user_id: e.target.value })
                }
                placeholder="Filter by user ID"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchOrders} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-4">
          <p className="text-dark-600">
            Total Orders: <span className="font-semibold">{orders.length}</span>
          </p>
        </div>
        <Table columns={columns} data={orders} />
      </Card>
    </div>
  );
};

export default OrderList;
