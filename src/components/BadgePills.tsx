import { getBadgeIcon, getBadgeLabel, type PublicBadge } from "@/hooks/usePublicBadges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BadgePillsProps {
  badges: PublicBadge[];
  max?: number;
}

const COLOR_MAP: Record<string, string> = {
  "#f59e0b": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "#10b981": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "#3b82f6": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "#ec4899": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  "#8b5cf6": "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  "#f97316": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

const getColorClass = (color: string | null) => {
  if (color && COLOR_MAP[color]) return COLOR_MAP[color];
  return "bg-primary/10 text-primary";
};

const BadgePills = ({ badges, max = 2 }: BadgePillsProps) => {
  if (!badges || badges.length === 0) return null;

  const visible = badges.slice(0, max);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap gap-1">
        {visible.map((badge) => (
          <Tooltip key={badge.badge_slug}>
            <TooltipTrigger asChild>
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-tight ${getColorClass(badge.badge_color)}`}
              >
                <span className="text-[10px]">{getBadgeIcon(badge.badge_slug)}</span>
                {getBadgeLabel(badge.badge_slug, badge.badge_name)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-48">
              {badge.badge_name}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default BadgePills;
