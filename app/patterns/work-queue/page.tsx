'use client';

import Link from 'next/link';
import { ArrowLeft, Code2 } from 'lucide-react';

export default function WorkQueuePattern() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="border-b border-[#dbdbdb] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#1068bf] hover:underline flex items-center gap-2">
            <ArrowLeft size={18} />
            Back to Home
          </Link>
          <span className="text-[#707070]">/</span>
          <span className="text-[#303030] font-semibold">Work Queue Pattern</span>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-[#dbdbdb] rounded p-8">
          <div className="flex items-center gap-3 mb-6">
            <Code2 size={32} className="text-[#1068bf]" />
            <h1 className="text-3xl font-bold text-[#303030]">Work Queue Pattern</h1>
          </div>

          <div className="prose prose-sm max-w-none">
            {/* Overview */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">Overview</h2>
              <p className="text-[#303030] mb-4">
                Work Queue (aka Task Queue) distributes time-consuming tasks among multiple workers. Main idea: avoid doing resource-intensive task immediately and having to wait for it to complete. Instead, schedule task to be done later.
              </p>
              <div className="bg-[#f5f9fc] border-l-4 border-[#1068bf] p-4 my-4">
                <p className="text-sm text-[#303030] font-semibold">Use Case:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1 text-[#303030]">
                  <li>Web server processing image uploads (resize, compress)</li>
                  <li>Background data processing</li>
                  <li>Email/notification sending</li>
                </ul>
              </div>
            </section>

            {/* Architecture */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Architecture</h2>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`[Producer] --messages--> [Queue] --> [Worker 1]
                                   |
                                   |--> [Worker 2]
                                   |
                                   |--> [Worker N]`}
              </pre>
              <ul className="list-disc ml-6 space-y-2 text-[#303030]">
                <li><strong>Round-robin dispatch:</strong> Each message sent to next consumer in sequence</li>
                <li><strong>Fair dispatch:</strong> Use <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm text-[#e01e5a]">prefetch_count=1</code> to prevent overloading one worker</li>
                <li><strong>Acknowledgments:</strong> Worker must ack message after processing (prevents loss if worker dies)</li>
              </ul>
            </section>

            {/* Producer Code */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Producer Implementation</h2>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika

# Connection setup
conn_param = pika.ConnectionParameters(
    host='concurp1.isc.heia-fr.ch',
    port=5072,
    credentials=pika.PlainCredentials('guest', 'guest')
)

connection = pika.BlockingConnection(conn_param)
channel = connection.channel()

# Declare durable queue (survives broker restart)
channel.queue_declare(queue='task_queue', durable=True)

# Publish persistent message
message = "Task data: process this image"
channel.basic_publish(
    exchange='',
    routing_key='task_queue',
    body=message.encode(),
    properties=pika.BasicProperties(
        delivery_mode=2,  # make message persistent
    )
)

print(f"[x] Sent '{message}'")
connection.close()`}
              </pre>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 my-4">
                <p className="text-sm text-[#303030]">
                  <strong>Important:</strong> Set <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">durable=True</code> AND <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">delivery_mode=2</code> to ensure queue and messages survive broker restart.
                </p>
              </div>
            </section>

            {/* Worker Code */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Worker/Consumer Implementation</h2>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika
import time

conn_param = pika.ConnectionParameters(
    host='concurp1.isc.heia-fr.ch',
    port=5072,
    credentials=pika.PlainCredentials('guest', 'guest')
)

connection = pika.BlockingConnection(conn_param)
channel = connection.channel()

# Same queue declaration (idempotent)
channel.queue_declare(queue='task_queue', durable=True)

def callback(ch, method, properties, body):
    message = body.decode()
    print(f"[x] Received '{message}'")

    # Simulate work
    time.sleep(message.count('.'))

    print(f"[x] Done processing '{message}'")

    # Manual acknowledgment (CRITICAL)
    ch.basic_ack(delivery_tag=method.delivery_tag)

# Fair dispatch: don't give more than 1 message to worker at a time
channel.basic_qos(prefetch_count=1)

channel.basic_consume(
    queue='task_queue',
    on_message_callback=callback,
    auto_ack=False  # manual ack required
)

print('[*] Waiting for messages. To exit press CTRL+C')
channel.start_consuming()`}
              </pre>
            </section>

            {/* Key Configuration */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Critical Settings</h2>
              <table className="w-full border-collapse border border-[#dbdbdb] my-4">
                <thead className="bg-[#fafafa]">
                  <tr>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Setting</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Purpose</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Default</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">durable=True</code></td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Queue survives broker restart</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">False</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">delivery_mode=2</code></td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Message persists to disk</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">1 (transient)</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">auto_ack=False</code></td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Manual acknowledgment (prevents loss)</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">False</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">prefetch_count=1</code></td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Fair dispatch (one task at a time)</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">0 (unlimited)</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Common Pitfalls */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Common Pitfalls</h2>
              <div className="space-y-4">
                <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4">
                  <p className="font-semibold text-[#303030] mb-2">❌ Forgetting manual ack</p>
                  <p className="text-sm text-[#303030]">If worker crashes before ack, message is lost forever with <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">auto_ack=True</code></p>
                </div>

                <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4">
                  <p className="font-semibold text-[#303030] mb-2">❌ Not setting prefetch_count</p>
                  <p className="text-sm text-[#303030]">One fast worker gets all messages, slow workers stay idle. Use <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">prefetch_count=1</code></p>
                </div>

                <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4">
                  <p className="font-semibold text-[#303030] mb-2">❌ Durable queue but transient messages</p>
                  <p className="text-sm text-[#303030]">Queue survives restart, but messages don't. Need both <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">durable=True</code> AND <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">delivery_mode=2</code></p>
                </div>
              </div>
            </section>

            {/* Testing Tips */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Testing Strategy</h2>
              <ol className="list-decimal ml-6 space-y-2 text-[#303030]">
                <li>Start 3 worker processes</li>
                <li>Send 10 messages from producer</li>
                <li>Observe round-robin distribution (workers get ~3-4 messages each)</li>
                <li>Kill one worker mid-processing (Ctrl+C)</li>
                <li>Verify unacked message is redelivered to another worker</li>
                <li>Restart broker, verify queue and messages still exist</li>
              </ol>
            </section>

            {/* Related Patterns */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Related Patterns</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/patterns/pubsub" className="p-4 border border-[#dbdbdb] rounded hover:border-[#1068bf] hover:shadow-sm transition-all">
                  <h3 className="font-semibold text-[#303030] mb-2">Pub/Sub Pattern</h3>
                  <p className="text-sm text-[#707070]">Broadcast to all consumers (fanout exchange)</p>
                </Link>

                <Link href="/patterns/routing" className="p-4 border border-[#dbdbdb] rounded hover:border-[#1068bf] hover:shadow-sm transition-all">
                  <h3 className="font-semibold text-[#303030] mb-2">Routing Pattern</h3>
                  <p className="text-sm text-[#707070]">Selective routing with direct exchange</p>
                </Link>
              </div>
            </section>

            {/* Problems */}
            <section>
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Common Problems</h2>
              <div className="space-y-3">
                <Link href="/problems/lost-messages" className="block p-3 border border-[#dbdbdb] rounded hover:bg-[#f5f9fc] transition-colors">
                  <p className="font-medium text-[#303030]">Messages Lost → Check acknowledgments</p>
                </Link>
                <Link href="/problems/ordering" className="block p-3 border border-[#dbdbdb] rounded hover:bg-[#f5f9fc] transition-colors">
                  <p className="font-medium text-[#303030]">Out-of-Order Processing → Single consumer pattern</p>
                </Link>
                <Link href="/problems/performance" className="block p-3 border border-[#dbdbdb] rounded hover:bg-[#f5f9fc] transition-colors">
                  <p className="font-medium text-[#303030]">Slow Performance → Tune prefetch_count</p>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
