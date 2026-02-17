import { Badge } from "@/components/ui/badge";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  open: { label: "Aberto", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  assigned: { label: "Atribuído", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  in_progress: { label: "Em Progresso", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  waiting_response: { label: "Aguardando", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  resolved: { label: "Resolvido", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  closed: { label: "Fechado", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  escalated: { label: "Escalado", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

const PRIORITY_MAP: Record<string, { label: string; className: string }> = {
  low: { label: "🟢 Low", className: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" },
  medium: { label: "🟡 Medium", className: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300" },
  high: { label: "🟠 High", className: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300" },
  urgent: { label: "🔴 Urgent", className: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300" },
};

export const TicketStatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_MAP[status] || { label: status, className: "" };
  return <Badge variant="secondary" className={`text-xs ${s.className}`}>{s.label}</Badge>;
};

export const TicketPriorityBadge = ({ priority }: { priority: string }) => {
  const p = PRIORITY_MAP[priority] || { label: priority, className: "" };
  return <Badge variant="secondary" className={`text-xs ${p.className}`}>{p.label}</Badge>;
};

export const DEPARTMENT_LABELS: Record<string, string> = {
  cs: "Customer Success",
  commercial: "Comercial",
  onboarding: "Onboarding",
  it_admin: "IT / Admin",
};

export const CATEGORY_LABELS: Record<string, string> = {
  tecnico: "Técnico",
  faturacao: "Faturação",
  conta: "Conta",
  analytics: "Analytics",
  onboarding: "Onboarding",
  upgrade_plano: "Upgrade Plano",
  bug: "Bug",
  feature_request: "Feature Request",
  outro: "Outro",
};
