import { Info } from "lucide-react";

const INFO: Record<string, string> = {
  hero: "O bloco principal da homepage. Aparece acima de tudo. Inclui título, barra de pesquisa e botões de acção.",
  platform_stats: "Barra com métricas da plataforma (negócios, cidades, etc). Costuma aparecer logo abaixo do Hero.",
  categorias: "Grelha de categorias. Podes escolher quais mostrar e quantas aparecem antes do botão 'Ver mais'.",
  how_it_works: "Secção 'Como funciona' com passos numerados. Explica o processo ao utilizador.",
  dual_cta: "Dois cards lado a lado — um para consumidores, outro para empresas. Aparece a meio da homepage.",
  servicos_rapidos: "Cards de acesso rápido a categorias comuns. Ex: 'Fuga de água', 'Electricista urgente'.",
  social_proof: "Logos dos negócios na plataforma para gerar confiança.",
  novos_negocios: "Mostra os negócios mais recentemente registados.",
  banner: "Banner livre com imagem, texto e botão de acção.",
  negocios_premium: "Secção de negócios premium em destaque.",
  business_cta: "Bloco de chamada para negócios locais. Ideal para explicar benefícios e mostrar botões de adesão.",
  destaques: "Secção de destaques da plataforma.",
  featured_categories: "Categorias em destaque na homepage.",
  super_destaques: "Super destaques — os negócios com maior visibilidade.",
  categorias_accordion: "Accordion com categorias expandíveis.",
  texto: "Bloco de texto livre. Suporta título e conteúdo formatado.",
  personalizado: "Bloco personalizado com configuração JSON livre.",
};

interface Props { type: string }

const BlockInfoBanner = ({ type }: Props) => {
  const text = INFO[type];
  if (!text) return null;
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-sm text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
      <Info className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
};

export default BlockInfoBanner;
