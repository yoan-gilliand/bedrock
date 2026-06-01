'use client';

import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function ConnectionProblem() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#dbdbdb] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#1068bf] hover:underline flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </Link>
          <span className="text-[#707070]">/</span>
          <span className="text-[#303030] font-semibold">Connection Failures</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-[#dbdbdb] rounded p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle size={32} className="text-[#e24329]" />
            <h1 className="text-3xl font-bold text-[#303030]">Problem: Connection Failures</h1>
          </div>

          <div className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">Symptoms</h2>
              <ul className="list-disc ml-6 space-y-2 text-[#303030]">
                <li><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">AMQPConnectionError: Connection refused</code></li>
                <li><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">StreamLostError: Stream connection lost</code></li>
                <li><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">ConnectionClosed: (320) CONNECTION_FORCED</code></li>
                <li>Consumer stops receiving messages</li>
                <li>Publisher hangs indefinitely</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Root Causes</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">1. Network Interruption</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">WiFi drops, VPN disconnects, firewall kills idle connection</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Error
pika.exceptions.StreamLostError: Stream connection lost: ConnectionResetError(54, 'Connection reset by peer')`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">2. Heartbeat Timeout</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Broker doesn't receive heartbeat from client. Assumes client dead, closes connection.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Default heartbeat: 60s
# If client doesn't send heartbeat in 120s (2x interval), broker kills connection

# Caused by:
# - Blocking operation in callback (no heartbeat sent)
# - CPU overload (no time to send heartbeat)
# - Network congestion`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">3. Wrong Credentials / Permissions</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Error
pika.exceptions.AMQPConnectionError: (403, "ACCESS_REFUSED - Login was refused")

# Or
pika.exceptions.ChannelClosedByBroker: (403, 'ACCESS_REFUSED')`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">4. Broker Restart / Crash</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">RabbitMQ server restarts for maintenance or crashes. All connections dropped.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Solutions</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">✅ Solution 1: Auto-Reconnect Pattern</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika
import time

def create_connection():
    while True:
        try:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(
                    host='concurp1.isc.heia-fr.ch',
                    port=5072,
                    credentials=pika.PlainCredentials('guest', 'guest'),
                    heartbeat=600,  # 10 min
                    blocked_connection_timeout=300
                )
            )
            print("[✓] Connected to RabbitMQ")
            return connection
        except pika.exceptions.AMQPConnectionError as e:
            print(f"[✗] Connection failed: {e}")
            print("[⟳] Retrying in 5s...")
            time.sleep(5)

# Usage
connection = create_connection()
channel = connection.channel()

# In consumer loop
try:
    channel.start_consuming()
except (pika.exceptions.StreamLostError, pika.exceptions.AMQPConnectionError):
    print("[✗] Connection lost, reconnecting...")
    connection = create_connection()
    channel = connection.channel()
    # Re-setup consumer
    channel.basic_consume(...)
    channel.start_consuming()`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 2: Increase Heartbeat Interval</h3>
              <div className="bg-[#d1ecf1] border-l-4 border-[#0c5460] p-4 mb-4">
                <p className="text-sm text-[#303030]">For long-running tasks, increase heartbeat to avoid timeout during processing</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host='concurp1.isc.heia-fr.ch',
        port=5072,
        credentials=pika.PlainCredentials('guest', 'guest'),
        heartbeat=600  # 10 minutes (default is 60s)
    )
)`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 3: Connection Pooling</h3>
              <p className="text-[#303030] mb-4">Reuse connections across multiple operations. Don't create new connection per message.</p>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`class ConnectionPool:
    def __init__(self):
        self.connection = None
        self.channel = None

    def get_channel(self):
        if self.connection is None or self.connection.is_closed:
            self.connection = create_connection()
            self.channel = self.connection.channel()
        return self.channel

pool = ConnectionPool()

# Reuse channel
for msg in messages:
    channel = pool.get_channel()
    channel.basic_publish(...)`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 4: Connection Health Check</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`def is_connection_open(connection):
    return connection and connection.is_open

def ensure_connection():
    global connection, channel
    if not is_connection_open(connection):
        print("[⟳] Reconnecting...")
        connection = create_connection()
        channel = connection.channel()
        setup_consumer(channel)

# Check periodically
import threading

def health_check():
    while True:
        time.sleep(30)  # Check every 30s
        ensure_connection()

threading.Thread(target=health_check, daemon=True).start()`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 5: Graceful Shutdown</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import signal
import sys

def signal_handler(sig, frame):
    print("[!] Shutting down gracefully...")
    try:
        channel.stop_consuming()
        connection.close()
    except Exception as e:
        print(f"[✗] Error during shutdown: {e}")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Now Ctrl+C closes connection cleanly`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Connection Parameters Reference</h2>
              <table className="w-full border-collapse border border-[#dbdbdb] my-4">
                <thead className="bg-[#fafafa]">
                  <tr>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Parameter</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Default</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Recommended</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">heartbeat</code></td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">60s</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">600s</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Detect dead connections</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">blocked_connection_timeout</code></td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">None</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">300s</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Timeout when broker blocks</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">connection_attempts</code></td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">1</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">3-5</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Retry on initial connect</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">retry_delay</code></td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">2s</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">5s</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Wait between retries</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">socket_timeout</code></td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">10s</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">10s</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">TCP socket timeout</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Complete Robust Connection Example</h2>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika
import time
import signal
import sys

class RobustConsumer:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.should_stop = False

    def connect(self):
        while not self.should_stop:
            try:
                self.connection = pika.BlockingConnection(
                    pika.ConnectionParameters(
                        host='concurp1.isc.heia-fr.ch',
                        port=5072,
                        credentials=pika.PlainCredentials('guest', 'guest'),
                        heartbeat=600,
                        blocked_connection_timeout=300,
                        connection_attempts=3,
                        retry_delay=5
                    )
                )
                self.channel = self.connection.channel()
                self.channel.queue_declare(queue='task_queue', durable=True)
                self.channel.basic_qos(prefetch_count=1)
                print("[✓] Connected")
                return True
            except Exception as e:
                print(f"[✗] Connection failed: {e}")
                print("[⟳] Retrying in 5s...")
                time.sleep(5)
        return False

    def callback(self, ch, method, properties, body):
        try:
            print(f"[x] Processing {body.decode()}")
            time.sleep(1)
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            print(f"[✗] Error: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

    def start(self):
        while not self.should_stop:
            if not self.connect():
                break

            self.channel.basic_consume(
                queue='task_queue',
                on_message_callback=self.callback
            )

            try:
                print("[*] Consuming...")
                self.channel.start_consuming()
            except (pika.exceptions.StreamLostError, pika.exceptions.AMQPConnectionError) as e:
                print(f"[✗] Connection lost: {e}")
                print("[⟳] Reconnecting...")
                continue
            except KeyboardInterrupt:
                print("[!] Interrupted")
                self.stop()

    def stop(self):
        self.should_stop = True
        if self.channel:
            self.channel.stop_consuming()
        if self.connection:
            self.connection.close()
        print("[✓] Stopped")

# Run
consumer = RobustConsumer()
consumer.start()`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Testing Connection Resilience</h2>
              <ol className="list-decimal ml-6 space-y-3 text-[#303030]">
                <li>
                  <strong>Test Network Drop:</strong>
                  <ul className="list-disc ml-6 mt-2">
                    <li>Start consumer</li>
                    <li>Disable WiFi for 10 seconds</li>
                    <li>Re-enable WiFi</li>
                    <li>Verify consumer reconnects automatically</li>
                  </ul>
                </li>
                <li>
                  <strong>Test Broker Restart:</strong>
                  <ul className="list-disc ml-6 mt-2">
                    <li>Start consumer</li>
                    <li>Restart RabbitMQ broker</li>
                    <li>Verify consumer reconnects</li>
                  </ul>
                </li>
                <li>
                  <strong>Test Heartbeat Timeout:</strong>
                  <ul className="list-disc ml-6 mt-2">
                    <li>Set heartbeat=10</li>
                    <li>Add <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">time.sleep(30)</code> in callback</li>
                    <li>Verify connection dropped, then reconnects</li>
                  </ul>
                </li>
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
