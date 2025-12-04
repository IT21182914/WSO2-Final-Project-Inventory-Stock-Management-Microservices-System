import { useState, useEffect } from "react";
import { Users, Shield, Edit2, Save, X } from "lucide-react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { userService } from "../../services/userService";
import toast from "react-hot-toast";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editRole, setEditRole] = useState("");

  const roles = [
    { value: "admin", label: "Admin", color: "text-red-600 bg-red-100" },
    {
      value: "warehouse_staff",
      label: "Warehouse Staff",
      color: "text-blue-600 bg-blue-100",
    },
    {
      value: "supplier",
      label: "Supplier",
      color: "text-green-600 bg-green-100",
    },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (user) => {
    setEditingUserId(user.id);
    setEditRole(user.role);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditRole("");
  };

  const saveRole = async (userId) => {
    try {
      await userService.updateUserRole(userId, editRole);
      toast.success("User role updated successfully");
      setEditingUserId(null);
      setEditRole("");
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = roles.find((r) => r.value === role);
    if (!roleConfig) return null;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${roleConfig.color}`}
      >
        <Shield className="w-3 h-3 mr-1" />
        {roleConfig.label}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">User Management</h1>
          <p className="text-dark-600 mt-1">
            Manage user roles and permissions
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg">
          <Users className="w-5 h-5 text-primary-600" />
          <span className="text-sm font-medium text-primary-900">
            {users.length} Total Users
          </span>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-50 border-b border-dark-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-dark-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-dark-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-sm">
                          {user.username?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-dark-900">
                          {user.username}
                        </div>
                        <div className="text-sm text-dark-500">
                          {user.full_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-dark-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUserId === user.id ? (
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="block w-full px-3 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {roles.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      getRoleBadge(user.role)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingUserId === user.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveRole(user.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="inline-flex items-center px-3 py-1.5 bg-dark-200 text-dark-700 rounded-lg hover:bg-dark-300 transition-colors"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(user)}
                        className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit Role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Info Card */}
      <Card>
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500">
          <div className="flex">
            <Shield className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                Role Permissions
              </h3>
              <div className="mt-2 text-sm text-blue-800 space-y-1">
                <p>
                  <strong>Admin:</strong> Full system access including user
                  management
                </p>
                <p>
                  <strong>Warehouse Staff:</strong> Manage inventory, products,
                  and orders
                </p>
                <p>
                  <strong>Supplier:</strong> Manage supplier profile and view
                  orders
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserManagement;
