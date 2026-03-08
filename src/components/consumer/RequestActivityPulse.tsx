import { Eye, MessageCircle, Send } from "lucide-react";

interface Props {
  notified: number;
  viewed: number;
  responded: number;
}

const RequestActivityPulse = ({ notified, viewed, responded }: Props) => {
  if (notified === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <span className="flex items-center gap-1 text-muted-foreground">
        <Send className="h-3 w-3" />
        {notified} notificado{notified !== 1 ? "s" : ""}
      </span>
      {viewed > 0 && (
        <span className="flex items-center gap-1 text-foreground font-medium">
          <Eye className="h-3 w-3 text-blue-500" />
          {viewed} vi{viewed !== 1 ? "ram" : "u"} o pedido
        </span>
      )}
      {responded > 0 && (
        <span className="flex items-center gap-1 text-primary font-semibold">
          <MessageCircle className="h-3 w-3" />
          {responded} respond{responded !== 1 ? "eram" : "eu"}
        </span>
      )}
    </div>
  );
};

export default RequestActivityPulse;
