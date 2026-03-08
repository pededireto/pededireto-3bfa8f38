import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-email">("loading");

  useEffect(() => {
    if (!email) {
      setStatus("no-email");
      return;
    }

    const unsubscribe = async () => {
      const { error } = await (supabase as any)
        .from("newsletter_subscribers")
        .update({ is_active: false })
        .eq("email", email.toLowerCase().trim());

      setStatus(error ? "error" : "success");
    };

    unsubscribe();
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && <p className="text-muted-foreground">A processar...</p>}

        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Subscrição cancelada</h1>
            <p className="text-muted-foreground">
              O email <strong>{email}</strong> foi removido da nossa newsletter. Não receberá mais emails.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Erro</h1>
            <p className="text-muted-foreground">Não foi possível cancelar a subscrição. Tente novamente mais tarde.</p>
          </>
        )}

        {status === "no-email" && (
          <>
            <XCircle className="h-16 w-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Link inválido</h1>
            <p className="text-muted-foreground">Este link de cancelamento não é válido.</p>
          </>
        )}

        <Link to="/">
          <Button variant="outline" className="mt-4">Voltar ao início</Button>
        </Link>
      </div>
    </div>
  );
};

export default UnsubscribePage;
