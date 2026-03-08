import { Link } from "react-router-dom";
import { useConsumerActivity, type ActivityEvent } from "@/hooks/useConsumerActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  CheckCircle,
  Star,
  Heart,
  MessageCircle,
  Award,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

const ICON_MAP: Record<string, React.ElementType> = {
  "clipboard-list": ClipboardList,
  "check-circle": CheckCircle,
  star: Star,
  heart: Heart,
  "message-circle": MessageCircle,
  award: Award,
  activity: Activity,
};

const COLOR_MAP: Record<string, string> = {
  request_created: "text-primary bg-primary/10",
  match_accepted: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  review_submitted: "text-amber-500 bg-amber-500/10",
  favorite_added: "text-rose-500 bg-rose-500/10",
  badge_earned: "text-violet-500 bg-violet-500/10",
  message_received: "text-sky-500 bg-sky-500/10",
};

function getEntityLink(event: ActivityEvent): string | null {
  if (event.entity_type === "service_request" && event.entity_id) {
    return `/pedido/${event.entity_id}`;
  }
  if (event.entity_type === "business" && event.entity_id) {
    return null; // could link to business but we don't have slug here
  }
  return null;
}

interface Props {
  userId: string | undefined;
}

const ConsumerActivityTimeline = ({ userId }: Props) => {
  const { data: events = [], isLoading } = useConsumerActivity(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-primary" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-primary" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            A sua atividade aparecerá aqui à medida que usar a plataforma.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-5 w-5 text-primary" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[18px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-4">
            {events.map((event, idx) => {
              const IconComp = ICON_MAP[event.icon] || Activity;
              const colorClass = COLOR_MAP[event.event_type] || "text-muted-foreground bg-muted";
              const link = getEntityLink(event);
              const timeAgo = formatDistanceToNow(new Date(event.created_at), {
                addSuffix: true,
                locale: pt,
              });

              const content = (
                <div className="flex gap-3 group">
                  <div className={`relative z-10 flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${colorClass}`}>
                    <IconComp className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-medium text-foreground leading-tight group-hover:text-primary transition-colors">
                      {event.title}
                    </p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground/70 mt-1">{timeAgo}</p>
                  </div>
                </div>
              );

              return link ? (
                <Link key={event.id} to={link} className="block hover:bg-muted/50 -mx-2 px-2 py-1 rounded-lg transition-colors">
                  {content}
                </Link>
              ) : (
                <div key={event.id} className="-mx-2 px-2 py-1">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsumerActivityTimeline;
