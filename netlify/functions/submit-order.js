// =============================================================
// submit-order.js
//
// Netlify Function — runs on Netlify's servers, not in the browser.
// Receives the "Select ticket" form from index.html and stores a row
// in Netlify DB (Postgres, via the @netlify/neon package).
//
// ✏️ NOTHING in this file needs editing to get it working — Netlify
// DB wires up its own connection string automatically once you add
// a database to your site (see README for the one-time setup step).
//
// WHAT THIS DELIBERATELY DOES NOT DO:
// - It does not store the buyer's bank/card details — the form never
//   collects them in the first place.
// - It does not verify the payment actually happened. It just records
//   "this person says they paid, here's their reference number" so a
//   human (the admin) can check it against the real bank statement.
// =============================================================

import { getDatabase } from '@netlify/database';
const db = getDatabase();

// Runs once per cold start — makes sure the table exists before we try
// to insert into it. Safe to leave as-is.
async function ensureTable() {
  await db.sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      ticket_type TEXT NOT NULL,
      ticket_price TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      buyer_email TEXT NOT NULL,
      payment_ref TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { ticketType, ticketPrice, buyerName, buyerEmail, paymentRef } = body;

  // Basic server-side validation — never trust the browser alone.
  if (!ticketType || !buyerName || !buyerEmail || !paymentRef) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail);
  if (!emailLooksValid) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400 });
  }

  try {
    await ensureTable();

    await db.sql`
      INSERT INTO orders (ticket_type, ticket_price, buyer_name, buyer_email, payment_ref)
      VALUES (${ticketType}, ${ticketPrice}, ${buyerName}, ${buyerEmail}, ${paymentRef})
    `;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('submit-order error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
