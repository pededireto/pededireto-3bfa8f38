import { cn } from "@/lib/utils";
import CopyButton from "./CopyButton";

interface GrokBoxProps {
  label?: string;
  content: string;
  className?: string;
}

const GrokBox = ({ label = "PROMPT GROK", content, className }: GrokBoxProps) => {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-warning/30 bg-warning/5 p-4",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-warning">
          {label}
        </span>
        <CopyButton text={content} />
      </div>
      <p className="text-sm italic text-foreground/80 leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
};

export default GrokBox;
