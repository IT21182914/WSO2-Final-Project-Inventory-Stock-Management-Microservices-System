import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { orderService } from "../../services/orderService";
import { productService } from "../../services/productService";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiZap,
  FiRefreshCw,
} from "react-icons/fi";

// Random address generator
const generateRandomAddress = () => {
  const streets = [
    "Main St",
    "Oak Ave",
    "Maple Dr",
    "Pine Rd",
    "Cedar Ln",
    "Elm Way",
    "Park Blvd",
    "Lake St",
    "Hill Rd",
    "Valley Dr",
  ];
  const cities = [
    "New York",
    "Boston",
    "Chicago",
    "Austin",
    "Seattle",
    "Miami",
    "Denver",
    "Portland",
    "Phoenix",
    "Atlanta",
  ];
  const number = Math.floor(Math.random() * 9999) + 1;
  const street = streets[Math.floor(Math.random() * streets.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  return `${number} ${street}, ${city}`;
};

const OrderCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: "5",
    total_amount: "",
    shipping_address: "",
    payment_method: "credit_card",
    payment_status: "paid",
    notes: "",
  });

  const [orderItems, setOrderItems] = useState([
    {
      product_id: "",
      sku: "",
      product_name: "",
      quantity: "1",
      unit_price: "",
    },
  ]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAllProducts();
      // Filter only active products that are available for sale
      const activeProducts = (response.data || []).filter(
        (p) => p.lifecycle_state === "active" && (p.unit_price || 0) > 0
      );
      setProducts(activeProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    }
  };

  const generateRandomOrder = () => {
    if (products.length === 0) {
      toast.error("No products available. Please add products first.");
      return;
    }

    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;

    if (randomProduct) {
      setOrderItems([
        {
          product_id: randomProduct.id.toString(),
          sku: randomProduct.sku || "",
          product_name: randomProduct.name || "",
          quantity: quantity.toString(),
          unit_price: (randomProduct.unit_price || 0).toString(),
        },
      ]);

      setFormData((prev) => ({
        ...prev,
        shipping_address: generateRandomAddress(),
        total_amount: ((randomProduct.unit_price || 0) * quantity).toFixed(2),
      }));

      toast.success("Random order generated!");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;

    // Auto-fill product details when product is selected
    if (field === "product_id" && value) {
      const selectedProduct = products.find((p) => p.id === parseInt(value));
      if (selectedProduct) {
        newItems[index].sku = selectedProduct.sku || "";
        newItems[index].product_name = selectedProduct.name || "";
        newItems[index].unit_price = (
          selectedProduct.unit_price || 0
        ).toString();
      }
    }

    setOrderItems(newItems);

    // Auto-calculate total amount
    const total = newItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return sum + qty * price;
    }, 0);
    setFormData((prev) => ({ ...prev, total_amount: total.toFixed(2) }));
  };

  const addOrderItem = () => {
    setOrderItems([
      ...orderItems,
      {
        product_id: "",
        sku: "",
        product_name: "",
        quantity: "",
        unit_price: "",
      },
    ]);
  };

  const removeOrderItem = (index) => {
    if (orderItems.length > 1) {
      const newItems = orderItems.filter((_, i) => i !== index);
      setOrderItems(newItems);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.customer_id || !formData.total_amount) {
      toast("Please fill in all required fields", { icon: "⚠️" });
      return;
    }

    const hasValidItems = orderItems.every(
      (item) => item.product_id && item.quantity && item.unit_price
    );
    if (!hasValidItems) {
      toast("Please complete all order item details", { icon: "⚠️" });
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        ...formData,
        customer_id: parseInt(formData.customer_id),
        total_amount: parseFloat(formData.total_amount),
        items: orderItems.map((item) => ({
          product_id: parseInt(item.product_id),
          sku: item.sku,
          product_name: item.product_name,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
        })),
      };

      await orderService.createOrder(orderData);
      toast.success("Order created successfully!");
      navigate("/orders");
    } catch (error) {
      console.error("Error creating order:", error);

      // Enhanced error handling for stock issues
      const errorMessage =
        error.response?.data?.message || "Failed to create order";

      if (
        errorMessage.includes("Stock not available") ||
        errorMessage.includes("Insufficient stock")
      ) {
        // Parse stock shortage details if available
        try {
          const match = errorMessage.match(/\[{.*}\]/);
          if (match) {
            const stockInfo = JSON.parse(match[0]);
            const details = stockInfo
              .map(
                (item) =>
                  `${item.sku || item.product_id}: needs ${
                    item.requested
                  }, has ${item.currentStock} (shortage: ${item.shortage})`
              )
              .join(", ");
            toast.error(`Stock not available - ${details}`, { duration: 5000 });
            return;
          }
        } catch (e) {
          // Fallback to simple message
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/orders")}>
            <FiArrowLeft className="mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-dark-900">Create New Order</h1>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="primary" onClick={generateRandomOrder}>
            <FiZap className="mr-2" /> Quick Random Order
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <Card className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-dark-900 mb-4">
              Order Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Customer ID *"
                name="customer_id"
                type="number"
                value={formData.customer_id}
                onChange={handleInputChange}
                required
                placeholder="Enter customer ID"
              />
              <Input
                label="Total Amount *"
                name="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={handleInputChange}
                required
                disabled
                placeholder="Auto-calculated"
              />
              <div className="md:col-span-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      label="Shipping Address *"
                      name="shipping_address"
                      value={formData.shipping_address}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter shipping address"
                    />
                  </div>
                  <div className="pt-7">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          shipping_address: generateRandomAddress(),
                        }))
                      }
                    >
                      <FiRefreshCw className="mr-2" /> Random Address
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Payment Method
                </label>
                <select
                  name="payment_method"
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Payment Status
                </label>
                <select
                  name="payment_status"
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg"
                  value={formData.payment_status}
                  onChange={handleInputChange}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg"
                  rows="3"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional order notes..."
                />
              </div>
            </div>
          </Card>

          {/* Order Items */}
          <Card className="lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-dark-900">
                Order Items
              </h2>
              <Button type="button" size="sm" onClick={addOrderItem}>
                <FiPlus className="mr-2" /> Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg relative"
                >
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Product *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-dark-300 rounded-lg"
                      value={item.product_id}
                      onChange={(e) =>
                        handleItemChange(index, "product_id", e.target.value)
                      }
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (${product.price})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="SKU"
                    type="text"
                    value={item.sku}
                    disabled
                    placeholder="Auto-filled"
                  />
                  <Input
                    label="Product Name"
                    type="text"
                    value={item.product_name}
                    disabled
                    placeholder="Auto-filled"
                  />
                  <Input
                    label="Quantity *"
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    required
                    min="1"
                    placeholder="Qty"
                  />
                  <div className="flex items-end gap-2">
                    <Input
                      label="Unit Price"
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      disabled
                      placeholder="Auto-filled"
                    />
                    {orderItems.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeOrderItem(index)}
                      >
                        <FiTrash2 />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Submit */}
          <Card className="lg:col-span-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-dark-600">Total Order Amount:</p>
                <p className="text-3xl font-bold text-primary">
                  ${formData.total_amount || "0.00"}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/orders")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Order"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default OrderCreate;
