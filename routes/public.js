import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  const db = req.db;
  const featured = db.data.offers.filter(o => o.status === 'validated' && o.featured);
  const withProvider = (o) => ({ ...o, provider: db.data.providers.find(p => p.id === o.providerId), category: db.data.categories.find(c => c.id === o.categoryId) });
  res.render('public/home', {
    title: 'Accueil',
    featured: featured.map(withProvider),
    categories: db.data.categories,
    stats: {
      offers: db.data.offers.filter(o => o.status === 'validated').length,
      providers: db.data.providers.filter(p => p.validated).length,
      bookings: db.data.bookings.length
    }
  });
});

router.get('/a-propos', (req, res) => {
  res.render('public/about', { title: 'À propos' });
});

router.get('/hors-connexion', (req, res) => {
  res.render('public/offline', { title: 'Mode hors-connexion' });
});

router.get('/catalogue', (req, res) => {
  const db = req.db;
  const { categorie, q } = req.query;
  let offers = db.data.offers.filter(o => o.status === 'validated');
  if (categorie) {
    const cat = db.data.categories.find(c => c.slug === categorie);
    if (cat) offers = offers.filter(o => o.categoryId === cat.id);
  }
  if (q) {
    const query = q.toLowerCase();
    offers = offers.filter(o => o.title.toLowerCase().includes(query) || o.description.toLowerCase().includes(query));
  }
  const withProvider = (o) => ({ ...o, provider: db.data.providers.find(p => p.id === o.providerId), category: db.data.categories.find(c => c.id === o.categoryId) });
  res.render('public/catalogue', {
    title: 'Catalogue des expériences',
    offers: offers.map(withProvider),
    categories: db.data.categories,
    activeCategorie: categorie || '',
    q: q || ''
  });
});

router.get('/offres/:slug', (req, res) => {
  const db = req.db;
  const offer = db.data.offers.find(o => o.slug === req.params.slug);
  if (!offer) return res.status(404).render('404', { title: 'Offre introuvable' });
  const provider = db.data.providers.find(p => p.id === offer.providerId);
  const category = db.data.categories.find(c => c.id === offer.categoryId);
  const isFavorite = res.locals.currentUser && res.locals.currentUser.favorites && res.locals.currentUser.favorites.includes(offer.id);
  const similar = db.data.offers
    .filter(o => o.categoryId === offer.categoryId && o.id !== offer.id && o.status === 'validated')
    .slice(0, 3)
    .map(o => ({ ...o, provider: db.data.providers.find(p => p.id === o.providerId), category }));
  res.render('public/offer-detail', {
    title: offer.title,
    offer, provider, category, isFavorite, similar
  });
});

router.get('/devenir-partenaire', (req, res) => {
  res.render('public/become-partner', { title: 'Devenir partenaire' });
});

router.post('/devenir-partenaire', async (req, res) => {
  const db = req.db;
  const { name, businessName, type, email, phone, description } = req.body;
  const bcrypt = (await import('bcryptjs')).default;
  const { v4: uuid } = await import('uuid');

  if (db.data.users.find(u => u.email === email)) {
    req.flash('error', 'Un compte existe déjà avec cet email.');
    return res.redirect('/devenir-partenaire');
  }

  const tempPassword = Math.random().toString(36).slice(-8);
  const userId = uuid();
  db.data.users.push({
    id: userId, role: 'provider', name, email, phone,
    passwordHash: bcrypt.hashSync(tempPassword, 10), favorites: [], createdAt: new Date().toISOString()
  });
  db.data.providers.push({
    id: uuid(), userId, businessName, type, description, phone, email,
    validated: false, createdAt: new Date().toISOString(), stats: { views: 0, bookings: 0 }
  });
  db.data.notifications.push({
    id: uuid(), targetRole: 'admin', targetUserId: null,
    message: `Nouvelle demande de partenariat : "${businessName}"`, link: '/admin/prestataires',
    read: false, createdAt: new Date().toISOString()
  });
  await db.write();

  req.flash('success', `Votre demande a été envoyée ! Votre mot de passe temporaire est : ${tempPassword} (à changer après connexion). Votre profil sera activé après validation par notre équipe.`);
  res.redirect('/connexion');
});

export default router;
