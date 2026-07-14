import express from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();

router.use(requireAuth('traveler'));

router.get('/', (req, res) => {
  const db = req.db;
  const user = res.locals.currentUser;
  const bookings = db.data.bookings
    .filter(b => b.travelerId === user.id)
    .map(b => ({ ...b, offer: db.data.offers.find(o => o.id === b.offerId) }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const favoriteOffers = (user.favorites || [])
    .map(id => db.data.offers.find(o => o.id === id))
    .filter(Boolean)
    .map(o => ({ ...o, provider: db.data.providers.find(p => p.id === o.providerId) }));

  res.render('traveler/dashboard', { title: 'Mon compte', bookings, favoriteOffers });
});

router.post('/profil', async (req, res) => {
  const db = req.db;
  const user = db.data.users.find(u => u.id === res.locals.currentUser.id);
  const { name, phone } = req.body;
  user.name = name || user.name;
  user.phone = phone || user.phone;
  await db.write();
  req.flash('success', 'Profil mis à jour avec succès.');
  res.redirect('/mon-compte');
});

router.post('/mot-de-passe', async (req, res) => {
  const db = req.db;
  const user = db.data.users.find(u => u.id === res.locals.currentUser.id);
  const { currentPassword, newPassword } = req.body;
  if (!bcrypt.compareSync(currentPassword || '', user.passwordHash)) {
    req.flash('error', 'Mot de passe actuel incorrect.');
    return res.redirect('/mon-compte');
  }
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  await db.write();
  req.flash('success', 'Mot de passe modifié avec succès.');
  res.redirect('/mon-compte');
});

router.post('/favoris/:offerId', async (req, res) => {
  const db = req.db;
  const user = db.data.users.find(u => u.id === res.locals.currentUser.id);
  user.favorites = user.favorites || [];
  const idx = user.favorites.indexOf(req.params.offerId);
  if (idx >= 0) {
    user.favorites.splice(idx, 1);
  } else {
    user.favorites.push(req.params.offerId);
  }
  await db.write();
  const offer = db.data.offers.find(o => o.id === req.params.offerId);
  res.redirect(req.get('referer') || (offer ? '/offres/' + offer.slug : '/mon-compte'));
});

export default router;
