import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  config: Record<string, any>;
  onChange: (c: Record<string, any>) => void;
}

const HeroBlockForm = ({ config, onChange }: Props) => {
  const u = (key: string, val: any) => onChange({ ...config, [key]: val });

  return (
    <div className="space-y-4">
      <div>
        <Label>Título principal</Label>
        <Input value={config.titulo || ""} onChange={e => u("titulo", e.target.value)} placeholder="Diz o que precisas. Resolve já." />
      </div>
      <div>
        <Label>Subtítulo</Label>
        <Input value={config.subtitulo || ""} onChange={e => u("subtitulo", e.target.value)} placeholder="Encontra profissionais na tua zona em minutos" />
      </div>
      <div>
        <Label>Badge (opcional)</Label>
        <Input value={config.badge || ""} onChange={e => u("badge", e.target.value)} placeholder="A plataforma nº1 para encontrar serviços" />
      </div>

      <div>
        <Label>Trust badges (3 frases curtas)</Label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {[0, 1, 2].map(i => (
            <Input
              key={i}
              value={(config.trust_badges || [])[i] || ""}
              onChange={e => {
                const arr = [...(config.trust_badges || ["", "", ""])];
                arr[i] = e.target.value;
                u("trust_badges", arr);
              }}
              placeholder={["Profissionais prontos", "Contacto direto", "Respostas rápidas"][i]}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Switch checked={config.mostrar_pesquisa !== false} onCheckedChange={v => u("mostrar_pesquisa", v)} />
          <Label>Mostrar barra de pesquisa</Label>
        </div>
        <div>
          <Label>Tamanho da barra</Label>
          <Select value={config.tamanho_pesquisa || "grande"} onValueChange={v => u("tamanho_pesquisa", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pequena">Pequena</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="grande">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>CTA primário — texto</Label>
          <Input value={config.cta_primario_texto || ""} onChange={e => u("cta_primario_texto", e.target.value)} placeholder="Publicar pedido grátis" />
        </div>
        <div>
          <Label>CTA primário — link</Label>
          <Input value={config.cta_primario_link || ""} onChange={e => u("cta_primario_link", e.target.value)} placeholder="/pedido" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>CTA secundário — texto</Label>
          <Input value={config.cta_secundario_texto || ""} onChange={e => u("cta_secundario_texto", e.target.value)} placeholder="Sou profissional" />
        </div>
        <div>
          <Label>CTA secundário — link</Label>
          <Input value={config.cta_secundario_link || ""} onChange={e => u("cta_secundario_link", e.target.value)} placeholder="/claim-business" />
        </div>
      </div>

      <div>
        <Label>Tipo de media lateral</Label>
        <Select value={config.media_type || "none"} onValueChange={v => u("media_type", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem media</SelectItem>
            <SelectItem value="image">Imagem</SelectItem>
            <SelectItem value="video">Vídeo YouTube</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.media_type === "image" && (
        <div>
          <Label>URL da imagem</Label>
          <Input value={config.imagem_url || ""} onChange={e => u("imagem_url", e.target.value)} placeholder="https://..." />
          {config.imagem_url && <img src={config.imagem_url} alt="Preview" className="mt-1 w-full max-h-32 object-cover rounded-lg border border-border" />}
        </div>
      )}

      {config.media_type === "video" && (
        <div>
          <Label>URL do vídeo YouTube</Label>
          <Input value={config.video_url || ""} onChange={e => u("video_url", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        </div>
      )}
    </div>
  );
};

export default HeroBlockForm;
