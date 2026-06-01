'use client';

import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function OrderingProblem() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#dbdbdb] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#1068bf] hover:underline flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </Link>
          <span className="text-[#707070]">/</span>
          <span className="text-[#303030] font-semibold">Message Ordering Problem</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-[#dbdbdb] rounded p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle size={32} className="text-[#e24329]" />
            <h1 className="text-3xl font-bold text-[#303030]">Problem: Out-of-Order Messages</h1>
          </div>

          <div className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">Symptom</h2>
              <p className="text-[#303030] mb-4">
                Producer sends messages 1, 2, 3 in order. Consumer receives 1, 3, 2. Order violated.
              </p>
              <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4 my-4">
                <p className="text-sm text-[#303030]">
                  <strong>Impact:</strong> State corruption (user created before account), database constraint violations, business logic errors
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Root Causes</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">1. Multiple Consumers (Load Balancing)</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">RabbitMQ distributes messages round-robin. Consumer A gets msg 1, Consumer B gets msg 2. If B processes faster, messages arrive out-of-order.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Producer sends: 1, 2, 3
[Queue] --> Consumer A (slow)   <-- msg 1 (takes 5s)
        |
        --> Consumer B (fast)   <-- msg 2 (takes 1s) ✓ FINISHES FIRST
        |
        --> Consumer C (medium) <-- msg 3 (takes 2s)

Result: 2, 3, 1 (order violated)`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">2. Message Redelivery After Failure</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Consumer crashes while processing msg 2. RabbitMQ requeues msg 2. Meanwhile msg 3 already processed. Redelivered msg 2 arrives AFTER msg 3.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`Timeline:
1. Msg 1 processed ✓
2. Msg 2 delivered, consumer CRASHES before ack
3. Msg 3 processed ✓
4. Msg 2 redelivered (requeued)
5. Msg 2 processed ✓

Final order: 1, 3, 2`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">3. Parallel Processing Within Consumer</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Consumer uses threading/async to process messages concurrently. Race condition causes out-of-order completion.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# ❌ BAD - Threads complete out-of-order
def callback(ch, method, properties, body):
    thread = threading.Thread(target=process, args=(body,))
    thread.start()  # Non-blocking, order not preserved`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Solutions</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">✅ Solution 1: Single Consumer</h3>
              <p className="text-[#303030] mb-4">Only ONE consumer processes queue. Guarantees FIFO order.</p>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Only run ONE instance of this consumer
channel.basic_consume(
    queue='strict_order_queue',
    on_message_callback=callback,
    auto_ack=False
)

def callback(ch, method, properties, body):
    # Process synchronously (blocking)
    result = process_message(body)
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.start_consuming()  # Run only ONE instance`}
              </pre>

              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 my-4">
                <p className="text-sm text-[#303030]"><strong>Trade-off:</strong> No parallelism. Slower throughput. Good for strict ordering requirements.</p>
              </div>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 2: Sequence Numbers + Reordering Buffer</h3>
              <p className="text-[#303030] mb-4">Producer adds sequence number to each message. Consumer buffers out-of-order messages and reorders them.</p>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Producer
sequence = 0
for msg in messages:
    sequence += 1
    channel.basic_publish(
        exchange='',
        routing_key='task_queue',
        body=json.dumps({'seq': sequence, 'data': msg}).encode()
    )

# Consumer
expected_seq = 1
buffer = {}  # {seq: message}

def callback(ch, method, properties, body):
    msg = json.loads(body.decode())
    seq = msg['seq']

    # Buffer message
    buffer[seq] = msg

    # Process all consecutive messages
    global expected_seq
    while expected_seq in buffer:
        process_message(buffer[expected_seq])
        del buffer[expected_seq]
        expected_seq += 1

    ch.basic_ack(delivery_tag=method.delivery_tag)`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 3: Separate Queues Per Entity</h3>
              <p className="text-[#303030] mb-4">Use routing key to send related messages to same queue. Different entities can process in parallel, but same entity always ordered.</p>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Producer
channel.basic_publish(
    exchange='direct_exchange',
    routing_key=f'user_{user_id}',  # Route by user ID
    body=message.encode()
)

# Consumer binds to specific user queue
channel.queue_bind(
    exchange='direct_exchange',
    queue='user_123_queue',
    routing_key='user_123'
)

# Result: All messages for user 123 processed in order
# Messages for different users can process in parallel`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 4: prefetch_count=1 + Synchronous Processing</h3>
              <p className="text-[#303030] mb-4">Limit consumer to ONE message at a time. Process synchronously (no threads).</p>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`channel.basic_qos(prefetch_count=1)  # Only 1 message at a time

def callback(ch, method, properties, body):
    # Synchronous processing (blocking)
    result = process_message(body)
    ch.basic_ack(delivery_tag=method.delivery_tag)
    # Next message only delivered AFTER ack

channel.basic_consume(
    queue='ordered_queue',
    on_message_callback=callback,
    auto_ack=False
)`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">When Ordering Matters vs. Doesn't</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">🔴 Strict Ordering Required</h3>
              <ul className="list-disc ml-6 space-y-2 text-[#303030] mb-4">
                <li>Bank transactions (withdraw MUST happen after deposit)</li>
                <li>State machine updates (status: pending → approved → shipped)</li>
                <li>Database migrations (schema changes must apply in order)</li>
                <li>Event sourcing (events must replay in order)</li>
              </ul>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">🟢 Ordering NOT Required</h3>
              <ul className="list-disc ml-6 space-y-2 text-[#303030]">
                <li>Image resizing (each image independent)</li>
                <li>Email sending (order doesn't matter)</li>
                <li>Log aggregation (timestamps handle ordering)</li>
                <li>Independent API calls</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Testing Strategy</h2>
              <ol className="list-decimal ml-6 space-y-3 text-[#303030]">
                <li>
                  <strong>Inject Artificial Delays:</strong>
                  <pre className="bg-[#0d1117] text-[#e6edf3] p-3 rounded text-sm font-mono mt-2">
{`# Make early messages slow
if seq == 1:
    time.sleep(5)  # Delay first message`}
                  </pre>
                </li>
                <li>
                  <strong>Start Multiple Consumers:</strong> Send 100 messages with multiple workers. Check if order violated.
                </li>
                <li>
                  <strong>Kill Consumer Mid-Processing:</strong> Force redelivery and check ordering.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Summary</h2>
              <table className="w-full border-collapse border border-[#dbdbdb] my-4">
                <thead className="bg-[#fafafa]">
                  <tr>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Solution</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Pros</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Cons</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Single Consumer</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Simple, guaranteed order</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">No parallelism, bottleneck</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Sequence Numbers</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Allows parallelism</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Complex, memory overhead</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Separate Queues</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Per-entity parallelism</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Queue explosion</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">prefetch_count=1</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Simple config</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Slower throughput</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
