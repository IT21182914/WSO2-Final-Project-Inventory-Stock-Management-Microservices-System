import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { FiPlus, FiEdit, FiTrash2, FiTag } from "react-icons/fi";

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:3002/api/categories");
      setCategories(res.data.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingCategory(null);
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(
          `http://localhost:3002/api/categories/${editingCategory.id}`,
          formData
        );
        toast.success("Category updated successfully!");
      } else {
        await axios.post("http://localhost:3002/api/categories", formData);
        toast.success("Category created successfully!");
      }
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(error.response?.data?.message || "Failed to save category");
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await axios.delete(`http://localhost:3002/api/categories/${id}`);
        toast.success("Category deleted successfully!");
        fetchCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
        toast.error("Failed to delete category");
      }
    }
  };

  const columns = [
    {
      header: "Code",
      accessor: "code",
      cell: (row) => (
        <span className="font-mono font-semibold text-primary">{row.code}</span>
      ),
    },
    {
      header: "Name",
      accessor: "name",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <FiTag className="text-dark-600" />
          <span className="font-medium text-dark-900">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Description",
      accessor: "description",
      cell: (row) => (
        <span className="text-dark-600">{row.description || "N/A"}</span>
      ),
    },
    {
      header: "Created",
      accessor: "created_at",
      cell: (row) => (
        <span className="text-dark-600">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(row)}>
            <FiEdit size={16} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(row.id)}
            className="text-danger hover:bg-danger/10"
          >
            <FiTrash2 size={16} />
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
        <h1 className="text-3xl font-bold text-dark-900">Categories</h1>
        <Button onClick={() => setShowModal(true)}>
          <FiPlus className="mr-2" />
          Add Category
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-dark-900">
            Product Categories
          </h2>
          <p className="text-dark-600 text-sm">
            Manage product categories and classifications
          </p>
        </div>
        <Table columns={columns} data={categories} />
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-dark-900 mb-6">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  label="Category Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Electronics"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-dark-900 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Category description..."
                    rows="3"
                    className="w-full px-4 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">
                  {editingCategory ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CategoryList;
