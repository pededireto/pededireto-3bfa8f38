import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Settings } from "lucide-react";
import BlockInfoBanner from "./BlockInfoBanner";
import HeroBlockForm from "./HeroBlockForm";
import PlatformStatsBlockForm from "./PlatformStatsBlockForm";
import CategoriasBlockForm from "./CategoriasBlockForm";
import HowItWorksBlockForm from "./HowItWorksBlockForm";
import DualCtaBlockForm from "./DualCtaBlockForm";
import ServicosRapidosBlockForm from "./ServicosRapidosBlockForm";
import SocialProofBlockForm from "./SocialProofBlockForm";
import BannerBlockForm from "./BannerBlockForm";
import NovosNegociosBlockForm from "./NovosNegociosBlockForm";
import GenericBlockForm from "./GenericBlockForm";
import TextoBlockForm from "./TextoBlockForm";

interface Props {
  type: string;
  config: Record<string, any>;
  onChange: (c: Record<string, any>) => void;
  configJson: string;
  onConfigJsonChange: (v: string) => void;
}

const GENERIC_TYPES = ["negocios_premium", "destaques", "featured_categories", "super_destaques", "categorias_accordion"];

const BlockFormRenderer = ({ type, config, onChange, configJson, onConfigJsonChange }: Props) => {
  const isCustom = type === "personalizado";

  const renderForm = () => {
    switch (type) {
      case "hero": return <HeroBlockForm config={config} onChange={onChange} />;
      case "platform_stats": return <PlatformStatsBlockForm config={config} onChange={onChange} />;
      case "categorias": return <CategoriasBlockForm config={config} onChange={onChange} />;
      case "how_it_works": return <HowItWorksBlockForm config={config} onChange={onChange} />;
      case "dual_cta": return <DualCtaBlockForm config={config} onChange={onChange} />;
      case "servicos_rapidos": return <ServicosRapidosBlockForm config={config} onChange={onChange} />;
      case "social_proof": return <SocialProofBlockForm config={config} onChange={onChange} />;
      case "banner": return <BannerBlockForm config={config} onChange={onChange} />;
      case "novos_negocios": return <NovosNegociosBlockForm config={config} onChange={onChange} />;
      case "texto": return <TextoBlockForm config={config} onChange={onChange} />;
      default:
        if (GENERIC_TYPES.includes(type)) return <GenericBlockForm config={config} onChange={onChange} type={type} />;
        return null;
    }
  };

  const form = renderForm();

  return (
    <div className="space-y-4">
      <BlockInfoBanner type={type} />

      {isCustom ? (
        <div>
          <Textarea
            value={configJson}
            onChange={e => onConfigJsonChange(e.target.value)}
            rows={10}
            className="font-mono text-xs"
            placeholder='{ "key": "value" }'
          />
          <p className="text-xs text-muted-foreground mt-1">
            O JSON deve ser um objecto válido. Começa e termina com {"{ }"}. Substitui completamente o conteúdo.
          </p>
        </div>
      ) : (
        <>
          {form}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <Settings className="h-3 w-3" />
              ⚙️ Editar JSON directamente
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Textarea
                value={configJson}
                onChange={e => onConfigJsonChange(e.target.value)}
                rows={8}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O JSON deve ser um objecto válido. Começa e termina com {"{ }"}. Alterações aqui sobrepõem os campos visuais.
              </p>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </div>
  );
};

export default BlockFormRenderer;
