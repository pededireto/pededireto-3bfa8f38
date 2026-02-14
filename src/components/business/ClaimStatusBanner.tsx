import { AlertTriangle, XCircle, Ban } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ClaimStatusBannerProps {
  message: string;
  variant: "warning" | "destructive" | "secondary";
}

const variantStyles = {
  warning: "border-yellow-500/50 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-500/30",
  destructive: "border-destructive/50 bg-destructive/10 text-destructive dark:bg-destructive/20",
  secondary: "border-muted bg-muted/50 text-muted-foreground",
};

const variantIcons = {
  warning: AlertTriangle,
  destructive: XCircle,
  secondary: Ban,
};

const ClaimStatusBanner = ({ message, variant }: ClaimStatusBannerProps) => {
  const Icon = variantIcons[variant];

  return (
    <Alert className={variantStyles[variant]}>
      <Icon className="h-4 w-4" />
      <AlertDescription className="font-medium">{message}</AlertDescription>
    </Alert>
  );
};

export default ClaimStatusBanner;
