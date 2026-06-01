'use client';

import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function PerformanceProblem() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#dbdbdb] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#1068bf] hover:underline flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </Link>
          <span className="text-[#707070]">/</span>
          <span className="text-[#303030] font-semibold">Performance Issues</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-[#dbdbdb] rounded p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle size={32} className="text-[#e24329]" />
            <h1 className="text-3xl font-bold text-[#303030]">Problem: Slow Performance</h1>
          </div>

          <div className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">Symptoms</h2>
              <ul className="list-disc ml-6 space-y-2 text-[#303030]">
                <li>Messages pile up in queue faster than consumed</li>
                <li>High latency between publish and consume</li>
                <li>Low throughput (messages/second)</li>
                <li>Consumer CPU idle while queue grows</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Root Causes & Solutions</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">1. prefetch_count Too Low</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Consumer waits idle while broker sends one message at a time. Network round-trip overhead kills throughput.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-semibold text-[#303030] mb-2">❌ Bad (prefetch=1)</p>
                  <pre className="bg-[#0d1117] text-[#e6edf3] p-3 rounded text-sm font-mono whitespace-pre-wrap">
{`channel.basic_qos(prefetch_count=1)

# Consumer idle during network RTT
# [Process msg] [Wait] [Process] [Wait]
# Throughput: ~100 msg/s`}
                  </pre>
                </div>

                <div>
                  <p className="font-semibold text-[#303030] mb-2">✅ Good (prefetch=10-50)</p>
                  <pre className="bg-[#0d1117] text-[#e6edf3] p-3 rounded text-sm font-mono whitespace-pre-wrap">
{`channel.basic_qos(prefetch_count=20)

# Consumer has buffer of messages
# [Process][Process][Process]...
# Throughput: ~2000 msg/s`}
                  </pre>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">2. New Connection Per Message</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Connection setup expensive (TCP handshake, auth, channel creation). Reuse connections.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-semibold text-[#303030] mb-2">❌ Bad</p>
                  <pre className="bg-[#0d1117] text-[#e6edf3] p-3 rounded text-sm font-mono whitespace-pre-wrap">
{`for msg in messages:
    conn = pika.BlockingConnection(...)
    channel = conn.channel()
    channel.basic_publish(...)
    conn.close()
# 1000 messages = 1000 connections`}
                  </pre>
                </div>

                <div>
                  <p className="font-semibold text-[#303030] mb-2">✅ Good</p>
                  <pre className="bg-[#0d1117] text-[#e6edf3] p-3 rounded text-sm font-mono whitespace-pre-wrap">
{`conn = pika.BlockingConnection(...)
channel = conn.channel()
for msg in messages:
    channel.basic_publish(...)
conn.close()
# 1000 messages = 1 connection`}
                  </pre>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">3. Single Consumer, Heavy Processing</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">One consumer can't keep up. Add more consumer instances (horizontal scaling).</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Terminal 1
python consumer.py

# Terminal 2
python consumer.py  # Add second instance

# Terminal 3
python consumer.py  # Add third instance

# Queue distributes messages round-robin
# Throughput 3x faster`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">4. Synchronous Processing in Callback</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Callback blocks on slow I/O. Use threading to process in parallel.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-semibold text-[#303030] mb-2">❌ Slow (synchronous)</p>
                  <pre className="bg-[#0d1117] text-[#e6edf3] p-3 rounded text-sm font-mono whitespace-pre-wrap">
{`def callback(ch, method, props, body):
    # Blocks entire consumer
    result = slow_api_call(body)
    ch.basic_ack(delivery_tag=method.delivery_tag)

# Processes 1 msg at a time`}
                  </pre>
                </div>

                <div>
                  <p className="font-semibold text-[#303030] mb-2">✅ Fast (threaded)</p>
                  <pre className="bg-[#0d1117] text-[#e6edf3] p-3 rounded text-sm font-mono whitespace-pre-wrap">
{`def callback(ch, method, props, body):
    threading.Thread(
        target=process_async,
        args=(ch, method, body)
    ).start()

def process_async(ch, method, body):
    result = slow_api_call(body)
    ch.basic_ack(delivery_tag=method.delivery_tag)

# Processes multiple msgs in parallel`}
                  </pre>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">5. No Message Batching</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Publishing messages one-by-one. Use batching + <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">confirm_delivery()</code>.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`channel.confirm_delivery()

batch = []
for msg in messages:
    channel.basic_publish(
        exchange='',
        routing_key='task_queue',
        body=msg.encode()
    )
    batch.append(msg)

    # Flush batch every 100 messages
    if len(batch) >= 100:
        # All published in one network round-trip
        batch.clear()

# Much faster than individual publishes`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">6. Persistent Messages on Every Message</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Persistence adds disk I/O overhead. Use transient messages for non-critical data.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-semibold text-[#303030] mb-2">Persistent (slower)</p>
                  <pre className="bg-[#0d1117] text-[#e6edf3] p-3 rounded text-sm font-mono whitespace-pre-wrap">
{`channel.basic_publish(
    ...,
    properties=pika.BasicProperties(
        delivery_mode=2  # Disk write
    )
)
# ~1000 msg/s`}
                  </pre>
                </div>

                <div>
                  <p className="font-semibold text-[#303030] mb-2">Transient (faster)</p>
                  <pre className="bg-[#0d1117] text-[#e6edf3] p-3 rounded text-sm font-mono whitespace-pre-wrap">
{`channel.basic_publish(
    ...,
    properties=pika.BasicProperties(
        delivery_mode=1  # RAM only
    )
)
# ~10000 msg/s`}
                  </pre>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">7. Network Latency</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">High RTT between client and broker. Run consumers closer to broker.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Check latency
ping concurp1.isc.heia-fr.ch

# If >50ms, consider:
# - Running consumers in same datacenter as broker
# - Increasing prefetch_count to hide latency
# - Using connection pooling`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Performance Tuning Guide</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">Optimal Settings by Use Case</h3>
              <table className="w-full border-collapse border border-[#dbdbdb] my-4">
                <thead className="bg-[#fafafa]">
                  <tr>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Use Case</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">prefetch_count</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Persistence</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Workers</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">High throughput</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">50-100</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Transient</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Many (10+)</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Low latency</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">1-5</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Transient</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Few (1-3)</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Reliable processing</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">1-10</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Persistent</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Medium (3-5)</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Heavy processing</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">5-20</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Persistent</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Many + threading</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Benchmarking</h2>

              <h3 className="text-lg font-semibold text-[#303030] mb-3">Simple Throughput Test</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import time

# Producer
start = time.time()
for i in range(10000):
    channel.basic_publish(...)
duration = time.time() - start
print(f"Throughput: {10000/duration:.0f} msg/s")

# Consumer
count = 0
start = time.time()

def callback(ch, method, props, body):
    global count
    count += 1
    if count == 10000:
        duration = time.time() - start
        print(f"Throughput: {10000/duration:.0f} msg/s")
    ch.basic_ack(delivery_tag=method.delivery_tag)`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Monitoring</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">Key Metrics</h3>
              <ul className="list-disc ml-6 space-y-2 text-[#303030] mb-4">
                <li><strong>Queue depth:</strong> Messages waiting to be consumed</li>
                <li><strong>Publish rate:</strong> Messages/sec incoming</li>
                <li><strong>Consume rate:</strong> Messages/sec processed</li>
                <li><strong>Consumer utilization:</strong> % time processing vs idle</li>
                <li><strong>Message age:</strong> Time from publish to consume</li>
              </ul>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Check queue stats
rabbitmqctl list_queues name messages messages_ready messages_unacknowledged

# Check rates
rabbitmqctl list_queues name message_stats.publish message_stats.deliver`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Quick Wins Summary</h2>
              <ol className="list-decimal ml-6 space-y-2 text-[#303030]">
                <li>Increase prefetch_count (10-50 for most workloads)</li>
                <li>Reuse connections (don't create new per message)</li>
                <li>Add more consumer instances (horizontal scaling)</li>
                <li>Use threading for I/O-bound processing</li>
                <li>Use transient messages for non-critical data</li>
                <li>Batch publish operations</li>
                <li>Run consumers close to broker (reduce network latency)</li>
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
