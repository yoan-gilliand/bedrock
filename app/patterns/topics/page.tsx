'use client';

import Link from 'next/link';
import { ArrowLeft, Code2 } from 'lucide-react';

export default function TopicsPattern() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#dbdbdb] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#1068bf] hover:underline flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </Link>
          <span className="text-[#707070]">/</span>
          <span className="text-[#303030] font-semibold">Topics Pattern</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-[#dbdbdb] rounded p-8">
          <div className="flex items-center gap-3 mb-6">
            <Code2 size={32} className="text-[#1068bf]" />
            <h1 className="text-3xl font-bold text-[#303030]">Topics Pattern (Topic Exchange)</h1>
          </div>

          <div className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">Overview</h2>
              <p className="text-[#303030] mb-4">
                Topics pattern uses <strong>topic exchange</strong> with pattern matching. Routing keys are dot-separated words. Bindings use wildcards: <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">*</code> (one word), <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">#</code> (zero or more words).
              </p>
              <div className="bg-[#f5f9fc] border-l-4 border-[#1068bf] p-4 my-4">
                <p className="text-sm text-[#303030] font-semibold">Use Case:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1 text-[#303030]">
                  <li>Multi-dimensional filtering (region.severity.service)</li>
                  <li>Hierarchical topics (news.sport.football, news.politics)</li>
                  <li>Complex routing rules</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Wildcard Syntax</h2>
              <table className="w-full border-collapse border border-[#dbdbdb] my-4">
                <thead className="bg-[#fafafa]">
                  <tr>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Symbol</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Matches</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Example</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">*</code></td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Exactly ONE word</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">*.error.*</code> matches <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">us.error.db</code></td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">#</code></td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Zero or MORE words</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">us.#</code> matches <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">us.error.db</code>, <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">us</code></td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Example: Log Routing</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">Publisher</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='logs_topic', exchange_type='topic')

# Format: region.severity.service
routing_keys = [
    'us.error.database',
    'eu.warning.api',
    'us.info.frontend',
    'eu.error.payment'
]

for key in routing_keys:
    message = f"Log from {key}"
    channel.basic_publish(
        exchange='logs_topic',
        routing_key=key,
        body=message.encode()
    )
    print(f"[✓] Sent [{key}]: {message}")`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">Subscriber Examples</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Consumer 1: All US logs
channel.queue_bind(exchange='logs_topic', queue=q1, routing_key='us.#')
# Receives: us.error.database, us.info.frontend

# Consumer 2: All errors (any region)
channel.queue_bind(exchange='logs_topic', queue=q2, routing_key='*.error.*')
# Receives: us.error.database, eu.error.payment

# Consumer 3: EU warnings
channel.queue_bind(exchange='logs_topic', queue=q3, routing_key='eu.warning.*')
# Receives: eu.warning.api

# Consumer 4: Everything
channel.queue_bind(exchange='logs_topic', queue=q4, routing_key='#')
# Receives: ALL messages`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Complete Example</h2>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika
import sys

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='logs_topic', exchange_type='topic')

result = channel.queue_declare(queue='', exclusive=True)
queue_name = result.method.queue

# Bind to patterns from command line
binding_keys = sys.argv[1:] if len(sys.argv) > 1 else ['#']

for binding_key in binding_keys:
    channel.queue_bind(
        exchange='logs_topic',
        queue=queue_name,
        routing_key=binding_key
    )

print(f"[*] Listening for patterns: {binding_keys}")

def callback(ch, method, properties, body):
    print(f"[x] {method.routing_key}: {body.decode()}")

channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
channel.start_consuming()

# Usage:
# python subscriber.py "us.#"              # All US logs
# python subscriber.py "*.error.*"         # All errors
# python subscriber.py "us.error.*" "eu.error.*"  # US + EU errors`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Pattern Matching Examples</h2>
              <table className="w-full border-collapse border border-[#dbdbdb] my-4">
                <thead className="bg-[#fafafa]">
                  <tr>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Routing Key</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Binding Pattern</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Match?</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">us.error.database</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">us.#</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">✅ Yes</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">us.error.database</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">*.error.*</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">✅ Yes</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">us.error.database</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">eu.#</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">❌ No</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">us</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">us.#</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">✅ Yes</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">us</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">us.*</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">❌ No (needs 2 words)</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">anything.goes.here</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">#</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">✅ Yes</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Common Pitfalls</h2>
              <div className="space-y-4">
                <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4">
                  <p className="font-semibold text-[#303030] mb-2">❌ Using <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">*</code> when you need <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">#</code></p>
                  <p className="text-sm text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">us.*</code> matches <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">us.error</code> but NOT <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">us.error.database</code>. Use <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">us.#</code> instead.</p>
                </div>

                <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4">
                  <p className="font-semibold text-[#303030] mb-2">❌ Forgetting dots in routing keys</p>
                  <p className="text-sm text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">us_error_database</code> is ONE word. Must be <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">us.error.database</code></p>
                </div>

                <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4">
                  <p className="font-semibold text-[#303030] mb-2">❌ Using topic exchange for simple routing</p>
                  <p className="text-sm text-[#303030]">If no wildcards needed, use direct exchange (simpler, faster)</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Related Patterns</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/patterns/routing" className="p-4 border border-[#dbdbdb] rounded hover:border-[#1068bf] hover:shadow-sm transition-all">
                  <h3 className="font-semibold text-[#303030] mb-2">Routing Pattern</h3>
                  <p className="text-sm text-[#707070]">Exact key matching (no wildcards)</p>
                </Link>

                <Link href="/patterns/pubsub" className="p-4 border border-[#dbdbdb] rounded hover:border-[#1068bf] hover:shadow-sm transition-all">
                  <h3 className="font-semibold text-[#303030] mb-2">Pub/Sub Pattern</h3>
                  <p className="text-sm text-[#707070]">Broadcast to all (no filtering)</p>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
