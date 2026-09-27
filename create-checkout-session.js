const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PRODUCT = {
  id: 'kit-nettoyage-clavier-6-en-1',
  name: 'Kit Nettoyage Clavier 6-en-1',
  unit_amount: 1099,
  currency: 'eur'
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({error:'Méthode non autorisée.'});
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const qty = Math.max(1, Math.min(20, items.reduce((n,x)=>n+Math.max(0,Math.floor(Number(x.quantity)||0)),0)));
    if (!qty) return res.status(400).json({error:'Panier vide.'});

    const origin = process.env.SITE_URL || `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: PRODUCT.currency,
          product_data: {name: PRODUCT.name},
          unit_amount: PRODUCT.unit_amount
        },
        quantity: qty
      }],
      billing_address_collection: 'auto',
      shipping_address_collection: {allowed_countries:['FR']},
      phone_number_collection: {enabled:true},
      customer_creation: 'always',
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
      metadata: {product_id: PRODUCT.id, quantity: String(qty)}
    });
    return res.status(200).json({url:session.url});
  } catch (e) {
    console.error(e);
    return res.status(500).json({error:'Erreur Stripe. Vérifie la configuration du serveur.'});
  }
};
