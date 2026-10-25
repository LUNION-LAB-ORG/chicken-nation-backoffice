'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, InfoWindowF, MarkerF } from '@react-google-maps/api';
import { Bike, Car, Eye, EyeOff, MapPin, X } from 'lucide-react';

import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { useDashboardStore } from '@/store/dashboardStore';
import { formatImageUrl } from '@/utils/imageHelpers';

import BoutonAppelerLivreur from '../../calls/components/BoutonAppelerLivreur';
import { sousTitreLivreur } from '../../calls/utils/appel-livreur';
import { AnimatedDelivererMarker } from '../../maps/components/AnimatedDelivererMarker';
import { restaurantMarkerIcon } from '../../maps/components/marker-icons';
import type { PositionGps } from '../../operations/utils/suivi-course';
import type { EtatDisponibilite } from '../types/livreur.types';
import {
  COULEURS_ETAT,
  COULEURS_PRESENCE,
  NOM_ETAT,
  ORDRE_ETATS,
  libellePresence,
  presenceAppli,
  type PresenceAppli,
} from '../utils/disponibilite';
import {
  placeCourte,
  texteCourseCarte,
  texteDernierePosition,
  texteFinTournee,
  textesArrets,
  type LivreurEnDirect,
} from '../utils/groupes-en-direct';
import { PastilleEtat, initialesLivreur } from './PastilleEtat';
import { ICONE_PRESENCE } from './PresenceAppliLigne';

/**
 * CARTE D'EN DIRECT (conception du 24/10, 9.4), le cœur de l'ancienne carte
 * des livreurs sans sa colonne ni son sélecteur de restaurant : la liste et
 * le filtre sont à côté (« Livreurs », bandeau des restaurants).
 *
 *  - marqueurs des livreurs, couleur de leur état, qui glissent d'une
 *    position à l'autre ; marqueurs des restaurants, nom au survol ;
 *  - légende des états ; « Positions anciennes » montre ou cache les
 *    livreurs sans position récente (le livreur choisi reste montré) ;
 *  - fenêtre du livreur choisi : état, véhicule, place dans la file, course
 *    et ses arrêts, fin de tournée, appli, dernière position, « Voir le
 *    livreur » (comme la fiche d'une course), « Voir la course », « Appeler »
 *    (admin et centre d'appels).
 *    Sans position, la fenêtre s'ouvre dans un coin de la carte.
 */

const ABIDJAN = { lat: 5.348, lng: -4.027 };

export interface RestaurantSurCarte {
  id: string;
  nom: string;
  position: PositionGps;
}

export interface CarteEnDirectProps {
  lignes: LivreurEnDirect[];
  /** Livreur choisi, et le numéro du choix : chaque nouveau choix recentre la carte. */
  choix: { id: string; n: number } | null;
  onChoisir: (livreurId: string) => void;
  onFermer: () => void;
  restaurants: RestaurantSurCarte[];
  /** Restaurant choisi dans le bandeau : la carte s'y centre quand il change. */
  centreRestaurant: PositionGps | null;
  maintenant: Date;
}

// ─── Marqueurs ───────────────────────────────────────────────────────────────

function iconeLivreur(etat: EtatDisponibilite, initiales: string, choisi: boolean, ancienne: boolean): google.maps.Icon {
  const couleur = COULEURS_ETAT[etat].couleur;
  const taille = choisi ? 48 : 36;
  const r = choisi ? 20 : 14;
  const cx = taille / 2;
  const opacite = ancienne && !choisi ? 0.5 : 1;

  const svg = choisi
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${taille} ${taille}" width="${taille}" height="${taille}">
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="${couleur}" stroke="white" stroke-width="3.5"/>
        <text x="${cx}" y="${cx + 5}" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="13" font-weight="bold">${initiales}</text>
       </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${taille} ${taille}" width="${taille}" height="${taille}" opacity="${opacite}">
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="${couleur}" stroke="white" stroke-width="2.5"/>
        <circle cx="${cx}" cy="${cx}" r="4" fill="white"/>
       </svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(taille, taille),
    anchor: new google.maps.Point(cx, cx),
  };
}

// ─── Fenêtre du livreur ──────────────────────────────────────────────────────

const VEHICULES: Record<string, { libelle: string; Icone: React.ComponentType<{ className?: string }> }> = {
  MOTO: { libelle: 'Moto', Icone: Bike },
  VELO: { libelle: 'Vélo', Icone: Bike },
  VOITURE: { libelle: 'Voiture', Icone: Car },
};

function Info({ terme, children, title }: { terme: string; children: React.ReactNode; title?: string }) {
  return (
    <div className="flex items-center justify-between gap-3" title={title}>
      <dt className="shrink-0 text-gray-500">{terme}</dt>
      <dd className="min-w-0 truncate text-right font-semibold text-gray-800">{children}</dd>
    </div>
  );
}

/** « Appli fermée · vue il y a 6 min », « En arrière-plan ». */
function InfoAppli({ appli }: { appli: PresenceAppli }) {
  const Icone = ICONE_PRESENCE[appli.cas];
  return (
    <div className="flex items-center justify-between gap-3" title={appli.raison}>
      <dt className="shrink-0 text-gray-500">Appli</dt>
      <dd
        className="flex min-w-0 items-center gap-1 truncate text-right font-semibold"
        style={{ color: COULEURS_PRESENCE[appli.cas].texte }}
      >
        <Icone className="h-3 w-3 shrink-0" />
        <span className="truncate">{libellePresence(appli)}</span>
      </dd>
    </div>
  );
}

function FenetreLivreur({ ligne, maintenant }: { ligne: LivreurEnDirect; maintenant: Date }) {
  const openLivreur = useDashboardStore((s) => s.openLivreur);
  const openCourse = useDashboardStore((s) => s.openCourse);
  const { live, nom, etat, libelleEtat, rang } = ligne;
  const course = live.active_course;
  const vehicule = live.type_vehicule ? VEHICULES[live.type_vehicule] : null;
  const place = etat === 'DISPONIBLE' ? placeCourte(rang) : null;
  const appli = presenceAppli(live, etat, maintenant);
  const fin = course ? texteFinTournee(course) : null;
  const arrets = course ? textesArrets(course.deliveries ?? []) : [];
  const position = texteDernierePosition(live.location_at, maintenant);

  return (
    <div className="w-[260px] p-1">
      <div className="mb-2 flex items-start gap-2.5">
        <PastilleEtat
          variante="anneau"
          etat={etat}
          title={libelleEtat}
          image={live.image ? formatImageUrl(live.image) : null}
          prenom={live.first_name}
          nom={live.last_name}
          taille={36}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900" title={nom}>
            {nom}
          </p>
          {live.restaurant && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-gray-500">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{live.restaurant.name}</span>
            </p>
          )}
        </div>
        <PastilleEtat etat={etat} title={libelleEtat} />
      </div>

      <dl className="space-y-1 text-[11px]">
        {vehicule && (
          <Info terme="Véhicule">
            <span className="inline-flex items-center gap-1">
              <vehicule.Icone className="h-3 w-3" />
              {vehicule.libelle}
            </span>
          </Info>
        )}
        {place && <Info terme="Rang FIFO">{place}</Info>}
        {course && (
          <>
            <Info terme="Course active" title={texteCourseCarte(course)}>
              {texteCourseCarte(course)}
            </Info>
            {arrets.map((texte) => (
              <p key={texte} className="truncate text-gray-700" title={texte}>
                {texte}
              </p>
            ))}
            {fin && <p className={fin.retard ? 'font-semibold text-red-600' : 'text-gray-700'}>{fin.texte}</p>}
          </>
        )}
        {appli && <InfoAppli appli={appli} />}
        {position && <p className="text-gray-400">{position}</p>}
      </dl>

      <div className="mt-2.5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => openLivreur(live.id)}
          className="text-xs font-semibold text-[#F17922] hover:underline"
        >
          Voir le livreur
        </button>
        {course && (
          <button
            type="button"
            onClick={() => openCourse(course.id)}
            className="text-xs font-semibold text-[#F17922] hover:underline"
          >
            Voir la course
          </button>
        )}
        <BoutonAppelerLivreur
          delivererId={live.id}
          nom={nom}
          detail={sousTitreLivreur(live.restaurant?.name)}
          className="ml-auto"
        />
      </div>
    </div>
  );
}

// ─── Carte ───────────────────────────────────────────────────────────────────

export function CarteEnDirect({
  lignes,
  choix,
  onChoisir,
  onFermer,
  restaurants,
  centreRestaurant,
  maintenant,
}: CarteEnDirectProps) {
  const { isScriptLoaded } = useGoogleMaps();
  const [positionsAnciennes, setPositionsAnciennes] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const choisi = choix?.id ?? null;

  const surCarte = useMemo(
    () => lignes.filter((l) => l.position && (l.positionRecente || positionsAnciennes || l.id === choisi)),
    [lignes, positionsAnciennes, choisi],
  );
  const nombreAnciennes = useMemo(() => lignes.filter((l) => l.position && !l.positionRecente).length, [lignes]);
  const choisie = choisi ? (lignes.find((l) => l.id === choisi) ?? null) : null;

  // Position du livreur choisi au moment où la carte en a besoin, sans
  // recentrer à chaque position reçue.
  const positionChoisie = useRef<PositionGps | null>(null);
  positionChoisie.current = choisie?.position ?? null;

  const centrerSurChoisi = useCallback(() => {
    const pos = positionChoisie.current;
    if (!pos || !mapRef.current) return;
    mapRef.current.panTo(pos);
    mapRef.current.setZoom(16);
  }, []);

  // Centre de départ figé : le restaurant choisi, sinon le milieu de la
  // flotte au premier chargement. Recalculé, il combattrait le glissement
  // des marqueurs et le déplacement fait à la main.
  const centreInitial = useRef<PositionGps | null>(null);
  if (centreInitial.current === null) {
    if (centreRestaurant) {
      centreInitial.current = centreRestaurant;
    } else if (surCarte.length > 0) {
      const somme = surCarte.reduce(
        (a, l) => ({ lat: a.lat + l.position!.lat, lng: a.lng + l.position!.lng }),
        { lat: 0, lng: 0 },
      );
      centreInitial.current = { lat: somme.lat / surCarte.length, lng: somme.lng / surCarte.length };
    }
  }
  const centre = centreInitial.current ?? ABIDJAN;

  // Chaque nouveau choix (ligne, marqueur, alerte) recentre la carte.
  const numeroChoix = choix?.n ?? 0;
  useEffect(() => {
    if (numeroChoix > 0) centrerSurChoisi();
  }, [numeroChoix, centrerSurChoisi]);

  // Autre restaurant dans le bandeau : la carte s'y déplace.
  const cleRestaurant = centreRestaurant ? `${centreRestaurant.lat},${centreRestaurant.lng}` : '';
  const restaurantPrecedent = useRef(cleRestaurant);
  useEffect(() => {
    if (restaurantPrecedent.current === cleRestaurant) return;
    restaurantPrecedent.current = cleRestaurant;
    if (centreRestaurant && mapRef.current) {
      mapRef.current.panTo(centreRestaurant);
      mapRef.current.setZoom(14);
    }
  }, [cleRestaurant, centreRestaurant]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      // Carte montrée après le choix (petit écran) : elle s'ouvre sur lui.
      if (positionChoisie.current) centrerSurChoisi();
    },
    [centrerSurChoisi],
  );

  if (!isScriptLoaded) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl bg-gray-100">
        <p className="text-sm text-gray-500">Chargement de la carte…</p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-xl border border-[#E4E4E7] bg-white">
      {/* Légende */}
      <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-5rem)] flex-wrap gap-2 rounded-xl border border-gray-100 bg-white/90 px-3 py-1.5 text-[11px] shadow-sm backdrop-blur-sm">
        {ORDRE_ETATS.filter((etat) => etat !== 'INACTIF').map((etat) => (
          <span key={etat} className="inline-flex items-center gap-1 font-semibold" style={{ color: COULEURS_ETAT[etat].texte }}>
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: COULEURS_ETAT[etat].couleur }} />
            {NOM_ETAT[etat]}
          </span>
        ))}
      </div>

      {/* Positions anciennes */}
      <button
        type="button"
        onClick={() => setPositionsAnciennes((v) => !v)}
        aria-pressed={positionsAnciennes}
        title={
          nombreAnciennes > 1
            ? `${nombreAnciennes} livreurs sans position récente`
            : nombreAnciennes === 1
              ? '1 livreur sans position récente'
              : undefined
        }
        className={`absolute bottom-6 right-[60px] z-10 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
          positionsAnciennes
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        {positionsAnciennes ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        Positions anciennes
      </button>

      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={centre}
        zoom={13}
        onLoad={onLoad}
        onClick={onFermer}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          clickableIcons: false,
          styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
        }}
      >
        {restaurants.map((r) => (
          <MarkerF
            key={`restaurant-${r.id}`}
            position={r.position}
            icon={restaurantMarkerIcon()}
            title={r.nom}
            cursor="default"
            zIndex={0}
          />
        ))}

        {surCarte.map((l) => (
          <AnimatedDelivererMarker
            key={l.id}
            position={l.position!}
            onClick={() => onChoisir(l.id)}
            icon={iconeLivreur(
              l.etat,
              initialesLivreur(l.live.first_name, l.live.last_name),
              choisi === l.id,
              !l.positionRecente,
            )}
            durationMs={5000}
            zIndex={choisi === l.id ? 10 : 1}
          />
        ))}

        {choisie?.position && (
          <InfoWindowF position={choisie.position} onCloseClick={onFermer}>
            <FenetreLivreur ligne={choisie} maintenant={maintenant} />
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* Livreur choisi sans position : sa fenêtre dans un coin. */}
      {choisie && !choisie.position && (
        <div className="absolute bottom-3 left-3 z-10 rounded-xl border border-gray-200 bg-white p-2 pt-6 shadow-lg">
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="absolute right-1.5 top-1.5 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <FenetreLivreur ligne={choisie} maintenant={maintenant} />
        </div>
      )}
    </div>
  );
}

export default CarteEnDirect;
