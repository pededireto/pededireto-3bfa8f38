import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  days: number;
  onChange: (days: number) => void;
}

const options = [
  { label: "7 dias", value: 7 },
  { label: "30 dias", value: 30 },
  { label: "90 dias", value: 90 },
];

const DateRangeFilter = ({ days, onChange }: DateRangeFilterProps) => {
  return (
    <div className="flex gap-1 bg-muted rounded-lg p-1">
      {options.map((opt) => (
        <Button
          key={opt.value}
          variant="ghost"
          size="sm"
          onClick={() => onChange(opt.value)}
          className={cn(
            "text-xs h-7 px-3 rounded-md",
            days === opt.value && "bg-background shadow-sm text-foreground"
          )}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
};

export default DateRangeFilter;
