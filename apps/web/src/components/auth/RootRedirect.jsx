import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Loader2 } from "lucide-react";

const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🏠 RootRedirect - Checking auth:", { isAuthenticated, user: user?.username, role: user?.role });
    
    if (isAuthenticated && user) {
      const role = user.role;
      console.log("✅ Authenticated, redirecting based on role:", role);
      
      if (role === "admin") {
        navigate("/dashboard/admin", { replace: true });
      } else if (role === "warehouse_staff") {
        navigate("/dashboard/warehouse", { replace: true });
      } else if (role === "supplier") {
        navigate("/dashboard/supplier", { replace: true });
      } else {
        navigate("/products", { replace: true });
      }
    } else if (isAuthenticated && !user) {
      console.log("⏳ Authenticated but user not loaded yet, waiting...");
      // User object is still loading, stay here and wait
    } else {
      console.log("❌ Not authenticated, redirecting to login");
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Loading...
        </h2>
        <p className="text-gray-600">
          Please wait while we redirect you.
        </p>
      </div>
    </div>
  );
};

export default RootRedirect;
