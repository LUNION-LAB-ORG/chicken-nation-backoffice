/* eslint-disable @typescript-eslint/ban-ts-comment -- tests bun : leurs types ne sont pas installés dans le backoffice. */
// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Rendu des écrans d'incident avec des données toutes prêtes : chaque écran
 * s'affiche sans erreur, avec ses mots, et ne montre que les gestes que le
 * serveur accorde (`droits` de la fiche).
 */

const consoleDOrigine = { log: console.log, warn: console.warn, error: console.error };
console.log = () => {};
console.warn = () => {};
afterAll(() => Object.assign(console, consoleDOrigine));

/**
 * Magasin du tableau de bord. Un autre fichier de tests le remplace par un
 * objet nu, et ce remplacement vaut pour toute la série : on pose ici un
 * magasin appelable, puis on remet ce qu'on avait trouvé en partant.
 */
const tableauAvant = { ...(await import('@/store/dashboardStore')) };
const etatTableau = { setFilter: () => {}, setActiveTab: () => {}, openTicket: () => {}, openAvis: () => {} };
mock.module('@/store/dashboardStore', () => ({
  ...tableauAvant,
  useDashboardStore: Object.assign((selecteur) => (selecteur ? selecteur(etatTableau) : etatTableau), {
    getState: () => etatTableau,
    setState: () => {},
    subscribe: () => () => {},
  }),
}));
afterAll(() => mock.module('@/store/dashboardStore', () => tableauAvant));

/**
 * Compte connecté. Rendu hors du navigateur, le vrai magasin rend son état
 * de DÉPART (personne de connecté), quel que soit l'état qu'on lui donne :
 * il est remplacé le temps de ces tests, puis remis en place.
 */
const authAvant = { ...(await import('../../../users/hook/authStore')) };
const session = { user: null, peutTout: false };
const etatSession = () => ({ user: session.user, isAuthenticated: true, can: () => session.peutTout });
mock.module('../../../users/hook/authStore', () => ({
  ...authAvant,
  useAuthStore: Object.assign((selecteur) => (selecteur ? selecteur(etatSession()) : etatSession()), {
    getState: etatSession,
    setState: () => {},
    subscribe: () => () => {},
  }),
}));
afterAll(() => mock.module('../../../users/hook/authStore', () => authAvant));

const { incidentKeys } = await import('../../queries/incident.query');
const { CarteIncident } = await import('../CarteIncident');
const { FicheIncident } = await import('../FicheIncident');
const { TableauIncidents } = await import('../TableauIncidents');
const { HistoriqueIncidents } = await import('../HistoriqueIncidents');
const { TableauDeBordIncidents } = await import('../TableauDeBordIncidents');
const { ReglagesIncidents } = await import('../ReglagesIncidents');
const { SignalerIncident } = await import('../SignalerIncident');
const { IncidentsCommande } = await import('../IncidentsCommande');
const { IncidentNote } = await import('../IncidentNote');
const { Incidents } = await import('../Incidents');

const connecter = (role, type = 'BACKOFFICE') => {
  session.user = { id: 'u-1', role, type, restaurant_id: type === 'RESTAURANT' ? 'r-1' : null, permissions: { modules: {} } };
};

beforeEach(() => {
  session.peutTout = false;
  connecter('CALL_CENTER');
});

const rendre = (element, semer = () => {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  semer(client);
  return renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, element));
};

const MAINTENANT = new Date('2026-11-12T13:00:00.000Z');

const ligne = (p = {}) => ({
  id: 'i-1',
  code: 'INC-261111-001',
  statut: 'OUVERT',
  gravite: 'HAUTE',
  origine: 'APPEL',
  pole: 'RESTAURANT',
  categorie: { id: 'cat-qualite', nom: 'Qualité du plat' },
  extrait: 'Poulet servi tiède.',
  commande: { id: 'o-1', reference: 'ORD-261110-50950' },
  restaurant: { id: 'r-1', name: 'Angré' },
  client: { id: 'c-1', nom: 'Awa Koné', telephone: '+2250707000001' },
  agent: null,
  geste: null,
  bon_montant: null,
  echeance_at: '2026-11-12T10:00:00.000Z',
  en_retard: true,
  created_at: '2026-11-11T10:00:00.000Z',
  resolu_at: null,
  cloture_at: null,
  ...p,
});

const AUCUN_DROIT = { traiter: false, noter: false, prendre: false, assigner: false, resoudre: false, bon: false, cloturer: false, rouvrir: false };

const fiche = (p = {}) => ({
  ...ligne(),
  description: 'Poulet servi tiède, la cliente a rappelé.',
  cause: null,
  action: null,
  recontact: null,
  reaction: null,
  signale_par: 'Ruth Fetai',
  resolu_par: null,
  cloture_par: null,
  assigne_at: null,
  commande: {
    id: 'o-1',
    reference: 'ORD-261110-50950',
    created_at: '2026-11-10T19:40:00.000Z',
    type: 'DELIVERY',
    statut: 'COMPLETED',
    montant: 5500,
    restaurant: { id: 'r-1', name: 'Angré' },
    client: { id: 'c-1', nom: 'Awa Koné', telephone: '+2250707000001' },
  },
  bon: null,
  bon_a_creer: false,
  liens: { ticket: null, avis_id: null, note: null },
  autres: [],
  suivis: [{ id: 's-1', type: 'CREATION', texte: 'Signalé par Ruth Fetai (Appel)', note: null, auteur_nom: 'Ruth Fetai', created_at: '2026-11-11T10:00:00.000Z' }],
  droits: AUCUN_DROIT,
  montants_bon: [1000, 2000, 3000],
  bon_suggere: 3000,
  ...p,
});

const reglages = {
  categories: [
    { id: 'cat-retard', nom: 'Livraison tardive', pole: 'LIVRAISON', delai_heures: 24, actif: true, ordre: 1 },
    { id: 'cat-qualite', nom: 'Qualité du plat', pole: 'RESTAURANT', delai_heures: 24, actif: true, ordre: 2 },
    { id: 'cat-ancienne', nom: 'Ancienne catégorie', pole: 'RESTAURANT', delai_heures: 24, actif: false, ordre: 3 },
  ],
  bareme: { FAIBLE: 1000, MOYENNE: 2000, HAUTE: 3000 },
  validite_jours: 30,
  bon_restaurant: true,
};

const voirFiche = (f) =>
  rendre(React.createElement(FicheIncident, { id: f.id, onFermer: () => {} }), (c) => {
    c.setQueryData(incidentKeys.fiche(f.id), f);
    c.setQueryData(incidentKeys.reglages, reglages);
  });

describe('carte du tableau', () => {
  const carte = (i) => rendre(React.createElement(CarteIncident, { incident: i, maintenant: MAINTENANT, avecRestaurant: true, onOuvrir: () => {} }));

  test('dit la catégorie, le restaurant, le client, le retard et qui en répond', () => {
    const html = carte(ligne());
    expect(html).toContain('Qualité du plat');
    expect(html).toContain('Angré · Awa Koné · …50950');
    expect(html).toContain('en retard de 3 h');
    expect(html).toContain('Gravité haute');
    expect(html).toContain('Restaurant');
  });

  test('résolue : depuis quand, par qui, et le geste', () => {
    const html = carte(
      ligne({ statut: 'RESOLU', gravite: 'FAIBLE', resolu_at: '2026-11-12T11:00:00.000Z', geste: 'BON', bon_montant: 2000, agent: { id: 'u', fullname: 'Mariam Manager' } }),
    );
    expect(html).toContain('résolu depuis 2 h');
    expect(html).toContain('Mariam Manager');
    expect(html).toContain('Bon de 2.000 F');
    expect(html).not.toContain('Gravité haute');
  });
});

describe('fiche', () => {
  test('ouvert, pour qui traite : prendre en charge, changer le responsable, résoudre, noter', () => {
    const html = voirFiche(fiche({ droits: { ...AUCUN_DROIT, traiter: true, noter: true, prendre: true, assigner: true, resoudre: true, bon: true } }));
    for (const mot of [
      'Qualité du plat',
      'INC-261111-001',
      'Problème signalé',
      'Poulet servi tiède, la cliente a rappelé.',
      'Prendre en charge',
      'Suivi par',
      // L'apostrophe est échappée dans le balisage : on s'arrête avant.
      'Résoudre l',
      'Marquer résolu',
      'Action corrective',
      'Geste pour le client',
      'Bon de réduction',
      'Marquer résolu',
      'Signalé par Ruth Fetai (Appel)',
      'Ajouter une note',
      'Awa Koné',
      '07 07 00 00 01',
      'Appeler',
      'ORD-261110-50950',
      '5.500 F',
    ]) {
      expect(html).toContain(mot);
    }
    expect(html).not.toContain('Clôturer');
    expect(html).not.toContain('Rouvrir');
  });

  test('ouvert, en lecture : le problème et le journal, aucun geste', () => {
    const html = voirFiche(fiche());
    expect(html).toContain('Problème signalé');
    expect(html).toContain('personne ne l');
    for (const mot of ['Prendre en charge', 'Marquer résolu', 'Ajouter une note', 'Clôturer', 'Rouvrir']) {
      expect(html).not.toContain(mot);
    }
  });

  test('sans le droit d’offrir un bon, le bon n’est pas proposé', () => {
    const html = voirFiche(fiche({ droits: { ...AUCUN_DROIT, traiter: true, resoudre: true, bon: false } }));
    expect(html).toContain('Remplacement');
    expect(html).not.toContain('Bon de réduction');
  });

  test('résolu avec un bon : la résolution, le bon, le rappel du client, la réouverture', () => {
    const html = voirFiche(
      fiche({
        statut: 'RESOLU',
        en_retard: false,
        cause: 'Commande préparée trop tôt.',
        action: 'Mise en sac au départ du livreur.',
        geste: 'BON',
        bon_montant: 2000,
        resolu_at: '2026-11-11T12:00:00.000Z',
        resolu_par: 'Mariam Manager',
        bon: { code: 'CN7Q2KXP', montant: 2000, statut: 'ACTIVE', expire_at: '2026-12-11T12:00:00.000Z', message_at: '2026-11-11T12:00:05.000Z', message_canal: 'SMS' },
        droits: { ...AUCUN_DROIT, traiter: true, noter: true, cloturer: true, rouvrir: true },
      }),
    );
    for (const mot of [
      'Résolution',
      'Commande préparée trop tôt.',
      'Mise en sac au départ du livreur.',
      'Bon de 2.000 F',
      'CN7Q2KXP',
      'Code envoyé par SMS',
      'Renvoyer le SMS',
      'par Mariam Manager',
      'Informer le client et clôturer',
      'Client informé',
      'Client injoignable',
      'Sans recontact',
      'Clôturer l',
      'Rouvrir l',
    ]) {
      expect(html).toContain(mot);
    }
    expect(html).not.toContain('Marquer résolu');
    expect(html).not.toContain('Prendre en charge');
  });

  test('le bon n’a pas pu être créé : la fiche propose de le créer', () => {
    const html = voirFiche(
      fiche({ statut: 'RESOLU', cause: 'a', action: 'b', geste: 'BON', bon_montant: 2000, bon_a_creer: true, droits: { ...AUCUN_DROIT, traiter: true, cloturer: true } }),
    );
    expect(html).toContain('pas pu être créé');
    expect(html).toContain('Créer le bon');
  });

  test('le SMS n’est pas parti : la fiche le dit', () => {
    const html = voirFiche(
      fiche({
        statut: 'RESOLU',
        cause: 'a',
        action: 'b',
        geste: 'BON',
        bon_montant: 2000,
        bon: { code: '••••XP', montant: 2000, statut: 'ACTIVE', expire_at: null, message_at: null, message_canal: 'AUCUN' },
      }),
    );
    expect(html).toContain('dictez le code au client');
    // En lecture : ni copie, ni renvoi.
    expect(html).not.toContain('Renvoyer le SMS');
  });

  test('clôturé : ce que le client a dit, les liens vers le ticket et les autres incidents', () => {
    connecter('ADMIN');
    // Lit les commandes, les tickets et les avis : les liens s'affichent.
    session.peutTout = true;
    const html = voirFiche(
      fiche({
        statut: 'CLOTURE',
        en_retard: false,
        cause: 'a',
        action: 'b',
        geste: 'EXCUSES',
        recontact: 'INFORME',
        reaction: 'Satisfaite, recommandera.',
        cloture_at: '2026-11-12T09:00:00.000Z',
        cloture_par: 'Ange Yoboué',
        origine: 'TICKET',
        liens: { ticket: { id: 't-1', code: 'LIV-00012' }, avis_id: 'a-1', note: { id: 'n-1', rating: 1 } },
        autres: [{ id: 'i-2', code: 'INC-261101-003', statut: 'CLOTURE', categorie: 'Livraison tardive', created_at: '2026-11-01T10:00:00.000Z' }],
      }),
    );
    for (const mot of [
      'Client informé',
      'Satisfaite, recommandera.',
      'par Ange Yoboué',
      'Voir le ticket LIV-00012',
      'Voir l',
      '1 sur 5',
      'Autres incidents de ce client',
      'Livraison tardive',
      'Voir la commande',
    ]) {
      expect(html).toContain(mot);
    }
    expect(html).not.toContain('Informer le client et clôturer');
  });

  test('un numéro masqué ne s’appelle pas', () => {
    connecter('MARKETING');
    const html = voirFiche(fiche({ client: { id: 'c-1', nom: 'Awa Koné', telephone: '+225•••••••01' } }));
    expect(html).toContain('+225•••••••01');
    expect(html).not.toContain('Appeler');
    expect(html).not.toContain('WhatsApp');
  });
});

describe('tableau, historique, tableau de bord, réglages', () => {
  test('le tableau montre les quatre colonnes et dit quand une colonne est vide', () => {
    const html = rendre(React.createElement(TableauIncidents, { pointDeVente: false }), (c) => {
      c.setQueryData(incidentKeys.tableau({}), {
        colonnes: {
          OUVERT: { total: 60, incidents: [ligne()] },
          EN_COURS: { total: 1, incidents: [ligne({ id: 'i-2', statut: 'EN_COURS', agent: { id: 'u', fullname: 'Ruth Fetai' } })] },
          RESOLU: { total: 0, incidents: [] },
          CLOTURE: { total: 0, incidents: [] },
        },
      });
      c.setQueryData(incidentKeys.reglages, reglages);
    });
    for (const mot of ['Ouvert', 'En cours', 'Résolu', 'Clôturé', 'À prendre en charge', 'Client à informer', 'Aucun client à rappeler', 'Ruth Fetai']) {
      expect(html).toContain(mot);
    }
    expect(html).toContain('59 de plus dans l');
    // Filtres : le restaurant pour le siège.
    expect(html).toContain('Restaurant<select');
    expect(html).toContain('Livraison tardive');
  });

  test('un point de vente n’a pas le filtre Restaurant', () => {
    const html = rendre(React.createElement(TableauIncidents, { pointDeVente: true }), (c) =>
      c.setQueryData(incidentKeys.tableau({}), {
        colonnes: { OUVERT: { total: 0, incidents: [] }, EN_COURS: { total: 0, incidents: [] }, RESOLU: { total: 0, incidents: [] }, CLOTURE: { total: 0, incidents: [] } },
      }),
    );
    expect(html).not.toContain('Restaurant<select');
    expect(html).toContain('Responsable<select');
    expect(html).toContain('Rien à prendre');
  });

  test('l’historique liste les incidents et propose l’export au siège', () => {
    const semer = (c) =>
      c.setQueryData(incidentKeys.liste({ page: 1, limit: 20 }), {
        data: [ligne({ statut: 'CLOTURE', en_retard: false, geste: 'BON', bon_montant: 3000 })],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });
    const html = rendre(React.createElement(HistoriqueIncidents, { pointDeVente: false, peutExporter: true }), semer);
    for (const mot of ['Signalé le', 'Qualité du plat', 'Awa Koné', 'ORD-261110-50950', 'Clôturé', 'Bon de 3.000 F', 'Exporter CSV', 'INC-261111-001 · Appel']) {
      expect(html).toContain(mot);
    }
    expect(rendre(React.createElement(HistoriqueIncidents, { pointDeVente: true, peutExporter: false }), semer)).not.toContain('Exporter CSV');
  });

  test('le tableau de bord dit combien, où, en combien de temps, et ce que coûtent les bons', () => {
    const jour = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
    const html = rendre(React.createElement(TableauDeBordIncidents, { pointDeVente: false }), (c) =>
      c.setQueryData(incidentKeys.statistiques({ du: jour(29), au: jour(0) }), {
        du: jour(29),
        au: jour(0),
        total: 12,
        ouverts: 3,
        en_cours: 2,
        resolus: 4,
        clotures: 3,
        en_retard: 1,
        delai_moyen_heures: 19,
        dans_les_delais_pct: 67,
        par_categorie: [{ id: 'c', nom: 'Livraison tardive', total: 7, ouverts: 2 }],
        par_restaurant: [{ id: 'r', name: 'Angré', total: 12, ouverts: 5 }],
        par_pole: [{ pole: 'LIVRAISON', total: 7 }],
        par_origine: [{ origine: 'AVIS', total: 2 }],
        par_gravite: [{ gravite: 'HAUTE', total: 3 }],
        par_jour: [{ jour: jour(1), total: 5 }, { jour: jour(0), total: 7 }],
        gestes: [{ geste: 'BON', total: 4 }],
        bons: { nombre: 4, montant: 8000 },
        corrections: [{ id: 'i', code: 'INC-1', categorie: 'Qualité du plat', restaurant: 'Faya', cause: 'Plat tiède', action: 'Mise en sac au départ', resolu_at: '2026-11-10T10:00:00.000Z' }],
      }),
    );
    for (const mot of [
      'Incidents signalés',
      '>12<',
      '3 ouverts, 2 en cours',
      'En retard',
      '19 h',
      '67 %',
      'Bons offerts',
      '8.000 F',
      'Livraison tardive',
      'Angré',
      'Avis du site',
      'Bon de réduction',
      'Dernières actions correctives',
      'Cause : Plat tiède',
      'Action : Mise en sac au départ',
    ]) {
      expect(html).toContain(mot);
    }
  });

  test('les réglages montrent les catégories, actives ou non, et le barème', () => {
    const html = rendre(React.createElement(ReglagesIncidents), (c) => c.setQueryData(incidentKeys.reglages, reglages));
    for (const mot of ['Livraison tardive', 'Ancienne catégorie', 'Nouvelle catégorie', 'Bons de réduction', 'Gravité haute (F)', 'Validité (jours)', 'Enregistrer']) {
      expect(html).toContain(mot);
    }
  });
});

describe('signaler', () => {
  const commande = fiche().commande;
  const semer = (incidents = []) => (c) => {
    c.setQueryData(incidentKeys.reglages, reglages);
    c.setQueryData(incidentKeys.commande('o-1'), { commande, incidents, peut_signaler: true });
  };

  test('depuis une commande : son résumé, les catégories actives, la gravité, l’origine, la description', () => {
    const html = rendre(React.createElement(SignalerIncident, { demande: { orderId: 'o-1' }, onFermer: () => {} }), semer());
    for (const mot of ['Signaler un incident', 'ORD-261110-50950 · 5.500 F', 'Awa Koné · Angré', 'Livraison tardive', 'Gravité', 'Origine du signalement', 'Constat interne', 'Description', 'Choisissez la catégorie.']) {
      expect(html).toContain(mot);
    }
    expect(html).not.toContain('Ancienne catégorie');
    // La commande est celle de l'écran d'où l'on vient : on ne la change pas ici.
    expect(html).not.toContain('Changer');
  });

  test('depuis un ticket : l’origine est imposée, la description reprise', () => {
    const html = rendre(
      React.createElement(SignalerIncident, { demande: { orderId: 'o-1', ticketId: 't-1', description: 'Il manque une boisson.', gravite: 'MOYENNE' }, onFermer: () => {} }),
      semer(),
    );
    expect(html).toContain('Origine :');
    expect(html).toContain('Ticket');
    expect(html).toContain('Il manque une boisson.');
    expect(html).not.toContain('Origine du signalement');
  });

  test('sans commande : la recherche d’abord', () => {
    const html = rendre(React.createElement(SignalerIncident, { demande: {}, onFermer: () => {} }), semer());
    expect(html).toContain('Référence, nom ou téléphone du client');
    expect(html).not.toContain('Gravité');
  });

  test('ce qui est déjà signalé sur la commande est rappelé', () => {
    const html = rendre(
      React.createElement(SignalerIncident, { demande: { orderId: 'o-1' }, onFermer: () => {} }),
      semer([ligne({ statut: 'EN_COURS' }), ligne({ id: 'i-9', statut: 'CLOTURE', categorie: { id: 'cat-retard', nom: 'Livraison tardive' } })]),
    );
    expect(html).toContain('Déjà signalé sur cette commande');
    expect(html).toContain('(en cours)');
    // Un incident clôturé ne bloque rien : il n'est pas rappelé.
    expect(html).not.toContain('(clôturé)');
  });
});

describe('ponts', () => {
  const semer = (incidents, peut = true) => (c) =>
    c.setQueryData(incidentKeys.commande('o-1'), { commande: fiche().commande, incidents, peut_signaler: peut });

  test('tiroir d’une commande : ses incidents et « Signaler un incident »', () => {
    const html = rendre(React.createElement(IncidentsCommande, { orderId: 'o-1', cadre: 'carte' }), semer([ligne({ statut: 'EN_COURS' })]));
    expect(html).toContain('Incidents');
    expect(html).toContain('Qualité du plat');
    expect(html).toContain('· en cours');
    expect(html).toContain('Signaler un incident');
  });

  test('rien à montrer et rien à signaler : le bloc disparaît', () => {
    expect(rendre(React.createElement(IncidentsCommande, { orderId: 'o-1' }), semer([], false))).toBe('');
    connecter('COMPTABLE');
    expect(rendre(React.createElement(IncidentsCommande, { orderId: 'o-1' }), semer([ligne()]))).toBe('');
  });

  test('note après commande : « Créer un incident » sous une mauvaise note, l’incident sinon', () => {
    const note = (p) => rendre(React.createElement(IncidentNote, { commentId: 'n-1', orderId: 'o-1', note: 1, message: 'Froid', incident: null, ...p }));
    expect(note({})).toContain('Créer un incident');
    expect(note({ note: 4 })).toBe('');
    expect(note({ incident: { id: 'i-1', code: 'INC-261111-001', statut: 'RESOLU' } })).toContain('Incident INC-261111-001');
    connecter('MARKETING');
    expect(note({})).toBe('');
    expect(note({ incident: { id: 'i-1', code: 'INC-261111-001', statut: 'RESOLU' } })).toContain('· résolu');
  });

  test('onglet du CRM : trois vues, « Réglages » pour l’administrateur seulement', () => {
    const semerOnglet = (c) => {
      c.setQueryData(incidentKeys.compteurs(), { ouverts: 2, en_cours: 1, resolus: 1, en_retard: 1 });
      c.setQueryData(incidentKeys.tableau({}), {
        colonnes: { OUVERT: { total: 0, incidents: [] }, EN_COURS: { total: 0, incidents: [] }, RESOLU: { total: 0, incidents: [] }, CLOTURE: { total: 0, incidents: [] } },
      });
    };
    connecter('ADMIN');
    const admin = rendre(React.createElement(Incidents), semerOnglet);
    for (const mot of ['En cours', 'Historique', 'Tableau de bord', 'Réglages', 'Signaler un incident', '1 en retard']) expect(admin).toContain(mot);
    connecter('CAISSIER', 'RESTAURANT');
    const caissier = rendre(React.createElement(Incidents), semerOnglet);
    expect(caissier).toContain('Signaler un incident');
    expect(caissier).not.toContain('Réglages');
    connecter('MARKETING');
    expect(rendre(React.createElement(Incidents), semerOnglet)).not.toContain('Signaler un incident');
  });
});

describe('écriture', () => {
  test('aucun tiret cadratin à l’écran', () => {
    const html =
      voirFiche(fiche({ droits: { ...AUCUN_DROIT, traiter: true, noter: true, prendre: true, assigner: true, resoudre: true, bon: true } })) +
      rendre(React.createElement(SignalerIncident, { demande: {}, onFermer: () => {} })) +
      rendre(React.createElement(ReglagesIncidents), (c) => c.setQueryData(incidentKeys.reglages, reglages));
    expect(html).not.toContain('—');
    expect(html).not.toContain('–');
  });
});
