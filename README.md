# Golden Ticket Draw — link preview prototype

A small static site built to demonstrate how **Open Graph / Twitter Card
tags** control the preview shown when this link is shared in iMessage,
Slack, WhatsApp, Discord, LinkedIn, X/Twitter, etc.

## Files

```
og-prototype/
├── index.html                      ← the page + all the meta tags (heavily commented)
├── admin.html                       ← token-gated page to view submitted orders
├── style.css                         ← all visual styling (ticket-stub theme)
├── netlify.toml                       ← Netlify config (commented)
├── package.json                        ← declares the @netlify/neon dependency
├── netlify/functions/
│   ├── submit-order.js                  ← saves a ticket confirmation to the DB
│   └── get-orders.js                     ← returns saved orders (admin.html uses this)
└── images/
    └── og-image.png                        ← the 1200x630 preview thumbnail
```

## What's editable

Every editable spot in `index.html` is marked with an `<!-- EDIT: ... -->` or
`✏️` comment right above it — event name, date, prize tiers, ticket prices,
etc. The meta tags you'll care about most are near the top of `<head>`,
clearly separated and explained line-by-line.

## Deploying to Netlify (when you're ready)

**This version needs Netlify CLI or a GitHub-connected deploy — not the
drag-and-drop uploader — because it has serverless functions and a
database.**

1. Push this folder to a GitHub repo, or install the Netlify CLI
   (`npm install -g netlify-cli`) and run `netlify deploy` from inside
   this folder
2. In the Netlify dashboard for your new site, go to **Project
   configuration → Environment variables** and add:
   - `ADMIN_TOKEN` — make up a long random string (e.g. from a password
     generator). This is what unlocks `admin.html`. **Keep it secret** —
     anyone with it can see every buyer's name/email.
3. Still in the dashboard, add a **Netlify Database** (Project →
   Database → "Add a database", or run `netlify db init` from the CLI).
   This automatically sets a `NETLIFY_DATABASE_URL` environment variable
   that `submit-order.js` and `get-orders.js` read from — no manual
   connection string needed.
4. Redeploy so the new environment variables and functions take effect
5. **Important:** open `index.html` and replace every
   `https://YOUR-SITE-NAME.netlify.app/` with your real Netlify URL —
   preview scrapers need a full, absolute URL for `og:image`, not a
   relative path
6. Visit `https://your-site.netlify.app/admin.html`, enter the
   `ADMIN_TOKEN` you set in step 2, and you should see the (empty)
   orders table. Submit a test ticket from the main page to confirm it
   shows up.

## Testing the preview

Once deployed, you can check exactly what each platform will render
before sharing it for real:

- **General / Facebook:** [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- **X / Twitter:** [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- **LinkedIn:** [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- **iMessage/Slack:** no public debugger — just paste the link and wait
  a few seconds; these apps cache aggressively, so a changed image may
  not update in an existing chat thread for a while

## How the order flow works

1. Buyer clicks a ticket tier → modal shows placeholder bank transfer
   details (✏️ edit these to your real account before going live)
2. Buyer fills in **their own name, email, and payment reference** —
   deliberately **not** their bank account/card numbers. Refunds
   should go back through the original payment method or be handled
   manually against the reference number, never by collecting a
   buyer's account details on a web form.
3. Submitting the form calls `submit-order.js`, which writes a row to
   the `orders` table in Netlify DB (auto-created on first submission)
4. You (the admin) open `admin.html`, enter `ADMIN_TOKEN`, and see
   every submission — cross-check the payment reference against your
   real bank statement, then mark it confirmed (this prototype doesn't
   include a "mark confirmed" button yet — see below)

## Security notes (read before using this for a real event)

- `admin.html` uses a single shared secret token, not real
  authentication. Fine for one organizer running a small event; not
  fine for a team — consider Netlify Identity or a proper login system
  if more than one person needs access.
- This form **does not verify payment actually happened** — it only
  records that someone *says* they paid, with a reference number for
  you to check manually. For automatic verification, you'd need a real
  payment processor (Stripe, PayPal) instead of bank-transfer
  instructions.
- Nothing here processes real money. Ticket prices, "payment" details,
  and the draw mechanics are placeholders for learning — replace the
  ✏️ marked fields with your real ones before using this for an actual
  event, and check your local raffle/lottery regulations first (many
  places require a permit for paid-entry prize draws).
