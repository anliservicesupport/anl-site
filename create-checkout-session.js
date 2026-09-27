const Stripe = require('stripe');

const PRODUCT = {
  id: 'kit-nettoyage-clavier-6-en-1',
  name: 'Kit Nettoyage Clavier 6-en-1',
  unit_amount: 1099,
  currency: 'eur'
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Méthode non autorisée.' }) };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'STRIPE_SECRET_KEY est absente dans Netlify.' }) };
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const body = event.body ? JSON.parse(event.body) : {};
    const items = Array.isArray(body.items) ? body.items : [];
    const qty = items.reduce((n, x) => n + Math.max(0, Math.floor(Number(x.quantity) || 0)), 0);

    if (!qty) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Panier vide.' }) };
    }

    const safeQty = Math.min(20, qty);
    const origin = process.env.SITE_URL || `https://${event.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: PRODUCT.currency,
          product_data: { name: PRODUCT.name },
          unit_amount: PRODUCT.unit_amount
        },
        quantity: safeQty
      }],
      billing_address_collection: 'auto',
      shipping_address_collection: { allowed_countries: ['FR'] },
      phone_number_collection: { enabled: true },
      customer_creation: 'always',
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
      metadata: { product_id: PRODUCT.id, quantity: String(safeQty) }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erreur Stripe. Vérifie la configuration du serveur.' })
    };
  }
};
