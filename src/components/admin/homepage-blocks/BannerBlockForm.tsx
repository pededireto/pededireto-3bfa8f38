import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  config: Record<string, any>;
  onChange: (c: Record<string, any>) => void;
}

const BannerBlockForm = ({ config, onChange }: Props) => {
  const u = (key: string, val: any) => onChange({ ...config, [key]: val });

  return (
    <div className="space-y-4">
      <div>
        <Label>Título</Label>
        <Input value={config.titulo || ""} onChange={e => u("titulo", e.target.value)} placeholder="Título do banner" />
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={config.descricao || ""} onChange={e => u("descricao", e.target.value)} placeholder="Texto descritivo do banner" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>URL do link</Label>
          <Input value={config.link || ""} onChange={e => u("link", e.target.value)} placeholder="/pagina-destino" />
        </div>
        <div>
          <Label>CTA texto (opcional)</Label>
          <Input value={config.cta_text || ""} onChange={e => u("cta_text", e.target.value)} placeholder="Saber mais →" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cor de fundo</Label>
          <Select value={config.bg_color || "verde"} onValueChange={v => u("bg_color", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="verde">Verde</SelectItem>
              <SelectItem value="azul">Azul</SelectItem>
              <SelectItem value="laranja">Laranja</SelectItem>
              <SelectItem value="cinza">Cinza</SelectItem>
              <SelectItem value="branco">Branco</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Posição da imagem</Label>
          <Select value={config.image_position || "direita"} onValueChange={v => u("image_position", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="direita">Direita</SelectItem>
              <SelectItem value="esquerda">Esquerda</SelectItem>
              <SelectItem value="fundo">Fundo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>URL da imagem</Label>
        <Input value={config.imagem_url || ""} onChange={e => u("imagem_url", e.target.value)} placeholder="https://..." />
        {config.imagem_url && <img src={config.imagem_url} alt="Preview" className="mt-1 w-full max-h-32 object-cover rounded-lg border border-border" />}
      </div>
      <div>
        <Label>URL do vídeo</Label>
        <Input value={config.video_url || ""} onChange={e => u("video_url", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
      </div>
    </div>
  );
};

export default BannerBlockForm;
