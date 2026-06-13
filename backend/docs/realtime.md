# Realtime: WebSockets + Redis pub/sub

Quick-commerce demos live and die by perceived speed. To make order
progress feel instant, we push status changes to clients over WebSockets.
The same channel carries notifications.

## Why Redis, not in-memory?

A naive implementation keeps a `dict[user_id, set[WebSocket]]` in the
process. That works in dev with one uvicorn worker. The moment you run
two workers (or two replicas in K8s), it falls apart:

- The order service in worker A emits an event.
- The client is connected to worker B.
- B's in-memory dict never hears about it. The client sees nothing.

So we keep the WebSocket sockets local (they have to be — TCP is
point-to-point) but move the **fan-out** to Redis pub/sub. Every worker
subscribes to the channels its connected clients care about; every
publisher writes to Redis; every subscriber pulls and forwards.

## Channels

| Channel                        | Producer                              | Consumer                                 |
| ------------------------------ | ------------------------------------- | ---------------------------------------- |
| `qc:orders:{order_id}`         | order placement / transitions         | `/ws/orders/{order_id}` subscribers      |
| `qc:users:{user_id}:notifications` | notifications service              | `/ws/notifications` for that user        |

Channel names are built by `app.services.events.order_channel(...)` and
`user_notifications_channel(...)` so the prefix conventions live in one
place. The namespace (`qc`) is configurable via `REDIS_NAMESPACE`.

## Endpoints

```
ws://host/api/v1/ws/orders/{order_id}?token=<supabase-jwt>
ws://host/api/v1/ws/notifications?token=<supabase-jwt>
```

The token is passed via query string because browsers can't set headers
on a WebSocket. The server:

1. Accepts the socket.
2. Verifies the JWT (close 1008 if invalid).
3. Confirms Redis is configured (close 1011 if not).
4. For per-order sockets, checks the order belongs to the user.
5. Subscribes to the relevant Redis channels and forwards every event.

A keepalive `{"event": "ping"}` is sent every 25 seconds so flaky
proxies / load balancers don't time out the connection.

## Failure modes

| Situation                          | Behaviour                                              |
| ---------------------------------- | ------------------------------------------------------ |
| `REDIS_URL` not set                | Socket closes with code 1011 + reason. REST API works. |
| Redis goes down mid-session        | Subscriber yields an error; socket closes 1011.        |
| Publisher can't reach Redis        | Event is dropped (logged). The DB row is still written.|
| Two workers, two clients           | Both clients get every event — single source of truth. |

## Wire format

Every server→client message is one JSON object::

```json
{"event": "status_changed",
 "data": {"order_id": "abc", "status": "packed", "previous": "confirmed"}}

{"event": "notification",
 "data": {"id": "...", "type": "order_placed", "title": "Order placed!", ...}}

{"event": "ping"}
{"event": "error", "message": "..."}
```

Clients should always switch on `event` and ignore unknown event types.