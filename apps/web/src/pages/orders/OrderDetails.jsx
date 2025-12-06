import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { orderService } from "../../services/orderService";
import { FiArrowLeft, FiEdit, FiTrash2 } from "react-icons/fi";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrderById(id);
      setOrder(response.data);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetails();
  }, [id, fetchOrderDetails]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      await orderService.updateOrderStatus(id, newStatus);
      fetchOrderDetails();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await orderService.cancelOrder(id);
        navigate("/orders");
      } catch (error) {
        console.error("Error deleting order:", error);
        toast.error("Failed to delete order");
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!order) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-dark-900 mb-8">
          Order Not Found
        </h1>
        <Button onClick={() => navigate("/orders")}>
          <FiArrowLeft className="mr-2" /> Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/orders")}>
            <FiArrowLeft className="mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-dark-900">
            Order #{order.id}
          </h1>
          {getStatusBadge(order.status)}
        </div>
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleDelete}>
            <FiTrash2 className="mr-2" /> Delete Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-dark-900 mb-4">
            Order Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-dark-600">Order ID</p>
              <p className="font-semibold">#{order.id}</p>
            </div>
            <div>
              <p className="text-sm text-dark-600">User ID</p>
              <p className="font-semibold">{order.user_id}</p>
            </div>
            <div>
              <p className="text-sm text-dark-600">Order Date</p>
              <p className="font-semibold">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-dark-600">Total Amount</p>
              <p className="font-semibold text-primary text-xl">
                ${parseFloat(order.total_amount).toFixed(2)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-dark-600">Shipping Address</p>
              <p className="font-semibold">{order.shipping_address || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-dark-600">Payment Method</p>
              <p className="font-semibold">{order.payment_method || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-dark-600">Payment Status</p>
              <Badge
                variant={
                  order.payment_status === "paid" ? "success" : "warning"
                }
              >
                {order.payment_status || "pending"}
              </Badge>
            </div>
          </div>

          {order.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-dark-600">Notes</p>
              <p className="text-dark-800">{order.notes}</p>
            </div>
          )}
        </Card>

        {/* Status Management */}
        <Card>
          <h2 className="text-xl font-semibold text-dark-900 mb-4">
            Status Management
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-dark-600 mb-2">Current Status</p>
              {getStatusBadge(order.status)}
            </div>
            <div className="border-t pt-3">
              <p className="text-sm text-dark-600 mb-3">Update Status</p>
              <div className="space-y-2">
                {order.status === "pending" && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleStatusUpdate("processing")}
                  >
                    Mark as Processing
                  </Button>
                )}
                {order.status === "processing" && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleStatusUpdate("shipped")}
                  >
                    Mark as Shipped
                  </Button>
                )}
                {order.status === "shipped" && (
                  <Button
                    size="sm"
                    className="w-full"
                    variant="success"
                    onClick={() => handleStatusUpdate("delivered")}
                  >
                    Mark as Delivered
                  </Button>
                )}
                {order.status !== "cancelled" &&
                  order.status !== "delivered" && (
                    <Button
                      size="sm"
                      className="w-full"
                      variant="danger"
                      onClick={() => handleStatusUpdate("cancelled")}
                    >
                      Cancel Order
                    </Button>
                  )}
              </div>
            </div>
          </div>
        </Card>

        {/* Order Items (if available) */}
        {order.items && order.items.length > 0 && (
          <Card className="lg:col-span-3">
            <h2 className="text-xl font-semibold text-dark-900 mb-4">
              Order Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-dark-700">
                      Product ID
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-dark-700">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-dark-700">
                      Unit Price
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-dark-700">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-3">{item.product_id}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">
                        ${parseFloat(item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        $
                        {(item.quantity * parseFloat(item.unit_price)).toFixed(
                          2
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
