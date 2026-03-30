import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSmartRedirect } from "@/hooks/useSmartRedirect";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // Smart redirect handles routing to the correct dashboard
  useSmartRedirect(user, isLoading);

  useEffect(() => {
    // Fallback: if after 10s still no user, redirect to login
    const timeout = setTimeout(() => {
      if (!user) {
        navigate("/login", { replace: true });
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">A autenticar...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
