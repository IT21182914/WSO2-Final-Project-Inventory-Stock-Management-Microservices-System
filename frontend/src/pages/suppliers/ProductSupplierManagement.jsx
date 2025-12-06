import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Input from "../../components/common/Input";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

const ProductSupplierManagement = () => {
  const [productSuppliers, setProductSuppliers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPS, setEditingPS] = useState(null);
  const [formData, setFormData] = useState({
    product_id: "",
    supplier_id: "",
    supplier_unit_price: "",
    lead_time_days: "7",
    minimum_order_quantity: "1",
    is_preferred: false,
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("asgardeo_token");

      console.log("[ProductSupplierManagement] Fetching data...");

      const [psResponse, supplierResponse, productResponse] = await Promise.all(
        [
          fetch("http://localhost:3004/api/product-suppliers", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3004/api/suppliers", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3002/api/products?is_active=true", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]
      );

      console.log("[ProductSupplierManagement] Response statuses:", {
        productSuppliers: psResponse.status,
        suppliers: supplierResponse.status,
        products: productResponse.status,
      });

      const psData = await psResponse.json();
      const supplierData = await supplierResponse.json();
      const productData = await productResponse.json();

      console.log("[ProductSupplierManagement] Product-Supplier data:", psData);
      console.log(
        "[ProductSupplierManagement] Sample PS record:",
        psData.data?.[0]
      );
      console.log(
        "[ProductSupplierManagement] Suppliers:",
        supplierData.data?.length
      );
      console.log(
        "[ProductSupplierManagement] Products:",
        productData.data?.length
      );

      setProductSuppliers(psData.data || []);
      setSuppliers(supplierData.data || []);
      setProducts(productData.data || []);
    } catch (error) {
      console.error("[ProductSupplierManagement] Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      product_id: "",
      supplier_id: "",
      supplier_unit_price: "",
      lead_time_days: "7",
      minimum_order_quantity: "1",
      is_preferred: false,
      notes: "",
    });
    setEditingPS(null);
    setShowAddModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("asgardeo_token");
      const url = editingPS
        ? `http://localhost:3004/api/product-suppliers/${editingPS.id}`
        : "http://localhost:3004/api/product-suppliers";

      const method = editingPS ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          product_id: parseInt(formData.product_id),
          supplier_id: parseInt(formData.supplier_id),
          supplier_unit_price: parseFloat(formData.supplier_unit_price),
          lead_time_days: parseInt(formData.lead_time_days),
          minimum_order_quantity: parseInt(formData.minimum_order_quantity),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingPS
            ? "Product-supplier relationship updated successfully"
            : "Product-supplier relationship added successfully"
        );
        resetForm();
        fetchData();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving product-supplier relationship:", error);
      toast.error("Failed to save");
    }
  };

  const handleEdit = (ps) => {
    setEditingPS(ps);
    setFormData({
      product_id: ps.product_id.toString(),
      supplier_id: ps.supplier_id.toString(),
      supplier_unit_price: ps.supplier_unit_price.toString(),
      lead_time_days: ps.lead_time_days.toString(),
      minimum_order_quantity: ps.minimum_order_quantity.toString(),
      is_preferred: ps.is_preferred,
      notes: ps.notes || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this relationship?")) {
      return;
    }

    try {
      const token = localStorage.getItem("asgardeo_token");
      const response = await fetch(
        `http://localhost:3004/api/product-suppliers/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Relationship deleted successfully");
        fetchData();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    }
  };

  const columns = [
    {
      header: "Product",
      accessor: (row) => {
        console.log("[Column Product] Row data:", row);
        // Check if product details are included from backend
        if (row.product_name) {
          return `${row.product_name} (${row.product_sku || "N/A"})`;
        }
        // Fallback to frontend products state
        const product = products.find((p) => p.id === row.product_id);
        const result = product
          ? `${product.name} (${product.sku})`
          : `Product ID: ${row.product_id}`;
        console.log("[Column Product] Resolved to:", result);
        return result;
      },
    },
    {
      header: "Supplier",
      accessor: "supplier_name",
    },
    {
      header: "Price",
      accessor: (row) => {
        console.log(
          "[Column Price] supplier_unit_price:",
          row.supplier_unit_price
        );
        return `$${parseFloat(row.supplier_unit_price).toFixed(2)}`;
      },
    },
    {
      header: "Lead Time",
      accessor: (row) => `${row.lead_time_days} days`,
    },
    {
      header: "MOQ",
      accessor: "minimum_order_quantity",
    },
    {
      header: "Preferred",
      accessor: (row) => (
        <span
          className={
            row.is_preferred ? "text-green-600 font-semibold" : "text-gray-400"
          }
        >
          {row.is_preferred ? "✓ Yes" : "No"}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-primary-600 hover:text-primary-800"
          >
            <FiEdit size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark-900">
            Product-Supplier Relationships
          </h1>
          <p className="text-dark-600 mt-1">
            Manage which suppliers can provide which products
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} icon={<FiPlus />}>
          Add Relationship
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <p className="text-dark-600">
            Total Relationships:{" "}
            <span className="font-semibold">{productSuppliers.length}</span>
          </p>
        </div>
        <Table columns={columns} data={productSuppliers} />
      </Card>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-dark-900 mb-4">
              {editingPS
                ? "Edit Relationship"
                : "Add Product-Supplier Relationship"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Product *
                  </label>
                  <select
                    name="product_id"
                    className="w-full px-3 py-2 border border-dark-300 rounded-lg"
                    value={formData.product_id}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingPS}
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku}) - ${product.unit_price}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Supplier *
                  </label>
                  <select
                    name="supplier_id"
                    className="w-full px-3 py-2 border border-dark-300 rounded-lg"
                    value={formData.supplier_id}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingPS}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Supplier Unit Price *"
                  name="supplier_unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.supplier_unit_price}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  label="Lead Time (days) *"
                  name="lead_time_days"
                  type="number"
                  min="1"
                  value={formData.lead_time_days}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  label="Minimum Order Quantity *"
                  name="minimum_order_quantity"
                  type="number"
                  min="1"
                  value={formData.minimum_order_quantity}
                  onChange={handleInputChange}
                  required
                />

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_preferred"
                    checked={formData.is_preferred}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-dark-700">
                    Preferred Supplier
                  </label>
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
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPS ? "Update" : "Add"} Relationship
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSupplierManagement;
