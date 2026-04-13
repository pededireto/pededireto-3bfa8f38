import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { BusinessWithCategory } from "@/hooks/useBusinesses";
import { useCommercialPlans } from "@/hooks/useCommercialPlans";
import { useBusinessRequests } from "@/hooks/useBusinessDashboard";
import { useUnreadNotificationsCount } from "@/hooks/useBusinessNotifications";
import { useBusinessAnalytics } from "@/hooks/useBusinessAnalytics";
import { useBusinessClaimPermissions } from "@/hooks/useBusinessClaimPermissions";
import { useBusinessScore } from "@/hooks/useBusinessScore";
import { useBusinessPlan } from "@/hooks/useBusinessPlan";
import { useBusinessResponseTime } from "@/hooks/useBusinessResponseTime";
import BusinessProfileScore from "@/components/business/BusinessProfileScore";
import OnboardingChecklist from "@/components/business/OnboardingChecklist";
import BusinessProAlerts from "@/components/business/BusinessProAlerts";
import BusinessRankingWidget from "@/components/business/BusinessRankingWidget";
import ShareProfileCard from "@/components/business/ShareProfileCard";
import { useBusinessBadges } from "@/hooks/useBusinessDashboardPro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  CreditCard,
  Inbox,
  Bell,
  Eye,
  MousePointerClick,
  TrendingUp,
  Calendar,
  ArrowRight,
  Lock,
  Zap,
  Clock,
  AlertTriangle as AlertTriangleIcon,
  Trophy,
  Timer,
  ChevronRight,
  FileText,
  Briefcase,
} from "lucide-react";

interface Props {
  business: BusinessWithCategory;
  onNavigate?: (tab: string) => void;
}

const WHATSAPP_SUPPORT_URL =
  "https://api.whatsapp.com/send/?phone=351210203862&text=Ol%C3%A1%2C+a+minha+conta+na+Pede+Direto+está+inativa,+podem+ajudar?.&type=phone_number&app_absent=0";

const LockedCard = ({
  icon: Icon,
  label,
  reason,
  onUnlock,
}: {
  icon: React.ElementType;
  label: string;
  reason: string;
  onUnlock: () => void;
}) => (
  <div className="bg-card rounded-xl p-5 shadow-card relative overflow-hidden">
    <div className="blur-sm pointer-events-none select-none">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">--</p>
      <p className="text-xs text-muted-foreground mt-1">&nbsp;</p>
    </div>
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-[2px]">
      <Lock className="h-5 w-5 text-muted-foreground mb-1.5" />
      <p className="text-xs text-muted-foreground text-center px-3 mb-2">{reason}</p>
      <Button size="sm" variant="outline" className="text-xs h-7" onClick={onUnlock}>
        Desbloquear →
      </Button>
    </div>
  </div>
);

const UpgradeBanner = ({
  isPreview,
  isFreePlan,
  onUpgrade,
}: {
  isPreview: boolean;
  isFreePlan: boolean;
  onUpgrade: () => void;
}) => {
  if (!isPreview && !isFreePlan) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
      <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
        <Zap className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        {isPreview ? (
          <>
            <p className="text-sm font-semibold text-foreground">O teu negócio está em verificação 🔍</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Já podes ver as tuas visualizações. Para receber pedidos e contactos diretos, ativa um plano.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-foreground">Estás no plano Gratuito</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Apareces nos resultados mas não recebes pedidos. Ativa o START por €9,90/mês.
            </p>
          </>
        )}
      </div>
      <Button size="sm" onClick={onUpgrade} className="shrink-0">
        {isPreview ? "Ver Planos" : "Começar a receber pedidos"}
        <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
};

/* ── Urgency helpers ────────────────────────────────────────── */
const getRequestUrgencyBadge = (req: any) => {
  const sr = req.service_requests;
  if (!sr) return null;
  if (sr.urgency === "urgent")
    return (
      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 animate-pulse">
        🔴 URGENTE
      </Badge>
    );
  return null;
};

const getTimeSince = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
};

const BusinessDashboardOverview = ({ business, onNavigate }: Props) => {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const flag = localStorage.getItem("onboarding_complete");
    if (flag === "true") {
      setShowWelcome(true);
      localStorage.removeItem("onboarding_complete");
    }
  }, []);
  const queryClient = useQueryClient();
  const { data: plans = [] } = useCommercialPlans(true);
  const { data: requests = [] } = useBusinessRequests(business.id);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount(business.id);
  const { data: analytics, refetch } = useBusinessAnalytics(business.id);
  const { data: scoreData } = useBusinessScore(business.id);
  const permissions = useBusinessClaimPermissions(business);
  const { data: responseTime } = useBusinessResponseTime(business.id);
  const { isOnTrial, trialDaysLeft } = useBusinessPlan({
    plan_id: business.plan_id,
    subscription_plan: (business as any).subscription_plan,
    subscription_status: business.subscription_status,
    trial_ends_at: (business as any).trial_ends_at,
    is_premium: (business as any).is_premium,
  });
  const plan = plans.find((p) => p.id === business.plan_id);
  const { data: badges = [] } = useBusinessBadges(permissions.canViewProAnalytics ? business.id : null);
  const unlockedBadges = badges.filter((b) => b.unlocked);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["business-analytics", business.id] });
    const timer = setTimeout(() => refetch(), 500);
    return () => clearTimeout(timer);
  }, [business.id, queryClient, refetch]);

  const subscriptionEndDate = business.subscription_end_date
    ? new Date(business.subscription_end_date).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const daysUntilExpiry = business.subscription_end_date
    ? Math.ceil((new Date(business.subscription_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isLocked = permissions.isPreview || permissions.isFreePlan;

  // Recent requests (last 5, sorted by most recent)
  const recentRequests = requests.filter((r: any) => r.service_requests).slice(0, 4);

  // Pending responses count
  const pendingResponses = requests.filter(
    (r: any) => r.service_requests?.status === "active" && !r.first_response_at,
  ).length;

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 19 ? "Boa tarde" : "Boa noite";

  return (
    <div className="space-y-6">
      {/* Welcome banner — first visit after onboarding */}
      {showWelcome && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-bold text-foreground">🎉 Bem-vindo à Pede Direto!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Estamos a verificar os seus dados e o negócio ficará visível em breve.
                <br />
                Complete o perfil enquanto isso para aparecer mais acima nos resultados!
              </p>
            </div>
            <button
              onClick={() => setShowWelcome(false)}
              className="text-muted-foreground hover:text-foreground p-1"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
          <Button size="sm" onClick={() => onNavigate?.("edit")} className="text-sm">
            Completar perfil agora →
          </Button>
        </div>
      )}

      {/* Onboarding Checklist */}
      <OnboardingChecklist business={business} onNavigate={(tab) => onNavigate?.(tab)} />

      {/* ── Hero Greeting ─────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {greeting}, {business.name} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Aqui está o resumo do teu negócio hoje</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={business.subscription_status === "active" ? "default" : "secondary"} className="text-xs">
            {plan?.name || "Gratuito"}
            {business.subscription_status === "active" ? " ✓" : ""}
          </Badge>
          {business.is_active ? (
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              ✅ Visível
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              🔍 Em verificação
            </Badge>
          )}
        </div>
      </div>

      {/* Trial Banner */}
      {isOnTrial && trialDaysLeft > 3 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-center gap-4">
          <div className="rounded-full bg-yellow-500/20 p-2.5 shrink-0">
            <Clock className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Estás em modo Trial PRO — {trialDaysLeft} dias restantes
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Experimenta todas as funcionalidades PRO gratuitamente.
            </p>
          </div>
          <Button size="sm" onClick={() => onNavigate?.("plan")} className="shrink-0">
            Escolher Plano <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}

      {isOnTrial && trialDaysLeft <= 3 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-center gap-4">
          <div className="rounded-full bg-destructive/20 p-2.5 shrink-0">
            <AlertTriangleIcon className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">O teu Trial termina em {trialDaysLeft} dias!</p>
            <p className="text-xs text-muted-foreground mt-0.5">Não percas o acesso PRO.</p>
          </div>
          <Button size="sm" variant="destructive" onClick={() => onNavigate?.("plan")} className="shrink-0">
            Manter acesso PRO <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}

      <UpgradeBanner
        isPreview={permissions.isPreview}
        isFreePlan={permissions.isFreePlan}
        onUpgrade={() => onNavigate?.("plan")}
      />

      {permissions.canViewProAnalytics && (
        <BusinessProAlerts
          businessId={business.id}
          business={{
            category_id: business.category_id,
            cta_whatsapp: business.cta_whatsapp,
            schedule_weekdays: business.schedule_weekdays,
            description: business.description,
          }}
          onNavigate={onNavigate}
        />
      )}

      {/* ── KPI Cards (5 cols) ───────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Visitas</span>
          </div>
          <p className="text-2xl font-bold">{analytics?.views ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
        </div>

        {isLocked ? (
          <LockedCard
            icon={Inbox}
            label="Pedidos"
            reason="Ativa um plano para receber"
            onUnlock={() => onNavigate?.("plan")}
          />
        ) : (
          <div className="bg-card rounded-xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Inbox className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Orçamentos</span>
            </div>
            <p className="text-2xl font-bold">{requests.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total recebidos</p>
          </div>
        )}

        {isLocked ? (
          <LockedCard
            icon={MousePointerClick}
            label="Respostas Pendentes"
            reason="Ativa um plano para ver"
            onUnlock={() => onNavigate?.("plan")}
          />
        ) : (
          <div className="bg-card rounded-xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-cta" />
              <span className="text-xs text-muted-foreground">Respostas Pendentes</span>
            </div>
            <p className="text-2xl font-bold">{pendingResponses}</p>
            {pendingResponses > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs p-0 h-auto text-primary mt-1"
                onClick={() => onNavigate?.("requests")}
              >
                Responder agora →
              </Button>
            )}
          </div>
        )}

        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Score de Resposta</span>
          </div>
          {responseTime ? (
            <>
              <p className="text-2xl font-bold">⚡ {responseTime.label}</p>
              <p className="text-xs text-muted-foreground mt-1">Tempo médio de resposta</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-xs text-muted-foreground mt-1">Sem dados ainda</p>
            </>
          )}
        </div>

        {/* Score / Pontos do Ranking */}
        <div className="bg-card rounded-xl p-5 shadow-card border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Pontos</span>
          </div>
          <p className="text-2xl font-bold">🏆 {scoreData?.score ?? business.ranking_score ?? 0}</p>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs p-0 h-auto text-primary mt-1"
            onClick={() => onNavigate?.("insights")}
          >
            Ver evolução →
          </Button>
        </div>
      </div>

      {/* ── Ranking + Profile Score row ────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <BusinessProfileScore
            businessId={business.id}
            canViewPro={permissions.canViewProAnalytics}
            onInsightsClick={() => onNavigate?.("insights")}
            onUpgradeClick={() => onNavigate?.("plan")}
          />
        </div>
        <BusinessRankingWidget businessId={business.id} onNavigate={onNavigate} />
      </div>

      {/* ── Recent Requests ──────────────────────────── */}
      {!isLocked && recentRequests.length > 0 && (
        <div className="bg-card rounded-xl p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Pedidos Recentes</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs p-0 h-auto text-primary"
              onClick={() => onNavigate?.("requests")}
            >
              Ver todos →
            </Button>
          </div>
          <div className="space-y-2">
            {recentRequests.map((req: any) => {
              const sr = req.service_requests;
              if (!sr) return null;
              const isExpired = sr.status === "expired";
              const isActive = sr.status === "active";
              return (
                <div
                  key={req.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                    isExpired
                      ? "border-muted bg-muted/20 opacity-60"
                      : sr.urgency === "urgent"
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-border"
                  }`}
                  onClick={() => onNavigate?.("requests")}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getRequestUrgencyBadge(req)}
                      <span className="text-sm font-medium text-foreground truncate">
                        {sr.description?.slice(0, 60) || "Pedido sem descrição"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{getTimeSince(sr.created_at)}</span>
                      {sr.profiles?.full_name && (
                        <>
                          <span>•</span>
                          <span>{sr.profiles.full_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isExpired && (
                      <Badge variant="secondary" className="text-[10px]">
                        Expirado
                      </Badge>
                    )}
                    {isActive && !req.first_response_at && (
                      <Button size="sm" className="text-xs h-7">
                        Responder
                      </Button>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quick Access — Quotes + Jobs ─────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate?.("quotes")}
          className="bg-card rounded-xl p-5 shadow-card text-left hover:ring-2 hover:ring-primary/30 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Orçamentos</p>
              <p className="text-xs text-muted-foreground">Gerir pedidos de orçamento</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate?.("job-offers")}
          className="bg-card rounded-xl p-5 shadow-card text-left hover:ring-2 hover:ring-primary/30 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Ofertas Emprego</p>
              <p className="text-xs text-muted-foreground">Publicar e gerir vagas</p>
            </div>
          </div>
        </button>
      </div>

      {/* ── Badges Row ───────────────────────────────── */}
      {permissions.canViewProAnalytics && unlockedBadges.length > 0 && (
        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Badges Conquistados</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs p-0 h-auto text-primary"
              onClick={() => onNavigate?.("badges")}
            >
              Ver todos →
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {unlockedBadges.slice(0, 6).map((badge) => (
              <Badge
                key={badge.name}
                variant="secondary"
                className="text-xs px-3 py-1.5 bg-primary/5 border-primary/20"
              >
                ✅ {badge.name}
              </Badge>
            ))}
            {unlockedBadges.length > 6 && (
              <Badge variant="outline" className="text-xs px-3 py-1.5">
                +{unlockedBadges.length - 6} mais
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom row: Plan + Share + State ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ShareProfileCard slug={business.slug} businessName={business.name} />

        <div className="bg-card rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Plano Atual</span>
          </div>
          <div>
            <p className="text-lg font-bold">{plan?.name || "Gratuito"}</p>
            <Badge variant={business.subscription_status === "active" ? "default" : "secondary"} className="mt-1">
              {business.subscription_status === "active"
                ? "Ativo"
                : business.subscription_status === "expired"
                  ? "Expirado"
                  : "Inativo"}
            </Badge>
            {subscriptionEndDate && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {daysUntilExpiry !== null && daysUntilExpiry <= 30 ? (
                    <span className="text-yellow-500 font-medium">Expira em {daysUntilExpiry} dias</span>
                  ) : (
                    `Válido até ${subscriptionEndDate}`
                  )}
                </span>
              </div>
            )}
            {(permissions.isFreePlan || permissions.isPreview) && (
              <Button size="sm" className="w-full mt-3 text-xs" onClick={() => onNavigate?.("plan")}>
                {permissions.isPreview ? "Ativar Plano" : "Melhorar Plano"}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-xl p-5 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Estado do Negócio</span>
            </div>
            <Badge variant={business.is_active ? "default" : "secondary"} className="text-sm px-3 py-1">
              {business.is_active ? "✅ Visível ao público" : "🔍 Em verificação"}
            </Badge>
            {!business.is_active && (
              <p className="text-xs text-muted-foreground mt-2">
                Estamos a verificar os seus dados. Complete o perfil para acelerar!
              </p>
            )}
          </div>

          {!isLocked && analytics && analytics.totalContacts > 0 && (
            <div className="bg-card rounded-xl p-5 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <MousePointerClick className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Contactos (30d)</span>
              </div>
              <p className="text-2xl font-bold">{analytics.totalContacts}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                {analytics.breakdown.phone > 0 && (
                  <span className="text-[10px] text-muted-foreground">📞{analytics.breakdown.phone}</span>
                )}
                {analytics.breakdown.whatsapp > 0 && (
                  <span className="text-[10px] text-muted-foreground">💬{analytics.breakdown.whatsapp}</span>
                )}
                {analytics.breakdown.website > 0 && (
                  <span className="text-[10px] text-muted-foreground">🌐{analytics.breakdown.website}</span>
                )}
                {analytics.breakdown.email > 0 && (
                  <span className="text-[10px] text-muted-foreground">✉️{analytics.breakdown.email}</span>
                )}
              </div>
            </div>
          )}

          {isLocked && analytics && analytics.views > 0 && (
            <div className="bg-card rounded-xl p-5 shadow-card border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">O teu Potencial</span>
              </div>
              <p className="text-2xl font-bold text-primary">{analytics.views}</p>
              <p className="text-xs text-muted-foreground mt-1">pessoas viram o teu perfil nos últimos 30 dias</p>
              <Button size="sm" className="w-full mt-3 text-xs" onClick={() => onNavigate?.("plan")}>
                Começar a receber contactos →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboardOverview;
