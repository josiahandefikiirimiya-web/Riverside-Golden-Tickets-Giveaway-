// =============================================================
// get-orders.js
//
// Netlify Function — powers the admin page (admin.html). Returns
// every row in the "orders" table as JSON, so the admin can see who
// says they've paid, cross-check the reference number against the
// bank statement, and mark them confirmed.
//
// ✏️ SECURITY — READ THIS BEFORE DEPLOYING FOR REAL:
// This function checks for a secret token in the request header
// against an environment variable called ADMIN_TOKEN. That's a
// bare-minimum gate, not real authentication — anyone who has the
// token can read every buyer's name/email. For a real event:
//   - Set ADMIN_TOKEN in Netlify's dashboard (Site settings →
//     Environment variables) to a long random string — don't hardcode
//     it in this file or commit it to git.
//   - Consider Netlify Identity or a proper login system instead of
//     a single shared token, especially if more than one person
//     needs admin access.
// =============================================================

import { getDatabase } from '@netlify/database';
const db = getDatabase();

export default async (req) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Expect header: Authorization: Bearer <ADMIN_TOKEN>
  const authHeader = req.headers.get('authorization') || '';
  const providedToken = authHeader.replace('Bearer ', '').trim();
  const expectedToken = Netlify.env.get('ADMIN_TOKEN');

  if (!expectedToken) {
    // Fails closed: if you forgot to set ADMIN_TOKEN, this refuses
    // to serve data rather than accidentally leaving it open.
    return new Response(JSON.stringify({ error: 'ADMIN_TOKEN not configured on server' }), { status: 500 });
  }

  if (!providedToken || providedToken !== expectedToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const rows = await sql`
      SELECT id, ticket_type, ticket_price, buyer_name, buyer_email,
             payment_ref, status, created_at
      FROM orders
      ORDER BY created_at DESC
    `;

    return new Response(JSON.stringify({ orders: rows }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('get-orders error:', err);
    // If the table doesn't exist yet (no orders submitted at all),
    // just return an empty list instead of an error.
    return new Response(JSON.stringify({ orders: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
