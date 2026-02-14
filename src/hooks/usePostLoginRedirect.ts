import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessMembership } from "@/hooks/useBusinessMembership";

/**
 * Hook that redirects user to the appropriate dashboard after login.
 * Call this in login pages after successful authentication.
 */
export const usePostLoginRedirect = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin, isCommercial, isLoading: authLoading } = useAuth();
  const { data: membership, isLoading: membershipLoading } = useBusinessMembership();

  const isLoading = authLoading || membershipLoading;

  const redirect = () => {
    if (!user) return;

    if (isAdmin || isSuperAdmin) {
      navigate("/admin", { replace: true });
      return;
    }

    if (isCommercial) {
      navigate("/comercial", { replace: true });
      return;
    }

    if (membership?.business_id) {
      navigate("/business-dashboard", { replace: true });
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  return { redirect, isLoading };
};
