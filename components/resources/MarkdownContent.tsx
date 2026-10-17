import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="resource-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          // Remote images aren't loaded automatically from an untrusted document.
          img: ({ alt }) => (
            <span className="text-muted">
              [Imagem: {alt || "sem descrição"}]
            </span>
          ),
          a: ({ href, children }) =>
            href && /^https?:\/\//i.test(href) ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
