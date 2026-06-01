'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { Book, Code, AlertTriangle, Zap, FileText } from 'lucide-react';

const readmeContent = `# Programmation Concurrente 2 - RabbitMQ Exam Cheat Sheet

> **Exam Context:** Consumer/Producer RabbitMQ implementation in D20.22 on Mac minis
> **Access:** Internet available, AI blocked
> **Format:** Repo clone in PyCharm, partial code to complete

## 🔗 Liens Utiles

- 📚 [Cours & Slides](https://concurp2-lecture.kube-ext.isc.heia-fr.ch/) - Théorie et diapositives
- 💻 [Code Snippets GitLab](https://gitlab.forge.hefr.ch/concurp/code-snippets) - Exemples de code
- 🧪 [Lab20 - Printer System](https://concurp2-lecture.kube-ext.isc.heia-fr.ch/labs/lab20/) - Système d'impression
- 🧪 [Lab21 - Translation RPC](https://concurp2-lecture.kube-ext.isc.heia-fr.ch/labs/lab21/) - Traducteur RPC
- 🧪 [Lab22](https://concurp2-lecture.kube-ext.isc.heia-fr.ch/labs/lab22/) - Lab 22

---

## Navigation Rapide

### 📚 Patterns Essentiels
- [Work Queue Pattern](/patterns/work-queue) - Distribution de tâches entre workers
- [Pub/Sub Pattern](/patterns/pubsub) - Broadcast à tous les consommateurs
- [Routing Pattern](/patterns/routing) - Routing direct avec clés
- [Topics Pattern](/patterns/topics) - Pattern matching avancé
- [RPC Pattern](/patterns/rpc) - Remote Procedure Call

### ⚠️ Problèmes Courants & Solutions
- [Messages Perdus](/problems/lost-messages) - Acknowledgments, persistence, durabilité
- [Message Ordering](/problems/ordering) - Garantir l'ordre des messages
- [Messages Dupliqués](/problems/duplicates) - Idempotence et déduplication
- [Deadlocks](/problems/deadlock) - Éviter les deadlocks producer/consumer
- [Performance Issues](/problems/performance) - Prefetch, connection pooling
- [Connection Failures](/problems/connection) - Reconnection, heartbeats
- [Memory Leaks](/problems/memory) - Channel management, cleanup

### 🔧 Code Snippets Pratiques
- [Configuration](/snippets/config) - Setup Pika + ConfigParser
- [Thread Safety](/snippets/threading) - Patterns multi-threading
- [Error Handling](/snippets/errors) - Try/catch patterns
- [Testing](/snippets/testing) - Comment tester RabbitMQ code

### 🎯 Préparation Examen
- [Tous les Exercices Possibles](/exercises/all) - 7 exercices complets type examen

---

## Table of Contents

1. [RabbitMQ Core Concepts](#rabbitmq-core-concepts)
2. [Python Pika Library](#python-pika-library)
3. [Producer/Consumer Patterns](#producerconsumer-patterns)
4. [Exchange Types](#exchange-types)
5. [Quick Reference](#quick-reference)

---

## RabbitMQ Core Concepts

### Message Broker Architecture

**Message Broker** = Service that validates, transforms, and routes messages in a distributed system

**Key Components:**
- **Producer** - Sends messages to exchanges
- **Exchange** - Routes messages to queues (like a post office)
- **Queue** - Stores messages until consumed (like a mailbox)
- **Consumer** - Receives and processes messages
- **Binding** - Rule connecting exchange to queue

**AMQP Protocol:**
- Messages published to **exchanges**
- Exchanges distribute to **queues** via **bindings**
- Broker delivers or consumers fetch messages

---

## Python Pika Library

### Installation

\`\`\`bash
pip install pika
poetry add pika
\`\`\`

### Basic Connection

\`\`\`python
import pika

conn_param = pika.ConnectionParameters(
    host='concurp1.isc.heia-fr.ch',
    port=5072,
    credentials=pika.PlainCredentials('guest', 'guest')
)

connection = pika.BlockingConnection(conn_param)
channel = connection.channel()
channel.queue_declare(queue='my_queue')

# Always close
connection.close()
\`\`\`

---

## Producer/Consumer Patterns

### Simple Producer

\`\`\`python
channel.basic_publish(
    exchange='',
    routing_key='task_queue',
    body=message.encode(),
    properties=pika.BasicProperties(delivery_mode=2)
)
\`\`\`

### Simple Consumer

\`\`\`python
def callback(ch, method, properties, body):
    print(f"Received: {body.decode()}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(
    queue='task_queue',
    on_message_callback=callback,
    auto_ack=False
)

channel.start_consuming()
\`\`\`

---

## Exchange Types

**Direct** - Exact key match → Unicast (point-to-point)

**Fanout** - Broadcast (ignore key) → Pub/Sub (broadcast)

**Topic** - Pattern match (\`*\`, \`#\`) → Filtered pub/sub

**Headers** - Header attributes → Complex routing rules

---

## Quick Reference

### Connection

\`\`\`python
pika.ConnectionParameters(host, port, credentials)
pika.BlockingConnection(params)
connection.channel()
\`\`\`

### Queue Operations

\`\`\`python
channel.queue_declare(queue, durable=True)
channel.queue_bind(exchange, queue, routing_key)
channel.queue_delete(queue)
\`\`\`

### Publish

\`\`\`python
channel.basic_publish(exchange, routing_key, body, properties)
\`\`\`

### Consume

\`\`\`python
channel.basic_consume(queue, on_message_callback, auto_ack)
channel.start_consuming()
\`\`\`

### Acknowledgment

\`\`\`python
ch.basic_ack(delivery_tag)      # Success
ch.basic_nack(delivery_tag)      # Failure, requeue
ch.basic_reject(delivery_tag)    # Reject single message
\`\`\`

---

## Exam Strategy

### Pre-Exam
- [ ] Arrive 10 min early
- [ ] Configure git credentials
- [ ] Clone repo, open PyCharm
- [ ] Test RabbitMQ connection

### During Exam
1. Read scenario (5 pages)
2. Identify pattern (Producer/Consumer, RPC, Work Queue)
3. Check provided code
4. Implement missing parts
5. Test incrementally

---

## School Server Config

\`\`\`python
HOST = 'concurp1.isc.heia-fr.ch'
PORT = 5072
USER = 'guest'
PASSWORD = 'guest'
\`\`\`

---

**Explore sub-pages above for deep-dive examples and problem solutions!**
`;

export default function HomePage() {
  const router = useRouter();

  const handleLogoClick = (e: React.MouseEvent) => {
    // Secret: shift + alt + click
    if (e.shiftKey && e.altKey) {
      router.push('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* GitLab Header */}
      <header className="border-b border-[#dbdbdb] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogoClick}
              className="text-2xl hover:opacity-80 transition-opacity"
              title="Repository"
            >
              📁
            </button>
            <div>
              <h1 className="text-lg font-semibold text-[#303030]">Programmation Concurrente</h1>
              <p className="text-xs text-[#707070]">RabbitMQ Exam Cheat Sheet</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/patterns/work-queue" className="px-3 py-1.5 text-sm border border-[#dbdbdb] rounded hover:bg-[#f0f0f0] flex items-center gap-1.5">
              <Code size={14} />
              Patterns
            </Link>
            <Link href="/problems/lost-messages" className="px-3 py-1.5 text-sm border border-[#dbdbdb] rounded hover:bg-[#f0f0f0] flex items-center gap-1.5">
              <AlertTriangle size={14} />
              Problems
            </Link>
          </div>
        </div>
      </header>

      {/* Quick Nav Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href="/patterns/work-queue" className="p-4 bg-white border border-[#dbdbdb] rounded hover:border-[#1068bf] hover:shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Code size={20} className="text-[#1068bf]" />
              <h3 className="font-semibold text-[#303030]">Patterns Essentiels</h3>
            </div>
            <p className="text-sm text-[#707070]">Work Queue, Pub/Sub, Routing, Topics, RPC</p>
          </Link>

          <Link href="/problems/lost-messages" className="p-4 bg-white border border-[#dbdbdb] rounded hover:border-[#e24329] hover:shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={20} className="text-[#e24329]" />
              <h3 className="font-semibold text-[#303030]">Problèmes Courants</h3>
            </div>
            <p className="text-sm text-[#707070]">Messages perdus, ordering, duplicates, deadlocks</p>
          </Link>

          <Link href="/snippets/config" className="p-4 bg-white border border-[#dbdbdb] rounded hover:border-[#6b4fbb] hover:shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={20} className="text-[#6b4fbb]" />
              <h3 className="font-semibold text-[#303030]">Code Snippets</h3>
            </div>
            <p className="text-sm text-[#707070]">Config, threading, errors, testing ready-to-copy</p>
          </Link>
        </div>

        {/* Main Content */}
        <article className="bg-white border border-[#dbdbdb] rounded p-6">
          <ReactMarkdown
            className="prose prose-sm max-w-none"
            components={{
              h1: ({ children }) => <h1 className="text-3xl font-bold mb-4 text-[#303030] border-b border-[#dbdbdb] pb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-semibold mt-8 mb-4 text-[#303030]">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-semibold mt-6 mb-3 text-[#303030]">{children}</h3>,
              p: ({ children }) => <p className="mb-4 text-[#303030] leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-outside ml-6 mb-4 space-y-1 text-[#303030]">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-1 text-[#303030]">{children}</ol>,
              blockquote: ({ children }) => <blockquote className="border-l-4 border-[#1068bf] pl-4 py-2 my-4 bg-[#f5f9fc] text-[#303030]">{children}</blockquote>,
              table: ({ children }) => <table className="w-full border-collapse border border-[#dbdbdb] my-4">{children}</table>,
              thead: ({ children }) => <thead className="bg-[#fafafa]">{children}</thead>,
              th: ({ children }) => <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">{children}</th>,
              td: ({ children }) => <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">{children}</td>,
              code: ({ inline, children, ...props }: any) => {
                return inline ? (
                  <code className="bg-[#2d2d2d] px-1.5 py-0.5 rounded text-sm text-[#e9c062] border border-[#444] font-mono" {...props}>{children}</code>
                ) : (
                  <code {...props}>{children}</code>
                );
              },
              pre: ({ children }: any) => (
                <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto my-4 font-mono text-sm leading-relaxed">{children}</pre>
              ),
              a: ({ children, href }) => {
                // Internal links
                if (href?.startsWith('/')) {
                  return <Link href={href} className="text-[#1068bf] hover:underline font-medium">{children}</Link>;
                }
                // External links
                return <a href={href} className="text-[#1068bf] hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>;
              },
              strong: ({ children }) => <strong className="font-semibold text-[#303030]">{children}</strong>,
              hr: () => <hr className="my-6 border-t border-[#dbdbdb]" />,
            }}
          >
            {readmeContent}
          </ReactMarkdown>
        </article>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#dbdbdb] mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-[#707070]">
            <p>© 2026 HES-SO Fribourg • Concurrent Programming Course</p>
            <div className="flex gap-4">
              <Link href="/patterns/work-queue" className="hover:text-[#1068bf]">Patterns</Link>
              <Link href="/problems/lost-messages" className="hover:text-[#1068bf]">Problems</Link>
              <Link href="/snippets/config" className="hover:text-[#1068bf]">Snippets</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
