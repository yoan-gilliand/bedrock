# Site Structure

## Home Page
- **/** - README cheat sheet with navigation cards to patterns/problems/snippets
- Secret link: Shift+Alt+Click on 📁 icon → /auth

## Authentication
- **/auth** - Login page (hidden, GitLab theme)
- **/utils** - Main dashboard with chat assistant (requires auth)

## Pattern Pages (/patterns/*)
1. **/patterns/work-queue** - Task distribution, round-robin, fair dispatch
2. **/patterns/pubsub** - Fanout exchange, broadcast to all consumers
3. **/patterns/routing** - Direct exchange, exact key matching
4. **/patterns/topics** - Topic exchange, wildcard patterns (* and #)
5. **/patterns/rpc** - Remote Procedure Call, request/response

## Problem Pages (/problems/*)
1. **/problems/lost-messages** - Acknowledgments, persistence, durability
2. **/problems/ordering** - Message sequence, redelivery, single consumer
3. **/problems/deadlock** - RPC cycles, blocking operations, timeouts
4. **/problems/performance** - prefetch_count, connection pooling, threading
5. **/problems/connection** - Auto-reconnect, heartbeats, error handling
6. **/problems/duplicates** - Idempotence, deduplication, message IDs
7. **/problems/memory** - (placeholder, can add if needed)

## Code Snippets (/snippets/*)
1. **/snippets/config** - ConfigParser, env vars, connection setup, threading, error handling, testing utils

## Navigation Flow
```
Home (/)
├── Quick Nav Cards → Patterns, Problems, Snippets
├── README Content (inline)
│   ├── Pattern links → /patterns/*
│   ├── Problem links → /problems/*
│   └── Snippet links → /snippets/*
├── Header Links → Patterns, Problems
└── Secret Login (Shift+Alt+Click 📁) → /auth → /utils (chat)
```

## Features
- All pages pixel-perfect GitLab UI clone
- Comprehensive RabbitMQ producer/consumer documentation
- Code examples ready to copy-paste
- Cross-linked navigation between related topics
- Hidden chat assistant for exam help
- Works offline (static content)

## Exam Coverage
✅ Work Queue pattern
✅ Pub/Sub (fanout)
✅ Routing (direct exchange)
✅ Topics (pattern matching)
✅ RPC pattern
✅ Message loss prevention
✅ Ordering guarantees
✅ Deadlock detection
✅ Performance tuning
✅ Connection resilience
✅ Duplicate handling
✅ Configuration patterns
✅ Threading best practices
✅ Error handling
✅ Testing strategies
