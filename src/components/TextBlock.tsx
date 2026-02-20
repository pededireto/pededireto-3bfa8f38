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
          {title && (
            <h2 className="text-2xl font-bold mb-4 text-foreground">{title}</h2>
          )}
          {content && (
            <div
              className="max-w-none [&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:mb-6 [&_h1]:text-foreground [&_h1]:leading-tight [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mb-5 [&_h2]:text-foreground [&_h2]:leading-snug [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-3 [&_h3]:text-foreground [&_p]:text-muted-foreground [&_p]:mb-4 [&_p]:leading-relaxed [&_strong]:text-foreground [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:text-muted-foreground [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-2 [&_a]:text-primary [&_a]:underline [&_a:hover]:opacity-80 [&_hr]:border-border [&_hr]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(content, {
                  ALLOWED_TAGS: [
                    "h1","h2","h3","h4","h5","h6",
                    "p","br","strong","em","b","i","u","s",
                    "ul","ol","li",
                    "a","hr","blockquote",
                    "div","span","section",
                    "table","thead","tbody","tr","th","td",
                    "img"
                  ],
                  ALLOWED_ATTR: ["href","target","rel","src","alt","class","id","style"],
                }),
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default TextBlock;

