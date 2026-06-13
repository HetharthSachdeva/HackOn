# Domain Model

## External (managed by upstream pipeline)

### `qcommerce_products`

| Column | Type | Notes |
|---|---|---|
| `asin` | varchar | PK; Amazon-style product ID |
| `title` | text | |
| `category` | varchar | Single category — categories are derived |
| `price` | decimal(10,2) | |
| `img_url` | text | |
| `stars` | float | |
| `reviews` | int | |
| `unit_size` | varchar | |
| `stock_qty` | int | |
| `in_stock` | bool | |
| `delivery_time_mins` | int | |
| `tags` | text | Likely comma-separated |
| `embedding` | vector(384) | `all-MiniLM-L6-v2` embedding of title+tags |

**Backend treats this read-only.** Alembic is configured to skip it.

## Internal (owned by this backend, created via Alembic)

Coming in Phase 2:

- `addresses(user_id, line1, line2, city, …)`
- `carts(user_id PK, created_at, updated_at)`
- `cart_items(user_id, asin, quantity)`
- `orders(id, user_id, status, total_amount, …)`
- `order_items(order_id, asin, quantity, unit_price_snapshot, title_snapshot)`
- `payments(order_id, provider, status, …)`
- `deliveries(order_id, slot_start, slot_end, status, eta_mins, …)`
- `missions(id, slug, title, description)`
- `mission_items(mission_id, asin, default_quantity)`
- `reorder_subscriptions(id, user_id, asin, cadence_days, next_run_at, …)`
- `reviews(id, user_id, asin, stars, body)`
- `notifications(id, user_id, type, payload, read_at)`
- `product_stats(asin, view_count, order_count)` _(optional)_

> **Note.** No FK constraints reference `qcommerce_products` so that table
> can be rebuilt independently. We validate ASIN existence in services.

## User identity

User identity comes from Supabase Auth. We **never** mirror passwords or
PII into our DB. The Supabase user UUID (the JWT `sub` claim) is what every
internal table references as `user_id`.
