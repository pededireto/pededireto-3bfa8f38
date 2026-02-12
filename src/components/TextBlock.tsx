import DOMPurify from "dompurify";

interface TextBlockProps {
  config: Record<string, any> | null;
  title?: string | null;
}

const TextBlock = ({ config, title }: TextBlockProps) => {
  const content = config?.conteudo || config?.content || "";
  if (!content && !title) return null;

  return (
    <section className="py-8">
      <div className="container">
        <div className="bg-card rounded-2xl p-8 shadow-card">
          {title && <h2 className="text-2xl font-bold mb-4 text-foreground">{title}</h2>}
          {content && (
            <div
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default TextBlock;
