'use client';

import Link from 'next/link';
import { ArrowLeft, Code2 } from 'lucide-react';

export default function ConfigSnippets() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#dbdbdb] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#1068bf] hover:underline flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </Link>
          <span className="text-[#707070]">/</span>
          <span className="text-[#303030] font-semibold">Code Snippets</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-[#dbdbdb] rounded p-8">
          <div className="flex items-center gap-3 mb-6">
            <Code2 size={32} className="text-[#6b4fbb]" />
            <h1 className="text-3xl font-bold text-[#303030]">Ready-to-Copy Code Snippets</h1>
          </div>

          <div className="prose prose-sm max-w-none">
            {/* Configuration */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">1. Configuration Setup</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">ConfigParser (YAML)</h3>
              <p className="text-[#303030] mb-4">Load RabbitMQ credentials from config.yaml</p>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# config.yaml
[rabbitmq]
host = concurp1.isc.heia-fr.ch
port = 5072
username = guest
password = guest

[dictionary]
hello = bonjour
world = monde
cat = chat`}
              </pre>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika
import configparser

# Load config
config = configparser.ConfigParser()
config.read('config.yaml')

# Get RabbitMQ settings
HOST = config.get('rabbitmq', 'host')
PORT = config.getint('rabbitmq', 'port')
USER = config.get('rabbitmq', 'username')
PASS = config.get('rabbitmq', 'password')

# Create connection
conn_params = pika.ConnectionParameters(
    host=HOST,
    port=PORT,
    credentials=pika.PlainCredentials(USER, PASS)
)

connection = pika.BlockingConnection(conn_params)
channel = connection.channel()

# Load dictionary
DICTIONARY = dict(config.items('dictionary'))
print(DICTIONARY)  # {'hello': 'bonjour', 'world': 'monde', ...}`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">Environment Variables</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import os
import pika

HOST = os.getenv('RABBITMQ_HOST', 'concurp1.isc.heia-fr.ch')
PORT = int(os.getenv('RABBITMQ_PORT', '5072'))
USER = os.getenv('RABBITMQ_USER', 'guest')
PASS = os.getenv('RABBITMQ_PASS', 'guest')

conn_params = pika.ConnectionParameters(
    host=HOST,
    port=PORT,
    credentials=pika.PlainCredentials(USER, PASS),
    heartbeat=600,
    blocked_connection_timeout=300
)`}
              </pre>
            </section>

            {/* Threading */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">2. Thread-Safe Patterns</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">Connection Per Thread</h3>
              <p className="text-[#303030] mb-4">Pika connections NOT thread-safe. Each thread needs own connection.</p>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika
import threading

def get_connection():
    """Create new connection (call once per thread)"""
    return pika.BlockingConnection(
        pika.ConnectionParameters(
            host='concurp1.isc.heia-fr.ch',
            port=5072,
            credentials=pika.PlainCredentials('guest', 'guest')
        )
    )

def worker_thread():
    # Each thread gets own connection
    connection = get_connection()
    channel = connection.channel()

    # Do work...
    channel.basic_publish(...)

    connection.close()

# Spawn threads
threads = []
for i in range(5):
    t = threading.Thread(target=worker_thread)
    t.start()
    threads.append(t)

for t in threads:
    t.join()`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">Thread Pool for Processing</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`from concurrent.futures import ThreadPoolExecutor
import pika

executor = ThreadPoolExecutor(max_workers=10)

def process_message(body):
    """Heavy processing in thread pool"""
    # Do slow work here
    result = expensive_operation(body)
    return result

def callback(ch, method, properties, body):
    """Main callback (runs in consumer thread)"""
    # Submit to thread pool
    future = executor.submit(process_message, body)

    # Register completion callback
    def done(f):
        try:
            result = f.result()
            print(f"[✓] Processed: {result}")
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            print(f"[✗] Error: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

    future.add_done_callback(done)

channel.basic_consume(queue='task_queue', on_message_callback=callback)
channel.start_consuming()`}
              </pre>
            </section>

            {/* Error Handling */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">3. Error Handling Patterns</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">Robust Consumer with Retry</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika
import time
import json

MAX_RETRIES = 3

def callback(ch, method, properties, body):
    try:
        # Parse message
        data = json.loads(body.decode())

        # Check retry count
        retry_count = properties.headers.get('x-retry-count', 0) if properties.headers else 0

        # Process
        result = process_data(data)
        print(f"[✓] Processed: {result}")

        # Success - ack
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except json.JSONDecodeError as e:
        # Invalid JSON - don't requeue (poison message)
        print(f"[✗] Invalid JSON: {e}")
        ch.basic_ack(delivery_tag=method.delivery_tag)  # Discard

    except Exception as e:
        print(f"[✗] Processing error: {e}")

        # Check retry limit
        if retry_count < MAX_RETRIES:
            # Requeue with incremented retry count
            print(f"[⟳] Retry {retry_count + 1}/{MAX_RETRIES}")

            headers = properties.headers or {}
            headers['x-retry-count'] = retry_count + 1

            ch.basic_publish(
                exchange='',
                routing_key=method.routing_key,
                body=body,
                properties=pika.BasicProperties(headers=headers)
            )

            # Ack original (we re-published it)
            ch.basic_ack(delivery_tag=method.delivery_tag)
        else:
            # Max retries exceeded - send to dead letter queue
            print(f"[☠] Max retries exceeded, sending to DLQ")
            ch.basic_publish(
                exchange='',
                routing_key='dead_letter_queue',
                body=body,
                properties=properties
            )
            ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue='task_queue', on_message_callback=callback, auto_ack=False)
channel.start_consuming()`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">Connection Error Handling</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika
import time

def safe_publish(channel, routing_key, body, max_retries=3):
    """Publish with automatic retry on failure"""
    for attempt in range(max_retries):
        try:
            channel.basic_publish(
                exchange='',
                routing_key=routing_key,
                body=body.encode(),
                properties=pika.BasicProperties(delivery_mode=2)
            )
            return True
        except pika.exceptions.AMQPConnectionError as e:
            print(f"[✗] Connection error (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
                # Reconnect
                global connection, channel
                connection = create_connection()
                channel = connection.channel()
            else:
                print(f"[☠] Failed after {max_retries} attempts")
                return False
        except Exception as e:
            print(f"[✗] Unexpected error: {e}")
            return False

# Usage
if safe_publish(channel, 'task_queue', 'my message'):
    print("[✓] Published successfully")
else:
    print("[✗] Publish failed")`}
              </pre>
            </section>

            {/* Testing */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">4. Testing Utilities</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">Message Counter (Test Throughput)</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import time

class MessageCounter:
    def __init__(self):
        self.count = 0
        self.start_time = None

    def start(self):
        self.start_time = time.time()
        self.count = 0

    def increment(self):
        self.count += 1

    def report(self):
        duration = time.time() - self.start_time
        rate = self.count / duration if duration > 0 else 0
        print(f"[Stats] {self.count} messages in {duration:.2f}s = {rate:.0f} msg/s")

# Usage in consumer
counter = MessageCounter()
counter.start()

def callback(ch, method, properties, body):
    process_message(body)
    counter.increment()

    # Report every 1000 messages
    if counter.count % 1000 == 0:
        counter.report()

    ch.basic_ack(delivery_tag=method.delivery_tag)`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">Verify Queue Empty</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`def is_queue_empty(channel, queue_name):
    """Check if queue has messages"""
    method = channel.queue_declare(queue=queue_name, passive=True)
    return method.method.message_count == 0

# Usage in tests
assert is_queue_empty(channel, 'task_queue'), "Queue should be empty after processing"

# Or get message count
method = channel.queue_declare(queue='task_queue', passive=True)
print(f"Queue depth: {method.method.message_count} messages")`}
              </pre>
            </section>

            {/* Common Patterns */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">5. Common Patterns</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">Simple Producer</h3>
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

channel.queue_declare(queue='task_queue', durable=True)

for i in range(10):
    message = f"Task {i}"
    channel.basic_publish(
        exchange='',
        routing_key='task_queue',
        body=message.encode(),
        properties=pika.BasicProperties(delivery_mode=2)
    )
    print(f"[✓] Sent: {message}")

connection.close()`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">Simple Consumer</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika
import time

connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host='concurp1.isc.heia-fr.ch',
        port=5072,
        credentials=pika.PlainCredentials('guest', 'guest')
    )
)
channel = connection.channel()

channel.queue_declare(queue='task_queue', durable=True)
channel.basic_qos(prefetch_count=1)

def callback(ch, method, properties, body):
    message = body.decode()
    print(f"[x] Received: {message}")

    # Simulate work
    time.sleep(message.count('.'))

    print(f"[✓] Done: {message}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(
    queue='task_queue',
    on_message_callback=callback,
    auto_ack=False
)

print('[*] Waiting for messages. Press CTRL+C to exit')
channel.start_consuming()`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">JSON Message Handler</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import json

# Producer
data = {
    "user_id": 123,
    "action": "purchase",
    "amount": 99.99
}

channel.basic_publish(
    exchange='',
    routing_key='events',
    body=json.dumps(data).encode()
)

# Consumer
def callback(ch, method, properties, body):
    try:
        data = json.loads(body.decode())
        print(f"[x] User {data['user_id']} {data['action']} \${data['amount']}")
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except json.JSONDecodeError as e:
        print(f"[✗] Invalid JSON: {e}")
        ch.basic_ack(delivery_tag=method.delivery_tag)  # Discard poison message`}
              </pre>
            </section>

            {/* Exam Quick Reference */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">6. Exam Quick Reference</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">School Server Config</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`HOST = 'concurp1.isc.heia-fr.ch'
PORT = 5072
USER = 'guest'
PASS = 'guest'`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">Most Common Mistakes</h3>
              <ul className="list-disc ml-6 space-y-2 text-[#303030]">
                <li>Forgetting <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">auto_ack=False</code></li>
                <li>Not calling <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">basic_ack()</code></li>
                <li>Using same connection in multiple threads</li>
                <li>Not closing connection at end</li>
                <li>Wrong exchange type (direct vs fanout)</li>
                <li>Forgetting <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">queue_bind()</code> for exchanges</li>
              </ul>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">Debugging Commands</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Check queue exists and has messages
rabbitmqctl list_queues

# Check bindings
rabbitmqctl list_bindings

# Check connections
rabbitmqctl list_connections

# Purge queue (clear all messages)
rabbitmqctl purge_queue task_queue`}
              </pre>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
