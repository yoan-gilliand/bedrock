'use client';

import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function LostMessagesPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#dbdbdb] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#1068bf] hover:underline flex items-center gap-2">
            <ArrowLeft size={18} />
            Back to Home
          </Link>
          <span className="text-[#707070]">/</span>
          <span className="text-[#303030] font-semibold">Lost Messages Problem</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-[#dbdbdb] rounded p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle size={32} className="text-[#e24329]" />
            <h1 className="text-3xl font-bold text-[#303030]">Problem: Messages Lost</h1>
          </div>

          <div className="prose prose-sm max-w-none">
            {/* Problem Statement */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">Symptom</h2>
              <p className="text-[#303030] mb-4">
                Producer sends 100 messages. Only 87 are processed. 13 messages disappear without trace. No errors thrown.
              </p>
              <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4 my-4">
                <p className="text-sm text-[#303030]">
                  <strong>Impact:</strong> Data loss, incomplete processing, silent failures
                </p>
              </div>
            </section>

            {/* Root Causes */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Root Causes</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">1. Auto-Acknowledgment Enabled</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030] mb-2"><strong>Problem:</strong> Worker crashes AFTER receiving message but BEFORE processing</p>
                <p className="text-sm text-[#303030]">With <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">auto_ack=True</code>, RabbitMQ removes message from queue immediately when delivered. If worker dies, message lost.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# ❌ BAD - Message lost if worker crashes
channel.basic_consume(
    queue='task_queue',
    on_message_callback=callback,
    auto_ack=True  # RabbitMQ immediately forgets message
)

def callback(ch, method, properties, body):
    # If crash happens here, message is GONE
    process_data(body)  # <-- crash here = lost message`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">2. Non-Persistent Messages</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030] mb-2"><strong>Problem:</strong> RabbitMQ broker restarts/crashes</p>
                <p className="text-sm text-[#303030]">Messages stored in RAM only. Broker restart = all messages deleted.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# ❌ BAD - Messages lost on broker restart
channel.basic_publish(
    exchange='',
    routing_key='task_queue',
    body=message.encode()
    # No delivery_mode=2 means transient message
)`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">3. Non-Durable Queue</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Queue itself disappears on broker restart. Even persistent messages lost if queue not durable.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# ❌ BAD - Queue deleted on broker restart
channel.queue_declare(queue='task_queue')  # durable defaults to False`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">4. Connection Lost Before Message Published</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Network failure between <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">basic_publish()</code> and broker receiving message.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# ❌ BAD - No confirmation message was received
channel.basic_publish(...)  # Returns immediately, no confirmation
# Network dies here --> message may not reach broker`}
              </pre>
            </section>

            {/* Solutions */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Solutions</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">✅ Solution 1: Manual Acknowledgments</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`channel.basic_consume(
    queue='task_queue',
    on_message_callback=callback,
    auto_ack=False  # Manual ack required
)

def callback(ch, method, properties, body):
    try:
        process_data(body)
        # Only ack AFTER successful processing
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f"Processing failed: {e}")
        # Reject and requeue for retry
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 2: Persistent Messages</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`channel.basic_publish(
    exchange='',
    routing_key='task_queue',
    body=message.encode(),
    properties=pika.BasicProperties(
        delivery_mode=2  # Persistent (survives broker restart)
    )
)`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 3: Durable Queue</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`channel.queue_declare(
    queue='task_queue',
    durable=True  # Queue survives broker restart
)`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 4: Publisher Confirms</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Enable publisher confirms
channel.confirm_delivery()

try:
    channel.basic_publish(
        exchange='',
        routing_key='task_queue',
        body=message.encode(),
        properties=pika.BasicProperties(delivery_mode=2),
        mandatory=True  # Return message if unroutable
    )
    print("Message confirmed by broker")
except pika.exceptions.UnroutableError:
    print("Message could not be routed")
except pika.exceptions.NackError:
    print("Message was nacked by broker")`}
              </pre>
            </section>

            {/* Complete Example */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Complete Reliable Example</h2>

              <h3 className="text-lg font-semibold text-[#303030] mb-3">Producer (Reliable)</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika

conn_param = pika.ConnectionParameters(
    host='concurp1.isc.heia-fr.ch',
    port=5072,
    credentials=pika.PlainCredentials('guest', 'guest')
)

connection = pika.BlockingConnection(conn_param)
channel = connection.channel()

# Durable queue
channel.queue_declare(queue='task_queue', durable=True)

# Enable publisher confirms
channel.confirm_delivery()

for i in range(100):
    message = f"Task {i}"
    try:
        channel.basic_publish(
            exchange='',
            routing_key='task_queue',
            body=message.encode(),
            properties=pika.BasicProperties(
                delivery_mode=2  # Persistent
            ),
            mandatory=True
        )
        print(f"[✓] Sent '{message}'")
    except Exception as e:
        print(f"[✗] Failed to send '{message}': {e}")

connection.close()`}
              </pre>

              <h3 className="text-lg font-semibold text-[#303030] mb-3 mt-6">Consumer (Reliable)</h3>
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

channel.queue_declare(queue='task_queue', durable=True)

def callback(ch, method, properties, body):
    message = body.decode()
    print(f"[x] Received '{message}'")

    try:
        # Simulate processing
        time.sleep(message.count('.'))
        print(f"[✓] Done processing '{message}'")

        # Acknowledge ONLY after success
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f"[✗] Failed processing '{message}': {e}")

        # Reject and requeue for retry
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

# Fair dispatch
channel.basic_qos(prefetch_count=1)

channel.basic_consume(
    queue='task_queue',
    on_message_callback=callback,
    auto_ack=False  # Manual ack
)

print('[*] Waiting for messages. To exit press CTRL+C')
channel.start_consuming()`}
              </pre>
            </section>

            {/* Testing */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">How to Test</h2>
              <ol className="list-decimal ml-6 space-y-3 text-[#303030]">
                <li>
                  <strong>Test Worker Crash:</strong>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Start consumer</li>
                    <li>Send 10 messages</li>
                    <li>Kill consumer (Ctrl+C) while processing message 5</li>
                    <li>Start consumer again</li>
                    <li>Verify message 5 is redelivered</li>
                  </ul>
                </li>
                <li>
                  <strong>Test Broker Restart:</strong>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Send 10 persistent messages to durable queue</li>
                    <li>Restart RabbitMQ broker</li>
                    <li>Start consumer</li>
                    <li>Verify all 10 messages still exist</li>
                  </ul>
                </li>
                <li>
                  <strong>Test Network Failure:</strong>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Enable publisher confirms</li>
                    <li>Disconnect network during publish</li>
                    <li>Verify exception raised, message not lost</li>
                  </ul>
                </li>
              </ol>
            </section>

            {/* Summary */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Summary</h2>
              <table className="w-full border-collapse border border-[#dbdbdb] my-4">
                <thead className="bg-[#fafafa]">
                  <tr>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Cause</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Solution</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Worker crashes before processing</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">auto_ack=False</code> + manual ack</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Broker restarts</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">durable=True</code> + <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">delivery_mode=2</code></td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Network failure during publish</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">channel.confirm_delivery()</code></td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Queue deleted on restart</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">queue_declare(durable=True)</code></td>
                  </tr>
                </tbody>
              </table>

              <div className="bg-[#d1ecf1] border-l-4 border-[#0c5460] p-4 my-4">
                <p className="text-sm text-[#303030]">
                  <strong>Golden Rule:</strong> For zero message loss, need ALL THREE: durable queue + persistent messages + manual acknowledgments
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
