ANL — paiement Stripe

IMPORTANT :
- Le fichier index.html ne contient PAS de clé secrète.
- La clé Stripe doit être ajoutée comme variable d'environnement STRIPE_SECRET_KEY sur l'hébergeur.
- SITE_URL peut être définie avec l'URL publique du site.
- Commence en mode TEST Stripe.

Le bouton de confirmation appelle /api/create-checkout-session puis redirige vers Stripe Checkout.
Le prix de 10,99 € est fixé côté serveur à 1099 centimes.
La livraison est configurée pour la France.
