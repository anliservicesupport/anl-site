ANL — version prête pour Netlify + Stripe Checkout

1. Remplace les fichiers de ton projet par le contenu de ce dossier.
2. Dans Netlify > Project configuration > Environment variables, garde :
   Key: STRIPE_SECRET_KEY
   Value: ta clé Stripe TEST sk_test_...
3. Tu peux aussi ajouter :
   Key: SITE_URL
   Value: https://TON-SITE.netlify.app
4. Relance un nouveau déploiement Netlify.
5. Utilise Stripe en mode TEST pour faire le premier paiement.

La clé secrète n'est pas dans index.html.
Le serveur fixe le prix à 10,99 € et ne fait pas confiance au prix envoyé par le navigateur.
