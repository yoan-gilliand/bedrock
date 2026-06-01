# Concurrent Programming 2 - RabbitMQ Exam Cheat Sheet

> **Exam Context:** Consumer/Producer RabbitMQ implementation in D20.22 on Mac minis  
> **Access:** Internet available, AI blocked  
> **Format:** Repo clone in PyCharm, partial code to complete  
> **Duration:** ~2-3 hours with 5-page detailed scenario

---

## Table of Contents

1. [RabbitMQ Core Concepts](#rabbitmq-core-concepts)
2. [Python Pika Library](#python-pika-library)
3. [Producer/Consumer Patterns](#producerconsumer-patterns)
4. [Exchange Types](#exchange-types)
5. [RPC Pattern](#rpc-pattern)
6. [Configuration & Connection](#configuration--connection)
7. [Complete Code Examples](#complete-code-examples)
8. [Lab20: Printer System](#lab20-printer-system)
9. [Lab21: Translation RPC](#lab21-translation-rpc)
10. [Common Patterns & Snippets](#common-patterns--snippets)
11. [Troubleshooting](#troubleshooting)
12. [Quick Reference Commands](#quick-reference-commands)

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

**AMQP Protocol (Advanced Message Queuing Protocol):**
- Messages published to **exchanges**
- Exchanges distribute to **queues** via **bindings**
- Broker delivers or consumers fetch messages

**Message Attributes:**
- Can be used for filtering
- Support acknowledgments (reliable delivery)
- Routing problem handling (dead-letter queues)

---

## Python Pika Library

### Installation

```bash
pip install pika
# or
poetry add pika
```

### Basic Connection Setup

```python
import pika

# Connection parameters
conn_param = pika.ConnectionParameters(
    host='concurp1.isc.heia-fr.ch',  # or 'localhost'
    port=5672,
    credentials=pika.PlainCredentials('guest', 'guest')
)

# Create connection
connection = pika.BlockingConnection(conn_param)

# Create channel
channel = connection.channel()

# Declare queue
channel.queue_declare(queue='my_queue')

# Always close connection when done
connection.close()
```

---

## Producer/Consumer Patterns

### Simple Producer

```python
import pika

QUEUE = 'task_queue'

# Setup connection
conn_param = pika.ConnectionParameters(host='localhost', port=5672)
connection = pika.BlockingConnection(conn_param)
channel = connection.channel()

# Declare queue (idempotent - creates if not exists)
channel.queue_declare(queue=QUEUE, durable=True)

# Publish message
message = "Hello World from Python!"
channel.basic_publish(
    exchange='',           # Default exchange (direct to queue)
    routing_key=QUEUE,     # Queue name
    body=message.encode(),  # Message content as bytes
    properties=pika.BasicProperties(
        delivery_mode=2,   # Make message persistent
    )
)

print(f"Sent: {message}")
connection.close()
```

### Simple Consumer with Callback

```python
import pika

QUEUE = 'task_queue'

def callback_func(ch, method, properties, body):
    """Called when message received"""
    print(f"Received: {body.decode()}")
    print(f"Channel: {ch}")
    print(f"Method: {method}")
    print(f"Properties: {properties}")
    
    # Process message here
    # ...
    
    # Manual acknowledgment (if auto_ack=False)
    ch.basic_ack(delivery_tag=method.delivery_tag)

# Setup
conn_param = pika.ConnectionParameters(host='localhost', port=5672)
connection = pika.BlockingConnection(conn_param)
channel = connection.channel()

channel.queue_declare(queue=QUEUE, durable=True)

# Set up consumer
channel.basic_consume(
    queue=QUEUE,
    on_message_callback=callback_func,
    auto_ack=False  # Manual acknowledgment for reliability
)

print('Waiting for messages. Press CTRL+C to exit.')

# Start consuming (blocks forever)
channel.start_consuming()
```

---

## Exchange Types

### 1. Direct Exchange

Routes messages to queues where **routing_key exactly matches** binding key.

```python
# Producer
channel.exchange_declare(exchange='direct_logs', exchange_type='direct')

channel.basic_publish(
    exchange='direct_logs',
    routing_key='error',  # Must match binding key
    body='Error message'
)

# Consumer
channel.queue_bind(
    exchange='direct_logs',
    queue=queue_name,
    routing_key='error'  # Only receives 'error' messages
)
```

**Use case:** Unicast routing (one specific destination)

### 2. Fanout Exchange

Routes messages to **ALL queues** bound to it. Routing key is **ignored**.

```python
# Producer
channel.exchange_declare(exchange='logs', exchange_type='fanout')

channel.basic_publish(
    exchange='logs',
    routing_key='',  # Ignored for fanout
    body='Broadcast message'
)

# Consumer
channel.queue_bind(exchange='logs', queue=queue_name)
# No routing_key needed - receives all messages
```

**Use case:** Broadcast (pub/sub pattern)

### 3. Topic Exchange

Routes based on **pattern matching** between routing key and binding pattern.

**Wildcards:**
- `*` = exactly one word
- `#` = zero or more words

```python
# Producer
channel.exchange_declare(exchange='topic_logs', exchange_type='topic')

channel.basic_publish(
    exchange='topic_logs',
    routing_key='kern.critical',
    body='A critical kernel error'
)

# Consumer
channel.queue_bind(
    exchange='topic_logs',
    queue=queue_name,
    routing_key='kern.*'  # Matches kern.critical, kern.info, etc.
)

# Another consumer
channel.queue_bind(
    exchange='topic_logs',
    queue=queue_name2,
    routing_key='*.critical'  # Matches kern.critical, auth.critical, etc.
)

# Catch-all consumer
channel.queue_bind(
    exchange='topic_logs',
    queue=queue_name3,
    routing_key='#'  # Matches everything
)
```

**Use case:** Multicast with filtering (pub/sub with topics)

### 4. Headers Exchange

Routes based on message headers instead of routing key.

```python
channel.exchange_declare(exchange='headers_exchange', exchange_type='headers')

channel.basic_publish(
    exchange='headers_exchange',
    routing_key='',
    body='Message',
    properties=pika.BasicProperties(
        headers={'format': 'pdf', 'type': 'report'}
    )
)

# Bind with header matching
channel.queue_bind(
    exchange='headers_exchange',
    queue=queue_name,
    arguments={'x-match': 'all', 'format': 'pdf', 'type': 'report'}
)
```

---

## RPC Pattern

**Remote Procedure Call** - Client sends request, waits for response.

### RPC Client

```python
import pika
import uuid

class RpcClient:
    def __init__(self):
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(host='localhost')
        )
        self.channel = self.connection.channel()
        
        # Declare callback queue for responses
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
            self.response = body
    
    def call(self, n):
        self.response = None
        self.corr_id = str(uuid.uuid4())
        
        self.channel.basic_publish(
            exchange='',
            routing_key='rpc_queue',
            properties=pika.BasicProperties(
                reply_to=self.callback_queue,
                correlation_id=self.corr_id,
            ),
            body=str(n)
        )
        
        # Wait for response
        while self.response is None:
            self.connection.process_data_events()
        
        return int(self.response)

# Usage
rpc = RpcClient()
result = rpc.call(30)
print(f"Result: {result}")
```

### RPC Server

```python
import pika

def fib(n):
    if n == 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fib(n-1) + fib(n-2)

def on_request(ch, method, props, body):
    n = int(body)
    print(f"Computing fib({n})")
    response = fib(n)
    
    # Send response back to client
    ch.basic_publish(
        exchange='',
        routing_key=props.reply_to,
        properties=pika.BasicProperties(
            correlation_id=props.correlation_id
        ),
        body=str(response)
    )
    
    ch.basic_ack(delivery_tag=method.delivery_tag)

# Setup
connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost')
)
channel = connection.channel()

channel.queue_declare(queue='rpc_queue')

channel.basic_consume(queue='rpc_queue', on_message_callback=on_request)

print("RPC Server waiting for requests")
channel.start_consuming()
```

---

## Configuration & Connection

### Using ConfigParser

```python
import configparser
import pika

# config.ini
"""
[broker]
host = concurp1.isc.heia-fr.ch
port = 5672
user = guest
pw = guest

[queues]
request_queue = my_requests
response_queue = my_responses
"""

config = configparser.ConfigParser()
config.read('config.ini')

# Connection
conn_param = pika.ConnectionParameters(
    host=config['broker']['host'],
    port=int(config['broker']['port']),
    credentials=pika.PlainCredentials(
        config['broker']['user'],
        config['broker']['pw']
    )
)

connection = pika.BlockingConnection(conn_param)
channel = connection.channel()
```

### School Server Config

```python
# For labs/exam
BROKER_CONFIG = {
    'host': 'concurp1.isc.heia-fr.ch',
    'port': 5072,  # Note: 5072 for school server
    'username': 'guest',
    'password': 'guest'
}
```

---

## Complete Code Examples

### Example 1: Work Queue (Task Distribution)

**Producer (send_tasks.py)**

```python
import pika
import sys

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost')
)
channel = connection.channel()

# Durable queue survives broker restart
channel.queue_declare(queue='task_queue', durable=True)

message = ' '.join(sys.argv[1:]) or "Hello World!"

channel.basic_publish(
    exchange='',
    routing_key='task_queue',
    body=message,
    properties=pika.BasicProperties(
        delivery_mode=2,  # Persistent message
    )
)

print(f"Sent: {message}")
connection.close()
```

**Worker (worker.py)**

```python
import pika
import time

def callback(ch, method, properties, body):
    print(f"Received: {body.decode()}")
    time.sleep(body.count(b'.'))  # Simulate work
    print("Done")
    ch.basic_ack(delivery_tag=method.delivery_tag)

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost')
)
channel = connection.channel()

channel.queue_declare(queue='task_queue', durable=True)

# Fair dispatch - don't give worker new task until it acks
channel.basic_qos(prefetch_count=1)

channel.basic_consume(
    queue='task_queue',
    on_message_callback=callback
)

print('Worker waiting for tasks. CTRL+C to exit.')
channel.start_consuming()
```

### Example 2: Publish/Subscribe (Logs)

**Publisher (emit_log.py)**

```python
import pika
import sys

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost')
)
channel = connection.channel()

# Fanout exchange broadcasts to all queues
channel.exchange_declare(exchange='logs', exchange_type='fanout')

message = ' '.join(sys.argv[1:]) or "info: Hello World!"

channel.basic_publish(
    exchange='logs',
    routing_key='',
    body=message
)

print(f"Sent: {message}")
connection.close()
```

**Subscriber (receive_logs.py)**

```python
import pika

def callback(ch, method, properties, body):
    print(f"Received: {body.decode()}")

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost')
)
channel = connection.channel()

channel.exchange_declare(exchange='logs', exchange_type='fanout')

# Exclusive queue - deleted when connection closes
result = channel.queue_declare(queue='', exclusive=True)
queue_name = result.method.queue

channel.queue_bind(exchange='logs', queue=queue_name)

channel.basic_consume(
    queue=queue_name,
    on_message_callback=callback,
    auto_ack=True
)

print('Waiting for logs. CTRL+C to exit.')
channel.start_consuming()
```

---

## Lab20: Printer System

### Architecture

**Components:**
- `printers.py` - Simulates printers (Type A and B)
- `server.py` - Manages printer allocation
- `clients.py` - Generates print jobs

**Flow:**
1. Client requests printer from server via broker
2. Server allocates available printer or queues request
3. Client sends document line-by-line to assigned printer
4. Printer processes lines (~15ms delay per line)
5. Client notifies server when finished

### Key Requirements

```python
# Queue naming: use username prefix
QUEUE_NAME = f"{username}_printer_requests"

# Output format
f"Client_{type} #{client_no}, {timestamp}, file {file_no}, line {line_no}"

# Example: printer_out/printerA-1.txt
```

### Server Pattern (Manager)

```python
import pika
import threading

class PrinterManager:
    def __init__(self):
        self.available_printers = {
            'A': [1, 2],  # Printer IDs
            'B': [1]
        }
        self.lock = threading.Lock()
    
    def allocate_printer(self, printer_type):
        with self.lock:
            if self.available_printers[printer_type]:
                return self.available_printers[printer_type].pop(0)
            return None
    
    def release_printer(self, printer_type, printer_id):
        with self.lock:
            self.available_printers[printer_type].append(printer_id)

def handle_request(ch, method, props, body):
    request = body.decode()  # e.g., "REQUEST:A" or "RELEASE:A:1"
    
    if request.startswith("REQUEST"):
        printer_type = request.split(':')[1]
        printer_id = manager.allocate_printer(printer_type)
        
        if printer_id:
            response = f"ALLOCATED:{printer_type}:{printer_id}"
        else:
            response = "WAIT"
        
        ch.basic_publish(
            exchange='',
            routing_key=props.reply_to,
            properties=pika.BasicProperties(
                correlation_id=props.correlation_id
            ),
            body=response
        )
    
    elif request.startswith("RELEASE"):
        _, printer_type, printer_id = request.split(':')
        manager.release_printer(printer_type, int(printer_id))
    
    ch.basic_ack(delivery_tag=method.delivery_tag)

manager = PrinterManager()

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='concurp1.isc.heia-fr.ch', port=5072)
)
channel = connection.channel()
channel.queue_declare(queue='printer_manager')
channel.basic_consume(queue='printer_manager', on_message_callback=handle_request)
channel.start_consuming()
```

---

## Lab21: Translation RPC

### Requirements

**Translator script:**
- Works as Unix pipe: `cat file.txt | python3 translator.py | less`
- Translates word-by-word via RPC
- Converts to lowercase
- Filters punctuation during RPC

### Command-Line Args

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('-f', '--from-lang', default='en', help='Source language')
parser.add_argument('-t', '--to-lang', default='fr', help='Target language')
args = parser.parse_args()

source_lang = args.from_lang
dest_lang = args.to_lang
```

### RPC Message Format

```python
# Request format: "msg_id:source_lang:dest_lang:word"
request = f"{msg_id}:en:fr:flower"

# Response format: "msg_id:translated_word"
response = "1234:fleur"
```

### Complete Translation Script

```python
#!/usr/bin/env python3
import pika
import sys
import uuid
import re

class TranslatorRPC:
    def __init__(self, source_lang, dest_lang):
        self.source_lang = source_lang
        self.dest_lang = dest_lang
        
        # Connect to broker
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host='concurp1.isc.heia-fr.ch',
                port=5072,
                credentials=pika.PlainCredentials('guest', 'guest')
            )
        )
        self.channel = self.connection.channel()
        
        # Callback queue
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
            # Parse response: "msg_id:translated_word"
            parts = body.decode().split(':', 1)
            if len(parts) == 2:
                self.response = parts[1]
    
    def translate_word(self, word):
        # Filter punctuation
        clean_word = re.sub(r'[^\w]', '', word)
        if not clean_word:
            return word
        
        self.response = None
        self.corr_id = str(uuid.uuid4())
        
        # Build request: "msg_id:source:dest:word"
        request = f"{self.corr_id}:{self.source_lang}:{self.dest_lang}:{clean_word}"
        
        self.channel.basic_publish(
            exchange='',
            routing_key='concurp-lab21',
            properties=pika.BasicProperties(
                reply_to=self.callback_queue,
                correlation_id=self.corr_id,
            ),
            body=request
        )
        
        # Wait for response
        while self.response is None:
            self.connection.process_data_events()
        
        return self.response.lower()

def main():
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument('-f', '--from-lang', default='en')
    parser.add_argument('-t', '--to-lang', default='fr')
    args = parser.parse_args()
    
    translator = TranslatorRPC(args.from_lang, args.to_lang)
    
    # Read from stdin
    for line in sys.stdin:
        words = line.split()
        translated_words = []
        
        for word in words:
            translated = translator.translate_word(word)
            translated_words.append(translated)
        
        print(' '.join(translated_words))

if __name__ == '__main__':
    main()
```

---

## Common Patterns & Snippets

### Thread-Safe Queue Operations

```python
import threading

class ThreadSafeQueue:
    def __init__(self):
        self.items = []
        self.lock = threading.Lock()
    
    def put(self, item):
        with self.lock:
            self.items.append(item)
    
    def get(self):
        with self.lock:
            if self.items:
                return self.items.pop(0)
            return None
```

### Clean Shutdown

```python
import signal
import sys

def signal_handler(sig, frame):
    print('Shutting down gracefully...')
    
    # Delete queues
    channel.queue_delete(queue='my_queue')
    
    # Close connection
    connection.close()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
```

### Multiple Consumers (Threading)

```python
import threading

def consumer_worker(queue_name, callback):
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host='localhost')
    )
    channel = connection.channel()
    channel.queue_declare(queue=queue_name)
    channel.basic_consume(
        queue=queue_name,
        on_message_callback=callback,
        auto_ack=True
    )
    channel.start_consuming()

# Start multiple consumers
threads = []
for i in range(3):
    t = threading.Thread(target=consumer_worker, args=('task_queue', my_callback))
    t.start()
    threads.append(t)

for t in threads:
    t.join()
```

### Message Properties

```python
properties = pika.BasicProperties(
    delivery_mode=2,        # 1=non-persistent, 2=persistent
    content_type='application/json',
    content_encoding='utf-8',
    headers={'x-custom': 'value'},
    correlation_id='abc123',
    reply_to='callback_queue',
    expiration='60000',     # TTL in milliseconds
    message_id='msg-001',
    timestamp=int(time.time()),
    type='order',
    user_id='guest',
    app_id='my-app'
)
```

---

## Troubleshooting

### Connection Issues

```python
# Test connection
try:
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host='localhost', port=5672)
    )
    print("Connected successfully")
    connection.close()
except pika.exceptions.AMQPConnectionError as e:
    print(f"Connection failed: {e}")
```

### Queue/Exchange Inspection

```bash
# Using rabbitmqadmin (if available)
rabbitmqadmin list queues
rabbitmqadmin list exchanges
rabbitmqadmin list bindings

# Management UI (web interface)
# http://localhost:15672
# Default: guest/guest
```

### Common Errors

**"queue not found"**
- Queue must be declared before use
- Ensure `queue_declare()` is called

**Messages not routing**
- Check exchange type matches binding pattern
- Verify routing_key matches binding_key
- For topic exchanges, check wildcards

**Consumer not receiving**
- Check `auto_ack` setting
- Verify `basic_consume()` was called
- Ensure `start_consuming()` is running

**Connection timeout**
- Check host/port
- Verify firewall rules
- Confirm RabbitMQ server is running

---

## Quick Reference Commands

### Pika Essential Methods

```python
# Connection
pika.ConnectionParameters(host, port, credentials)
pika.BlockingConnection(params)
connection.channel()
connection.close()

# Queue
channel.queue_declare(queue, durable, exclusive, auto_delete)
channel.queue_delete(queue)
channel.queue_bind(exchange, queue, routing_key)
channel.queue_purge(queue)

# Exchange
channel.exchange_declare(exchange, exchange_type, durable)
channel.exchange_delete(exchange)

# Publish
channel.basic_publish(exchange, routing_key, body, properties)

# Consume
channel.basic_consume(queue, on_message_callback, auto_ack)
channel.start_consuming()
channel.stop_consuming()

# Acknowledgment
channel.basic_ack(delivery_tag)
channel.basic_nack(delivery_tag, requeue)
channel.basic_reject(delivery_tag, requeue)

# QoS
channel.basic_qos(prefetch_count)
```

### Key Parameter Values

```python
# Exchange types
'direct'    # Exact routing key match
'fanout'    # Broadcast to all queues
'topic'     # Pattern matching
'headers'   # Header-based routing

# Delivery modes
1  # Non-persistent
2  # Persistent

# auto_ack
True   # Automatic acknowledgment (may lose messages)
False  # Manual acknowledgment (reliable)
```

---

## Exam Strategy

### Pre-Exam Checklist

- [ ] Arrive 10 minutes early
- [ ] Configure git credentials
- [ ] Clone provided repo
- [ ] Open in PyCharm
- [ ] Verify Python 3.11+ environment
- [ ] Test RabbitMQ connection to school server

### During Exam

1. **Read scenario thoroughly** (5 pages)
2. **Identify pattern**: Producer/Consumer, RPC, Work Queue, Pub/Sub
3. **Map components**: Which scripts are producers? Consumers? Both?
4. **Check provided code**: What's already implemented?
5. **Implement missing parts** using patterns above
6. **Test incrementally**: Don't write everything then test
7. **Use print() for debugging** (stderr if using pipes)

### Code Structure Tips

```python
# Start with config
import pika
import configparser

config = configparser.ConfigParser()
config.read('config.ini')

# Then connection
def get_connection():
    return pika.BlockingConnection(
        pika.ConnectionParameters(
            host=config['broker']['host'],
            port=int(config['broker']['port']),
            credentials=pika.PlainCredentials(
                config['broker']['user'],
                config['broker']['pw']
            )
        )
    )

# Then business logic
def main():
    connection = get_connection()
    channel = connection.channel()
    
    # Your code here
    
    connection.close()

if __name__ == '__main__':
    main()
```

---

## Additional Resources

### Official Docs
- RabbitMQ Tutorials: https://www.rabbitmq.com/tutorials
- Pika Documentation: https://pika.readthedocs.io
- AMQP Concepts: https://www.rabbitmq.com/tutorials/amqp-concepts.html

### Exchange Types Explained
- https://medium.com/trendyol-tech/rabbitmq-exchange-types-d7e1f51ec825

### School Server
- Host: `concurp1.isc.heia-fr.ch`
- Port: `5072`
- Credentials: `guest` / `guest`

---

**Good luck on your exam!** 🚀

*This cheat sheet contains everything you need for a consumer/producer RabbitMQ exam. Upload this file to the Analysis Assistant during the exam for instant access to all patterns, code snippets, and troubleshooting tips.*
