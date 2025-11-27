import { createContext, useContext, useState, useEffect } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AsgardeoAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Asgardeo hooks
  const {
    state,
    signIn,
    signOut,
    getBasicUserInfo,
    getIDToken,
    getAccessToken,
    on,
  } = useAuthContext();

  // Sync Asgardeo state with our user state
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("🔄 Initializing auth, state:", state);
        if (state.isAuthenticated) {
          console.log("✅ User is authenticated");
          // Get user info from Asgardeo
          const basicUserInfo = await getBasicUserInfo();
          console.log("👤 Basic user info:", basicUserInfo);

          const accessToken = await getAccessToken();
          console.log(
            "🔑 Access token:",
            accessToken ? "Received" : "Not received"
          );

          // Map Asgardeo user to our user format
          const mappedUser = {
            id: basicUserInfo.sub,
            username:
              basicUserInfo.username || basicUserInfo.email?.split("@")[0],
            email: basicUserInfo.email,
            role: mapAsgardeoRoleToAppRole(basicUserInfo.groups || []),
            asgardeoUser: basicUserInfo,
            accessToken: accessToken,
          };

          console.log("✅ Mapped user:", mappedUser);
          setUser(mappedUser);

          // Store token in API service
          if (accessToken) {
            localStorage.setItem("asgardeo_token", accessToken);
            console.log("💾 Token stored in localStorage");
          }
        } else {
          console.log("❌ User is not authenticated");
          setUser(null);
          localStorage.removeItem("asgardeo_token");
        }
      } catch (error) {
        console.error("❌ Error initializing auth:", error);
        console.error("  Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } finally {
        setLoading(false);
        console.log("✅ Auth initialization complete");
      }
    };

    initAuth();
  }, [state.isAuthenticated]);

  /**
   * Map Asgardeo groups/roles to application roles
   * Customize this based on your Asgardeo role configuration
   */
  const mapAsgardeoRoleToAppRole = (groups) => {
    console.log("🔍 Mapping groups to role:", groups);

    if (!groups || groups.length === 0) {
      console.warn("⚠️ No groups found - defaulting to warehouse_staff");
      return "warehouse_staff"; // Changed default from customer to warehouse_staff
    }

    // Check for admin role
    if (groups.some((g) => g.toLowerCase().includes("admin"))) {
      console.log("✅ Matched role: admin");
      return "admin";
    }

    // Check for warehouse staff
    if (
      groups.some(
        (g) =>
          g.toLowerCase().includes("warehouse") ||
          g.toLowerCase().includes("staff")
      )
    ) {
      console.log("✅ Matched role: warehouse_staff");
      return "warehouse_staff";
    }

    // Check for supplier
    if (groups.some((g) => g.toLowerCase().includes("supplier"))) {
      console.log("✅ Matched role: supplier");
      return "supplier";
    }

    // Default to warehouse_staff if no match
    console.warn("⚠️ No matching group - defaulting to warehouse_staff");
    return "warehouse_staff";
  };

  const login = async () => {
    try {
      console.log("🔐 Attempting Asgardeo login...");
      console.log("  Auth state:", state);
      await signIn();
      console.log("✅ SignIn triggered successfully");
      // The actual login redirect will be handled by Asgardeo
      // User will be set in the useEffect when they return
    } catch (error) {
      console.error("❌ Login error:", error);
      console.error("  Error name:", error.name);
      console.error("  Error message:", error.message);
      console.error("  Error stack:", error.stack);
      toast.error(`Login failed: ${error.message || "Please try again"}`);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      localStorage.removeItem("asgardeo_token");
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  const updateUser = (userData) => {
    setUser((prev) => ({
      ...prev,
      ...userData,
    }));
  };

  // Handle post-login navigation
  useEffect(() => {
    if (user && !loading) {
      // Only navigate on initial login, not on page refresh
      const hasNavigated = sessionStorage.getItem("has_navigated");

      if (!hasNavigated) {
        const role = user.role;
        if (role === "admin") {
          navigate("/dashboard/admin");
        } else if (role === "warehouse_staff") {
          navigate("/dashboard/warehouse");
        } else if (role === "supplier") {
          navigate("/dashboard/supplier");
        } else {
          navigate("/products");
        }

        sessionStorage.setItem("has_navigated", "true");
        toast.success(`Welcome back, ${user.username}!`);
      }
    }
  }, [user, loading]);

  const value = {
    user,
    loading: loading || state.isLoading,
    login,
    logout,
    updateUser,
    isAuthenticated: state.isAuthenticated,
    hasRole: (roles) => {
      if (!user) return false;
      if (Array.isArray(roles)) {
        return roles.includes(user.role);
      }
      return user.role === roles;
    },
    // Expose Asgardeo methods for advanced use
    getAccessToken,
    getIDToken,
    asgardeoState: state,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Keep backward compatibility with old AuthProvider name
export const AuthProvider = AsgardeoAuthProvider;
