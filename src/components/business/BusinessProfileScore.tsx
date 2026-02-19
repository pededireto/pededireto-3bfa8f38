import { Lightbulb, CheckCircle2 } from "lucide-react";
import { useBusinessProfileScore } from "@/hooks/useBusinessProfileScore";

interface BusinessProfileScoreProps {
  businessId: string;
}

const getScoreColor = (percentage: number) => {
  if (percentage >= 80) return "text-green-500";
  if (percentage >= 50) return "text-yellow-500";
  return "text-red-500";
};

const getBarColor = (percentage: number) => {
  if (percentage >= 80) return "bg-green-500";
  if (percentage >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

const getScoreLabel = (percentage: number) => {
  if (percentage >= 80) return "Excelente";
  if (percentage >= 60) return "Bom";
  if (percentage >= 40) return "A melhorar";
  return "Incompleto";
};

const BusinessProfileScore = ({ businessId }: BusinessProfileScoreProps) => {
  const { data, isLoading } = useBusinessProfileScore(businessId);

  if (isLoading || !data) return null;

  return (
    <div className="bg-card rounded-xl p-5 shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Perfil Completo</p>
          <p className="text-xs text-muted-foreground">Quanto mais completo, mais visível és</p>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${getScoreColor(data.percentage)}`}>
            {data.percentage}%
          </span>
          <p className={`text-xs font-medium ${getScoreColor(data.percentage)}`}>
            {getScoreLabel(data.percentage)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ${getBarColor(data.percentage)}`}
          style={{ width: `${data.percentage}%` }}
        />
      </div>

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Lightbulb className="h-3 w-3" /> Sugestões para melhorar
          </p>
          {data.suggestions.slice(0, 3).map((suggestion, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
              <Lightbulb className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
              {suggestion}
            </div>
          ))}
        </div>
      )}

      {data.suggestions.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-green-500">
          <CheckCircle2 className="h-4 w-4" />
          Perfil totalmente completo — parabéns!
        </div>
      )}
    </div>
  );
};

export default BusinessProfileScore;
