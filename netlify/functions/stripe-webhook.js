const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Méthode non autorisée'
    };
  }

  const signature = event.headers['stripe-signature'];

  if (!signature) {
    return {
      statusCode: 400,
      body: 'Signature Stripe manquante'
    };
  }

  let stripeEvent;

  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;

    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Signature webhook invalide:', err.message);

    return {
      statusCode: 400,
      body: 'Webhook invalide'
    };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    const amount = ((session.amount_total || 0) / 100).toFixed(2);

    const customerEmail =
      session.customer_details?.email || 'Email non disponible';

    console.log('💰 NOUVELLE COMMANDE', {
      session: session.id,
      amount,
      customerEmail
    });

    // Envoi du mail via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'ANL <onboarding@resend.dev>',
        to: ['anl.service.support@gmail.com'],
        subject: `💰 Nouvelle commande ANL — ${amount} €`,
        html: `
          <h2>💰 Nouvelle commande ANL</h2>
          <p><strong>Montant :</strong> ${amount} €</p>
          <p><strong>Email client :</strong> ${customerEmail}</p>
          <p><strong>Session Stripe :</strong> ${session.id}</p>
          <p>Le paiement a été confirmé par Stripe.</p>
        `
      })
    });

    if (!response.ok) {
      console.error('Erreur Resend:', await response.text());
    }
  }

  return {
    statusCode: 200,
    body: 'OK'
  };
};
