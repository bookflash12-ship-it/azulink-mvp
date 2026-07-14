import express from 'express';
import { v4 as uuid } from 'uuid';
const router = express.Router();

router.post('/offres/:slug/reserver', async (req, res) => {
  const db = req.db;
  const offer = db.data.offers.find(o => o.slug === req.params.slug);
  if (!offer) return res.status(404).render('404', { title: 'Offre introuvable' });

  const { fullName, phone, email, date, participants, comments } = req.body;
  if (!fullName || !phone || !email || !date || !participants) {
    req.flash('error', 'Veuillez remplir tous les champs obligatoires de la réservation.');
    return res.redirect('/offres/' + offer.slug);
  }

  const booking = {
    id: uuid(),
    offerId: offer.id,
    travelerId: res.locals.currentUser && res.locals.currentUser.role === 'traveler' ? res.locals.currentUser.id : null,
    fullName, phone, email,
    date, participants: parseInt(participants, 10) || 1,
    comments: comments || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.data.bookings.push(booking);

  const provider = db.data.providers.find(p => p.id === offer.providerId);

  // Notify admin (gestionnaire de la plateforme)
  db.data.notifications.push({
    id: uuid(), targetRole: 'admin', targetUserId: null,
    message: `Nouvelle demande de réservation pour "${offer.title}" par ${fullName}`,
    link: '/admin/reservations', read: false, createdAt: new Date().toISOString()
  });

  // Notify provider
  if (provider) {
    db.data.notifications.push({
      id: uuid(), targetRole: 'provider', targetUserId: provider.userId,
      message: `Nouvelle demande de réservation pour "${offer.title}" par ${fullName}`,
      link: '/prestataire/reservations', read: false, createdAt: new Date().toISOString()
    });
    provider.stats = provider.stats || { views: 0, bookings: 0 };
    provider.stats.bookings += 1;
  }

  await db.write();

  req.flash('success', `Votre demande de réservation pour "${offer.title}" a bien été envoyée ! Le prestataire vous contactera prochainement au ${phone} ou par email pour confirmer.`);
  res.redirect('/offres/' + offer.slug);
});

export default router;
