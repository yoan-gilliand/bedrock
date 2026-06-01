'use client';

import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

const readmeContent = `# concurp2-lab21

The translator script that is usable in a classical Unix pipe. This project implements a RabbitMQ RPC-based word-by-word translator using Python.

## Features

- **Unix Pipe Compatibility:** Can be used within pipes (e.g., \`cat input.txt | python3 src/translator.py | less\`).
- **Punctuation Preservation:** Isolates punctuation, while spaces and digits to ensure the sentence structure is maintained.
- **Word-by-word Translation:** Sends each word individually to a RabbitMQ server for translation via RPC.

## Requirements

- Python 3.8+
- RabbitMQ server running locally or accessible via network
- \`pika\` library for RabbitMQ communication

## Installation

1. Clone this repository:
   \`\`\`bash
   git clone https://github.com/yourusername/concurp2-lab21.git
   cd concurp2-lab21
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. Configure RabbitMQ connection in \`config.yaml\` if needed.

## Usage

### Basic Translation

\`\`\`bash
cat input.txt | python3 src/translator.py | less
\`\`\`

### Direct Input

\`\`\`bash
echo "Hello world" | python3 src/translator.py
\`\`\`

## Project Structure

\`\`\`
concurp2-lab21/
├── src/
│   ├── translator.py    # Main translation script
│   └── rpc_client.py    # RabbitMQ RPC client
├── config.yaml          # Configuration file
├── requirements.txt     # Python dependencies
└── README.md           # This file
\`\`\`

## Configuration

Edit \`config.yaml\` to configure RabbitMQ connection:

\`\`\`yaml
rabbitmq:
  host: localhost
  port: 5672
  queue: translation_queue
\`\`\`

## License

MIT License

## Contributors

- Yoan Gilliand

---

<sub>Created on March 30, 2026 for Concurrent Programming course (2025-2026)</sub>
`;

export default function HomePage() {
  const router = useRouter();

  const handleLogoClick = (e: React.MouseEvent) => {
    // Secret click: shift + alt + click on the repo icon
    if (e.shiftKey && e.altKey) {
      router.push('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* GitLab-style header */}
      <header className="border-b border-[#dbdbdb] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogoClick}
              className="text-2xl hover:opacity-80 transition-opacity"
              title="Repository"
            >
              📁
            </button>
            <div>
              <h1 className="text-xl font-semibold text-[#303030]">concurp2-lab21</h1>
              <p className="text-sm text-[#707070]">Python RabbitMQ Translator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm border border-[#dbdbdb] rounded hover:bg-[#f0f0f0]">
              ⭐ Star
            </button>
            <button className="px-3 py-1.5 text-sm border border-[#dbdbdb] rounded hover:bg-[#f0f0f0]">
              🔀 Fork
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <article className="prose prose-slate max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-3xl font-bold mb-4 text-[#303030]">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-semibold mt-8 mb-4 text-[#303030]">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-semibold mt-6 mb-3 text-[#303030]">{children}</h3>,
              p: ({ children }) => <p className="mb-4 text-[#303030] leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-[#303030]">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-[#303030]">{children}</ol>,
              code: ({ inline, children, ...props }: any) => {
                if (inline) {
                  return <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm text-[#e01e5a] border border-[#e5e5e5]" {...props}>{children}</code>;
                }
                return (
                  <pre className="bg-[#f5f5f5] p-4 rounded border border-[#e5e5e5] overflow-x-auto mb-4">
                    <code className="text-sm text-[#303030]" {...props}>{children}</code>
                  </pre>
                );
              },
              a: ({ children, href }) => <a href={href} className="text-[#1068bf] hover:underline">{children}</a>,
              strong: ({ children }) => <strong className="font-semibold text-[#303030]">{children}</strong>,
            }}
          >
            {readmeContent}
          </ReactMarkdown>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#dbdbdb] mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-[#707070]">
          <p>© 2026 HES-SO Fribourg • Concurrent Programming Course</p>
        </div>
      </footer>
    </div>
  );
}
