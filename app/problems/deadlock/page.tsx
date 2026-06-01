'use client';

import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function DeadlockProblem() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#dbdbdb] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#1068bf] hover:underline flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </Link>
          <span className="text-[#707070]">/</span>
          <span className="text-[#303030] font-semibold">Deadlock Problem</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-[#dbdbdb] rounded p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle size={32} className="text-[#e24329]" />
            <h1 className="text-3xl font-bold text-[#303030]">Problem: Deadlock in RabbitMQ</h1>
          </div>

          <div className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">Symptom</h2>
              <p className="text-[#303030] mb-4">
                System hangs. No messages processed. All consumers blocked waiting. Nothing progresses.
              </p>
              <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4 my-4">
                <p className="text-sm text-[#303030]">
                  <strong>Impact:</strong> Complete system freeze, requires manual intervention (restart)
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Root Causes</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">1. RPC Call Cycle</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Service A calls Service B via RPC. Service B calls Service A via RPC. Both block waiting for response → deadlock.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Service A
def handle_request(ch, method, props, body):
    result = rpc_client.call_service_b()  # Blocks here
    return result

# Service B
def handle_request(ch, method, props, body):
    result = rpc_client.call_service_a()  # Blocks here
    return result

Timeline:
1. Service A receives request, calls Service B (blocks waiting)
2. Service B receives request, calls Service A (blocks waiting)
3. Service A can't respond (blocked on B)
4. Service B can't respond (blocked on A)
5. DEADLOCK ☠️`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">2. Queue Full + Blocking Publisher</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Queue reaches max length. Publisher blocks trying to send. Consumer can't receive because waiting for lock held by publisher.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Queue max length = 100
channel.queue_declare(
    queue='limited_queue',
    arguments={'x-max-length': 100}
)

# Producer sends 101 messages
for i in range(101):
    channel.basic_publish(...)  # Blocks on msg 101 (queue full)

# Consumer can't process because producer holds connection lock`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">3. Single-Threaded Consumer Making Blocking RPC</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Consumer callback makes blocking RPC call on SAME connection. Connection blocked by RPC, can't process incoming RPC response.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# ❌ BAD - Same connection for consume + RPC
connection = pika.BlockingConnection(...)
channel = connection.channel()

def callback(ch, method, properties, body):
    # This blocks the connection
    result = rpc_client.call(data)  # Uses SAME connection
    # RPC response can't arrive (connection blocked by this callback)

channel.basic_consume(queue='task_queue', on_message_callback=callback)
channel.start_consuming()  # DEADLOCK`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">4. Unacknowledged Messages Fill prefetch Buffer</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Consumer prefetches 100 messages. Processing first message blocks waiting for external resource. Other 99 messages can't be processed (no ack). New messages can't arrive (prefetch full).</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`channel.basic_qos(prefetch_count=100)

def callback(ch, method, properties, body):
    # First message blocks on slow external call
    external_api.slow_call()  # Takes 10 minutes
    # Other 99 prefetched messages can't be processed
    # Ack never happens, prefetch buffer stays full
    ch.basic_ack(delivery_tag=method.delivery_tag)`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Solutions</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">✅ Solution 1: Break RPC Cycles (Async Pattern)</h3>
              <p className="text-[#303030] mb-4">Don't block waiting for response. Use callback queues.</p>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Service A
def handle_request(ch, method, props, body):
    # Send async request to B (don't wait)
    channel.basic_publish(
        exchange='',
        routing_key='service_b_queue',
        body=body,
        properties=pika.BasicProperties(reply_to='service_a_callback')
    )
    # Process immediately, response comes to callback queue
    ch.basic_ack(delivery_tag=method.delivery_tag)

# No blocking = no deadlock`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 2: Separate Connections for Publish/Consume</h3>
              <p className="text-[#303030] mb-4">Use different connection for RPC client vs consumer.</p>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Connection 1: For consuming
consume_conn = pika.BlockingConnection(...)
consume_channel = consume_conn.channel()

# Connection 2: For RPC client (separate!)
rpc_conn = pika.BlockingConnection(...)
rpc_channel = rpc_conn.channel()
rpc_client = RpcClient(rpc_channel)

def callback(ch, method, properties, body):
    # RPC uses different connection, no blocking
    result = rpc_client.call(data)
    ch.basic_ack(delivery_tag=method.delivery_tag)

consume_channel.basic_consume(queue='task_queue', on_message_callback=callback)
consume_channel.start_consuming()`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 3: Use Timeouts</h3>
              <p className="text-[#303030] mb-4">Add timeout to RPC calls. Fail fast instead of blocking forever.</p>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`class RpcClient:
    def call(self, data, timeout=5.0):
        self.response = None
        self.corr_id = str(uuid.uuid4())

        channel.basic_publish(...)

        # Wait with timeout
        start = time.time()
        while self.response is None:
            if time.time() - start > timeout:
                raise TimeoutError("RPC call timed out")
            self.connection.process_data_events(time_limit=0.1)

        return self.response`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 4: Lower prefetch_count</h3>
              <p className="text-[#303030] mb-4">Prevent buffer from filling up. Allow other consumers to take over.</p>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Instead of prefetch_count=100
channel.basic_qos(prefetch_count=1)  # Only 1 message at a time

# If processing blocks, other consumers can take remaining messages`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 5: Use Threading for Blocking Operations</h3>
              <p className="text-[#303030] mb-4">Move blocking call to separate thread. Main thread acks immediately.</p>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import threading

def callback(ch, method, properties, body):
    # Ack immediately
    ch.basic_ack(delivery_tag=method.delivery_tag)

    # Process in background thread
    thread = threading.Thread(
        target=process_blocking_task,
        args=(body,)
    )
    thread.start()

def process_blocking_task(body):
    # Blocking operation here (separate thread, won't block consumer)
    external_api.slow_call()`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Detection & Debugging</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">Signs of Deadlock</h3>
              <ul className="list-disc ml-6 space-y-2 text-[#303030] mb-4">
                <li>Messages in queue but not processed</li>
                <li>Consumers running but no activity</li>
                <li>CPU usage near 0% (all threads blocked)</li>
                <li>No error messages (silent hang)</li>
              </ul>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">Debug Tools</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Check queue status
rabbitmqctl list_queues name messages consumers

# Check connections
rabbitmqctl list_connections

# Thread dump (Python)
import threading
print(threading.enumerate())
for thread in threading.enumerate():
    print(thread, thread.is_alive())`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Prevention Checklist</h2>
              <ul className="list-disc ml-6 space-y-2 text-[#303030]">
                <li>✓ Never make blocking RPC calls within consumer callback on same connection</li>
                <li>✓ Use separate connections for publish vs consume</li>
                <li>✓ Add timeouts to all RPC calls</li>
                <li>✓ Keep prefetch_count low (1-10)</li>
                <li>✓ Avoid circular RPC dependencies between services</li>
                <li>✓ Use async patterns instead of blocking waits</li>
                <li>✓ Move slow operations to background threads</li>
              </ul>
            </section>

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
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">RPC cycle</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Use async pattern, no blocking waits</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Same connection for RPC + consume</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Separate connections</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Blocking callback</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Move to thread, ack immediately</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Prefetch buffer full</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Lower prefetch_count</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Infinite wait</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Add timeouts</td>
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
