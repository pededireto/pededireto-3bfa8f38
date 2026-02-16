import { useOnboardingStats } from "@/hooks/useOnboardingData";
import { Loader2, Users, Building2, Link2, Bug } from "lucide-react";

const OnboardingDashboard = () => {
  const { data: stats, isPending } = useOnboardingStats();

  if (isPending) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const cards = [
    { label: "Total Utilizadores", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-600" },
    { label: "Total Negócios", value: stats?.totalBusinesses || 0, icon: Building2, color: "text-emerald-600" },
    { label: "Negócios Claimed", value: stats?.claimedBusinesses || 0, icon: Link2, color: "text-green-600" },
    { label: "Negócios Unclaimed", value: stats?.unclaimedBusinesses || 0, icon: Building2, color: "text-orange-600" },
    { label: "Negócios Ativos", value: stats?.activeBusinesses || 0, icon: Building2, color: "text-teal-600" },
    { label: "Bugs Abertos", value: stats?.openBugs || 0, icon: Bug, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📊 Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-2">
              <card.icon className={`h-5 w-5 ${card.color}`} />
              <span className="text-sm text-muted-foreground">{card.label}</span>
            </div>
            <div className="text-3xl font-bold">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnboardingDashboard;
