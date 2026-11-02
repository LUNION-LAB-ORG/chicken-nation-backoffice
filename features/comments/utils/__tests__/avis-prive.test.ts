/* eslint-disable @typescript-eslint/ban-ts-comment -- tests bun : leurs types ne sont pas installés dans le backoffice. */
// @ts-nocheck
import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
  AVERTISSEMENT_FICHE,
  AVERTISSEMENT_LISTE,
  cibleNotificationAvis,
  cleCloture,
  comparerAvis,
  corpsAgent,
  corpsCommande,
  corpsTicket,
  COMPTEURS,
  COULEUR_RESSENTI,
  COULEUR_STATUT,
  etatFiche,
  etatListe,
  FILTRES_DEFAUT,
  filtresDuCompteur,
  formatEcheance,
  formatRecu,
  JE_NE_SAIS_PAS,
  LIBELLE_ACTION,
  LIBELLE_CANAL,
  LIBELLE_RESSENTI,
  LIBELLE_RESULTAT,
  LIBELLE_SOLUTION,
  LIBELLE_STATUT,
  libelleSource,
  lienWhatsApp,
  lireFiltres,
  MESSAGE_CONFLIT,
  messageErreurAvis,
  NON_ASSIGNE,
  optionsCloture,
  pastilleOnglet,
  peutTraiterAvis,
  PERIODES,
  raisonIncidentImpossible,
  requeteDepuisFiltres,
  ROLES_TRAITEMENT_AVIS,
  SANS_PRENOM,
  SOURCES,
  STATUTS,
  telephoneComplet,
  telephoneLocal,
  texteRetardFiche,
} from '../avis-prive';
import * as schema from '../../schemas/avis-prive.schema';

/**
 * Retours privés « Ton avis compte » au back-office (contrat
 * .banc-test-crm/avis/contrat-avis.md, 3 et 6, tests 8.3).
 */

// ─── Libellés ────────────────────────────────────────────────────────────────

describe('libellés', () => {
  test("une commande prise par téléphone s'appelle « Manuel » à l'écran", () => {
    expect(LIBELLE_CANAL.TELEPHONE).toBe('Manuel');
    expect(LIBELLE_CANAL).toEqual({
      APPLI: 'Appli',
      SITE_WEB: 'Site web',
      TELEPHONE: 'Manuel',
      WHATSAPP: 'WhatsApp',
      SUR_PLACE: 'Sur place',
      AUTRE_PLATEFORME: 'Autre plateforme',
    });
  });

  test('ressentis, statuts, solutions et résultats de la maquette', () => {
    expect(Object.values(LIBELLE_RESSENTI)).toEqual(['Pas content', 'Peut mieux faire', 'Au top']);
    expect(STATUTS.map((s) => LIBELLE_STATUT[s])).toEqual([
      'Nouveau',
      'À rappeler',
      'En cours',
      'Injoignable',
      'Incident ouvert',
      'Résolu',
      'Classé',
    ]);
    expect(Object.values(LIBELLE_SOLUTION)).toEqual(['Excuses', 'Geste commercial', 'Remplacement', 'Remboursement', 'Aucune']);
    expect(Object.values(LIBELLE_RESULTAT)).toEqual(['Joint', 'Injoignable', 'Messagerie']);
    expect(Object.values(LIBELLE_ACTION)).toEqual(['Appel', 'Message WhatsApp', 'Note interne']);
  });

  test('source : QR code marque-page, et un code inconnu se lit « Site web »', () => {
    expect(libelleSource('marque-page')).toBe('QR code marque-page');
    expect(libelleSource('inconnu')).toBe('Site web');
    expect(libelleSource(null)).toBe('Site web');
  });

  test('compteurs et périodes', () => {
    expect(COMPTEURS.map((c) => c.libelle)).toEqual(['Nouveaux', 'À rappeler', 'Échéance dépassée', 'Résolus sur 7 jours']);
    expect(PERIODES.map((p) => p.libelle)).toEqual(['7 derniers jours', "Aujourd'hui", '30 derniers jours', 'Tout']);
    expect(FILTRES_DEFAUT.periode).toBe('7j');
  });

  test('couleurs complètes : 7 statuts, 3 ressentis', () => {
    for (const s of STATUTS) {
      expect(COULEUR_STATUT[s].fond).toMatch(/^#[0-9A-F]{6}$/);
      expect(COULEUR_STATUT[s].texte).toMatch(/^#[0-9A-F]{6}$/);
    }
    expect(Object.keys(COULEUR_STATUT)).toHaveLength(7);
    expect(Object.keys(COULEUR_RESSENTI)).toHaveLength(3);
    expect(COULEUR_RESSENTI.PAS_CONTENT).toEqual({ fond: '#FDE2D3', texte: '#8A2C00' });
    expect(COULEUR_STATUT.A_RAPPELER).toEqual({ fond: '#FFF1E8', texte: '#8A3500' });
  });
});

// ─── Dates ──────────────────────────────────────────────────────────────────

describe('dates', () => {
  // Heure locale du poste : les dates sont construites en heure locale.
  const maintenant = new Date(2026, 10, 2, 9, 0);
  const iso = (...p) => new Date(...p).toISOString();

  test('« Reçu le » : 02/11 · 08:42', () => {
    expect(formatRecu(iso(2026, 10, 2, 8, 42))).toBe('02/11 · 08:42');
    expect(formatRecu(null)).toBe('');
  });

  test("échéance à venir : aujourd'hui, demain", () => {
    expect(formatEcheance(iso(2026, 10, 2, 10, 15), false, maintenant)).toEqual({ texte: "Aujourd'hui 10:15", depassee: false });
    expect(formatEcheance(iso(2026, 10, 3, 21, 3), false, maintenant)).toEqual({ texte: 'Demain 21:03', depassee: false });
  });

  test('échéance dépassée : en minutes, en heures, en jours', () => {
    expect(formatEcheance(iso(2026, 10, 2, 8, 25), true, maintenant)).toEqual({ texte: 'Dépassée de 35 min', depassee: true });
    expect(formatEcheance(iso(2026, 10, 2, 7, 0), true, maintenant)).toEqual({ texte: 'Dépassée de 2 h', depassee: true });
    expect(formatEcheance(iso(2026, 9, 30, 8, 0), true, maintenant)).toEqual({ texte: 'Dépassée de 3 j', depassee: true });
  });

  test('sans objet : vide ; retard annoncé par le serveur malgré une horloge en avance', () => {
    expect(formatEcheance(null, false, maintenant)).toEqual({ texte: '', depassee: false });
    expect(formatEcheance(iso(2026, 10, 2, 9, 0, 30), true, maintenant)).toEqual({ texte: 'Dépassée de 1 min', depassee: true });
  });

  test('fiche : « Échéance dépassée de 2 h », rien sinon', () => {
    expect(texteRetardFiche(iso(2026, 10, 2, 7, 0), true, maintenant)).toBe('Échéance dépassée de 2 h');
    expect(texteRetardFiche(iso(2026, 10, 2, 10, 15), false, maintenant)).toBeNull();
    expect(texteRetardFiche(null, false, maintenant)).toBeNull();
  });
});

// ─── Tri (jumeau du serveur) ────────────────────────────────────────────────

describe('tri', () => {
  test("ordre exact de l'exemple de la maquette", () => {
    const a = (id, jour, h, m, ressenti, statut) => ({
      id,
      ressenti,
      statut,
      created_at: new Date(2026, jour === 31 ? 9 : 10, jour, h, m).toISOString(),
    });
    const maquette = [
      a('1', 2, 8, 42, 'PAS_CONTENT', 'A_RAPPELER'),
      a('2', 2, 10, 15, 'PAS_CONTENT', 'A_RAPPELER'),
      a('3', 1, 21, 3, 'PEUT_MIEUX_FAIRE', 'EN_COURS'),
      a('4', 1, 19, 27, 'PAS_CONTENT', 'INCIDENT_OUVERT'),
      a('5', 1, 13, 10, 'AU_TOP', 'CLASSE'),
      a('6', 31, 20, 44, 'PEUT_MIEUX_FAIRE', 'RESOLU'),
    ];
    const melange = [maquette[4], maquette[1], maquette[5], maquette[0], maquette[3], maquette[2]];
    expect([...melange].sort(comparerAvis).map((x) => x.id)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  test('un « Pas content » déjà clos ne passe pas devant', () => {
    const vieux = { id: 'a', ressenti: 'PAS_CONTENT', statut: 'RESOLU', created_at: '2026-10-01T08:00:00Z' };
    const recent = { id: 'b', ressenti: 'AU_TOP', statut: 'NOUVEAU', created_at: '2026-11-01T08:00:00Z' };
    expect([vieux, recent].sort(comparerAvis).map((x) => x.id)).toEqual(['b', 'a']);
  });
});

// ─── Compteurs et filtres ───────────────────────────────────────────────────

describe('compteurs', () => {
  const avant = { ...FILTRES_DEFAUT, recherche: 'frites', ressenti: 'AU_TOP', store: 'resto-1', page: 3 };

  test('chaque compteur filtre ce qu’il compte, store gardé, ressenti et recherche retirés', () => {
    expect(filtresDuCompteur('nouveaux', avant)).toEqual({
      ...FILTRES_DEFAUT,
      store: 'resto-1',
      statut: 'NOUVEAU',
      periode: 'tout',
    });
    expect(filtresDuCompteur('a_rappeler', avant)).toMatchObject({ statut: 'A_RAPPELER', periode: 'tout', en_retard: false });
    expect(filtresDuCompteur('echeance_depassee', { ...avant, statut: 'RESOLU' })).toMatchObject({
      statut: '',
      en_retard: true,
      periode: 'tout',
      page: 1,
    });
    // « Résolus sur 7 jours » compte sur la date de RÉSOLUTION : le clic pose le
    // filtre du serveur du même nom, période Tout (la période « 7 derniers
    // jours » porte sur la date de réception et cacherait un avis reçu il y a
    // 13 jours et résolu hier, pourtant compté).
    expect(filtresDuCompteur('resolus_7j', avant)).toEqual({
      ...FILTRES_DEFAUT,
      store: 'resto-1',
      resolus_7j: true,
      periode: 'tout',
    });
    expect(requeteDepuisFiltres(filtresDuCompteur('resolus_7j', avant))).toEqual({
      page: 1,
      limit: 20,
      resolus_7j: 'true',
      restaurantId: 'resto-1',
      periode: 'tout',
    });
    // Un autre compteur retire ce filtre.
    expect(filtresDuCompteur('nouveaux', filtresDuCompteur('resolus_7j', avant)).resolus_7j).toBe(false);
  });

  test("pastille de l'onglet : masquée à 0", () => {
    expect(pastilleOnglet(0)).toBeNull();
    expect(pastilleOnglet(undefined)).toBeNull();
    expect(pastilleOnglet(4)).toBe('4');
    expect(pastilleOnglet(150)).toBe('99+');
  });

  test('paramètres du serveur', () => {
    expect(requeteDepuisFiltres({ ...FILTRES_DEFAUT, recherche: ' a ' })).toEqual({ page: 1, limit: 20, periode: '7j' });
    expect(
      requeteDepuisFiltres({
        ...FILTRES_DEFAUT,
        recherche: ' 0707 ',
        ressenti: 'PAS_CONTENT',
        statut: 'A_RAPPELER',
        en_retard: true,
        store: 'aucun',
        periode: 'tout',
        page: 2,
      }),
    ).toEqual({
      page: 2,
      limit: 20,
      recherche: '0707',
      ressenti: 'PAS_CONTENT',
      statut: 'A_RAPPELER',
      en_retard: 'true',
      restaurantId: 'aucun',
      periode: 'tout',
    });
    // Point de vente : le serveur impose son restaurant.
    expect(requeteDepuisFiltres({ ...FILTRES_DEFAUT, store: 'resto-1' }, true).restaurantId).toBeUndefined();
  });

  test('filtres gardés : un ancien état incomplet est complété', () => {
    expect(lireFiltres(undefined)).toEqual(FILTRES_DEFAUT);
    expect(lireFiltres({ statut: 'INCONNU', periode: '90j', page: 0 })).toEqual(FILTRES_DEFAUT);
    expect(lireFiltres({ resolus_7j: true, periode: 'tout' })).toEqual({ ...FILTRES_DEFAUT, resolus_7j: true, periode: 'tout' });
  });
});

// ─── Clôture et journal (formulaires) ───────────────────────────────────────

describe('clôture', () => {
  const avecAccord = (statut, solution = '') => schema.verifierCloture({ statut, solution, accord_rappel: true }, 'EN_COURS');

  test('la solution est obligatoire pour Résolu', () => {
    expect(avecAccord('RESOLU')).toEqual({ ok: false, message: 'La solution est obligatoire pour Résolu.' });
    expect(avecAccord('RESOLU', 'GESTE_COMMERCIAL')).toEqual({
      ok: true,
      dto: { statut: 'RESOLU', solution: 'GESTE_COMMERCIAL', statut_lu: 'EN_COURS' },
    });
  });

  test('Classé : solution facultative ; autres statuts : solution ignorée', () => {
    expect(avecAccord('CLASSE')).toEqual({ ok: true, dto: { statut: 'CLASSE', solution: null, statut_lu: 'EN_COURS' } });
    expect(avecAccord('EN_COURS', 'EXCUSES')).toEqual({ ok: true, dto: { statut: 'EN_COURS', solution: null, statut_lu: 'EN_COURS' } });
  });

  test('Incident ouvert et Nouveau refusés à la main ; sans accord, ni À rappeler ni Injoignable', () => {
    expect(avecAccord('INCIDENT_OUVERT').message).toBe('Passer par Créer un incident.');
    expect(avecAccord('NOUVEAU').message).toBe('Choisissez le statut.');
    expect(avecAccord('').message).toBe('Choisissez le statut.');
    const sansAccord = (statut) => schema.verifierCloture({ statut, solution: '', accord_rappel: false }, 'NOUVEAU');
    expect(sansAccord('A_RAPPELER').ok).toBe(false);
    expect(sansAccord('INJOIGNABLE').ok).toBe(false);
    expect(sansAccord('CLASSE').ok).toBe(true);
  });

  test('options : Incident ouvert grisé ; À rappeler et Injoignable grisés sans accord', () => {
    const grises = (accord) => optionsCloture(accord).filter((o) => o.desactive).map((o) => o.valeur);
    expect(grises(true)).toEqual(['INCIDENT_OUVERT']);
    expect(grises(false)).toEqual(['A_RAPPELER', 'INJOIGNABLE', 'INCIDENT_OUVERT']);
    expect(optionsCloture(true).map((o) => o.libelle)).toEqual(['À rappeler', 'En cours', 'Injoignable', 'Incident ouvert', 'Résolu', 'Classé']);
  });
});

describe('journal', () => {
  const saisie = (action, resultat = '', note = '', accord_rappel = true) =>
    schema.verifierJournal({ action, resultat, note, accord_rappel });

  test('appel : résultat obligatoire, note facultative', () => {
    expect(saisie('APPEL')).toEqual({ ok: false, message: 'Choisissez le résultat.' });
    expect(saisie('APPEL', 'JOINT')).toEqual({ ok: true, dto: { action: 'APPEL', resultat: 'JOINT', note: null } });
    expect(saisie('APPEL', 'MESSAGERIE', '  rappeler demain  ')).toEqual({
      ok: true,
      dto: { action: 'APPEL', resultat: 'MESSAGERIE', note: 'rappeler demain' },
    });
  });

  test("WhatsApp : pas de messagerie ; sans accord, ni appel ni WhatsApp", () => {
    expect(saisie('WHATSAPP', 'MESSAGERIE').message).toBe('Un message WhatsApp est Joint ou Injoignable.');
    expect(saisie('APPEL', 'JOINT', '', false).message).toBe("Pas d'accord de rappel : ni appel ni WhatsApp.");
  });

  test('note interne : note obligatoire, résultat ignoré', () => {
    expect(saisie('NOTE', '', '   ')).toEqual({ ok: false, message: 'Écrivez la note.' });
    expect(saisie('NOTE', 'JOINT', 'vu', false)).toEqual({ ok: true, dto: { action: 'NOTE', note: 'vu' } });
    expect(saisie('NOTE', '', 'x'.repeat(2001)).message).toBe('La note ne doit pas dépasser 2 000 caractères.');
  });
});

// ─── Droits, téléphone, incident, cloche, erreurs ───────────────────────────

describe('droits', () => {
  test('traiter : administrateur et call center seulement', () => {
    expect(peutTraiterAvis({ role: 'ADMIN' })).toBe(true);
    expect(peutTraiterAvis({ role: 'CALL_CENTER' })).toBe(true);
    for (const role of ['MARKETING', 'MANAGER', 'CAISSIER', 'ASSISTANT_MANAGER', 'COMPTABLE', 'LIVRAISON_OPS', 'CUISINE']) {
      expect(peutTraiterAvis({ role })).toBe(false);
    }
    expect(peutTraiterAvis(null)).toBe(false);
  });
});

describe('téléphone', () => {
  test('affichage local et complet ; un numéro masqué reste tel quel', () => {
    expect(telephoneLocal('+2250102030405')).toBe('01 02 03 04 05');
    expect(telephoneComplet('+2250102030405')).toBe('+225 01 02 03 04 05');
    expect(telephoneLocal('+225••••••••05')).toBe('+225••••••••05');
    expect(telephoneComplet('+225••••••••05')).toBe('+225••••••••05');
  });

  test('WhatsApp : rien sur un numéro masqué ou trop court', () => {
    expect(lienWhatsApp('+2250102030405')).toBe('https://wa.me/2250102030405');
    expect(lienWhatsApp('0102030405')).toBe('https://wa.me/2250102030405');
    expect(lienWhatsApp('+225••••••••05')).toBeUndefined();
    expect(lienWhatsApp('123')).toBeUndefined();
    expect(lienWhatsApp(null)).toBeUndefined();
  });
});

describe('incident', () => {
  test('client rapproché et commande cochée obligatoires', () => {
    expect(raisonIncidentImpossible({ rapproche: false, order_id: null })).toBe('Client non rapproché.');
    expect(raisonIncidentImpossible({ rapproche: true, order_id: null })).toBe("Cocher d'abord la commande concernée.");
    expect(raisonIncidentImpossible({ rapproche: true, order_id: 'c1' })).toBeNull();
  });
});

describe('cloche', () => {
  test("`kind: 'avis'` ouvre la fiche de l'avis", () => {
    expect(cibleNotificationAvis({ kind: 'avis', avis_id: 'a1' })).toBe('a1');
  });
  test("une autre notification n'ouvre pas d'avis", () => {
    expect(cibleNotificationAvis({ kind: 'order', reference: 'CN-1' })).toBeNull();
    expect(cibleNotificationAvis({ ticketId: 't1' })).toBeNull();
    expect(cibleNotificationAvis({ kind: 'avis' })).toBeNull();
    expect(cibleNotificationAvis(null)).toBeNull();
  });
});

describe('erreurs', () => {
  test('409 : message du conflit ; 404 et 500 : message du serveur ; 400 : tableau lu', () => {
    expect(messageErreurAvis({ status: 409, message: 'x' })).toBe("L'avis a changé entre-temps. Rechargez la fiche.");
    expect(messageErreurAvis({ status: 404, message: 'Ressource non trouvée.', messageServeur: 'Catégorie de ticket introuvable.' })).toBe(
      'Catégorie de ticket introuvable.',
    );
    expect(messageErreurAvis({ status: 500, message: 'Erreur temporaire du serveur. Réessayez plus tard.', messageServeur: 'Internal server error' })).toBe(
      'Erreur temporaire du serveur. Réessayez plus tard.',
    );
    expect(messageErreurAvis({ status: 400, message: ['Choisissez le résultat.'] })).toBe('Choisissez le résultat.');
  });

  test('messages au personnel : vouvoiement, comme le reste du back-office', () => {
    const messages = [MESSAGE_CONFLIT, ...Object.values(schema).filter((v) => typeof v === 'string')];
    for (const m of messages) {
      expect({ m, tutoie: /\b(Choisis|Écris|Recharge|Saisis|Coche|Sélectionne)\b/.test(m) }).toEqual({ m, tutoie: false });
    }
  });
});

describe('gestes : la valeur lue part avec (claim du serveur)', () => {
  const avis = { id: 'a1', order_id: 'o-1', agent: { id: 'u-cc', fullname: 'Agent' } };

  test('commande : la commande cochée vue à l’écran part avec', () => {
    expect(corpsCommande(avis, 'o-2')).toEqual({ order_id: 'o-2', order_id_lu: 'o-1' });
    expect(corpsCommande(avis, null)).toEqual({ order_id: null, order_id_lu: 'o-1' });
    expect(corpsCommande({ order_id: null }, 'o-2')).toEqual({ order_id: 'o-2', order_id_lu: null });
  });

  test('agent : l’agent vu à l’écran part avec (Non assigné : null)', () => {
    expect(corpsAgent(avis, 'u-cc2')).toEqual({ agent_id: 'u-cc2', agent_lu: 'u-cc' });
    expect(corpsAgent({ agent: null }, 'u-cc2')).toEqual({ agent_id: 'u-cc2', agent_lu: null });
  });

  test('incident : la commande montrée dans la fenêtre part avec ; rien sans commande cochée', () => {
    expect(corpsTicket(avis, 'cat-1')).toEqual({ categoryId: 'cat-1', order_id: 'o-1' });
    expect(corpsTicket({ order_id: null }, 'cat-1')).toBeNull();
  });
});

describe('fiche et liste : un autre avis, un rafraîchissement raté', () => {
  const fiche = { id: 'a1', statut: 'A_RAPPELER', solution: null };

  test('formulaire Clôture : deux avis au même statut ne partagent jamais leur saisie', () => {
    expect(cleCloture(fiche)).not.toBe(cleCloture({ ...fiche, id: 'a2' }));
    expect(cleCloture(fiche)).not.toBe(cleCloture({ ...fiche, statut: 'EN_COURS' }));
    expect(cleCloture(fiche)).not.toBe(cleCloture({ ...fiche, solution: 'EXCUSES' }));
    expect(cleCloture(fiche)).toBe(cleCloture({ ...fiche }));
  });

  test('fiche déjà chargée et rafraîchissement raté : la fiche reste, avec un avertissement', () => {
    const panne = { status: 500, message: 'Erreur temporaire du serveur. Réessayez plus tard.' };
    expect(etatFiche({ avis: fiche, isLoading: false, isError: true, error: panne })).toEqual({ etat: 'fiche', avertissement: true });
    expect(etatFiche({ avis: fiche, isLoading: false, isError: false, error: null })).toEqual({ etat: 'fiche', avertissement: false });
    // Sans fiche : chargement, puis l'écran d'erreur.
    expect(etatFiche({ avis: undefined, isLoading: true, isError: false, error: null }).etat).toBe('chargement');
    expect(etatFiche({ avis: undefined, isLoading: false, isError: true, error: panne }).etat).toBe('erreur');
    // Avis supprimé entre-temps : « Cet avis n'existe plus. », même avec une copie en cache.
    expect(etatFiche({ avis: fiche, isLoading: false, isError: true, error: { status: 404 } }).etat).toBe('introuvable');
    expect(AVERTISSEMENT_FICHE).toContain('plus à jour');
  });

  test('liste déjà chargée et rafraîchissement raté : le tableau reste, avec un avertissement', () => {
    expect(etatListe({ lignes: [{ id: 'a1' }], isLoading: false, isError: true })).toEqual({ etat: 'table', avertissement: true });
    expect(etatListe({ lignes: [], isLoading: false, isError: false })).toEqual({ etat: 'vide', avertissement: false });
    expect(etatListe({ lignes: undefined, isLoading: true, isError: false }).etat).toBe('chargement');
    expect(etatListe({ lignes: undefined, isLoading: false, isError: true }).etat).toBe('erreur');
    expect(AVERTISSEMENT_LISTE).toContain('plus à jour');
  });
});

// ─── Textes : aucun tiret, aucune donnée d'exemple ──────────────────────────

const RACINE = join(import.meta.dir, '../..');
const fichiers = (dossier) =>
  readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return nom === '__tests__' ? [] : fichiers(chemin);
    return /\.(ts|tsx)$/.test(nom) ? [chemin] : [];
  });

describe('textes', () => {
  const textes = [
    ...Object.values(LIBELLE_CANAL),
    ...Object.values(LIBELLE_STATUT),
    ...Object.values(LIBELLE_SOLUTION),
    ...Object.values(LIBELLE_RESULTAT),
    ...Object.values(LIBELLE_ACTION),
    ...Object.values(SOURCES),
    ...COMPTEURS.map((c) => c.libelle),
    ...PERIODES.map((p) => p.libelle),
    SANS_PRENOM,
    JE_NE_SAIS_PAS,
    NON_ASSIGNE,
    ...Object.values(schema).filter((v) => typeof v === 'string'),
  ];

  test('aucun tiret cadratin ni demi-cadratin', () => {
    for (const t of textes) expect(t).not.toMatch(/[–—]/);
    for (const f of [...fichiers(RACINE), join(RACINE, '../../src/components/gestion/Clients/Reviews.tsx')]) {
      expect({ f, tiret: /[–—]/.test(readFileSync(f, 'utf8')) }).toEqual({ f, tiret: false });
    }
  });

  test("aucune donnée d'exemple de la maquette dans le code", () => {
    for (const f of fichiers(RACINE)) {
      const source = readFileSync(f, 'utf8');
      for (const exemple of ["Données d'exemple", 'CN-[réf]', 'Agent 1', 'Awa', '07 07 00 00 01']) {
        expect({ f, exemple, present: source.includes(exemple) }).toEqual({ f, exemple, present: false });
      }
    }
  });
});

// ─── Jumeaux du serveur ─────────────────────────────────────────────────────

const SERVEUR = join(import.meta.dir, '../../../../../backend/src');
const regles = join(SERVEUR, 'modules/customer/avis-prives/avis-prive.rules.ts');
const roles = join(SERVEUR, 'modules/auth/constantes/roles-avis-prives.ts');

/** Paires `CLE: 'valeur'` d'une constante exportée du serveur. */
function tableServeur(source, nom) {
  const debut = source.indexOf(`export const ${nom}`);
  if (debut < 0) throw new Error(`${nom} absent du serveur`);
  const bloc = source.slice(debut, source.indexOf('};', debut));
  const table = {};
  for (const m of bloc.matchAll(/['"]?([A-Za-z_-]+)['"]?\s*:\s*(['"])(.*?)\2/g)) table[m[1]] = m[3];
  return table;
}

describe.skipIf(!existsSync(regles) || !existsSync(roles))('fidèles au serveur', () => {
  const source = existsSync(regles) ? readFileSync(regles, 'utf8') : '';

  test("mots de l'écran", () => {
    expect(tableServeur(source, 'LIBELLE_CANAL_ECRAN')).toEqual(LIBELLE_CANAL);
    expect(tableServeur(source, 'LIBELLE_STATUT')).toEqual(LIBELLE_STATUT);
    expect(tableServeur(source, 'LIBELLE_RESSENTI')).toEqual(LIBELLE_RESSENTI);
    expect(tableServeur(source, 'LIBELLE_SOLUTION')).toEqual(LIBELLE_SOLUTION);
    expect(tableServeur(source, 'LIBELLE_RESULTAT')).toEqual(LIBELLE_RESULTAT);
    expect(tableServeur(source, 'LIBELLE_ACTION')).toEqual(LIBELLE_ACTION);
  });

  test('sources de la liste blanche', () => {
    expect(tableServeur(source, 'SOURCES')).toEqual(SOURCES);
  });

  test('messages des formulaires et du conflit', () => {
    const messages = {
      MESSAGE_CONFLIT,
      MESSAGE_SOLUTION: schema.MESSAGE_SOLUTION,
      MESSAGE_INCIDENT_MANUEL: schema.MESSAGE_INCIDENT_MANUEL,
      MESSAGE_SANS_ACCORD: schema.MESSAGE_SANS_ACCORD,
      MESSAGE_SANS_ACCORD_STATUT: schema.MESSAGE_SANS_ACCORD_STATUT,
      MESSAGE_RESULTAT: schema.MESSAGE_RESULTAT,
      MESSAGE_RESULTAT_WHATSAPP: schema.MESSAGE_RESULTAT_WHATSAPP,
      MESSAGE_NOTE: schema.MESSAGE_NOTE,
      MESSAGE_NOTE_LONGUE: schema.MESSAGE_NOTE_LONGUE,
    };
    for (const [nom, texte] of Object.entries(messages)) {
      const m = new RegExp(`export const ${nom} =\\s*(['"])(.*?)\\1;`).exec(source);
      expect({ nom, texte: m?.[2] }).toEqual({ nom, texte });
    }
  });

  test('rôles de traitement', () => {
    const r = /ROLES_TRAITEMENT_AVIS = \[([^\]]*)\]/.exec(readFileSync(roles, 'utf8'));
    const serveur = [...(r?.[1] ?? '').matchAll(/UserRole\.([A-Z_]+)/g)].map((m) => m[1]);
    expect(serveur).toEqual([...ROLES_TRAITEMENT_AVIS]);
  });
});
