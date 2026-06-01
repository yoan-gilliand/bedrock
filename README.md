# concurp2-lab21

The translator script that is usable in a classical Unix pipe. This project implements a RabbitMQ RPC-based word-by-word translator using Python.

## Features

- **Unix Pipe Compatibility:** Can be used within pipes (e.g., `cat input.txt | python3 src/translator.py | less`).
- **Punctuation Preservation:** Isolates punctuation, while spaces and digits to ensure the sentence structure is maintained.
- **Word-by-word Translation:** Sends each word individually to a RabbitMQ server for translation via RPC.

## Requirements

- Python 3.8+
- RabbitMQ server running locally or accessible via network
- `pika` library for RabbitMQ communication

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/concurp2-lab21.git
   cd concurp2-lab21
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure RabbitMQ connection in `config.yaml` if needed.

## Usage

### Basic Translation

```bash
cat input.txt | python3 src/translator.py | less
```

### Direct Input

```bash
echo "Hello world" | python3 src/translator.py
```

## Project Structure

```
concurp2-lab21/
├── src/
│   ├── translator.py    # Main translation script
│   └── rpc_client.py    # RabbitMQ RPC client
├── config.yaml          # Configuration file
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Configuration

Edit `config.yaml` to configure RabbitMQ connection:

```yaml
rabbitmq:
  host: localhost
  port: 5672
  queue: translation_queue
```

## License

MIT License

## Contributors

- Yoan Gilliand

---

<sub>Created on March 30, 2026 for Concurrent Programming course (2025-2026)</sub>
