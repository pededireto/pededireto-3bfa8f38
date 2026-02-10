import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsFavorited, useToggleFavorite } from "@/hooks/useUserFavorites";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  businessId: string;
  size?: "sm" | "icon";
  className?: string;
}

const FavoriteButton = ({ businessId, size = "icon", className }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: isFavorited = false } = useIsFavorited(businessId);
  const toggleFavorite = useToggleFavorite();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    toggleFavorite.mutate(
      { businessId, isFavorited },
      {
        onSuccess: () => {
          toast({
            title: isFavorited ? "Removido dos favoritos" : "Adicionado aos favoritos",
          });
        },
      }
    );
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      className={cn(
        "rounded-full",
        isFavorited ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500",
        className
      )}
      title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
    </Button>
  );
};

export default FavoriteButton;
