import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { productService } from "../../services/productService";
import axios from "../../utils/axios";
import toast from "react-hot-toast";

const ProductAdd = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    unit_price: "",
    category_id: "",
    size: "",
    color: "",
  });

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:3002/api/categories");
      setCategories(res.data.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProduct = async () => {
    try {
      setPageLoading(true);
      const response = await productService.getProductById(id);
      const product = response.data;
      setFormData({
        name: product.name || "",
        description: product.description || "",
        sku: product.sku || "",
        unit_price: product.unit_price || "",
        category_id: product.category_id || "",
        size: product.size || "",
        color: product.color || "",
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product data");
      navigate("/products");
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data
      const productData = {
        name: formData.name,
        sku: formData.sku,
        unit_price: parseFloat(formData.unit_price),
        description: formData.description || "",
      };

      // Add optional fields only if they have values
      if (formData.category_id) {
        productData.category_id = parseInt(formData.category_id);
      }
      if (formData.size) {
        productData.size = formData.size;
      }
      if (formData.color) {
        productData.color = formData.color;
      }

      if (isEditMode) {
        await productService.updateProduct(id, productData);
        toast.success("Product updated successfully");
      } else {
        await productService.createProduct(productData);
        toast.success("Product created successfully");
      }

      navigate("/products");
    } catch (error) {
      toast.error(
        isEditMode ? "Failed to update product" : "Failed to create product"
      );
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <LoadingSpinner text="Loading product data..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/products")}
          className="mr-4"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-dark-900">
            {isEditMode ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-dark-600 mt-2">
            {isEditMode
              ? "Update product information"
              : "Create a new product in your catalog"}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter product name"
            />

            <Input
              label="SKU"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
              placeholder="Enter SKU"
            />

            <Input
              label="Unit Price"
              name="unit_price"
              type="number"
              step="0.01"
              value={formData.unit_price}
              onChange={handleChange}
              required
              placeholder="0.00"
            />

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-dark-900"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Size"
              name="size"
              type="text"
              value={formData.size}
              onChange={handleChange}
              placeholder="e.g., Small, Medium, Large"
            />

            <Input
              label="Color"
              name="color"
              type="text"
              value={formData.color}
              onChange={handleChange}
              placeholder="e.g., Red, Blue, Green"
            />

            <div className="md:col-span-2">
              <Input
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product description"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/products")}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              <Save size={18} className="mr-2" />
              {isEditMode ? "Update Product" : "Save Product"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProductAdd;
