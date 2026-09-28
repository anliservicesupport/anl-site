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
      session.customer_details?.email || 'Non disponible';

    const customerName =
      session.customer_details?.name || 'Non disponible';

    const customerPhone =
      session.customer_details?.phone || 'Non disponible';

    const address = session.customer_details?.address;

    const addressLine1 = address?.line1 || 'Non disponible';
    const addressLine2 = address?.line2 || '';
    const city = address?.city || 'Non disponible';
    const postalCode = address?.postal_code || 'Non disponible';
    const country = address?.country || 'Non disponible';

    const quantity =
      session.metadata?.quantity || 'Non disponible';

    console.log('================================');
    console.log('💰 NOUVELLE COMMANDE ANL');
    console.log('================================');
    console.log('Client :', customerName);
    console.log('Email :', customerEmail);
    console.log('Téléphone :', customerPhone);
    console.log('Adresse :', addressLine1);
    console.log('Complément :', addressLine2);
    console.log('Ville :', city);
    console.log('Code postal :', postalCode);
    console.log('Pays :', country);
    console.log('Produit : Kit Nettoyage Clavier 6-en-1');
    console.log('Quantité :', quantity);
    console.log('Montant :', `${amount} €`);
    console.log('Session Stripe :', session.id);
    console.log('================================');

    // Tentative d'envoi via Resend.
    // Si Resend échoue, la commande reste quand même validée.
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch(
          'https://api.resend.com/emails',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`
            },
            body: JSON.stringify({
              from: 'ANL <onboarding@resend.dev>',
              to: ['anl.service.support@gmail.com'],
              subject: `Nouvelle commande ANL — ${amount} €`,
              html: `
                <h2>💰 Nouvelle commande ANL</h2>

                <h3>Client</h3>
                <p><strong>Nom :</strong> ${customerName}</p>
                <p><strong>Email :</strong> ${customerEmail}</p>
                <p><strong>Téléphone :</strong> ${customerPhone}</p>

                <h3>Livraison</h3>
                <p><strong>Adresse :</strong> ${addressLine1}</p>
                <p><strong>Complément :</strong> ${addressLine2}</p>
                <p><strong>Ville :</strong> ${city}</p>
                <p><strong>Code postal :</strong> ${postalCode}</p>
                <p><strong>Pays :</strong> ${country}</p>

                <h3>Commande</h3>
                <p><strong>Produit :</strong> Kit Nettoyage Clavier 6-en-1</p>
                <p><strong>Quantité :</strong> ${quantity}</p>
                <p><strong>Montant :</strong> ${amount} €</p>
                <p><strong>Session Stripe :</strong> ${session.id}</p>
              `
            })
          }
        );

        if (!response.ok) {
          console.error(
            'Resend a refusé l’envoi :',
            await response.text()
          );
        } else {
          console.log('📧 Email envoyé avec Resend.');
        }
      } catch (emailError) {
        console.error(
          'Erreur Resend :',
          emailError.message
        );
      }
    } else {
      console.log(
        'ℹ️ RESEND_API_KEY absente : email ignoré.'
      );
    }
  }

  return {
    statusCode: 200,
    body: 'OK'
  };
};
