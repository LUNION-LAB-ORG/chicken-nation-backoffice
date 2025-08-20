import { Ad } from '@/types/ad';

export const mockAds: Ad[] = [
  {
    id: '1',
    title: 'Offre spéciale Burger',
    content: 'Tu attends quoi pour relever le défi du "BURGER MECHANT MECHANT". Vous pouvez commander au : 07 47 00 00 00',
    createdAt: '2023-06-15T14:30:00Z',
    status: 'published',
    type: 'app',
    stats: {
      sentTo: 349,
      readBy: 278
    }
  },
  {
    id: '2',
    title: 'Promotion du weekend',
    content: 'Ce weekend, profitez de -20% sur tous nos menus familiaux. Offre valable uniquement en restaurant.',
    createdAt: '2023-07-22T09:15:00Z',
    status: 'published',
    type: 'social',
    stats: {
      sentTo: 520,
      readBy: 412
    }
  },
  {
    id: '3',
    title: 'Nouveau menu',
    content: 'Découvrez notre nouveau menu végétarien avec des ingrédients frais et locaux. Disponible dès maintenant !',
    createdAt: '2023-08-05T11:45:00Z',
    status: 'published',
    type: 'email',
    stats: {
      sentTo: 275,
      readBy: 183
    }
  },
  {
    id: '4',
    title: 'Happy Hour tous les jours',
    content: 'Happy Hour de 17h à 19h tous les jours : 1 menu acheté = 1 boisson offerte !',
    createdAt: '2023-09-10T16:20:00Z',
    status: 'published',
    type: 'app',
    stats: {
      sentTo: 410,
      readBy: 325
    }
  },
  {
    id: '5',
    title: 'Livraison gratuite',
    content: 'Livraison gratuite pour toute commande supérieure à 25€. Utilisez le code LIVGRATUIT à la caisse.',
    createdAt: '2023-10-18T13:10:00Z',
    status: 'published',
    type: 'social',
    stats: {
      sentTo: 630,
      readBy: 542
    }
  },
  {
    id: '6',
    title: 'Menu étudiant',
    content: 'Étudiants, profitez de -15% sur présentation de votre carte étudiante. Offre valable toute l\'année !',
    createdAt: '2023-11-05T10:30:00Z',
    status: 'published',
    type: 'email',
    stats: {
      sentTo: 320,
      readBy: 156
    }
  },
  {
    id: '7',
    title: 'Poulet croustillant',
    content: 'Notre nouveau poulet croustillant est arrivé ! Venez le découvrir dans tous nos restaurants.',
    createdAt: '2023-12-12T15:45:00Z',
    status: 'published',
    type: 'app',
    stats: {
      sentTo: 480,
      readBy: 390
    }
  },
  {
    id: '8',
    title: 'Offre de Noël',
    content: 'Pour Noël, commandez notre menu festif et recevez un cadeau surprise !',
    createdAt: '2023-12-20T09:00:00Z',
    status: 'published',
    type: 'social',
    stats: {
      sentTo: 720,
      readBy: 650
    }
  }
];
