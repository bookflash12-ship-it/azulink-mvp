import express from 'express';
import { v4 as uuid } from 'uuid';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();

router.use(requireAuth('admin'));

router.get('/', (req, res) => {
  const db = req.db;
  const stats = {
    users: db.data.users.filter(u => u.role === 'traveler').length,
    providers: db.data.providers.length,
    providersValidated: db.data.providers.filter(p => p.validated).length,
    providersPending: db.data.providers.filter(p => !p.validated).length,
    offers: db.data.offers.length,
    offersValidated: db.data.offers.filter(o => o.status === 'validated').length,
    offersPending: db.data.offers.filter(o => o.status === 'pending').length,
    bookings: db.data.bookings.length,
    bookingsPending: db.data.bookings.filter(b => b.status === 'pending').length,
    bookingsConfirmed: db.data.bookings.filter(b => b.status === 'confirmed').length
  };

  const byCategory = db.data.categories.map(c => ({
    name: c.name,
    count: db.data.offers.filter(o => o.categoryId === c.id).length
  }));

  const recentBookings = [...db.data.bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(b => ({ ...b, offer: db.data.offers.find(o => o.id === b.offerId) }));

  res.render('admin/dashboard', { title: 'Tableau de bord', stats, byCategory, recentBookings });
});

// ---------- Users ----------
router.get('/utilisateurs', (req, res) => {
  const db = req.db;
  res.render('admin/users', { title: 'Utilisateurs', users: db.data.users });
});

router.post('/utilisateurs/:id/supprimer', async (req, res) => {
  const db = req.db;
  if (req.params.id === res.locals.currentUser.id) {
    req.flash('error', 'Vous ne pouvez pas supprimer votre propre compte.');
    return res.redirect('/admin/utilisateurs');
  }
  db.data.users = db.data.users.filter(u => u.id !== req.params.id);
  await db.write();
  req.flash('success', 'Utilisateur supprimé.');
  res.redirect('/admin/utilisateurs');
});

// ---------- Providers ----------
router.get('/prestataires', (req, res) => {
  const db = req.db;
  const providers = db.data.providers.map(p => ({
    ...p,
    offersCount: db.data.offers.filter(o => o.providerId === p.id).length
  }));
  res.render('admin/providers', { title: 'Prestataires', providers });
});

router.post('/prestataires/:id/valider', async (req, res) => {
  const db = req.db;
  const provider = db.data.providers.find(p => p.id === req.params.id);
  if (provider) {
    provider.validated = true;
    await db.write();
    req.flash('success', `Prestataire "${provider.businessName}" validé.`);
  }
  res.redirect('/admin/prestataires');
});

router.post('/prestataires/:id/suspendre', async (req, res) => {
  const db = req.db;
  const provider = db.data.providers.find(p => p.id === req.params.id);
  if (provider) {
    provider.validated = false;
    await db.write();
    req.flash('success', `Prestataire "${provider.businessName}" suspendu.`);
  }
  res.redirect('/admin/prestataires');
});

// ---------- Offers ----------
router.get('/offres', (req, res) => {
  const db = req.db;
  const offers = db.data.offers.map(o => ({
    ...o,
    provider: db.data.providers.find(p => p.id === o.providerId),
    category: db.data.categories.find(c => c.id === o.categoryId)
  }));
  res.render('admin/offers', { title: 'Offres', offers });
});

router.post('/offres/:id/valider', async (req, res) => {
  const db = req.db;
  const offer = db.data.offers.find(o => o.id === req.params.id);
  if (offer) {
    offer.status = 'validated';
    await db.write();
    req.flash('success', `Offre "${offer.title}" validée.`);
  }
  res.redirect('/admin/offres');
});

router.post('/offres/:id/rejeter', async (req, res) => {
  const db = req.db;
  const offer = db.data.offers.find(o => o.id === req.params.id);
  if (offer) {
    offer.status = 'pending';
    offer.featured = false;
    await db.write();
    req.flash('success', `Offre "${offer.title}" mise en attente.`);
  }
  res.redirect('/admin/offres');
});

router.post('/offres/:id/vedette', async (req, res) => {
  const db = req.db;
  const offer = db.data.offers.find(o => o.id === req.params.id);
  if (offer) {
    offer.featured = !offer.featured;
    await db.write();
  }
  res.redirect('/admin/offres');
});

router.post('/offres/:id/supprimer', async (req, res) => {
  const db = req.db;
  db.data.offers = db.data.offers.filter(o => o.id !== req.params.id);
  await db.write();
  req.flash('success', 'Offre supprimée.');
  res.redirect('/admin/offres');
});

// ---------- Bookings ----------
router.get('/reservations', (req, res) => {
  const db = req.db;
  const bookings = [...db.data.bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(b => ({
      ...b,
      offer: db.data.offers.find(o => o.id === b.offerId),
      provider: db.data.providers.find(p => p.id === (db.data.offers.find(o => o.id === b.offerId) || {}).providerId)
    }));
  res.render('admin/bookings', { title: 'Réservations', bookings });
});

router.post('/reservations/:id/statut', async (req, res) => {
  const db = req.db;
  const { status } = req.body;
  const booking = db.data.bookings.find(b => b.id === req.params.id);
  if (booking) {
    booking.status = status;
    await db.write();
    req.flash('success', 'Statut mis à jour.');
  }
  res.redirect('/admin/reservations');
});

// ---------- Categories ----------
router.get('/categories', (req, res) => {
  const db = req.db;
  const categories = db.data.categories.map(c => ({
    ...c,
    offersCount: db.data.offers.filter(o => o.categoryId === c.id).length
  }));
  res.render('admin/categories', { title: 'Catégories', categories });
});

router.post('/categories/nouveau', async (req, res) => {
  const db = req.db;
  const { name, icon } = req.body;
  const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  db.data.categories.push({ id: uuid(), name, slug, icon: icon || 'bi-tag' });
  await db.write();
  req.flash('success', 'Catégorie ajoutée.');
  res.redirect('/admin/categories');
});

router.post('/categories/:id/supprimer', async (req, res) => {
  const db = req.db;
  if (db.data.offers.some(o => o.categoryId === req.params.id)) {
    req.flash('error', 'Impossible de supprimer : des offres utilisent cette catégorie.');
    return res.redirect('/admin/categories');
  }
  db.data.categories = db.data.categories.filter(c => c.id !== req.params.id);
  await db.write();
  req.flash('success', 'Catégorie supprimée.');
  res.redirect('/admin/categories');
});

export default router;
