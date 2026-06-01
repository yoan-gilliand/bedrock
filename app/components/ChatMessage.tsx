'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

const CodeBlock = ({ inline, className, children, ...props }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const code = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && language) {
    return (
      <div className="relative group my-3 -mx-1">
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={handleCopy}
            className="px-2 py-1 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white text-xs rounded flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            {copied ? (
              <>
                <Check size={12} className="text-green-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <div className="relative overflow-hidden rounded border border-[#3e3e3e]">
          <div className="flex items-center justify-between px-3 py-2 bg-[#1e1e1e] border-b border-[#3e3e3e]">
            <span className="text-[#858585] text-xs font-mono">{language}</span>
          </div>
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              fontSize: '12px',
              padding: '12px',
              background: '#1e1e1e',
            }}
            showLineNumbers={code.split('\n').length > 3}
            {...props}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  }

  return (
    <code className="bg-[#fafafa] px-1.5 py-0.5 rounded text-[#e01e5a] text-xs font-mono border border-[#e5e5e5]" {...props}>
      {children}
    </code>
  );
};

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[90%] rounded-lg px-3 py-2.5 text-sm bg-[#1068bf] text-white shadow-sm">
          <div className="whitespace-pre-wrap break-words leading-relaxed">{content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[95%] rounded-lg px-3 py-2.5 text-sm bg-white text-[#303030] border border-[#e5e5e5] shadow-sm">
        <ReactMarkdown
          className="markdown-content"
          components={{
            code: CodeBlock as any,
            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-2 first:mt-0">{children}</h3>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-[#dbdbdb] pl-3 py-1 my-2 text-[#525252] italic">
                {children}
              </blockquote>
            ),
            a: ({ children, href }) => (
              <a href={href} className="text-[#1068bf] hover:underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
