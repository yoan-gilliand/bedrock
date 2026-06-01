'use client';

import Link from 'next/link';
import { ArrowLeft, Code2 } from 'lucide-react';

export default function PubSubPattern() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#dbdbdb] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#1068bf] hover:underline flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </Link>
          <span className="text-[#707070]">/</span>
          <span className="text-[#303030] font-semibold">Pub/Sub Pattern</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-[#dbdbdb] rounded p-8">
          <div className="flex items-center gap-3 mb-6">
            <Code2 size={32} className="text-[#1068bf]" />
            <h1 className="text-3xl font-bold text-[#303030]">Pub/Sub Pattern (Fanout)</h1>
          </div>

          <div className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">Overview</h2>
              <p className="text-[#303030] mb-4">
                Publish/Subscribe delivers same message to multiple consumers. Uses <strong>fanout exchange</strong> to broadcast messages to all bound queues.
              </p>
              <div className="bg-[#f5f9fc] border-l-4 border-[#1068bf] p-4 my-4">
                <p className="text-sm text-[#303030] font-semibold">Use Case:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1 text-[#303030]">
                  <li>Log aggregation (send logs to console, file, Elasticsearch)</li>
                  <li>Notifications (email, SMS, push notification all triggered by one event)</li>
                  <li>Real-time dashboard updates (multiple clients subscribe to same data feed)</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Architecture</h2>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`[Producer] --> [Fanout Exchange] --> [Queue A] --> [Consumer A]
                       |
                       |------------> [Queue B] --> [Consumer B]
                       |
                       +------------> [Queue C] --> [Consumer C]

ALL queues bound to exchange receive EVERY message (broadcast)`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Publisher Implementation</h2>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika

connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host='concurp1.isc.heia-fr.ch',
        port=5072,
        credentials=pika.PlainCredentials('guest', 'guest')
    )
)
channel = connection.channel()

# Declare fanout exchange
channel.exchange_declare(exchange='logs', exchange_type='fanout')

# Publish message (no routing_key needed for fanout)
message = "System error: Database connection failed"
channel.basic_publish(
    exchange='logs',
    routing_key='',  # Ignored by fanout exchange
    body=message.encode()
)

print(f"[x] Broadcast: '{message}'")
connection.close()`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Subscriber Implementation</h2>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika

connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host='concurp1.isc.heia-fr.ch',
        port=5072,
        credentials=pika.PlainCredentials('guest', 'guest')
    )
)
channel = connection.channel()

# Declare same exchange (idempotent)
channel.exchange_declare(exchange='logs', exchange_type='fanout')

# Create exclusive temporary queue (auto-deleted when consumer disconnects)
result = channel.queue_declare(queue='', exclusive=True)
queue_name = result.method.queue

# Bind queue to exchange
channel.queue_bind(exchange='logs', queue=queue_name)

def callback(ch, method, properties, body):
    print(f"[x] Received: {body.decode()}")

channel.basic_consume(
    queue=queue_name,
    on_message_callback=callback,
    auto_ack=True
)

print('[*] Waiting for logs. To exit press CTRL+C')
channel.start_consuming()`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Lab20: Printer System</h2>
              <p className="text-[#303030] mb-4">
                Lab20 builds print job fanout system where jobs sent to multiple printer queues.
              </p>

              <h3 className="text-lg font-semibold text-[#303030] mb-3">Print Job Publisher</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`channel.exchange_declare(exchange='print_jobs', exchange_type='fanout')

job = {
    "document": "report.pdf",
    "pages": 10,
    "color": True
}

channel.basic_publish(
    exchange='print_jobs',
    routing_key='',
    body=json.dumps(job).encode()
)

print(f"[x] Sent print job: {job['document']}")`}
              </pre>

              <h3 className="text-lg font-semibold text-[#303030] mb-3 mt-6">Printer Consumer</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import json

channel.exchange_declare(exchange='print_jobs', exchange_type='fanout')

result = channel.queue_declare(queue='', exclusive=True)
queue_name = result.method.queue

channel.queue_bind(exchange='print_jobs', queue=queue_name)

def print_job(ch, method, properties, body):
    job = json.loads(body.decode())
    print(f"[Printer] Processing: {job['document']}")
    # Simulate printing
    time.sleep(job['pages'] * 0.5)
    print(f"[Printer] Done: {job['document']}")

channel.basic_consume(
    queue=queue_name,
    on_message_callback=print_job,
    auto_ack=True
)`}
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
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">fanout</code></td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Routing Key</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Ignored (broadcast to all)</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Queue Type</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Usually exclusive (auto-deleted)</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Message Delivery</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Copy to EVERY bound queue</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Common Pitfalls</h2>
              <div className="space-y-4">
                <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4">
                  <p className="font-semibold text-[#303030] mb-2">❌ Using direct exchange instead of fanout</p>
                  <p className="text-sm text-[#303030]">Direct exchange requires exact routing_key match. Fanout broadcasts to all.</p>
                </div>

                <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4">
                  <p className="font-semibold text-[#303030] mb-2">❌ Forgetting queue_bind</p>
                  <p className="text-sm text-[#303030]">Queue must be bound to exchange. Declaring queue alone not enough.</p>
                </div>

                <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4">
                  <p className="font-semibold text-[#303030] mb-2">❌ Messages lost when no consumers</p>
                  <p className="text-sm text-[#303030]">If no queues bound to exchange, messages dropped. This is by design (ephemeral broadcast).</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Related Patterns</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/patterns/routing" className="p-4 border border-[#dbdbdb] rounded hover:border-[#1068bf] hover:shadow-sm transition-all">
                  <h3 className="font-semibold text-[#303030] mb-2">Routing Pattern</h3>
                  <p className="text-sm text-[#707070]">Selective broadcast with direct exchange</p>
                </Link>

                <Link href="/patterns/topics" className="p-4 border border-[#dbdbdb] rounded hover:border-[#1068bf] hover:shadow-sm transition-all">
                  <h3 className="font-semibold text-[#303030] mb-2">Topics Pattern</h3>
                  <p className="text-sm text-[#707070]">Pattern-based routing</p>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
