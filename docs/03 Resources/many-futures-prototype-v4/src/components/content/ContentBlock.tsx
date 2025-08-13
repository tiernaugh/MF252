import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ContentBlock as ContentBlockType, Citation } from '../../types/episode';

interface ContentBlockProps {
  block: ContentBlockType;
}

export function ContentBlock({ block }: ContentBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Header blocks should not have hover effects
  const isHeaderBlock = block.type === 'sectionHeader';

  const FaviconDot = ({ url }: { url: string }) => {
    const [errored, setErrored] = useState(false);
    let favicon = '';
    try {
      const u = new URL(url);
      favicon = `${u.origin}/favicon.ico`;
    } catch {}
    return (
      <span className="w-4 h-4 rounded-full border border-white inline-block overflow-hidden bg-gray-400">
        {!errored && favicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={favicon}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : null}
      </span>
    );
  };

  const renderBlockContent = () => {
    // ... (keep the existing switch statement here)
    switch (block.type) {
        case 'coldOpen':
          return (
            <div className="p-6 rounded-lg">
              <div className="prose prose-lg max-w-none">
                {block.content.paragraphs.map((paragraph) => (
                  <div key={`${block.id}-co-${paragraph.slice(0, 32)}`} className="text-gray-800 mb-4 leading-relaxed font-medium">
                    <ReactMarkdown>{paragraph}</ReactMarkdown>
                  </div>
                ))}
              </div>
              {renderCitations((block as ContentBlockType & { citations?: Citation[] }).citations)}
            </div>
          );
  
        case 'executiveSummary':
          return (
            <div className="p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {block.content.title}
              </h3>
              <ul className="space-y-3">
                {block.content.points.map((point) => (
                  <li key={`${block.id}-es-${point.slice(0, 32)}`} className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full mt-2" />
                    <div className="text-gray-700">
                      <ReactMarkdown>{point}</ReactMarkdown>
                    </div>
                  </li>
                ))}
              </ul>
              {renderCitations((block as ContentBlockType & { citations?: Citation[] }).citations)}
            </div>
          );
  
        case 'sectionHeader':
          return (
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 border-b border-gray-200 pb-2">
              {block.content.title}
            </h2>
          );
  
        case 'text':
          return (
            <div className="prose max-w-none">
              {block.content.paragraphs.map((paragraph) => (
                <div key={`${block.id}-text-${paragraph.slice(0, 32)}`} className="text-gray-700 mb-4 leading-relaxed">
                  <ReactMarkdown>{paragraph}</ReactMarkdown>
                </div>
              ))}
            </div>
          );
  
        case 'signal':
          return (
            <div className="p-6 rounded-lg">
              <div className="prose max-w-none">
                {block.content.paragraphs.map((paragraph) => (
                  <div key={`${block.id}-sig-${paragraph.slice(0, 32)}`} className="text-gray-700 mb-4 leading-relaxed">
                    <ReactMarkdown>{paragraph}</ReactMarkdown>
                  </div>
                ))}
              </div>
              {renderCitations((block as ContentBlockType & { citations?: Citation[] }).citations)}
            </div>
          );
  
        case 'pattern':
          return (
            <div className="p-6 rounded-lg">
              <div className="prose max-w-none">
                {block.content.paragraphs.map((paragraph) => (
                  <div key={`${block.id}-pat-${paragraph.slice(0, 32)}`} className="text-gray-700 mb-4 leading-relaxed">
                    <ReactMarkdown>{paragraph}</ReactMarkdown>
                  </div>
                ))}
              </div>
              {block.content.keyTakeaway && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 text-gray-600 font-semibold text-sm">KEY:</span>
                    <span className="text-gray-700 font-medium text-sm">
                      <ReactMarkdown>{block.content.keyTakeaway}</ReactMarkdown>
                    </span>
                  </div>
                </div>
              )}
              {renderCitations((block as ContentBlockType & { citations?: Citation[] }).citations)}
            </div>
          );
  
        case 'possibility':
          return (
            <div className="p-6 rounded-lg">
              <div className="prose max-w-none">
                {block.content.paragraphs.map((paragraph) => (
                  <div key={`${block.id}-poss-${paragraph.slice(0, 32)}`} className="text-gray-700 mb-4 leading-relaxed">
                    <ReactMarkdown>{paragraph}</ReactMarkdown>
                  </div>
                ))}
              </div>
              {block.content.keyTakeaway && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 text-gray-600 font-semibold text-sm">KEY:</span>
                    <span className="text-gray-700 font-medium text-sm">
                      <ReactMarkdown>{block.content.keyTakeaway}</ReactMarkdown>
                    </span>
                  </div>
                </div>
              )}
              {renderCitations((block as ContentBlockType & { citations?: Citation[] }).citations)}
            </div>
          );
  
        case 'question':
          return (
            <div className="p-6 rounded-lg">
              {block.content.title && (
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {block.content.title}
                </h3>
              )}
              <ul className="space-y-4">
                {block.content.questions.map((question) => (
                  <li key={`${block.id}-q-${question.slice(0, 32)}`} className="text-gray-700 leading-relaxed">
                    <ReactMarkdown>{question}</ReactMarkdown>
                  </li>
                ))}
              </ul>
              {renderCitations((block as ContentBlockType & { citations?: Citation[] }).citations)}
            </div>
          );
  
        case 'tension':
          return (
            <div className="p-6 rounded-lg">
              <div className="prose max-w-none">
                {block.content.paragraphs.map((paragraph) => (
                  <div key={`${block.id}-ten-${paragraph.slice(0, 32)}`} className="text-gray-700 mb-4 leading-relaxed">
                    <ReactMarkdown>{paragraph}</ReactMarkdown>
                  </div>
                ))}
              </div>
              {block.content.keyTakeaway && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 text-gray-600 font-semibold text-sm">KEY:</span>
                    <span className="text-gray-700 font-medium text-sm">
                      <ReactMarkdown>{block.content.keyTakeaway}</ReactMarkdown>
                    </span>
                  </div>
                </div>
              )}
              {renderCitations((block as ContentBlockType & { citations?: Citation[] }).citations)}
            </div>
          );
  
        case 'timing':
          return (
            <div className="p-6 rounded-lg">
              <div className="prose max-w-none">
                {block.content.paragraphs.map((paragraph) => (
                  <div key={`${block.id}-time-${paragraph.slice(0, 32)}`} className="text-gray-700 mb-4 leading-relaxed">
                    <ReactMarkdown>{paragraph}</ReactMarkdown>
                  </div>
                ))}
              </div>
              {renderCitations((block as ContentBlockType & { citations?: Citation[] }).citations)}
            </div>
          );

        case 'quote':
          return (
            <figure className="my-6 border-l-2 border-gray-300 pl-4">
              <blockquote className="text-xl italic text-gray-900">{block.content.text}</blockquote>
              {(block.content.attribution || block.content.sourceUrl) && (
                <figcaption className="mt-2 text-sm text-gray-500">
                  {block.content.attribution}
                  {block.content.sourceUrl && (
                    <>
                      {block.content.attribution ? ' · ' : ''}
                      <a href={block.content.sourceUrl} className="underline hover:no-underline" target="_blank" rel="noreferrer">
                        Source
                      </a>
                    </>
                  )}
                </figcaption>
              )}
              {renderCitations((block as ContentBlockType & { citations?: Citation[] }).citations)}
            </figure>
          );

        case 'image':
          return (
            <figure className="my-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.content.url} alt={block.content.alt} className="w-full rounded-lg border border-gray-200" />
              {(block.content.caption || block.content.credit) && (
                <figcaption className="mt-2 text-sm text-gray-600">
                  {block.content.caption}
                  {block.content.credit ? (
                    <span className="text-gray-500">{block.content.caption ? ' · ' : ''}{block.content.credit}</span>
                  ) : null}
                </figcaption>
              )}
              {renderCitations((block as ContentBlockType & { citations?: Citation[] }).citations)}
            </figure>
          );
  
        default:
          return (
            <div className="p-4 bg-gray-100 rounded border">
              <p className="text-gray-600">Unknown block type</p>
            </div>
          );
      }
  };

  const renderCitations = (citations?: Citation[]) => {
    if (!citations || citations.length === 0) return null;
    return (
      <div className="mt-4">
        <details className="group">
          <summary className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs cursor-pointer select-none border border-gray-200 transition-colors">
            <span className="inline-flex -space-x-1">
              {citations.slice(0, 3).map((c, i) => (
                <FaviconDot key={`${c.url}-${i}`} url={c.url} />
              ))}
              {citations.length > 3 ? (
                <span className="ml-1 text-[10px] text-gray-500">+{citations.length - 3}</span>
              ) : null}
            </span>
            Sources
          </summary>
          <div className="mt-3 border border-gray-200 rounded-lg bg-white p-4">
            <ul className="space-y-2 text-[0.95rem] leading-6 text-gray-800">
              {citations.map((c, i) => (
                <li key={`${c.url}-${i}`} className="">
                  <span className="text-gray-500 mr-2">[{c.index ?? i + 1}]</span>
                  {c.sourceTitle ? <span className="font-medium">{c.sourceTitle}</span> : null}
                  {c.sourceTitle ? ' — ' : ''}
                  <a className="underline hover:no-underline break-words" href={c.url} target="_blank" rel="noreferrer">{c.url}</a>
                  {c.excerpt ? <span className="text-gray-600"> — “{c.excerpt}”</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    );
  };

  return (
    <div
      className={`relative transition-all duration-200 ${
        !isHeaderBlock ? 'rounded-lg' : ''
      } ${
        !isHeaderBlock && isHovered ? 'bg-gray-50' : ''
      }`}
      onMouseEnter={!isHeaderBlock ? () => setIsHovered(true) : undefined}
      onMouseLeave={!isHeaderBlock ? () => setIsHovered(false) : undefined}
    >
      {renderBlockContent()}
    </div>
  );
}