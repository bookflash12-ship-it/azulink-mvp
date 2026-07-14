import express from 'express';
import { v4 as uuid } from 'uuid';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();

router.use(requireAuth('provider'));

function getProvider(db, userId) {
  return db.data.providers.find(p => p.userId === userId);
}

function slugify(str) {
  return str.toString().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

router.get('/', (req, res) => {
  const db = req.db;
  const provider = getProvider(db, res.locals.currentUser.id);
  if (!provider) return res.redirect('/');

  const offers = db.data.offers.filter(o => o.providerId === provider.id);
  const bookings = db.data.bookings
    .filter(b => offers.some(o => o.id === b.offerId))
    .map(b => ({ ...b, offer: offers.find(o => o.id === b.offerId) }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.render('provider/dashboard', {
    title: 'Espace prestataire', provider, offers,
    bookings: bookings.slice(0, 5),
    stats: {
      totalOffers: offers.length,
      validatedOffers: offers.filter(o => o.status === 'validated').length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      totalBookings: bookings.length
    }
  });
});

router.get('/profil', (req, res) => {
  const db = req.db;
  const provider = getProvider(db, res.locals.currentUser.id);
  res.render('provider/profile', { title: 'Mon profil prestataire', provider });
});

router.post('/profil', async (req, res) => {
  const db = req.db;
  const provider = getProvider(db, res.locals.currentUser.id);
  const { businessName, type, description, phone, email, availability } = req.body;
  provider.businessName = businessName || provider.businessName;
  provider.type = type || provider.type;
  provider.description = description || provider.description;
  provider.phone = phone || provider.phone;
  provider.email = email || provider.email;
  provider.availability = availability || provider.availability || '';
  await db.write();
  req.flash('success', 'Profil mis à jour avec succès.');
  res.redirect('/prestataire/profil');
});

router.get('/offres', (req, res) => {
  const db = req.db;
  const provider = getProvider(db, res.locals.currentUser.id);
  const offers = db.data.offers.filter(o => o.providerId === provider.id)
    .map(o => ({ ...o, category: db.data.categories.find(c => c.id === o.categoryId) }));
  res.render('provider/offers', { title: 'Mes offres', offers });
});

router.get('/offres/nouveau', (req, res) => {
  res.render('provider/offer-form', { title: 'Nouvelle offre', offer: null, categories: req.db.data.categories });
});

router.post('/offres/nouveau', async (req, res) => {
  const db = req.db;
  const provider = getProvider(db, res.locals.currentUser.id);
  const { title, categoryId, description, program, included, images, address, lat, lng, duration, price, practicalInfo } = req.body;

  let slug = slugify(title);
  let suffix = 1;
  while (db.data.offers.find(o => o.slug === slug)) {
    slug = slugify(title) + '-' + (++suffix);
  }

  const offer = {
    id: uuid(), providerId: provider.id, categoryId, title, slug,
    description, program: program || '',
    included: (included || '').split('\n').map(s => s.trim()).filter(Boolean),
    images: (images || '').split('\n').map(s => s.trim()).filter(Boolean),
    location: { lat: parseFloat(lat) || 32.9394, lng: parseFloat(lng) || -5.6675, address: address || '' },
    duration, price: parseFloat(price) || 0, currency: 'MAD',
    practicalInfo: practicalInfo || '',
    status: 'pending', featured: false, createdAt: new Date().toISOString()
  };
  db.data.offers.push(offer);

  db.data.notifications.push({
    id: uuid(), targetRole: 'admin', targetUserId: null,
    message: `Nouvelle offre "${title}" en attente de validation`, link: '/admin/offres',
    read: false, createdAt: new Date().toISOString()
  });

  await db.write();
  req.flash('success', 'Offre créée avec succès ! Elle sera visible après validation par notre équipe.');
  res.redirect('/prestataire/offres');
});

router.get('/offres/:id/modifier', (req, res) => {
  const db = req.db;
  const provider = getProvider(db, res.locals.currentUser.id);
  const offer = db.data.offers.find(o => o.id === req.params.id && o.providerId === provider.id);
  if (!offer) return res.status(404).render('404', { title: 'Offre introuvable' });
  res.render('provider/offer-form', { title: 'Modifier l\'offre', offer, categories: db.data.categories });
});

router.post('/offres/:id/modifier', async (req, res) => {
  const db = req.db;
  const provider = getProvider(db, res.locals.currentUser.id);
  const offer = db.data.offers.find(o => o.id === req.params.id && o.providerId === provider.id);
  if (!offer) return res.status(404).render('404', { title: 'Offre introuvable' });

  const { title, categoryId, description, program, included, images, address, lat, lng, duration, price, practicalInfo } = req.body;
  offer.title = title;
  offer.categoryId = categoryId;
  offer.description = description;
  offer.program = program || '';
  offer.included = (included || '').split('\n').map(s => s.trim()).filter(Boolean);
  offer.images = (images || '').split('\n').map(s => s.trim()).filter(Boolean);
  offer.location = { lat: parseFloat(lat) || offer.location.lat, lng: parseFloat(lng) || offer.location.lng, address: address || offer.location.address };
  offer.duration = duration;
  offer.price = parseFloat(price) || 0;
  offer.practicalInfo = practicalInfo || '';
  offer.status = 'pending'; // re-validation after edit

  await db.write();
  req.flash('success', 'Offre modifiée. Elle repasse en attente de validation.');
  res.redirect('/prestataire/offres');
});

router.post('/offres/:id/supprimer', async (req, res) => {
  const db = req.db;
  const provider = getProvider(db, res.locals.currentUser.id);
  db.data.offers = db.data.offers.filter(o => !(o.id === req.params.id && o.providerId === provider.id));
  await db.write();
  req.flash('success', 'Offre supprimée.');
  res.redirect('/prestataire/offres');
});

router.get('/reservations', (req, res) => {
  const db = req.db;
  const provider = getProvider(db, res.locals.currentUser.id);
  const offers = db.data.offers.filter(o => o.providerId === provider.id);
  const bookings = db.data.bookings
    .filter(b => offers.some(o => o.id === b.offerId))
    .map(b => ({ ...b, offer: offers.find(o => o.id === b.offerId) }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.render('provider/bookings', { title: 'Réservations reçues', bookings });
});

router.post('/reservations/:id/statut', async (req, res) => {
  const db = req.db;
  const { status } = req.body;
  const booking = db.data.bookings.find(b => b.id === req.params.id);
  if (booking) {
    booking.status = status;
    await db.write();
    req.flash('success', 'Statut de la réservation mis à jour.');
  }
  res.redirect('/prestataire/reservations');
});

export default router;
