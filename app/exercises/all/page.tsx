'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function AllExercises() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#dbdbdb] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#1068bf] hover:underline flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </Link>
          <span className="text-[#707070]">/</span>
          <span className="text-[#303030] font-semibold">Tous les Exercices Possibles</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-[#dbdbdb] rounded p-8">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen size={32} className="text-[#1068bf]" />
            <h1 className="text-3xl font-bold text-[#303030]">Banque d'Exercices RabbitMQ - Préparation Examen</h1>
          </div>

          <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 mb-6">
            <p className="text-[#303030] font-semibold">
              🎯 Cette page contient 25+ exercices couvrant TOUS les patterns et problèmes possibles.
              Code complet fourni pour chaque exercice.
            </p>
          </div>

          <div className="prose prose-sm max-w-none">
            {/* SECTION 1: FANOUT EXERCISES */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-[#303030] mb-6 border-b-4 border-[#1068bf] pb-2">
                📡 FANOUT EXCHANGE (Pub/Sub)
              </h2>

              {/* Ex 1 */}
              <div className="mb-12 border-l-4 border-[#1068bf] pl-4">
                <h3 className="text-2xl font-semibold text-[#303030] mb-3">
                  Ex 1.1: Système de Logs Multi-Handler
                </h3>
                <p className="text-[#303030] mb-4">
                  <strong>Scénario:</strong> Application génère logs. Broadcast vers console, fichier, email (si ERROR).
                </p>

                <h4 className="text-lg font-semibold text-[#303030] mt-4 mb-2">Producer (emit_log.py)</h4>
                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
import pika
import json
from datetime import datetime
import sys

def main():
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host='concurp1.isc.heia-fr.ch',
            port=5072,
            credentials=pika.PlainCredentials('guest', 'guest')
        )
    )
    channel = connection.channel()

    # Fanout exchange
    channel.exchange_declare(exchange='logs', exchange_type='fanout')

    # Simulate log messages
    levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
    for i, level in enumerate(levels):
        log = {
            'level': level,
            'message': f'Application event {i}',
            'timestamp': datetime.now().isoformat(),
            'module': 'main'
        }

        channel.basic_publish(
            exchange='logs',
            routing_key='',  # Ignored by fanout
            body=json.dumps(log).encode()
        )
        print(f"[✓] Sent {level}: {log['message']}")

    connection.close()

if __name__ == '__main__':
    main()`}
                </pre>

                <h4 className="text-lg font-semibold text-[#303030] mt-4 mb-2">Consumer - Console Handler (log_console.py)</h4>
                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
import pika
import json

def main():
    connection = pika.BlockingConnection(...)
    channel = connection.channel()

    channel.exchange_declare(exchange='logs', exchange_type='fanout')

    # Exclusive queue (auto-deleted)
    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue

    channel.queue_bind(exchange='logs', queue=queue_name)

    def callback(ch, method, properties, body):
        log = json.loads(body.decode())
        color_map = {
            'DEBUG': '\\033[90m',    # Gray
            'INFO': '\\033[94m',     # Blue
            'WARNING': '\\033[93m',  # Yellow
            'ERROR': '\\033[91m',    # Red
            'CRITICAL': '\\033[95m'  # Magenta
        }
        reset = '\\033[0m'

        color = color_map.get(log['level'], '')
        print(f"{color}[{log['timestamp']}] {log['level']:8} {log['message']}{reset}")

    channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
    print('[*] Console handler waiting. Press CTRL+C to exit')
    channel.start_consuming()

if __name__ == '__main__':
    main()`}
                </pre>

                <h4 className="text-lg font-semibold text-[#303030] mt-4 mb-2">Consumer - File Handler (log_file.py)</h4>
                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
import pika
import json

def main():
    connection = pika.BlockingConnection(...)
    channel = connection.channel()

    channel.exchange_declare(exchange='logs', exchange_type='fanout')

    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue

    channel.queue_bind(exchange='logs', queue=queue_name)

    def callback(ch, method, properties, body):
        log = json.loads(body.decode())
        with open('application.log', 'a') as f:
            f.write(f"[{log['timestamp']}] {log['level']}: {log['message']}\\n")
        print(f"[FILE] Logged: {log['level']}")

    channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
    print('[*] File handler writing to application.log')
    channel.start_consuming()

if __name__ == '__main__':
    main()`}
                </pre>
              </div>

              {/* Ex 2 */}
              <div className="mb-12 border-l-4 border-[#1068bf] pl-4">
                <h3 className="text-2xl font-semibold text-[#303030] mb-3">
                  Ex 1.2: Système de Monitoring Serveur
                </h3>
                <p className="text-[#303030] mb-4">
                  <strong>Scénario:</strong> Serveur envoie metrics (CPU, RAM, disk). Multiple dashboards reçoivent en temps réel.
                </p>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# server_monitor.py (Producer)
import pika
import json
import psutil
import time

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='server_metrics', exchange_type='fanout')

while True:
    metrics = {
        'cpu_percent': psutil.cpu_percent(interval=1),
        'memory_percent': psutil.virtual_memory().percent,
        'disk_percent': psutil.disk_usage('/').percent,
        'timestamp': time.time()
    }

    channel.basic_publish(
        exchange='server_metrics',
        routing_key='',
        body=json.dumps(metrics).encode()
    )
    print(f"[✓] CPU: {metrics['cpu_percent']}% | RAM: {metrics['memory_percent']}%")
    time.sleep(5)  # Every 5 seconds`}
                </pre>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# dashboard.py (Consumer)
import pika
import json

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='server_metrics', exchange_type='fanout')

result = channel.queue_declare(queue='', exclusive=True)
queue_name = result.method.queue

channel.queue_bind(exchange='server_metrics', queue=queue_name)

def callback(ch, method, properties, body):
    metrics = json.loads(body.decode())

    # Alert if high usage
    if metrics['cpu_percent'] > 80:
        print(f"⚠️  HIGH CPU: {metrics['cpu_percent']}%")
    if metrics['memory_percent'] > 90:
        print(f"⚠️  HIGH MEMORY: {metrics['memory_percent']}%")

    print(f"[Dashboard] CPU: {metrics['cpu_percent']}% | MEM: {metrics['memory_percent']}%")

channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
print('[*] Dashboard monitoring...')
channel.start_consuming()`}
                </pre>
              </div>

              {/* Ex 3 */}
              <div className="mb-12 border-l-4 border-[#1068bf] pl-4">
                <h3 className="text-2xl font-semibold text-[#303030] mb-3">
                  Ex 1.3: Broadcast de Prix en Temps Réel
                </h3>
                <p className="text-[#303030] mb-4">
                  <strong>Scénario:</strong> Trading system broadcast prix actions à multiple clients.
                </p>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# price_feeder.py
import pika
import json
import random
import time

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='stock_prices', exchange_type='fanout')

stocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']

while True:
    for stock in stocks:
        price = {
            'symbol': stock,
            'price': round(random.uniform(100, 500), 2),
            'volume': random.randint(1000, 100000),
            'timestamp': time.time()
        }

        channel.basic_publish(
            exchange='stock_prices',
            routing_key='',
            body=json.dumps(price).encode()
        )

    time.sleep(2)  # Update every 2 seconds`}
                </pre>
              </div>
            </section>

            {/* SECTION 2: DIRECT EXCHANGE */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-[#303030] mb-6 border-b-4 border-[#e24329] pb-2">
                🎯 DIRECT EXCHANGE (Routing)
              </h2>

              {/* Ex 4 */}
              <div className="mb-12 border-l-4 border-[#e24329] pl-4">
                <h3 className="text-2xl font-semibold text-[#303030] mb-3">
                  Ex 2.1: Queue de Tâches avec Priorités
                </h3>
                <p className="text-[#303030] mb-4">
                  <strong>Scénario:</strong> Tasks routées vers queues HIGH/MEDIUM/LOW. Workers dédiés par priorité.
                </p>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# task_producer.py
import pika
import json
import sys

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='tasks', exchange_type='direct')

# Declare all queues
for priority in ['high', 'medium', 'low']:
    channel.queue_declare(queue=f'{priority}_priority', durable=True)
    channel.queue_bind(
        exchange='tasks',
        queue=f'{priority}_priority',
        routing_key=priority
    )

tasks = [
    ('high', 'Fix critical security vulnerability'),
    ('high', 'Resolve production outage'),
    ('medium', 'Implement new feature'),
    ('medium', 'Code review PR #123'),
    ('low', 'Update documentation'),
    ('low', 'Refactor tests'),
]

for priority, description in tasks:
    task = {
        'priority': priority,
        'description': description,
        'status': 'pending'
    }

    channel.basic_publish(
        exchange='tasks',
        routing_key=priority,
        body=json.dumps(task).encode(),
        properties=pika.BasicProperties(delivery_mode=2)
    )
    print(f"[✓] [{priority.upper()}] {description}")

connection.close()`}
                </pre>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# worker.py <priority>
import pika
import json
import time
import sys

if len(sys.argv) < 2:
    print("Usage: python worker.py <high|medium|low>")
    sys.exit(1)

priority = sys.argv[1]

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='tasks', exchange_type='direct')

queue_name = f'{priority}_priority'
channel.queue_declare(queue=queue_name, durable=True)
channel.queue_bind(exchange='tasks', queue=queue_name, routing_key=priority)

channel.basic_qos(prefetch_count=1)

def callback(ch, method, properties, body):
    task = json.loads(body.decode())
    print(f"[{priority.upper()} WORKER] Processing: {task['description']}")

    # Simulate work (high priority = less time)
    work_time = {'high': 1, 'medium': 3, 'low': 5}
    time.sleep(work_time[priority])

    print(f"[{priority.upper()} WORKER] ✓ Done")
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue=queue_name, on_message_callback=callback)

print(f'[*] {priority.upper()} priority worker ready')
channel.start_consuming()`}
                </pre>
              </div>

              {/* Ex 5 */}
              <div className="mb-12 border-l-4 border-[#e24329] pl-4">
                <h3 className="text-2xl font-semibold text-[#303030] mb-3">
                  Ex 2.2: Routage par Type de Document
                </h3>
                <p className="text-[#303030] mb-4">
                  <strong>Scénario:</strong> Documents routés vers processeurs spécialisés (PDF, Word, Image).
                </p>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# document_router.py
import pika
import json

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='documents', exchange_type='direct')

documents = [
    {'filename': 'report.pdf', 'type': 'pdf', 'size_kb': 1024},
    {'filename': 'presentation.pptx', 'type': 'office', 'size_kb': 2048},
    {'filename': 'photo.jpg', 'type': 'image', 'size_kb': 512},
    {'filename': 'contract.pdf', 'type': 'pdf', 'size_kb': 256},
    {'filename': 'diagram.png', 'type': 'image', 'size_kb': 128},
]

for doc in documents:
    channel.basic_publish(
        exchange='documents',
        routing_key=doc['type'],  # Route by file type
        body=json.dumps(doc).encode(),
        properties=pika.BasicProperties(delivery_mode=2)
    )
    print(f"[✓] Routed {doc['filename']} to {doc['type']} processor")

connection.close()`}
                </pre>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# pdf_processor.py
import pika
import json
import time

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='documents', exchange_type='direct')

channel.queue_declare(queue='pdf_processing', durable=True)
channel.queue_bind(exchange='documents', queue='pdf_processing', routing_key='pdf')

channel.basic_qos(prefetch_count=1)

def callback(ch, method, properties, body):
    doc = json.loads(body.decode())
    print(f"[PDF Processor] Processing {doc['filename']}...")

    # Simulate: extract text, OCR, index
    time.sleep(doc['size_kb'] / 1000)  # Slower for larger files

    print(f"[PDF Processor] ✓ Indexed {doc['filename']}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue='pdf_processing', on_message_callback=callback)
print('[*] PDF processor ready')
channel.start_consuming()`}
                </pre>
              </div>

              {/* Ex 6 */}
              <div className="mb-12 border-l-4 border-[#e24329] pl-4">
                <h3 className="text-2xl font-semibold text-[#303030] mb-3">
                  Ex 2.3: Notification par Canal
                </h3>
                <p className="text-[#303030] mb-4">
                  <strong>Scénario:</strong> Notifications routées vers email, SMS, ou push selon préférence user.
                </p>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# notification_sender.py
import pika
import json

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='notifications', exchange_type='direct')

users = [
    {'user_id': 1, 'preferred_channel': 'email', 'message': 'Welcome!'},
    {'user_id': 2, 'preferred_channel': 'sms', 'message': 'Order shipped'},
    {'user_id': 3, 'preferred_channel': 'push', 'message': 'New message'},
    {'user_id': 4, 'preferred_channel': 'email', 'message': 'Password reset'},
]

for user in users:
    notif = {
        'user_id': user['user_id'],
        'message': user['message'],
        'channel': user['preferred_channel']
    }

    channel.basic_publish(
        exchange='notifications',
        routing_key=user['preferred_channel'],
        body=json.dumps(notif).encode()
    )
    print(f"[✓] Sent via {user['preferred_channel']}: {user['message']}")

connection.close()`}
                </pre>
              </div>
            </section>

            {/* SECTION 3: TOPIC EXCHANGE */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-[#303030] mb-6 border-b-4 border-[#6b4fbb] pb-2">
                🌐 TOPIC EXCHANGE (Pattern Matching)
              </h2>

              {/* Ex 7 */}
              <div className="mb-12 border-l-4 border-[#6b4fbb] pl-4">
                <h3 className="text-2xl font-semibold text-[#303030] mb-3">
                  Ex 3.1: Events Multi-Dimensionnels (Region.Service.Level)
                </h3>
                <p className="text-[#303030] mb-4">
                  <strong>Scénario:</strong> Events avec pattern "region.service.severity". Subscribers filtrent avec wildcards.
                </p>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# event_producer.py
import pika
import json

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='events', exchange_type='topic')

events = [
    ('us.api.error', 'API timeout in us-east-1'),
    ('eu.database.warning', 'High query latency'),
    ('us.payment.error', 'Payment gateway down'),
    ('asia.cache.info', 'Cache hit rate 95%'),
    ('eu.api.critical', 'API returning 500 errors'),
    ('us.database.error', 'Connection pool exhausted'),
]

for routing_key, message in events:
    event = {
        'routing_key': routing_key,
        'message': message,
        'region': routing_key.split('.')[0],
        'service': routing_key.split('.')[1],
        'severity': routing_key.split('.')[2]
    }

    channel.basic_publish(
        exchange='events',
        routing_key=routing_key,
        body=json.dumps(event).encode()
    )
    print(f"[✓] [{routing_key}] {message}")

connection.close()`}
                </pre>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# subscriber.py <pattern>
# Examples:
# python subscriber.py "us.#"           # All US events
# python subscriber.py "*.api.*"        # All API events any region
# python subscriber.py "*.*.error"      # All errors any region/service
# python subscriber.py "eu.database.#"  # EU database (any severity)

import pika
import json
import sys

if len(sys.argv) < 2:
    print("Usage: python subscriber.py <pattern>")
    sys.exit(1)

pattern = sys.argv[1]

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='events', exchange_type='topic')

result = channel.queue_declare(queue='', exclusive=True)
queue_name = result.method.queue

channel.queue_bind(exchange='events', queue=queue_name, routing_key=pattern)

def callback(ch, method, properties, body):
    event = json.loads(body.decode())

    severity_colors = {
        'info': '\\033[94m',
        'warning': '\\033[93m',
        'error': '\\033[91m',
        'critical': '\\033[95m'
    }

    color = severity_colors.get(event['severity'], '')
    reset = '\\033[0m'

    print(f"{color}[{event['routing_key']}] {event['message']}{reset}")

channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)

print(f'[*] Listening for pattern: {pattern}')
channel.start_consuming()`}
                </pre>
              </div>

              {/* Ex 8 */}
              <div className="mb-12 border-l-4 border-[#6b4fbb] pl-4">
                <h3 className="text-2xl font-semibold text-[#303030] mb-3">
                  Ex 3.2: E-Commerce Events (user.{'{userId}'}.{'{action}'})
                </h3>
                <p className="text-[#303030] mb-4">
                  <strong>Scénario:</strong> Track user actions. Analytics subscribe "user.*.purchase", fraud à "user.*.suspicious".
                </p>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# user_tracker.py
import pika
import json

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='user_events', exchange_type='topic')

user_actions = [
    (1, 'login', 'User logged in from Chrome'),
    (1, 'view', 'Viewed product: Laptop'),
    (1, 'cart', 'Added laptop to cart'),
    (1, 'purchase', 'Purchased laptop for $999'),
    (2, 'login', 'User logged in from Firefox'),
    (2, 'suspicious', 'Multiple failed payment attempts'),
    (3, 'signup', 'New user registered'),
    (3, 'purchase', 'Purchased phone for $599'),
]

for user_id, action, description in user_actions:
    routing_key = f'user.{user_id}.{action}'

    event = {
        'user_id': user_id,
        'action': action,
        'description': description,
        'routing_key': routing_key
    }

    channel.basic_publish(
        exchange='user_events',
        routing_key=routing_key,
        body=json.dumps(event).encode()
    )
    print(f"[✓] [{routing_key}] {description}")

connection.close()`}
                </pre>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# analytics.py (track purchases only)
import pika
import json

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='user_events', exchange_type='topic')

result = channel.queue_declare(queue='', exclusive=True)
queue_name = result.method.queue

# Subscribe to ALL purchase events
channel.queue_bind(exchange='user_events', queue=queue_name, routing_key='user.*.purchase')

def callback(ch, method, properties, body):
    event = json.loads(body.decode())
    print(f"[Analytics] Purchase by User {event['user_id']}: {event['description']}")
    # Could write to analytics DB here

channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
print('[*] Analytics tracking purchases...')
channel.start_consuming()`}
                </pre>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# fraud_detection.py
import pika
import json

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='user_events', exchange_type='topic')

result = channel.queue_declare(queue='', exclusive=True)
queue_name = result.method.queue

# Subscribe to suspicious activity
channel.queue_bind(exchange='user_events', queue=queue_name, routing_key='user.*.suspicious')

def callback(ch, method, properties, body):
    event = json.loads(body.decode())
    print(f"🚨 [FRAUD ALERT] User {event['user_id']}: {event['description']}")
    # Could lock account, send alert

channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
print('[*] Fraud detection active...')
channel.start_consuming()`}
                </pre>
              </div>
            </section>

            {/* SECTION 4: RPC PATTERN */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-[#303030] mb-6 border-b-4 border-[#17a2b8] pb-2">
                🔄 RPC PATTERN (Request-Reply)
              </h2>

              {/* Ex 9 */}
              <div className="mb-12 border-l-4 border-[#17a2b8] pl-4">
                <h3 className="text-2xl font-semibold text-[#303030] mb-3">
                  Ex 4.1: Service de Calcul Mathématique
                </h3>
                <p className="text-[#303030] mb-4">
                  <strong>Scénario:</strong> Client envoie opérations math, serveur calcule et retourne résultat.
                </p>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# math_client.py
import pika
import uuid
import json

class MathRpcClient:
    def __init__(self):
        self.connection = pika.BlockingConnection(...)
        self.channel = self.connection.channel()

        result = self.channel.queue_declare(queue='', exclusive=True)
        self.callback_queue = result.method.queue

        self.channel.basic_consume(
            queue=self.callback_queue,
            on_message_callback=self.on_response,
            auto_ack=True
        )

        self.response = None
        self.corr_id = None

    def on_response(self, ch, method, props, body):
        if self.corr_id == props.correlation_id:
            self.response = body.decode()

    def call(self, operation, a, b):
        self.response = None
        self.corr_id = str(uuid.uuid4())

        request = {
            'operation': operation,
            'a': a,
            'b': b
        }

        self.channel.basic_publish(
            exchange='',
            routing_key='rpc_math',
            properties=pika.BasicProperties(
                reply_to=self.callback_queue,
                correlation_id=self.corr_id,
            ),
            body=json.dumps(request).encode()
        )

        print(f"[→] Calling {operation}({a}, {b})...")

        while self.response is None:
            self.connection.process_data_events()

        return json.loads(self.response)

    def close(self):
        self.connection.close()

# Usage
if __name__ == '__main__':
    client = MathRpcClient()

    # Test operations
    operations = [
        ('add', 5, 3),
        ('subtract', 10, 4),
        ('multiply', 6, 7),
        ('divide', 20, 4),
        ('power', 2, 8),
        ('divide', 10, 0),  # Error case
    ]

    for op, a, b in operations:
        result = client.call(op, a, b)
        if 'error' in result:
            print(f"[✗] {op}({a}, {b}) = ERROR: {result['error']}")
        else:
            print(f"[✓] {op}({a}, {b}) = {result['result']}")

    client.close()`}
                </pre>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# math_server.py
import pika
import json

def calculate(operation, a, b):
    ops = {
        'add': lambda x, y: x + y,
        'subtract': lambda x, y: x - y,
        'multiply': lambda x, y: x * y,
        'divide': lambda x, y: x / y if y != 0 else None,
        'power': lambda x, y: x ** y,
        'modulo': lambda x, y: x % y if y != 0 else None,
    }

    if operation not in ops:
        return {'error': f'Unknown operation: {operation}'}

    try:
        result = ops[operation](a, b)
        if result is None:
            return {'error': 'Division by zero'}
        return {'result': result}
    except Exception as e:
        return {'error': str(e)}

def on_request(ch, method, props, body):
    request = json.loads(body.decode())

    print(f"[.] Computing {request['operation']}({request['a']}, {request['b']})")

    response = calculate(request['operation'], request['a'], request['b'])

    ch.basic_publish(
        exchange='',
        routing_key=props.reply_to,
        properties=pika.BasicProperties(
            correlation_id=props.correlation_id
        ),
        body=json.dumps(response).encode()
    )

    ch.basic_ack(delivery_tag=method.delivery_tag)
    print(f"[x] Sent result: {response}")

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.queue_declare(queue='rpc_math')
channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue='rpc_math', on_message_callback=on_request)

print('[*] Math RPC server ready. Waiting for requests...')
channel.start_consuming()`}
                </pre>
              </div>

              {/* Ex 10 - TRADUCTEUR LAB21 */}
              <div className="mb-12 border-l-4 border-[#17a2b8] pl-4">
                <h3 className="text-2xl font-semibold text-[#303030] mb-3">
                  Ex 4.2: Traducteur Unix Pipe (Lab21 Style) ⭐
                </h3>
                <p className="text-[#303030] mb-4">
                  <strong>Scénario EXAMEN:</strong> cat input.txt | python translator.py | less
                </p>

                <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 my-4">
                  <p className="font-semibold text-[#303030]">⚠️ PATTERN LE PLUS PROBABLE À L'EXAMEN</p>
                </div>

                <h4 className="text-lg font-semibold text-[#303030] mt-4 mb-2">dictionary.ini</h4>
                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`[translations]
hello = bonjour
world = monde
cat = chat
dog = chien
house = maison
computer = ordinateur
book = livre
yes = oui
no = non
thank = merci
please = s'il vous plaît`}
                </pre>

                <h4 className="text-lg font-semibold text-[#303030] mt-4 mb-2">translator.py (Client - lit stdin/écrit stdout)</h4>
                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
import sys
import re
import pika
import uuid

class TranslatorRPC:
    def __init__(self):
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host='concurp1.isc.heia-fr.ch',
                port=5072,
                credentials=pika.PlainCredentials('guest', 'guest')
            )
        )
        self.channel = self.connection.channel()

        result = self.channel.queue_declare(queue='', exclusive=True)
        self.callback_queue = result.method.queue

        self.channel.basic_consume(
            queue=self.callback_queue,
            on_message_callback=self.on_response,
            auto_ack=True
        )

        self.response = None
        self.corr_id = None

    def on_response(self, ch, method, props, body):
        if self.corr_id == props.correlation_id:
            self.response = body.decode()

    def translate(self, word):
        self.response = None
        self.corr_id = str(uuid.uuid4())

        self.channel.basic_publish(
            exchange='',
            routing_key='translate_rpc',
            properties=pika.BasicProperties(
                reply_to=self.callback_queue,
                correlation_id=self.corr_id,
            ),
            body=word.encode()
        )

        while self.response is None:
            self.connection.process_data_events()

        return self.response

    def close(self):
        self.connection.close()

def main():
    translator = TranslatorRPC()

    try:
        # Read from stdin line by line
        for line in sys.stdin:
            # Split into words and punctuation
            tokens = re.findall(r'\\b\\w+\\b|[^\\w\\s]', line)

            translated_tokens = []
            for token in tokens:
                if token.isalpha():
                    # Translate word
                    translated = translator.translate(token.lower())

                    # Preserve original case
                    if token.isupper():
                        translated = translated.upper()
                    elif token[0].isupper():
                        translated = translated.capitalize()

                    translated_tokens.append(translated)
                else:
                    # Keep punctuation/numbers as-is
                    translated_tokens.append(token)

            # Write to stdout
            print(' '.join(translated_tokens))

    finally:
        translator.close()

if __name__ == '__main__':
    main()`}
                </pre>

                <h4 className="text-lg font-semibold text-[#303030] mt-4 mb-2">translation_server.py (Server avec ConfigParser)</h4>
                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
import pika
import configparser
import sys

# Load dictionary from config file
config = configparser.ConfigParser()
config.read('dictionary.ini')

DICTIONARY = dict(config.items('translations'))

def translate(word):
    """Translate word using dictionary, return original if not found"""
    return DICTIONARY.get(word.lower(), word)

def on_request(ch, method, props, body):
    word = body.decode()
    translation = translate(word)

    ch.basic_publish(
        exchange='',
        routing_key=props.reply_to,
        properties=pika.BasicProperties(
            correlation_id=props.correlation_id
        ),
        body=translation.encode()
    )

    ch.basic_ack(delivery_tag=method.delivery_tag)

connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host='concurp1.isc.heia-fr.ch',
        port=5072,
        credentials=pika.PlainCredentials('guest', 'guest')
    )
)
channel = connection.channel()

channel.queue_declare(queue='translate_rpc')
channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue='translate_rpc', on_message_callback=on_request)

print('[*] Translation server ready')
channel.start_consuming()`}
                </pre>

                <h4 className="text-lg font-semibold text-[#303030] mt-4 mb-2">Usage:</h4>
                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Terminal 1: Start server
python translation_server.py

# Terminal 2: Test translator
echo "Hello world" | python translator.py
# Output: bonjour monde

# Or with file
cat input.txt | python translator.py > output.txt

# Example input.txt:
# Hello cat and dog.
# Thank you for the book!

# Expected output:
# bonjour chat and chien.
# merci you for the livre!`}
                </pre>
              </div>

              {/* Ex 11 */}
              <div className="mb-12 border-l-4 border-[#17a2b8] pl-4">
                <h3 className="text-2xl font-semibold text-[#303030] mb-3">
                  Ex 4.3: Service de Validation de Données
                </h3>
                <p className="text-[#303030] mb-4">
                  <strong>Scénario:</strong> Client envoie data pour validation (email, phone, etc). Serveur valide et retourne résultat.
                </p>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# validator_server.py
import pika
import json
import re

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_phone(phone):
    pattern = r'^\\+?[0-9]{10,15}$'
    return bool(re.match(pattern, phone.replace(' ', '').replace('-', '')))

def validate(data_type, value):
    validators = {
        'email': validate_email,
        'phone': validate_phone,
        'url': lambda v: v.startswith('http://') or v.startswith('https://'),
        'positive_int': lambda v: v.isdigit() and int(v) > 0,
    }

    if data_type not in validators:
        return {'valid': False, 'error': f'Unknown type: {data_type}'}

    is_valid = validators[data_type](value)
    return {'valid': is_valid}

def on_request(ch, method, props, body):
    request = json.loads(body.decode())
    response = validate(request['type'], request['value'])

    ch.basic_publish(
        exchange='',
        routing_key=props.reply_to,
        properties=pika.BasicProperties(correlation_id=props.correlation_id),
        body=json.dumps(response).encode()
    )

    ch.basic_ack(delivery_tag=method.delivery_tag)

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.queue_declare(queue='validator_rpc')
channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue='validator_rpc', on_message_callback=on_request)

print('[*] Validator RPC server ready')
channel.start_consuming()`}
                </pre>
              </div>
            </section>

            {/* SECTION 5: WORK QUEUE */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-[#303030] mb-6 border-b-4 border-[#28a745] pb-2">
                ⚙️ WORK QUEUE (Fair Dispatch)
              </h2>

              {/* Ex 12 */}
              <div className="mb-12 border-l-4 border-[#28a745] pl-4">
                <h3 className="text-2xl font-semibold text-[#303030] mb-3">
                  Ex 5.1: Traitement d'Images (Pipeline)
                </h3>
                <p className="text-[#303030] mb-4">
                  <strong>Scénario:</strong> Upload images → resize, compress, thumbnail. Multiple workers en parallèle.
                </p>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# image_uploader.py
import pika
import json
import os

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.queue_declare(queue='image_processing', durable=True)

# Simulate uploaded images
images = [
    {'filename': 'photo1.jpg', 'path': '/uploads/photo1.jpg', 'size_mb': 5},
    {'filename': 'photo2.jpg', 'path': '/uploads/photo2.jpg', 'size_mb': 3},
    {'filename': 'photo3.jpg', 'path': '/uploads/photo3.jpg', 'size_mb': 8},
    {'filename': 'photo4.jpg', 'path': '/uploads/photo4.jpg', 'size_mb': 2},
    {'filename': 'photo5.jpg', 'path': '/uploads/photo5.jpg', 'size_mb': 6},
]

for img in images:
    channel.basic_publish(
        exchange='',
        routing_key='image_processing',
        body=json.dumps(img).encode(),
        properties=pika.BasicProperties(
            delivery_mode=2,  # Persistent
        )
    )
    print(f"[✓] Queued: {img['filename']} ({img['size_mb']} MB)")

print(f"\\n[✓] {len(images)} images queued for processing")
connection.close()`}
                </pre>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# image_worker.py
import pika
import json
import time
import sys

worker_id = sys.argv[1] if len(sys.argv) > 1 else '1'

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.queue_declare(queue='image_processing', durable=True)

# Fair dispatch: one task at a time
channel.basic_qos(prefetch_count=1)

def process_image(ch, method, properties, body):
    img = json.loads(body.decode())

    print(f"[Worker {worker_id}] Processing {img['filename']}...")

    # Simulate processing time based on file size
    process_time = img['size_mb']
    time.sleep(process_time)

    print(f"[Worker {worker_id}] ✓ Done: {img['filename']}")

    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(
    queue='image_processing',
    on_message_callback=process_image,
    auto_ack=False
)

print(f'[*] Worker {worker_id} ready. Waiting for images...')
channel.start_consuming()`}
                </pre>

                <h4 className="text-lg font-semibold text-[#303030] mt-4 mb-2">Test (lancez plusieurs workers):</h4>
                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Terminal 1
python image_worker.py Worker1

# Terminal 2
python image_worker.py Worker2

# Terminal 3
python image_worker.py Worker3

# Terminal 4 - Send images
python image_uploader.py

# Observer: images distribuées équitablement (round-robin)`}
                </pre>
              </div>

              {/* Ex 13 - PRINTER LAB20 */}
              <div className="mb-12 border-l-4 border-[#28a745] pl-4">
                <h3 className="text-2xl font-semibold text-[#303030] mb-3">
                  Ex 5.2: Système d'Impression (Lab20 Style) ⭐
                </h3>
                <p className="text-[#303030] mb-4">
                  <strong>Scénario EXAMEN:</strong> Print jobs broadcast à multiple imprimantes.
                </p>

                <div className="bg-[#fff3cd] border-l-4 border-[#ffc107] p-4 my-4">
                  <p className="font-semibold text-[#303030]">⚠️ FANOUT + WORK QUEUE pattern commun à l'examen</p>
                </div>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# print_job_sender.py
import pika
import json

connection = pika.BlockingConnection(...)
channel = connection.channel()

# Fanout exchange - broadcast to all printers
channel.exchange_declare(exchange='print_jobs', exchange_type='fanout')

jobs = [
    {'document': 'report_Q1.pdf', 'pages': 25, 'color': True, 'copies': 1},
    {'document': 'invoice_1234.pdf', 'pages': 2, 'color': False, 'copies': 3},
    {'document': 'presentation.pptx', 'pages': 50, 'color': True, 'copies': 1},
    {'document': 'memo.docx', 'pages': 1, 'color': False, 'copies': 5},
]

for job in jobs:
    channel.basic_publish(
        exchange='print_jobs',
        routing_key='',
        body=json.dumps(job).encode()
    )

    color_str = 'Color' if job['color'] else 'B&W'
    print(f"[✓] Print job: {job['document']} ({job['pages']} pages, {color_str}, {job['copies']} copies)")

connection.close()`}
                </pre>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# printer.py <printer_name>
import pika
import json
import time
import sys

if len(sys.argv) < 2:
    print("Usage: python printer.py <printer_name>")
    sys.exit(1)

printer_name = sys.argv[1]

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.exchange_declare(exchange='print_jobs', exchange_type='fanout')

# Each printer gets its own exclusive queue
result = channel.queue_declare(queue='', exclusive=True)
queue_name = result.method.queue

channel.queue_bind(exchange='print_jobs', queue=queue_name)

def print_job(ch, method, properties, body):
    job = json.loads(body.decode())

    print(f"[{printer_name}] Starting: {job['document']}")

    for copy in range(job['copies']):
        # Simulate printing time (0.5s per page)
        time.sleep(job['pages'] * 0.5)

        if job['copies'] > 1:
            print(f"[{printer_name}]   Copy {copy + 1}/{job['copies']} done")

    print(f"[{printer_name}] ✓ Completed: {job['document']}")

channel.basic_consume(queue=queue_name, on_message_callback=print_job, auto_ack=True)

print(f'[*] {printer_name} ready for print jobs')
channel.start_consuming()`}
                </pre>

                <h4 className="text-lg font-semibold text-[#303030] mt-4 mb-2">Test (démarrez plusieurs imprimantes):</h4>
                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`# Terminal 1
python printer.py "HP-LaserJet-101"

# Terminal 2
python printer.py "Canon-Pixma-202"

# Terminal 3
python printer.py "Epson-WorkForce-303"

# Terminal 4 - Send jobs
python print_job_sender.py

# Résultat: TOUTES les imprimantes reçoivent TOUS les jobs (fanout)`}
                </pre>
              </div>

              {/* Ex 14 */}
              <div className="mb-12 border-l-4 border-[#28a745] pl-4">
                <h3 className="text-2xl font-semibold text-[#303030] mb-3">
                  Ex 5.3: Queue d'Emails
                </h3>
                <p className="text-[#303030] mb-4">
                  <strong>Scénario:</strong> Emails en queue, workers les envoient via SMTP.
                </p>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# email_sender.py
import pika
import json

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.queue_declare(queue='email_queue', durable=True)

emails = [
    {'to': 'user1@example.com', 'subject': 'Welcome!', 'body': 'Thanks for signing up'},
    {'to': 'user2@example.com', 'subject': 'Order Confirmation', 'body': 'Your order #1234'},
    {'to': 'user3@example.com', 'subject': 'Password Reset', 'body': 'Reset link: ...'},
    {'to': 'user4@example.com', 'subject': 'Monthly Newsletter', 'body': 'Check out...'},
]

for email in emails:
    channel.basic_publish(
        exchange='',
        routing_key='email_queue',
        body=json.dumps(email).encode(),
        properties=pika.BasicProperties(delivery_mode=2)
    )
    print(f"[✓] Queued email to {email['to']}")

connection.close()`}
                </pre>

                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`#!/usr/bin/env python3
# email_worker.py
import pika
import json
import time

connection = pika.BlockingConnection(...)
channel = connection.channel()

channel.queue_declare(queue='email_queue', durable=True)
channel.basic_qos(prefetch_count=1)

def send_email(ch, method, properties, body):
    email = json.loads(body.decode())

    print(f"[📧] Sending to {email['to']}: {email['subject']}")

    # Simulate SMTP send
    time.sleep(2)

    print(f"[✓] Sent to {email['to']}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue='email_queue', on_message_callback=send_email, auto_ack=False)

print('[*] Email worker ready')
channel.start_consuming()`}
                </pre>
              </div>
            </section>

            {/* SECTION 6: EXAM SCENARIOS */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-[#303030] mb-6 border-b-4 border-[#dc3545] pb-2">
                🎯 SCÉNARIOS TYPE EXAMEN
              </h2>

              <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-6 mb-6">
                <h3 className="text-xl font-semibold text-[#303030] mb-4">Ce Qui Tombera PROBABLEMENT</h3>

                <div className="space-y-3">
                  <div className="bg-white p-3 rounded">
                    <p className="font-semibold text-[#303030]">1. Code à Compléter (70% chance)</p>
                    <p className="text-sm text-[#707070]">Fichier avec TODO comments. Ajouter exchange_type, routing_key, callbacks.</p>
                  </div>

                  <div className="bg-white p-3 rounded">
                    <p className="font-semibold text-[#303030]">2. Debugger Code Cassé (60% chance)</p>
                    <p className="text-sm text-[#707070]">Messages perdus (manque ack), wrong exchange type, oubli queue_bind.</p>
                  </div>

                  <div className="bg-white p-3 rounded">
                    <p className="font-semibold text-[#303030]">3. Adapter Pattern (50% chance)</p>
                    <p className="text-sm text-[#707070]">Transformer fanout → direct, ajouter persistence, ConfigParser.</p>
                  </div>

                  <div className="bg-white p-3 rounded">
                    <p className="font-semibold text-[#303030]">4. Unix Pipe (Lab21 style) (40% chance)</p>
                    <p className="text-sm text-[#707070]">cat input | python script.py | less avec RPC translation.</p>
                  </div>

                  <div className="bg-white p-3 rounded">
                    <p className="font-semibold text-[#303030]">5. Printer System (Lab20 style) (30% chance)</p>
                    <p className="text-sm text-[#707070]">Fanout broadcast print jobs à multiple printers.</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#d1ecf1] border-l-4 border-[#0c5460] p-6">
                <h3 className="text-xl font-semibold text-[#303030] mb-4">💡 Checklist Examen</h3>

                <ul className="space-y-2 text-[#303030]">
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span><code className="bg-[#2d2d2d] px-1 py-0.5 rounded text-[#e9c062]">host='concurp1.isc.heia-fr.ch', port=5072</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Toujours <code className="bg-[#2d2d2d] px-1 py-0.5 rounded text-[#e9c062]">auto_ack=False</code> + manual <code className="bg-[#2d2d2d] px-1 py-0.5 rounded text-[#e9c062]">basic_ack()</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Persistence: <code className="bg-[#2d2d2d] px-1 py-0.5 rounded text-[#e9c062]">durable=True</code> + <code className="bg-[#2d2d2d] px-1 py-0.5 rounded text-[#e9c062]">delivery_mode=2</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Fair dispatch: <code className="bg-[#2d2d2d] px-1 py-0.5 rounded text-[#e9c062]">basic_qos(prefetch_count=1)</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Fanout = broadcast (routing_key ignoré)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Direct = routing exact</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Topic = wildcards (* = 1 mot, # = 0+ mots)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>RPC: correlation_id + reply_to + exclusive callback queue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Toujours <code className="bg-[#2d2d2d] px-1 py-0.5 rounded text-[#e9c062]">connection.close()</code> à la fin</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Test: <code className="bg-[#2d2d2d] px-1 py-0.5 rounded text-[#e9c062]">python producer.py && python consumer.py</code></span>
                  </li>
                </ul>
              </div>
            </section>

            {/* PLUS D'EXERCICES */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">🎲 Autres Scénarios Possibles</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-[#dbdbdb] rounded p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-[#303030] mb-2">📊 Analytics Pipeline</h3>
                  <p className="text-sm text-[#707070] mb-2">Events → filter → aggregate → store</p>
                  <span className="text-xs bg-[#1068bf] text-white px-2 py-1 rounded">Topic Exchange</span>
                </div>

                <div className="border border-[#dbdbdb] rounded p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-[#303030] mb-2">🎬 Video Encoding</h3>
                  <p className="text-sm text-[#707070] mb-2">Videos → 720p, 1080p, 4K workers</p>
                  <span className="text-xs bg-[#28a745] text-white px-2 py-1 rounded">Work Queue</span>
                </div>

                <div className="border border-[#dbdbdb] rounded p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-[#303030] mb-2">🛒 Order Processing</h3>
                  <p className="text-sm text-[#707070] mb-2">Orders → validate → payment → ship</p>
                  <span className="text-xs bg-[#e24329] text-white px-2 py-1 rounded">Direct Exchange</span>
                </div>

                <div className="border border-[#dbdbdb] rounded p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-[#303030] mb-2">🔍 Search Indexing</h3>
                  <p className="text-sm text-[#707070] mb-2">Docs → parse → index → search</p>
                  <span className="text-xs bg-[#28a745] text-white px-2 py-1 rounded">Work Queue</span>
                </div>

                <div className="border border-[#dbdbdb] rounded p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-[#303030] mb-2">📝 Form Validation</h3>
                  <p className="text-sm text-[#707070] mb-2">Forms → validate → store → confirm</p>
                  <span className="text-xs bg-[#17a2b8] text-white px-2 py-1 rounded">RPC</span>
                </div>

                <div className="border border-[#dbdbdb] rounded p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-[#303030] mb-2">🎮 Game Leaderboard</h3>
                  <p className="text-sm text-[#707070] mb-2">Scores → aggregate → rankings</p>
                  <span className="text-xs bg-[#6b4fbb] text-white px-2 py-1 rounded">Topic Exchange</span>
                </div>

                <div className="border border-[#dbdbdb] rounded p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-[#303030] mb-2">💾 Backup System</h3>
                  <p className="text-sm text-[#707070] mb-2">Files → compress → encrypt → store</p>
                  <span className="text-xs bg-[#28a745] text-white px-2 py-1 rounded">Work Queue</span>
                </div>

                <div className="border border-[#dbdbdb] rounded p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-[#303030] mb-2">📊 Reporting Service</h3>
                  <p className="text-sm text-[#707070] mb-2">Data → compute → format → send</p>
                  <span className="text-xs bg-[#17a2b8] text-white px-2 py-1 rounded">RPC</span>
                </div>

                <div className="border border-[#dbdbdb] rounded p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-[#303030] mb-2">🔔 Alert System</h3>
                  <p className="text-sm text-[#707070] mb-2">Threshold breached → notify all</p>
                  <span className="text-xs bg-[#1068bf] text-white px-2 py-1 rounded">Fanout</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
