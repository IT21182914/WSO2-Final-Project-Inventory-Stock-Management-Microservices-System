import React, { useState, useEffect, useRef } from "react";
import axios from "../../utils/axios";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const PricingCalculator = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pricingResult, setPricingResult] = useState(null);
  const resultsRef = useRef(null);

  const [calculator, setCalculator] = useState({
    productId: "",
    quantity: 1,
    customerId: "",
  });

  const [bundleItems, setBundleItems] = useState([
    { productId: "", quantity: 1, customerId: "" },
  ]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:3002/api/products");
      setProducts(res.data.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const calculatePrice = async () => {
    if (!calculator.productId) {
      alert("Please select a product");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:3002/api/pricing/calculate",
        {
          productId: parseInt(calculator.productId),
          quantity: parseInt(calculator.quantity),
          customerId: calculator.customerId
            ? parseInt(calculator.customerId)
            : null,
        }
      );
      setPricingResult(res.data.data);
      scrollToResults();
    } catch (error) {
      alert("Error calculating price: " + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateBundle = async () => {
    const validItems = bundleItems.filter((item) => item.productId);
    if (validItems.length === 0) {
      alert("Please add at least one product");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:3002/api/pricing/calculate-bundle",
        {
          items: validItems.map((item) => ({
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
            customerId: item.customerId ? parseInt(item.customerId) : null,
          })),
        }
      );
      setPricingResult(res.data.data);
      scrollToResults();
    } catch (error) {
      alert("Error calculating bundle: " + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const addBundleItem = () => {
    setBundleItems([
      ...bundleItems,
      { productId: "", quantity: 1, customerId: "" },
    ]);
  };

  const removeBundleItem = (index) => {
    setBundleItems(bundleItems.filter((_, i) => i !== index));
  };

  const updateBundleItem = (index, field, value) => {
    const updated = [...bundleItems];
    updated[index][field] = value;
    setBundleItems(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Dynamic Pricing Calculator
        </h1>
        <p className="text-gray-600 mt-1">
          Calculate prices with automatic bulk discounts, promotions, and tier
          pricing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Product Calculator */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Single Product Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Product
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={calculator.productId}
                  onChange={(e) =>
                    setCalculator({ ...calculator, productId: e.target.value })
                  }
                >
                  <option value="">Select a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - $
                      {parseFloat(product.unit_price).toFixed(2)} (SKU:{" "}
                      {product.sku})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Quantity"
                type="number"
                min="1"
                value={calculator.quantity}
                onChange={(e) =>
                  setCalculator({ ...calculator, quantity: e.target.value })
                }
              />

              <Input
                label="Customer ID (optional for tier pricing)"
                type="number"
                value={calculator.customerId}
                onChange={(e) =>
                  setCalculator({ ...calculator, customerId: e.target.value })
                }
                placeholder="Enter customer ID for VIP/Gold/Silver pricing"
              />

              <Button
                onClick={calculatePrice}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Calculating..." : "Calculate Price"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Bundle Calculator */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Bundle Pricing</h2>
            <div className="space-y-4">
              {bundleItems.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Item {index + 1}</span>
                    {bundleItems.length > 1 && (
                      <button
                        onClick={() => removeBundleItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={item.productId}
                    onChange={(e) =>
                      updateBundleItem(index, "productId", e.target.value)
                    }
                  >
                    <option value="">Select product...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - $
                        {parseFloat(product.unit_price).toFixed(2)}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Quantity"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateBundleItem(index, "quantity", e.target.value)
                      }
                    />
                    <Input
                      label="Customer ID"
                      type="number"
                      value={item.customerId}
                      onChange={(e) =>
                        updateBundleItem(index, "customerId", e.target.value)
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>
              ))}

              <Button
                variant="secondary"
                onClick={addBundleItem}
                className="w-full"
              >
                + Add Another Item
              </Button>

              <Button
                onClick={calculateBundle}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Calculating..." : "Calculate Bundle Price"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Pricing Result */}
      {pricingResult && (
        <Card ref={resultsRef}>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Pricing Breakdown</h2>

            {pricingResult.items ? (
              // Bundle Result
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Subtotal</div>
                    <div className="text-2xl font-bold">
                      ${pricingResult.subtotal}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600">Item Discounts</div>
                    <div className="text-2xl font-bold text-blue-600">
                      -${pricingResult.itemDiscounts}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600">
                      Bundle Discount ({pricingResult.bundleDiscountPercentage}
                      %)
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      -${pricingResult.bundleDiscount}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600">Final Total</div>
                    <div className="text-2xl font-bold text-green-600">
                      ${pricingResult.finalTotal}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-3">Bundle Items:</h3>
                  <div className="space-y-2">
                    {pricingResult.items.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {item.productName}
                            </div>
                            <div className="text-sm text-gray-600">
                              Qty: {item.quantity} × ${item.basePrice} = $
                              {item.subtotal}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-600 font-medium">
                              ${item.finalTotal}
                            </div>
                            {item.totalDiscount > 0 && (
                              <div className="text-sm text-gray-600">
                                Saved: ${item.totalDiscount}
                              </div>
                            )}
                          </div>
                        </div>
                        {item.appliedDiscounts.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {item.appliedDiscounts.map((discount, i) => (
                              <div key={i} className="text-xs text-blue-600">
                                ✓ {discount.rule}: {discount.percentage}% off
                                (-$
                                {discount.amount.toFixed(2)})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Single Product Result
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Base Price</div>
                    <div className="text-2xl font-bold">
                      ${pricingResult.basePrice}
                    </div>
                    <div className="text-xs text-gray-500">per unit</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600">Final Price</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${pricingResult.pricePerUnit}
                    </div>
                    <div className="text-xs text-blue-500">per unit</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm text-red-600">Total Discount</div>
                    <div className="text-2xl font-bold text-red-600">
                      -${pricingResult.totalDiscount}
                    </div>
                    <div className="text-xs text-red-500">
                      (
                      {(
                        (pricingResult.totalDiscount / pricingResult.subtotal) *
                        100
                      ).toFixed(1)}
                      % off)
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600">Final Total</div>
                    <div className="text-2xl font-bold text-green-600">
                      ${pricingResult.finalTotal}
                    </div>
                    <div className="text-xs text-green-500">
                      for {pricingResult.quantity} units
                    </div>
                  </div>
                </div>

                {/* Applied Discounts */}
                {pricingResult.appliedDiscounts.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-3">Applied Discounts:</h3>
                    <div className="space-y-2">
                      {pricingResult.appliedDiscounts.map((discount, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-blue-900">
                              {discount.rule}
                            </div>
                            <div className="text-sm text-blue-700">
                              {discount.type === "bulk" &&
                                "Quantity-based discount"}
                              {discount.type === "promotion" &&
                                "Time-limited promotion"}
                              {discount.type === "category" &&
                                "Category-wide discount"}
                              {discount.type === "customer_tier" &&
                                "Customer loyalty discount"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">
                              -{discount.percentage}%
                            </div>
                            <div className="text-sm text-blue-700">
                              -${discount.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Details */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Product:</span>
                      <span className="ml-2 font-medium">
                        {pricingResult.productName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">SKU:</span>
                      <span className="ml-2 font-medium">
                        {pricingResult.sku}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Quantity:</span>
                      <span className="ml-2 font-medium">
                        {pricingResult.quantity} units
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Calculated:</span>
                      <span className="ml-2 font-medium">
                        {new Date(pricingResult.calculatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PricingCalculator;
