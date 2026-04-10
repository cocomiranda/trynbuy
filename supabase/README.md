# Supabase Workflow Setup

This app is moving from "derive state from Stripe sessions" to a proper Supabase-backed order lifecycle.

## 1. Run the schema

Open the Supabase SQL editor and run:

- [`supabase/migrations/20260410_orders_workflow.sql`](/Users/jameshecks/Documents/New%20project/supabase/migrations/20260410_orders_workflow.sql)

That creates:

- `profiles`
- `orders`
- `order_photos`
- `order_events`
- enums for order mode, status, delivery, inspection, photo stage, and event type
- RLS policies for authenticated users

## 2. Keep storage buckets

You still need these buckets:

- `trial-photos`
  - private
  - image MIME types only
- `trial-requests`
  - private
  - no image-only restriction

The current app still uses those buckets while we migrate the return/photo workflow into database tables.

## 3. Order lifecycle model

Recommended status flow:

- `checkout_pending`
- `trial_active`
- `trial_return_requested`
- `trial_pending_inspection`
- `trial_return_completed`
- `trial_converted_to_purchase`
- `purchase_paid`
- `purchase_to_be_delivered`
- `purchase_delivered`

## 4. What gets stored where

Use `orders` for:

- current status
- trial timing
- trial fee paid
- keep price
- remaining amount to buy
- guarantee hold amount
- Stripe session/payment IDs
- delivery and inspection states

Use `order_photos` for:

- before photos
- return photos
- file path and MIME metadata

Use `order_events` for:

- checkout started
- checkout completed
- return requested
- photo uploaded/deleted
- upgraded to purchase
- inspection updates
- delivery updates

## 5. Next code steps

After the schema is applied, the app refactor should happen in this order:

1. Add typed Supabase helpers for `orders`, `order_photos`, and `order_events`
2. Create draft orders before Stripe Checkout starts
3. Pass `order_id` into Stripe metadata
4. Add a Stripe webhook that updates `orders`
5. Change account pages to read from `orders`
6. Change photo uploads to create `order_photos` rows
7. Move return notes/status out of storage JSON and into `orders` / `order_events`

## 6. Required environment variables

For the current workflow implementation, configure:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `APP_URL`

## 7. Stripe webhook endpoint

Create a webhook in Stripe pointing to:

- `/api/stripe/webhook`

Listen to:

- `checkout.session.completed`
