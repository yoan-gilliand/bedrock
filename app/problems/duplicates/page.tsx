'use client';

import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function DuplicatesProblem() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#dbdbdb] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#1068bf] hover:underline flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </Link>
          <span className="text-[#707070]">/</span>
          <span className="text-[#303030] font-semibold">Duplicate Messages</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-[#dbdbdb] rounded p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle size={32} className="text-[#e24329]" />
            <h1 className="text-3xl font-bold text-[#303030]">Problem: Duplicate Messages</h1>
          </div>

          <div className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">Symptom</h2>
              <p className="text-[#303030] mb-4">
                Same message processed multiple times. Order created twice, email sent twice, payment charged twice.
              </p>
              <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4 my-4">
                <p className="text-sm text-[#303030]">
                  <strong>Impact:</strong> Data corruption, duplicate charges, angry users
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Root Causes</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">1. Consumer Crash After Processing, Before Ack</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Consumer processes message successfully, but crashes BEFORE sending ack. RabbitMQ redelivers message to another consumer.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`def callback(ch, method, properties, body):
    # Process message
    create_order(body)  # ✓ Order created in database

    # Crash here before ack (network failure, OOM, etc.)
    ch.basic_ack(delivery_tag=method.delivery_tag)  # Never reached

# Result: RabbitMQ redelivers -> create_order() called again -> duplicate order`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">2. Publisher Retry After Network Failure</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Message sent successfully, but network fails before confirmation received. Publisher retries, thinking it failed.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`try:
    channel.basic_publish(...)
    # Message actually delivered, but network dies before TCP ack
except Exception:
    # Publisher thinks it failed, retries
    channel.basic_publish(...)  # Duplicate!`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">3. Slow Processing + Connection Timeout</h3>
              <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-4">
                <p className="text-sm text-[#303030]">Consumer takes too long. RabbitMQ assumes consumer dead, redelivers to another consumer. Both process same message.</p>
              </div>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`def callback(ch, method, properties, body):
    # Takes 5 minutes (longer than heartbeat timeout)
    slow_operation(body)

    # Connection already closed by broker
    ch.basic_ack(...)  # Fails, message already redelivered

# Result: Another consumer also processing same message`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Solutions</h2>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">✅ Solution 1: Idempotent Operations</h3>
              <p className="text-[#303030] mb-4">Make processing safe to repeat. Same operation twice = same result.</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-semibold text-[#303030] mb-2">❌ Not Idempotent</p>
                  <pre className="bg-[#0d1117] text-[#e6edf3] p-3 rounded text-sm font-mono whitespace-pre-wrap">
{`def process(order_id):
    # Creates duplicate on retry
    db.execute("""
        INSERT INTO orders
        VALUES (?, ?)
    """, order_id, data)

def process(balance):
    # Charges twice
    balance -= 100
    return balance`}
                  </pre>
                </div>

                <div>
                  <p className="font-semibold text-[#303030] mb-2">✅ Idempotent</p>
                  <pre className="bg-[#0d1117] text-[#e6edf3] p-3 rounded text-sm font-mono whitespace-pre-wrap">
{`def process(order_id):
    # Safe to retry (INSERT IGNORE or ON CONFLICT DO NOTHING)
    db.execute("""
        INSERT INTO orders
        VALUES (?, ?)
        ON CONFLICT (order_id) DO NOTHING
    """, order_id, data)

def process(account_id, amount):
    # Deduplication check
    if not already_charged(account_id, transaction_id):
        charge(account_id, amount)
        mark_charged(transaction_id)`}
                  </pre>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 2: Deduplication with Message ID</h3>
              <p className="text-[#303030] mb-4">Track processed message IDs in database. Skip if already processed.</p>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import uuid

# Producer: Add unique message ID
msg_id = str(uuid.uuid4())
channel.basic_publish(
    ...,
    properties=pika.BasicProperties(message_id=msg_id),
    body=data
)

# Consumer: Check if already processed
def callback(ch, method, properties, body):
    msg_id = properties.message_id

    # Check dedup table
    if already_processed(msg_id):
        print(f"[!] Duplicate detected: {msg_id}")
        ch.basic_ack(delivery_tag=method.delivery_tag)
        return

    # Process message
    process_message(body)

    # Mark as processed
    mark_processed(msg_id)

    ch.basic_ack(delivery_tag=method.delivery_tag)

def already_processed(msg_id):
    return db.execute("SELECT 1 FROM processed_messages WHERE msg_id = ?", msg_id).fetchone()

def mark_processed(msg_id):
    db.execute("INSERT INTO processed_messages (msg_id, timestamp) VALUES (?, ?)", msg_id, time.time())`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 3: Transactional Processing</h3>
              <p className="text-[#303030] mb-4">Wrap processing + ack in database transaction. Both succeed or both fail.</p>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`def callback(ch, method, properties, body):
    msg_id = properties.message_id

    try:
        with db.transaction():
            # Check dedup
            if already_processed(msg_id):
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return

            # Process
            process_message(body)

            # Mark processed
            mark_processed(msg_id)

        # Only ack AFTER transaction commits
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        # Transaction rolled back, message redelivered
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 4: Business-Level Deduplication</h3>
              <p className="text-[#303030] mb-4">Use natural unique key from business logic (e.g., order_id, user_id + timestamp).</p>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`CREATE TABLE orders (
    order_id VARCHAR(255) PRIMARY KEY,  -- Unique constraint prevents duplicates
    user_id INT,
    amount DECIMAL,
    created_at TIMESTAMP
);

def process_order(order_data):
    try:
        db.execute("""
            INSERT INTO orders (order_id, user_id, amount, created_at)
            VALUES (?, ?, ?, ?)
        """, order_data['order_id'], ...)
    except IntegrityError:
        # Duplicate order_id, already processed
        print(f"[!] Order {order_data['order_id']} already exists")
        return  # Skip, don't fail`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3 mt-6">✅ Solution 5: Publisher Confirms (Prevent Publisher Retries)</h3>
              <p className="text-[#303030] mb-4">Get explicit confirmation from broker before considering message sent.</p>

              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`channel.confirm_delivery()

msg_id = str(uuid.uuid4())
try:
    channel.basic_publish(
        ...,
        properties=pika.BasicProperties(message_id=msg_id),
        body=data,
        mandatory=True
    )
    print(f"[✓] Message {msg_id} confirmed")
    # No need to retry
except pika.exceptions.UnroutableError:
    print(f"[✗] Message {msg_id} unroutable")
    # Handle error (don't blindly retry)
except pika.exceptions.NackError:
    print(f"[✗] Message {msg_id} nacked")
    # Handle error`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Complete Deduplication Example</h2>

              <h3 className="text-lg font-semibold text-[#303030] mb-3">Producer (with unique ID)</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika
import uuid
import json

connection = pika.BlockingConnection(...)
channel = connection.channel()
channel.confirm_delivery()

order = {
    "order_id": str(uuid.uuid4()),
    "user_id": 123,
    "amount": 99.99
}

channel.basic_publish(
    exchange='',
    routing_key='orders',
    properties=pika.BasicProperties(
        message_id=order["order_id"],
        delivery_mode=2
    ),
    body=json.dumps(order).encode(),
    mandatory=True
)

print(f"[✓] Order {order['order_id']} sent")`}
              </pre>

              <h3 className="text-lg font-semibold text-[#303030] mb-3 mt-6">Consumer (idempotent)</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import sqlite3
import json

db = sqlite3.connect('orders.db')
db.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY,
        user_id INT,
        amount REAL,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")

def callback(ch, method, properties, body):
    order = json.loads(body.decode())
    order_id = order['order_id']

    try:
        # Idempotent insert
        db.execute("""
            INSERT INTO orders (order_id, user_id, amount)
            VALUES (?, ?, ?)
            ON CONFLICT (order_id) DO NOTHING
        """, (order_id, order['user_id'], order['amount']))

        db.commit()

        if db.total_changes == 0:
            print(f"[!] Duplicate: {order_id}")
        else:
            print(f"[✓] Processed: {order_id}")

        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print(f"[✗] Error: {e}")
        db.rollback()
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

channel.basic_consume(queue='orders', on_message_callback=callback)
channel.start_consuming()`}
              </pre>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Testing Deduplication</h2>
              <ol className="list-decimal ml-6 space-y-3 text-[#303030]">
                <li>
                  <strong>Test Consumer Crash:</strong>
                  <ul className="list-disc ml-6 mt-2">
                    <li>Send message</li>
                    <li>Kill consumer after processing, before ack (Ctrl+C)</li>
                    <li>Start consumer again</li>
                    <li>Verify message processed only once (check database)</li>
                  </ul>
                </li>
                <li>
                  <strong>Test Redelivery Flag:</strong>
                  <ul className="list-disc ml-6 mt-2">
                    <li>Check <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">method.redelivered</code> flag in callback</li>
                    <li>Log when receiving redelivered messages</li>
                  </ul>
                </li>
                <li>
                  <strong>Stress Test:</strong>
                  <ul className="list-disc ml-6 mt-2">
                    <li>Send 1000 messages with random crashes</li>
                    <li>Count final database rows</li>
                    <li>Should equal exactly 1000 (no duplicates, no losses)</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Summary</h2>
              <table className="w-full border-collapse border border-[#dbdbdb] my-4">
                <thead className="bg-[#fafafa]">
                  <tr>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Strategy</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">When to Use</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Idempotent operations</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Always (best practice)</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Message ID deduplication</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">When operations can't be idempotent</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Transactional processing</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Multi-step operations</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Business-level dedup</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Natural unique keys exist</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Publisher confirms</td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Prevent publisher-side duplicates</td>
                  </tr>
                </tbody>
              </table>

              <div className="bg-[#d1ecf1] border-l-4 border-[#0c5460] p-4 my-4">
                <p className="text-sm text-[#303030]">
                  <strong>Golden Rule:</strong> At-least-once delivery is guaranteed. Exactly-once is YOUR responsibility via idempotence.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
