import { useState, useEffect } from "react";
import { Check, X, Package, Clock, Truck } from "lucide-react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { supplierService } from "../../services/supplierService";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AsgardeoAuthContext";

const PurchaseRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [responseData, setResponseData] = useState({
    response: "approved",
    approved_quantity: "",
    rejection_reason: "",
    estimated_delivery_date: "",
    supplier_notes: "",
  });
  const [shipData, setShipData] = useState({
    tracking_number: "",
    status: "shipped",
  });

  useEffect(() => {
    // Wait for user data to load, then fetch requests
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      // Get supplier ID from user backend data
      const supplierId = user?.supplier_id;

      if (!supplierId) {
        console.log("No supplier_id found for user:", user);
        // For now, fetch all orders for the supplier role
        // Backend should filter based on authenticated user
        const response = await supplierService.getAllPurchaseOrders();
        setRequests(response.data || []);
        setLoading(false);
        return;
      }

      // Fetch only purchase orders for this supplier
      const response = await supplierService.getAllPurchaseOrders({
        supplier_id: supplierId,
      });

      setRequests(response.data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load purchase requests");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (request) => {
    // Security check: Verify this request belongs to the logged-in supplier
    if (request.supplier_id !== user?.supplier_id) {
      toast.error("You can only respond to your own purchase requests");
      return;
    }

    setSelectedRequest(request);
    setResponseData({
      response: "approved",
      approved_quantity: request.requested_quantity || "",
      quoted_amount: "",
      rejection_reason: "",
      estimated_delivery_date: "",
      supplier_notes: "",
    });
    setShowResponseModal(true);
  };

  const handleShip = (request) => {
    // Security check: Verify this request belongs to the logged-in supplier
    if (request.supplier_id !== user?.supplier_id) {
      toast.error("You can only manage your own purchase orders");
      return;
    }

    setSelectedRequest(request);
    setShipData({
      tracking_number: "",
      status: "shipped",
    });
    setShowShipModal(true);
  };

  const submitResponse = async (e) => {
    e.preventDefault();

    // Validation
    if (responseData.response === "approved") {
      if (
        !responseData.approved_quantity ||
        parseInt(responseData.approved_quantity) < 1
      ) {
        toast.error("Please enter a valid approved quantity");
        return;
      }
      if (
        !responseData.quoted_amount ||
        parseFloat(responseData.quoted_amount) <= 0
      ) {
        toast.error("Please enter a valid price quote");
        return;
      }
      if (!responseData.estimated_delivery_date) {
        toast.error("Please select an estimated delivery date");
        return;
      }
    }

    try {
      // Convert quantity to integer
      const payload = {
        ...responseData,
        approved_quantity: responseData.approved_quantity
          ? parseInt(responseData.approved_quantity, 10)
          : null,
      };

      await fetch(
        `http://localhost:3004/api/purchase-orders/${selectedRequest.id}/respond`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("asgardeo_token")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      toast.success(
        `Request ${
          responseData.response === "approved" ? "approved" : "rejected"
        } successfully!`
      );
      setShowResponseModal(false);
      fetchRequests();
    } catch (error) {
      console.error("Error responding to request:", error);
      toast.error("Failed to respond to request");
    }
  };

  const submitShipment = async (e) => {
    e.preventDefault();
    try {
      await fetch(
        `http://localhost:3004/api/purchase-orders/${selectedRequest.id}/ship`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("asgardeo_token")}`,
          },
          body: JSON.stringify(shipData),
        }
      );

      toast.success("Shipment status updated successfully!");
      setShowShipModal(false);
      fetchRequests();
    } catch (error) {
      console.error("Error updating shipment:", error);
      toast.error("Failed to update shipment");
    }
  };

  const getStatusBadge = (status, supplierResponse) => {
    if (supplierResponse === "pending") {
      return <Badge variant="warning">Pending Response</Badge>;
    }
    if (supplierResponse === "approved") {
      return <Badge variant="success">Approved</Badge>;
    }
    if (supplierResponse === "rejected") {
      return <Badge variant="danger">Rejected</Badge>;
    }

    const statusColors = {
      confirmed: "info",
      preparing: "warning",
      shipped: "primary",
      received: "success",
      cancelled: "danger",
    };
    return (
      <Badge variant={statusColors[status] || "secondary"}>{status}</Badge>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Purchase Requests</h1>
        <p className="text-gray-600 mt-1">
          Manage incoming purchase requests from the company
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold">
                {
                  requests.filter((r) => r.supplier_response === "pending")
                    .length
                }
              </p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold">
                {
                  requests.filter((r) => r.supplier_response === "approved")
                    .length
                }
              </p>
            </div>
            <Check className="text-green-500" size={32} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Transit</p>
              <p className="text-2xl font-bold">
                {requests.filter((r) => r.status === "shipped").length}
              </p>
            </div>
            <Truck className="text-blue-500" size={32} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold">
                {requests.filter((r) => r.status === "received").length}
              </p>
            </div>
            <Package className="text-purple-500" size={32} />
          </div>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">All Requests</h2>
          {requests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No purchase requests found
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {request.po_number}
                        </h3>
                        {getStatusBadge(
                          request.status,
                          request.supplier_response
                        )}
                      </div>

                      {/* Product Name - Prominently Displayed */}
                      {request.product_details && (
                        <div className="mb-3 pb-2 border-b border-gray-200">
                          <div className="flex items-center gap-2">
                            <Package className="text-primary-600" size={18} />
                            <span className="font-semibold text-gray-900 text-base">
                              {request.product_details.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              (SKU: {request.product_details.sku})
                            </span>
                          </div>
                          <div className="ml-7 text-sm text-gray-600 mt-1">
                            <span className="font-medium">Quantity:</span>{" "}
                            <span className="font-semibold text-primary-700">
                              {request.requested_quantity || 0} units
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Order Date:</span>{" "}
                          {new Date(request.order_date).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-medium">
                            Expected Delivery:
                          </span>{" "}
                          {new Date(
                            request.expected_delivery_date
                          ).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-medium">Amount:</span>{" "}
                          {request.total_amount > 0 ? (
                            `$${request.total_amount}`
                          ) : (
                            <span className="text-yellow-600 font-medium">
                              Pending Quote
                            </span>
                          )}
                        </p>
                        {request.tracking_number && (
                          <p>
                            <span className="font-medium">Tracking:</span>{" "}
                            {request.tracking_number}
                          </p>
                        )}
                      </div>
                      {request.notes && (
                        <p className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Notes:</span>{" "}
                          {request.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {request.supplier_response === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleRespond(request)}
                        >
                          Respond
                        </Button>
                      )}
                      {request.supplier_response === "approved" &&
                        request.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleShip(request)}
                          >
                            Mark Shipped
                          </Button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  Respond to Purchase Request
                </h2>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Request Summary */}
              {selectedRequest && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-primary-900 mb-3">
                    Purchase Order Details
                  </h3>

                  {/* Product Information - Highlighted Section */}
                  {selectedRequest.product_details && (
                    <div className="bg-white border-2 border-primary-300 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-primary-900 mb-2 flex items-center">
                        <Package className="mr-2" size={18} />
                        Product Information
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="col-span-2">
                          <span className="text-gray-600">Product Name:</span>
                          <span className="ml-2 font-bold text-gray-900 text-base">
                            {selectedRequest.product_details.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">SKU:</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {selectedRequest.product_details.sku}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Category:</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {selectedRequest.product_details.category || "N/A"}
                          </span>
                        </div>
                        {selectedRequest.product_details.description && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Description:</span>
                            <p className="text-gray-900 text-sm mt-1">
                              {selectedRequest.product_details.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">PO Number:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {selectedRequest.po_number}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Order Date:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {new Date(
                          selectedRequest.order_date
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    {!selectedRequest.product_details && (
                      <div>
                        <span className="text-gray-600">Product ID:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {selectedRequest.product_id || "Not specified"}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2 font-semibold text-gray-900 capitalize">
                        {selectedRequest.supplier_response || "Pending"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Requested Quantity:</span>
                      <span className="ml-2 font-bold text-primary-700 text-base">
                        {selectedRequest.requested_quantity || 0} units
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Current Quote:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {selectedRequest.total_amount > 0 ? (
                          `$${parseFloat(selectedRequest.total_amount).toFixed(
                            2
                          )}`
                        ) : (
                          <span className="text-yellow-600">Pending</span>
                        )}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Expected Delivery:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {new Date(
                          selectedRequest.expected_delivery_date
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {selectedRequest.notes && (
                    <div className="mt-3 pt-3 border-t border-primary-200">
                      <span className="text-gray-600 text-sm">Notes:</span>
                      <p className="text-gray-900 text-sm mt-1">
                        {selectedRequest.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={submitResponse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Response
                  </label>
                  <select
                    value={responseData.response}
                    onChange={(e) =>
                      setResponseData({
                        ...responseData,
                        response: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="approved">Approve</option>
                    <option value="rejected">Reject</option>
                  </select>
                </div>

                {responseData.response === "approved" && (
                  <>
                    <div>
                      <Input
                        label={`Approved Quantity * (Max: ${
                          selectedRequest?.requested_quantity || 0
                        } units)`}
                        type="number"
                        min="1"
                        max={selectedRequest?.requested_quantity || 10000}
                        step="1"
                        value={responseData.approved_quantity}
                        onChange={(e) => {
                          setResponseData({
                            ...responseData,
                            approved_quantity: e.target.value,
                          });
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value);
                          if (value < 1) {
                            toast.error("Quantity must be at least 1");
                          } else if (
                            selectedRequest?.requested_quantity &&
                            value > selectedRequest.requested_quantity
                          ) {
                            toast.error(
                              `Approved quantity cannot exceed requested quantity (${selectedRequest.requested_quantity} units)`
                            );
                          }
                        }}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Tip: You can approve less if you have limited stock,
                        but not more than requested
                      </p>
                    </div>
                    <Input
                      label="Quoted Price (Total Amount) *"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={responseData.quoted_amount || ""}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value);
                        const quantity = parseInt(
                          responseData.approved_quantity
                        );
                        if (amount && quantity) {
                          const pricePerUnit = amount / quantity;
                          if (pricePerUnit < 0.01) {
                            toast.error("Price per unit seems too low");
                          }
                        }
                        setResponseData({
                          ...responseData,
                          quoted_amount: e.target.value,
                        });
                      }}
                      required
                      placeholder="Enter your price quote"
                    />
                    <Input
                      label="Estimated Delivery Date *"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={responseData.estimated_delivery_date}
                      onChange={(e) =>
                        setResponseData({
                          ...responseData,
                          estimated_delivery_date: e.target.value,
                        })
                      }
                      required
                    />
                  </>
                )}

                {responseData.response === "rejected" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Rejection Reason (Optional)
                    </label>
                    <textarea
                      value={responseData.rejection_reason}
                      onChange={(e) =>
                        setResponseData({
                          ...responseData,
                          rejection_reason: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      rows="3"
                      placeholder="Explain why the request is being rejected..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={responseData.supplier_notes}
                    onChange={(e) =>
                      setResponseData({
                        ...responseData,
                        supplier_notes: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    rows="2"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowResponseModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Submit Response</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Ship Modal */}
      {showShipModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Update Shipment</h2>
                <button
                  onClick={() => setShowShipModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <form onSubmit={submitShipment} className="space-y-4">
                <Input
                  label="Tracking Number"
                  value={shipData.tracking_number}
                  onChange={(e) =>
                    setShipData({
                      ...shipData,
                      tracking_number: e.target.value,
                    })
                  }
                  required
                  placeholder="Enter tracking number"
                />

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowShipModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Mark as Shipped</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequests;
