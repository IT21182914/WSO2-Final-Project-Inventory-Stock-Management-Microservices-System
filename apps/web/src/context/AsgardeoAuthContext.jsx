import { createContext, useState, useEffect } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export const AuthContext = createContext(null);

/**
 * Simplified Asgardeo Auth Provider
 * Leverages Asgardeo SDK's built-in token handling
 */
export const AsgardeoAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Asgardeo SDK hooks - these handle all token management automatically
  const {
    state,
    signIn,
    signOut,
    getBasicUserInfo,
    getAccessToken,
    getIDToken,
  } = useAuthContext();

  /**
   * Decode JWT token to get payload
   */
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return null;
    }
  };

  /**
   * Map Asgardeo groups to application roles
   * Returns primary role and full roles list
   */
  const mapGroupsToRoles = (groups = []) => {
    const groupsLower = groups.map(g => g.toLowerCase());
    const roles = [];
    
    // Map groups to roles
    if (groupsLower.some(g => g.includes("admin"))) roles.push("admin");
    if (groupsLower.some(g => g.includes("warehouse") || g.includes("staff"))) roles.push("warehouse_staff");
    if (groupsLower.some(g => g.includes("supplier"))) roles.push("supplier");
    
    // Primary role (highest privilege first)
    const primaryRole = roles.includes("admin") ? "admin" 
      : roles.includes("warehouse_staff") ? "warehouse_staff"
      : roles.includes("supplier") ? "supplier"
      : "warehouse_staff";
    
    return { primaryRole, roles: roles.length > 0 ? roles : [primaryRole] };
  };

  // Initialize user when authentication state changes
  useEffect(() => {
    const initUser = async () => {
      if (state.isAuthenticated) {
        try {
          const userInfo = await getBasicUserInfo();
          const accessToken = await getAccessToken();
          
          // Decode access token to get groups (groups are in access token, not ID token)
          const decodedAccessToken = decodeJWT(accessToken);
          const groups = decodedAccessToken?.groups || [];
          
          console.log("Asgardeo user info:", userInfo);
          console.log("Decoded Access Token:", decodedAccessToken);
          console.log("Groups from access token:", groups);
          
          const { primaryRole, roles } = mapGroupsToRoles(groups);
          
          const mappedUser = {
            id: userInfo.sub,
            sub: userInfo.sub,
            username: userInfo.username || decodedAccessToken?.email?.split("@")[0],
            email: decodedAccessToken?.email || userInfo.username,
            fullName: userInfo.displayName || "",
            firstName: decodedAccessToken?.given_name || "",
            lastName: decodedAccessToken?.family_name || "",
            role: primaryRole,
            roles: roles, // Array of all roles the user has
            groups: groups,
          };
          
          setUser(mappedUser);
        } catch (error) {
          console.error("Error getting user info:", error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initUser();
  }, [state.isAuthenticated, getBasicUserInfo, getAccessToken]);

  // Handle post-login navigation (only once per session)
  useEffect(() => {
    if (user && !loading && !sessionStorage.getItem("has_navigated")) {
      const dashboards = {
        admin: "/dashboard/admin",
        warehouse_staff: "/dashboard/warehouse",
        supplier: "/dashboard/supplier",
      };
      
      navigate(dashboards[user.role] || "/products");
      sessionStorage.setItem("has_navigated", "true");
      toast.success(`Welcome, ${user.firstName || user.username}!`);
    }
  }, [user, loading, navigate]);

  const login = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
      throw error;
    }
  };

  const logout = async () => {
    try {
      sessionStorage.removeItem("has_navigated");
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  /**
   * Open Asgardeo My Account page for profile management
   */
  const openMyAccount = () => {
    const baseUrl = import.meta.env.VITE_ASGARDEO_BASE_URL || "https://api.asgardeo.io/t/kubestock";
    const orgName = baseUrl.split("/t/")[1];
    const myAccountUrl = `https://myaccount.asgardeo.io/t/${orgName}`;
    window.open(myAccountUrl, "_blank");
  };

  /**
   * Open Asgardeo Console for user management (admin only)
   */
  const openUserManagement = () => {
    const baseUrl = import.meta.env.VITE_ASGARDEO_BASE_URL || "https://api.asgardeo.io/t/kubestock";
    const orgName = baseUrl.split("/t/")[1];
    const consoleUrl = `https://console.asgardeo.io/t/${orgName}/users`;
    window.open(consoleUrl, "_blank");
  };

  const value = {
    user,
    loading: loading || state.isLoading,
    isAuthenticated: state.isAuthenticated,
    login,
    logout,
    openMyAccount,
    openUserManagement,
    // Asgardeo SDK methods - use these directly for API calls
    getAccessToken,
    getIDToken,
    // Role checking utility - checks against user.roles array
    hasRole: (allowedRoles) => {
      if (!user || !user.roles) return false;
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      return rolesArray.some(role => user.roles.includes(role));
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Backward compatibility export
export const AuthProvider = AsgardeoAuthProvider;
