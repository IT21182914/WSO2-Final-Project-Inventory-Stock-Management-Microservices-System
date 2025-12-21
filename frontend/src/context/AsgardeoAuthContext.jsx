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
    getDecodedIDToken,
    on,
  } = useAuthContext();

  // Helper function to get actual JWT access token from sessionStorage
  const getRealAccessToken = async () => {
    try {
      // Try multiple methods to get the actual JWT token

      // Method 1: Try getIDToken (ID tokens are JWTs)
      const idToken = await getIDToken();
      if (idToken && idToken.length > 100 && idToken.startsWith("ey")) {
        console.log("✅ Using ID Token as access token (JWT format)");
        return idToken;
      }

      // Method 2: Check sessionStorage for access token
      const sessionData = sessionStorage.getItem(
        `session_data-${import.meta.env.VITE_ASGARDEO_CLIENT_ID}`
      );
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.access_token && parsed.access_token.length > 100) {
          console.log("✅ Found JWT access token in sessionStorage");
          return parsed.access_token;
        }
      }

      // Method 3: Try getAccessToken() anyway
      const accessToken = await getAccessToken();
      console.log("⚠️ Falling back to getAccessToken() result");
      return accessToken;
    } catch (error) {
      console.error("❌ Error getting access token:", error);
      return null;
    }
  };

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

          // Get actual JWT access token
          const accessToken = await getRealAccessToken();
          console.log("🔑 Access token debug:");
          console.log("  Type:", typeof accessToken);
          console.log("  Length:", accessToken?.length);
          console.log(
            "  Preview:",
            accessToken ? `${accessToken.substring(0, 100)}...` : "None"
          );
          console.log("  Is JWT?", accessToken?.startsWith("ey") || false);

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

          // Store token first so API calls can use it
          if (accessToken) {
            localStorage.setItem("asgardeo_token", accessToken);
            console.log("💾 Token stored in localStorage");
          }

          // Sync user with backend database (auto-creates if new user)
          try {
            const response = await fetch(
              `${
                import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:3001"
              }/api/auth/profile`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (response.ok) {
              const profileData = await response.json();
              console.log("✅ User synced with backend:", profileData.data);
              console.log(
                "🔍 Full name from backend:",
                profileData.data.full_name
              );
              console.log(
                "🔍 Username from backend:",
                profileData.data.username
              );

              // Update username from backend (more user-friendly than email)
              if (profileData.data.username) {
                mappedUser.username = profileData.data.username;
                console.log("✅ Username updated to:", mappedUser.username);
              }

              // Update role and supplier_id from backend if different
              if (profileData.data.role) {
                mappedUser.role = profileData.data.role;
              }
              if (profileData.data.supplier_id) {
                mappedUser.supplier_id = profileData.data.supplier_id;
              }

              // Use full_name if available, otherwise use backend username, then fallback to email-based username
              if (profileData.data.full_name) {
                mappedUser.full_name = profileData.data.full_name;
                console.log("✅ Full name set to:", mappedUser.full_name);
              } else if (profileData.data.username) {
                mappedUser.full_name = profileData.data.username;
                console.log(
                  "✅ Using backend username as full_name:",
                  mappedUser.full_name
                );
              } else {
                console.warn("⚠️ No full_name or username in backend response");
              }
            } else {
              console.warn(
                "⚠️ Could not sync user with backend:",
                response.status
              );
            }
          } catch (syncError) {
            console.error("❌ Error syncing user with backend:", syncError);
            // Continue anyway - user can still use the app
          }

          console.log("🎯 Final mappedUser before setUser:", mappedUser);
          console.log(
            "📋 User fields - full_name:",
            mappedUser.full_name,
            "username:",
            mappedUser.username,
            "email:",
            mappedUser.email
          );
          setUser(mappedUser);
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
      console.warn("⚠️ No groups found - defaulting to supplier");
      return "supplier"; // Default to supplier for new registrations
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

    // Default to supplier if no match (for new users)
    console.warn("⚠️ No matching group - defaulting to supplier");
    return "supplier";
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
    getAccessToken: getRealAccessToken, // Use our custom function
    getIDToken,
    asgardeoState: state,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Keep backward compatibility with old AuthProvider name
export const AuthProvider = AsgardeoAuthProvider;
