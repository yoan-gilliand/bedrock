'use client';

import Link from 'next/link';
import { ArrowLeft, Code2 } from 'lucide-react';

export default function RPCPattern() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#dbdbdb] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#1068bf] hover:underline flex items-center gap-2">
            <ArrowLeft size={18} />
            Back to Home
          </Link>
          <span className="text-[#707070]">/</span>
          <span className="text-[#303030] font-semibold">RPC Pattern</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-[#dbdbdb] rounded p-8">
          <div className="flex items-center gap-3 mb-6">
            <Code2 size={32} className="text-[#1068bf]" />
            <h1 className="text-3xl font-bold text-[#303030]">RPC Pattern (Remote Procedure Call)</h1>
          </div>

          <div className="prose prose-sm max-w-none">
            {/* Overview */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4 border-b border-[#dbdbdb] pb-2">Overview</h2>
              <p className="text-[#303030] mb-4">
                RPC over RabbitMQ allows client to call remote function on server and wait for result. Client sends request message, blocks waiting for response. Server processes request and sends result back.
              </p>
              <div className="bg-[#f5f9fc] border-l-4 border-[#1068bf] p-4 my-4">
                <p className="text-sm text-[#303030] font-semibold">Use Case: Lab21 Translation Service</p>
                <ul className="list-disc ml-6 mt-2 space-y-1 text-[#303030]">
                  <li>Client sends word to translate</li>
                  <li>Server translates word using dictionary</li>
                  <li>Server returns translated word</li>
                  <li>Client displays result to user</li>
                </ul>
              </div>
            </section>

            {/* Architecture */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Architecture</h2>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`[Client] --request--> [rpc_queue] --> [Server]
    ^                                       |
    |                                       |
    +------- [reply_to_queue] <--response--+

Key Components:
1. rpc_queue: where server listens for requests
2. reply_to: unique queue per client for responses
3. correlation_id: UUID to match request with response`}
              </pre>

              <h3 className="text-xl font-semibold text-[#303030] mb-3">How It Works</h3>
              <ol className="list-decimal ml-6 space-y-2 text-[#303030]">
                <li>Client creates exclusive callback queue (auto-deleted when connection closes)</li>
                <li>Client sends request to <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">rpc_queue</code> with:
                  <ul className="list-disc ml-6 mt-1">
                    <li><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">reply_to</code> = callback queue name</li>
                    <li><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">correlation_id</code> = unique UUID</li>
                  </ul>
                </li>
                <li>Client blocks waiting for response on callback queue</li>
                <li>Server consumes from <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">rpc_queue</code>, processes request</li>
                <li>Server publishes response to <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">reply_to</code> queue with same <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">correlation_id</code></li>
                <li>Client receives response, matches <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">correlation_id</code>, returns result</li>
              </ol>
            </section>

            {/* Client Implementation */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">RPC Client Implementation</h2>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika
import uuid

class RpcClient:
    def __init__(self):
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host='concurp1.isc.heia-fr.ch',
                port=5072,
                credentials=pika.PlainCredentials('guest', 'guest')
            )
        )
        self.channel = self.connection.channel()

        # Create exclusive callback queue (auto-deleted when connection closes)
        result = self.channel.queue_declare(queue='', exclusive=True)
        self.callback_queue = result.method.queue

        # Listen for responses
        self.channel.basic_consume(
            queue=self.callback_queue,
            on_message_callback=self.on_response,
            auto_ack=True
        )

        self.response = None
        self.corr_id = None

    def on_response(self, ch, method, props, body):
        # Check if this response matches our request
        if self.corr_id == props.correlation_id:
            self.response = body.decode()

    def call(self, word):
        # Reset response
        self.response = None
        self.corr_id = str(uuid.uuid4())

        # Send request
        self.channel.basic_publish(
            exchange='',
            routing_key='rpc_queue',
            properties=pika.BasicProperties(
                reply_to=self.callback_queue,
                correlation_id=self.corr_id,
            ),
            body=word.encode()
        )

        # Wait for response (blocks here)
        while self.response is None:
            self.connection.process_data_events()

        return self.response

    def close(self):
        self.connection.close()

# Usage
rpc = RpcClient()
result = rpc.call("hello")
print(f"Translation: {result}")
rpc.close()`}
              </pre>
            </section>

            {/* Server Implementation */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">RPC Server Implementation</h2>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika

# Translation dictionary
DICTIONARY = {
    "hello": "bonjour",
    "world": "monde",
    "cat": "chat",
    "dog": "chien",
}

def translate(word):
    """Translate word using dictionary."""
    return DICTIONARY.get(word.lower(), word)  # Return original if not found

def on_request(ch, method, props, body):
    word = body.decode()
    print(f"[.] Translating '{word}'")

    # Perform translation
    response = translate(word)

    # Send response back to client's callback queue
    ch.basic_publish(
        exchange='',
        routing_key=props.reply_to,  # Client's callback queue
        properties=pika.BasicProperties(
            correlation_id=props.correlation_id  # Echo back correlation_id
        ),
        body=response.encode()
    )

    # Acknowledge request
    ch.basic_ack(delivery_tag=method.delivery_tag)
    print(f"[x] Sent translation: '{response}'")

# Setup
connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host='concurp1.isc.heia-fr.ch',
        port=5072,
        credentials=pika.PlainCredentials('guest', 'guest')
    )
)
channel = connection.channel()

# Declare RPC queue
channel.queue_declare(queue='rpc_queue')

# Fair dispatch
channel.basic_qos(prefetch_count=1)

# Start consuming
channel.basic_consume(
    queue='rpc_queue',
    on_message_callback=on_request
)

print("[*] Awaiting RPC requests. To exit press CTRL+C")
channel.start_consuming()`}
              </pre>
            </section>

            {/* Lab21 Translation Example */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Lab21: Unix Pipe Translator</h2>
              <p className="text-[#303030] mb-4">
                Lab21 builds translator that works in Unix pipes: <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">cat file.txt | python translator.py | less</code>
              </p>

              <h3 className="text-lg font-semibold text-[#303030] mb-3">Client (reads stdin, writes stdout)</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import sys
import re

# Create RPC client (same as above)
rpc = RpcClient()

# Read from stdin line by line
for line in sys.stdin:
    # Split into words, preserving punctuation
    words = re.findall(r'\\b\\w+\\b|[^\\w\\s]', line)

    translated_words = []
    for word in words:
        if word.isalpha():
            # Translate word via RPC
            translated = rpc.call(word)
            translated_words.append(translated)
        else:
            # Keep punctuation as-is
            translated_words.append(word)

    # Write to stdout
    print(' '.join(translated_words))

rpc.close()`}
              </pre>

              <h3 className="text-lg font-semibold text-[#303030] mb-3">Server with ConfigParser</h3>
              <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded border border-[#30363d] overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">
{`import pika
import configparser

# Load config.yaml
config = configparser.ConfigParser()
config.read('config.yaml')

DICTIONARY = dict(config.items('dictionary'))

def translate(word):
    return DICTIONARY.get(word.lower(), word)

# Same RPC server code as above...`}
              </pre>
            </section>

            {/* Critical Points */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Critical Configuration</h2>
              <table className="w-full border-collapse border border-[#dbdbdb] my-4">
                <thead className="bg-[#fafafa]">
                  <tr>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Setting</th>
                    <th className="border border-[#dbdbdb] px-4 py-2 text-left font-semibold text-[#303030]">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">exclusive=True</code></td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Callback queue auto-deleted when client disconnects</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">correlation_id</code></td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Match response with request (allows parallel calls)</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">reply_to</code></td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Tell server where to send response</td>
                  </tr>
                  <tr>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]"><code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">process_data_events()</code></td>
                    <td className="border border-[#dbdbdb] px-4 py-2 text-[#303030]">Non-blocking event loop (allows waiting for response)</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Common Pitfalls */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Common Pitfalls</h2>
              <div className="space-y-4">
                <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4">
                  <p className="font-semibold text-[#303030] mb-2">❌ Not checking correlation_id</p>
                  <p className="text-sm text-[#303030]">Multiple parallel calls can return responses out-of-order. Always verify <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">correlation_id</code> matches.</p>
                </div>

                <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4">
                  <p className="font-semibold text-[#303030] mb-2">❌ Forgetting to ack on server</p>
                  <p className="text-sm text-[#303030]">Server must acknowledge request after sending response. Otherwise message redelivered.</p>
                </div>

                <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4">
                  <p className="font-semibold text-[#303030] mb-2">❌ Client timeout not implemented</p>
                  <p className="text-sm text-[#303030]">If server crashes, client blocks forever. Add timeout to <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-sm">process_data_events()</code>.</p>
                </div>

                <div className="bg-[#f8d7da] border-l-4 border-[#dc3545] p-4">
                  <p className="font-semibold text-[#303030] mb-2">❌ Using same connection for multiple clients</p>
                  <p className="text-sm text-[#303030]">Each client needs own connection and callback queue. Sharing causes response mix-ups.</p>
                </div>
              </div>
            </section>

            {/* Testing */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">How to Test</h2>
              <ol className="list-decimal ml-6 space-y-3 text-[#303030]">
                <li>
                  <strong>Basic RPC:</strong>
                  <pre className="bg-[#0d1117] text-[#e6edf3] p-3 rounded text-sm font-mono mt-2">
{`# Terminal 1: Start server
python rpc_server.py

# Terminal 2: Test client
python rpc_client.py`}
                  </pre>
                </li>
                <li>
                  <strong>Unix Pipe (Lab21):</strong>
                  <pre className="bg-[#0d1117] text-[#e6edf3] p-3 rounded text-sm font-mono mt-2">
{`echo "hello world" | python translator.py
cat input.txt | python translator.py | less`}
                  </pre>
                </li>
                <li>
                  <strong>Load Test:</strong>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Start 3 server instances (parallel processing)</li>
                    <li>Send 100 RPC calls from client</li>
                    <li>Verify all responses received correctly</li>
                  </ul>
                </li>
              </ol>
            </section>

            {/* Related */}
            <section>
              <h2 className="text-2xl font-semibold text-[#303030] mb-4">Related Patterns</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/patterns/work-queue" className="p-4 border border-[#dbdbdb] rounded hover:border-[#1068bf] hover:shadow-sm transition-all">
                  <h3 className="font-semibold text-[#303030] mb-2">Work Queue Pattern</h3>
                  <p className="text-sm text-[#707070]">Fire-and-forget task distribution</p>
                </Link>

                <Link href="/problems/deadlock" className="p-4 border border-[#dbdbdb] rounded hover:border-[#e24329] hover:shadow-sm transition-all">
                  <h3 className="font-semibold text-[#303030] mb-2">Deadlock Problem</h3>
                  <p className="text-sm text-[#707070]">RPC call cycles can cause deadlocks</p>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
