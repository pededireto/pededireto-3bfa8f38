import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  config: Record<string, any>;
  onChange: (c: Record<string, any>) => void;
}

const TextoBlockForm = ({ config, onChange }: Props) => {
  const u = (key: string, val: any) => onChange({ ...config, [key]: val });

  return (
    <div className="space-y-4">
      <div>
        <Label>Título (opcional)</Label>
        <Input value={config.titulo || ""} onChange={e => u("titulo", e.target.value)} placeholder="Título do bloco de texto" />
      </div>
      <div>
        <Label>Conteúdo</Label>
        <Textarea value={config.conteudo || ""} onChange={e => u("conteudo", e.target.value)} placeholder="Escreve o conteúdo aqui. Usa **negrito** para destaque." rows={6} />
        <p className="text-xs text-muted-foreground mt-1">Suporta **negrito** e quebras de linha.</p>
      </div>
      <div>
        <Label>Alinhamento</Label>
        <Select value={config.alinhamento || "esquerda"} onValueChange={v => u("alinhamento", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="esquerda">Esquerda</SelectItem>
            <SelectItem value="centro">Centro</SelectItem>
            <SelectItem value="direita">Direita</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TextoBlockForm;
