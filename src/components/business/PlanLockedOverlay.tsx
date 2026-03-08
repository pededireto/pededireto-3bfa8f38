import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PlanLockedOverlayProps {
  locked: boolean;
  requiredPlan?: "start" | "pro";
  children: React.ReactNode;
}

const planLabels: Record<string, string> = {
  start: "START",
  pro: "PRO",
};

const PlanLockedOverlay = ({ locked, requiredPlan = "start", children }: PlanLockedOverlayProps) => {
  const navigate = useNavigate();

  if (!locked) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40 blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg z-10">
        <div className="flex flex-col items-center gap-2 text-center px-4">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Disponível no plano {planLabels[requiredPlan]}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => navigate("/upgrade")}
            className="mt-1"
          >
            Fazer upgrade
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlanLockedOverlay;
