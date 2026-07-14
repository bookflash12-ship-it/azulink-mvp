import { initDb } from './db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

function hash(pw) {
  return bcrypt.hashSync(pw, 10);
}

async function seed() {
  const db = await initDb();

  const now = new Date().toISOString();

  // ---------- Categories ----------
  const categories = [
    { id: uuid(), name: 'Circuits nature et montagne', slug: 'circuits-nature', icon: 'bi-tree' },
    { id: uuid(), name: 'Hébergements', slug: 'hebergements', icon: 'bi-house-heart' },
    { id: uuid(), name: "Activités d'animation", slug: 'activites-animation', icon: 'bi-stars' },
    { id: uuid(), name: 'Activités culturelles', slug: 'activites-culturelles', icon: 'bi-bank' },
    { id: uuid(), name: 'Artisanat local', slug: 'artisanat-local', icon: 'bi-palette' },
    { id: uuid(), name: 'Expériences immersives', slug: 'experiences-immersives', icon: 'bi-camera-reels' },
    { id: uuid(), name: 'Offres partenaires', slug: 'offres-partenaires', icon: 'bi-handshake' }
  ];
  db.data.categories = categories;
  const catId = (slug) => categories.find(c => c.slug === slug).id;

  // ---------- Users ----------
  const adminUser = {
    id: uuid(), role: 'admin', name: 'Admin AzulLink', email: 'admin@azulink.ma',
    phone: '+212600000000', passwordHash: hash('admin123'), favorites: [], createdAt: now
  };

  const travelerUser = {
    id: uuid(), role: 'traveler', name: 'Sara Bennani', email: 'voyageur@azulink.ma',
    phone: '+212611111111', passwordHash: hash('voyageur123'), favorites: [], createdAt: now
  };

  const providerUsers = [
    { id: uuid(), role: 'provider', name: 'Hassan Aït Lahcen', email: 'prestataire@azulink.ma', phone: '+212622222222', passwordHash: hash('provider123'), favorites: [], createdAt: now },
    { id: uuid(), role: 'provider', name: 'Fatima Zahra Idrissi', email: 'gite.aitmhamed@azulink.ma', phone: '+212633333333', passwordHash: hash('provider123'), favorites: [], createdAt: now },
    { id: uuid(), role: 'provider', name: 'Youssef Ouazzani', email: 'guide.khenifra@azulink.ma', phone: '+212644444444', passwordHash: hash('provider123'), favorites: [], createdAt: now },
    { id: uuid(), role: 'provider', name: "Coopérative Artisanat Aghbala", email: 'artisanat.aghbala@azulink.ma', phone: '+212655555555', passwordHash: hash('provider123'), favorites: [], createdAt: now },
    { id: uuid(), role: 'provider', name: 'Karim Belghazi', email: 'transport.karim@azulink.ma', phone: '+212666666666', passwordHash: hash('provider123'), favorites: [], createdAt: now }
  ];

  db.data.users = [adminUser, travelerUser, ...providerUsers];

  // ---------- Providers ----------
  const providers = [
    {
      id: uuid(), userId: providerUsers[0].id, businessName: 'Atlas Trek Khénifra', type: 'Guides & Accompagnateurs',
      description: "Guides de montagne certifiés, spécialistes du Moyen Atlas et des circuits nature autour de Khénifra depuis 12 ans.",
      phone: providerUsers[0].phone, email: providerUsers[0].email, validated: true, createdAt: now,
      stats: { views: 342, bookings: 18 }
    },
    {
      id: uuid(), userId: providerUsers[1].id, businessName: 'Gîte Ait Mhamed', type: 'Hébergements',
      description: "Gîte écologique en pierre locale, niché au cœur du Moyen Atlas, cuisine traditionnelle et vue sur les cèdres.",
      phone: providerUsers[1].phone, email: providerUsers[1].email, validated: true, createdAt: now,
      stats: { views: 210, bookings: 9 }
    },
    {
      id: uuid(), userId: providerUsers[2].id, businessName: 'Khénifra Découverte', type: 'Guides & Accompagnateurs',
      description: "Passionné d'histoire locale, propose des visites culturelles et immersives dans la région de Khénifra.",
      phone: providerUsers[2].phone, email: providerUsers[2].email, validated: true, createdAt: now,
      stats: { views: 155, bookings: 7 }
    },
    {
      id: uuid(), userId: providerUsers[3].id, businessName: 'Coopérative Artisanat Aghbala', type: 'Artisans',
      description: "Coopérative féminine de tissage de tapis berbères traditionnels et poterie locale.",
      phone: providerUsers[3].phone, email: providerUsers[3].email, validated: false, createdAt: now,
      stats: { views: 40, bookings: 1 }
    },
    {
      id: uuid(), userId: providerUsers[4].id, businessName: 'Transport Karim 4x4', type: 'Transporteurs',
      description: "Location de 4x4 avec chauffeur pour excursions dans les pistes du Moyen Atlas.",
      phone: providerUsers[4].phone, email: providerUsers[4].email, validated: true, createdAt: now,
      stats: { views: 88, bookings: 4 }
    }
  ];
  db.data.providers = providers;
  const provId = (businessName) => providers.find(p => p.businessName === businessName).id;

  // ---------- Offers ----------
  const offers = [
    {
      id: uuid(), providerId: provId('Atlas Trek Khénifra'), categoryId: catId('circuits-nature'),
      title: 'Randonnée aux cascades d\'Oum Rbia', slug: 'randonnee-cascades-oum-rbia',
      description: "Une randonnée immersive jusqu'aux sources de l'Oum Rbia, à travers forêts de cèdres et villages berbères authentiques.",
      program: "08h00 : Départ de Khénifra en minibus.\n09h00 : Début de la randonnée guidée (durée 3h).\n12h30 : Déjeuner traditionnel chez l'habitant.\n14h30 : Visite des sources et temps libre.\n17h00 : Retour à Khénifra.",
      included: ['Guide certifié', 'Transport aller-retour', 'Déjeuner traditionnel', 'Assurance randonnée'],
      images: ['https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200'],
      location: { lat: 32.9394, lng: -5.5397, address: "Sources de l'Oum Rbia, région de Khénifra" },
      duration: '1 jour (8h)', price: 350, currency: 'MAD',
      practicalInfo: "Prévoir chaussures de randonnée, eau, crème solaire. Niveau modéré, accessible à partir de 10 ans.",
      status: 'validated', featured: true, createdAt: now
    },
    {
      id: uuid(), providerId: provId('Atlas Trek Khénifra'), categoryId: catId('circuits-nature'),
      title: 'Trek 2 jours dans la forêt de cèdres', slug: 'trek-2-jours-foret-cedres',
      description: "Immersion de deux jours dans la majestueuse forêt de cèdres du Moyen Atlas, bivouac sous les étoiles inclus.",
      program: "Jour 1 : Départ, marche 5h, bivouac en forêt, dîner autour du feu.\nJour 2 : Lever de soleil, marche 4h, retour.",
      included: ['Guide de montagne', 'Équipement de bivouac', 'Repas complets', 'Mulet porteur'],
      images: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200'],
      location: { lat: 33.0123, lng: -5.4210, address: 'Forêt de cèdres, Moyen Atlas' },
      duration: '2 jours / 1 nuit', price: 890, currency: 'MAD',
      practicalInfo: "Sac de couchage fourni. Météo variable en montagne, prévoir vêtements chauds.",
      status: 'validated', featured: true, createdAt: now
    },
    {
      id: uuid(), providerId: provId('Gîte Ait Mhamed'), categoryId: catId('hebergements'),
      title: 'Nuit au Gîte Ait Mhamed', slug: 'nuit-gite-ait-mhamed',
      description: "Séjour dans un gîte écologique construit en pierre locale, à l'architecture berbère authentique, entouré de cèdres centenaires.",
      program: "Arrivée libre à partir de 14h. Dîner traditionnel sur demande. Petit-déjeuner berbère inclus. Départ avant 12h.",
      included: ['Nuitée en chambre double', 'Petit-déjeuner berbère', 'Accès terrasse panoramique', 'Wifi'],
      images: ['https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200'],
      location: { lat: 32.8765, lng: -5.6012, address: 'Douar Ait Mhamed, Khénifra' },
      duration: '1 nuit', price: 420, currency: 'MAD',
      practicalInfo: "Chambres non-fumeurs. Animaux non admis. Paiement en espèces sur place ou acompte en ligne.",
      status: 'validated', featured: true, createdAt: now
    },
    {
      id: uuid(), providerId: provId('Khénifra Découverte'), categoryId: catId('activites-culturelles'),
      title: 'Visite guidée du patrimoine de Khénifra', slug: 'visite-guidee-patrimoine-khenifra',
      description: "Découvrez l'histoire de la ville rouge, du Kasbah aux ruelles historiques, avec un guide passionné d'histoire locale.",
      program: "09h : Rendez-vous place centrale.\n09h15 : Visite du Kasbah et du musée local.\n11h : Balade dans la médina.\n12h30 : Fin de la visite, dégustation de thé à la menthe.",
      included: ['Guide local certifié', 'Entrées musée', 'Dégustation thé à la menthe'],
      images: ['https://images.unsplash.com/photo-1548013146-72479768bada?w=1200'],
      location: { lat: 32.9394, lng: -5.6675, address: 'Centre-ville, Khénifra' },
      duration: '3h30', price: 150, currency: 'MAD',
      practicalInfo: "Adapté à tous les âges. Visite en français, arabe ou anglais sur demande.",
      status: 'validated', featured: false, createdAt: now
    },
    {
      id: uuid(), providerId: provId('Coopérative Artisanat Aghbala'), categoryId: catId('artisanat-local'),
      title: 'Atelier tissage de tapis berbère', slug: 'atelier-tissage-tapis-berbere',
      description: "Initiez-vous au tissage traditionnel des tapis berbères auprès des artisanes de la coopérative d'Aghbala.",
      program: "Accueil et présentation de la coopérative.\nDémonstration des techniques de tissage.\nAtelier pratique (2h).\nThé et pâtisseries traditionnelles.",
      included: ['Matériel de tissage', 'Encadrement par une artisane', 'Collation traditionnelle'],
      images: ['https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1200'],
      location: { lat: 32.7580, lng: -5.6390, address: 'Aghbala, région de Khénifra' },
      duration: '3h', price: 200, currency: 'MAD',
      practicalInfo: "Places limitées à 8 participants. Réservation recommandée 48h à l'avance.",
      status: 'pending', featured: false, createdAt: now
    },
    {
      id: uuid(), providerId: provId('Atlas Trek Khénifra'), categoryId: catId('experiences-immersives'),
      title: "Nuit chez l'habitant en montagne", slug: 'nuit-chez-habitant-montagne',
      description: "Vivez une immersion totale dans une famille berbère de montagne : repas partagé, veillée traditionnelle et découverte du mode de vie rural.",
      program: "Arrivée en fin d'après-midi, aide à la préparation du repas, dîner partagé, veillée contes et musique berbère, nuit chez l'habitant, petit-déjeuner.",
      included: ["Hébergement chez l'habitant", 'Repas du soir et petit-déjeuner', 'Veillée culturelle', 'Guide accompagnateur'],
      images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200'],
      location: { lat: 32.9012, lng: -5.5540, address: 'Village de montagne, Khénifra' },
      duration: '1 jour / 1 nuit', price: 480, currency: 'MAD',
      practicalInfo: "Expérience authentique, confort simple. Respect des coutumes locales demandé.",
      status: 'validated', featured: true, createdAt: now
    },
    {
      id: uuid(), providerId: provId('Transport Karim 4x4'), categoryId: catId('offres-partenaires'),
      title: 'Excursion 4x4 dans les pistes du Moyen Atlas', slug: 'excursion-4x4-moyen-atlas',
      description: "Une journée d'aventure en 4x4 sur les pistes escarpées du Moyen Atlas, avec arrêts photo dans des points de vue exceptionnels.",
      program: "08h30 : Départ en 4x4.\nArrêts aux points de vue et villages isolés.\nDéjeuner pique-nique en pleine nature.\n17h : Retour.",
      included: ['4x4 avec chauffeur expérimenté', 'Pique-nique', 'Assurance'],
      images: ['https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=1200'],
      location: { lat: 32.9800, lng: -5.4800, address: 'Pistes du Moyen Atlas, Khénifra' },
      duration: '1 jour (8h)', price: 550, currency: 'MAD',
      practicalInfo: "Maximum 4 personnes par véhicule. Non recommandé aux femmes enceintes.",
      status: 'validated', featured: false, createdAt: now
    },
    {
      id: uuid(), providerId: provId('Khénifra Découverte'), categoryId: catId('activites-animation'),
      title: 'Soirée musique et danse Ahidous', slug: 'soiree-musique-danse-ahidous',
      description: "Assistez à une représentation authentique de la danse Ahidous, danse traditionnelle berbère du Moyen Atlas, avec possibilité de participer.",
      program: "19h : Accueil et présentation de la tradition Ahidous.\n19h30 : Représentation par un groupe local.\n20h30 : Initiation participative.\n21h : Collation.",
      included: ['Représentation artistique', 'Initiation à la danse', 'Collation traditionnelle'],
      images: ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200'],
      location: { lat: 32.9394, lng: -5.6675, address: 'Centre culturel, Khénifra' },
      duration: '2h30', price: 180, currency: 'MAD',
      practicalInfo: "Idéal en groupe ou en famille. Tenue confortable recommandée.",
      status: 'validated', featured: false, createdAt: now
    }
  ];
  db.data.offers = offers;

  // ---------- Bookings (demo) ----------
  const bookings = [
    {
      id: uuid(), offerId: offers[0].id, travelerId: travelerUser.id,
      fullName: 'Sara Bennani', phone: '+212611111111', email: 'voyageur@azulink.ma',
      date: '2026-07-20', participants: 2, comments: 'Nous préférons un départ tôt le matin si possible.',
      status: 'confirmed', createdAt: now
    },
    {
      id: uuid(), offerId: offers[2].id, travelerId: null,
      fullName: 'Marc Dubois', phone: '+33612345678', email: 'marc.dubois@example.com',
      date: '2026-07-25', participants: 4, comments: '',
      status: 'pending', createdAt: now
    },
    {
      id: uuid(), offerId: offers[5].id, travelerId: travelerUser.id,
      fullName: 'Sara Bennani', phone: '+212611111111', email: 'voyageur@azulink.ma',
      date: '2026-08-02', participants: 1, comments: 'Végétarienne, merci de prévoir un repas adapté.',
      status: 'pending', createdAt: now
    }
  ];
  db.data.bookings = bookings;

  // ---------- Favorites demo ----------
  travelerUser.favorites = [offers[0].id, offers[5].id];

  // ---------- Notifications ----------
  db.data.notifications = [
    { id: uuid(), targetRole: 'admin', targetUserId: null, message: `Nouvelle demande de réservation pour "${offers[2].title}"`, link: '/admin/reservations', read: false, createdAt: now },
    { id: uuid(), targetRole: 'provider', targetUserId: providerUsers[0].id, message: `Nouvelle réservation confirmée pour "${offers[0].title}"`, link: '/prestataire/reservations', read: false, createdAt: now },
    { id: uuid(), targetRole: 'admin', targetUserId: null, message: `Le prestataire "Coopérative Artisanat Aghbala" attend une validation`, link: '/admin/prestataires', read: false, createdAt: now }
  ];

  await db.write();
  console.log('✅ Base de données initialisée avec succès.');
  console.log('---');
  console.log('Comptes de démonstration :');
  console.log('  Admin       : admin@azulink.ma / admin123');
  console.log('  Prestataire : prestataire@azulink.ma / provider123');
  console.log('  Voyageur    : voyageur@azulink.ma / voyageur123');
}

seed();
