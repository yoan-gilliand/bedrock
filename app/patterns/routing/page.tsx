'use client';

import Link from 'next/link';
import { ArrowLeft, Code2 } from 'lucide-react';

export default function RoutingPattern() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#dbdbdb] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#1068bf] hover:underline flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </Link>
          <span className="text-[#707070]">/</span>
          <span className="text-[#303030] font-semibold">Routing Pattern</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-[#dbdbdb] rounded p-8">
          <div className="flex items-center gap-3 mb-6">
            <Code2 size={32} className="text-[#1068bf]" />
            <h1 className="text-3xl font-bold text-[#303030]">Routing Pattern (Direct Exchange)</h1>
          </div>

          <div className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">Overview</h2>
              <p className="text-[#303030] mb-4">
                Routing pattern uses <strong>direct exchange</strong> to route messages to queues based on exact routing key match. Selective pub/sub.
              </p>
              <div className="bg-[#f5f9fc] border-l-4 border-[#1068bf] p-4 my-4">
                <p className="text-sm text-[#303030] font-semibold">Use Case:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1 text-[#303030]">
                  <li>Log levels (error, warning, info) → different handlers</li>
                  <li>Task types (email, sms, push) → specialized workers</li>
                  <li>Priority queues (high, medium, low)</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Architecture</h2>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`[Producer] --routing_key="error"--> [Direct Exchange]
                                            |
                                            |--(binding key="error")-> [Error Queue] -> [Error Handler]
                                            |
                                            |--(binding key="warning")-> [Warning Queue] -> [Warning Handler]
                                            |
                                            +--(binding key="info")-> [Info Queue] -> [Info Handler]

Message with key "error" ONLY goes to Error Queue`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Publisher</h2>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika

connection = pika.BlockingConnection(...)
channel = connection.channel()

# Declare direct exchange
channel.exchange_declare(exchange='logs_direct', exchange_type='direct')

# Publish with routing key
severity = 'error'  # or 'warning', 'info'
message = 'Database connection failed'

channel.basic_publish(
    exchange='logs_direct',
    routing_key=severity,  # Messages routed by this key
    body=f"{severity}: {message}".encode()
)

print(f"[✓] Sent [{severity}]: {message}")`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Subscriber</h2>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika
import sys

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='logs_direct', exchange_type='direct')

result = channel.queue_declare(queue='', exclusive=True)
queue_name = result.method.queue

# Subscribe to specific severities
severities = sys.argv[1:] if len(sys.argv) > 1 else ['info']

for severity in severities:
    channel.queue_bind(
        exchange='logs_direct',
        queue=queue_name,
        routing_key=severity  # Only receive messages with this key
    )

print(f"[*] Subscribed to: {severities}")

def callback(ch, method, properties, body):
    print(f"[x] {method.routing_key}: {body.decode()}")

channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
channel.start_consuming()

# Usage:
# python subscriber.py error          # Only errors
# python subscriber.py error warning  # Errors + warnings
# python subscriber.py info           # Only info`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Multiple Bindings</h2>
              <p className="text-[#303030] mb-4">One queue can bind to multiple routing keys.</p>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# All logs queue (receives everything)
channel.queue_bind(exchange='logs_direct', queue='all_logs', routing_key='info')
channel.queue_bind(exchange='logs_direct', queue='all_logs', routing_key='warning')
channel.queue_bind(exchange='logs_direct', queue='all_logs', routing_key='error')

# Critical logs queue (only errors)
channel.queue_bind(exchange='logs_direct', queue='critical_logs', routing_key='error')`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Key Points</h2>
              <table className="w-full border-collapse border border-[#dbdbdb] my-4">
                <thead className="bg-[#fafafa]">
                  <tr>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Concept</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Exchange Type</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">direct</code></td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Routing</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Exact key match</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Use Case</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Selective broadcast</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Multiple Bindings</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Supported (queue can receive multiple keys)</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Related Patterns</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/patterns/pubsub" className="p-4 border border-[#dbdbdb] rounded hover:border-[#1068bf] hover:shadow-sm transition-all">
                  <h3 className="font-semibold text-[#303030] mb-2">Pub/Sub Pattern</h3>
                  <p className="text-sm text-[#707070]">Broadcast to all (no filtering)</p>
                </Link>

                <Link href="/patterns/topics" className="p-4 border border-[#dbdbdb] rounded hover:border-[#1068bf] hover:shadow-sm transition-all">
                  <h3 className="font-semibold text-[#303030] mb-2">Topics Pattern</h3>
                  <p className="text-sm text-[#707070]">Pattern matching with wildcards</p>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
