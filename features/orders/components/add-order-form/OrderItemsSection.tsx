"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import Checkbox from "@/components/ui/Checkbox";
import {
  OrderFormData,
  OrderItemFormData,
  SupplementItem,
  SupplementOption,
} from "../../types/order-form.types";
import { Dish } from "../../../menus/types/dish.types";
import { useCategoryListQuery } from "../../../menus/queries/category/category-list.query";
import { useCategoryOneQuery } from "../../../menus/queries/category/category-one.query";
import { Minus, Plus, Search, UtensilsCrossed, X } from "lucide-react";
import { useDishListQuery } from "../../../menus/queries/dish-list.query";
import { useDishListClientQuery } from "../../../menus/queries/dish-list-client.query";
import { formatImageUrl } from "@/utils/imageHelpers";
import { getAllSupplements, Supplement } from "@/services/supplementService";
import { DishOptionGroup } from "../../../menus/types/dish-option.types";
import { dishOneQueryOption, useDishOneQuery } from "../../../menus/queries/dish-one.query";
import DishOptionsPicker from "./DishOptionsPicker";
import {
  idsConnus,
  idsParDefaut,
  prixOptionsUnitaire,
  resumeComposition,
  verifierComposition,
} from "../../utils/dishOptions";
import { DepartPlat, LigneDerniereCommande } from "../../types/habitudes.types";
import {
  RECHERCHE_MIN,
  ajouterLigne,
  chercherPlats,
  ligneComposee,
  lignePlatSimple,
  messageNonRepris,
  preparerReprise,
} from "../../utils/habitudes";
import CartePlat from "./CartePlat";
import EnTeteSection from "./EnTeteSection";
import LignesPanier, { LignePanier } from "./LignesPanier";
import { supplementsNommes } from "../../utils/panier";
import MenusHabituels from "./MenusHabituels";

interface OrderItemsSectionProps {
  formData: OrderFormData;
  items: OrderItemFormData[];
  onItemsChange: (items: OrderItemFormData[]) => void;
  /** Remonte le sous-total (plats+suppléments) au parent → sert au calcul des offres de livraison. */
  onSubtotalChange?: (subtotal: number) => void;
  /**
   * Où afficher les lignes du panier : le panneau à côté du formulaire, posé
   * par le parent. Les lignes y sont rendues d'ici, parce que leur prix et
   * leurs gestes (modifier, retirer, quantité) vivent avec le catalogue.
   */
  ciblePanier?: HTMLElement | null;
  /** Modification d'une commande : sa dernière commande n'est pas proposée. */
  enModification?: boolean;
}

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  formData,
  items,
  onItemsChange,
  onSubtotalChange,
  ciblePanier,
  enModification = false,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  // Recherche d'un plat, toutes catégories confondues.
  const [recherche, setRecherche] = useState("");
  // « Remettre au panier » : vérification des plats à options en cours.
  const [remiseEnCours, setRemiseEnCours] = useState(false);
  // Panier du dernier rendu, pour un ajout fait après une attente réseau.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const [selectedDishForConfig, setSelectedDishForConfig] =
    useState<Dish | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempSupplements, setTempSupplements] = useState<SupplementItem[]>([]);
  const [tempEpice, setTempEpice] = useState(false);
  /**
   * MENUS COMPOSABLES : choix en cours pour la ligne éditée.
   *
   * `null` signifie « rien décidé », ce qui déclenchera la pose des choix par
   * défaut quand le détail du plat arrivera. En modification, la valeur est
   * posée AVANT l'arrivée du détail, ce qui empêche les défauts d'écraser une
   * composition déjà validée.
   */
  const [tempOptionIds, setTempOptionIds] = useState<string[] | null>(null);

  // Récupérer tous les plats (passe par withEffective() côté backend, donc
  // contient `excluded_supplement_ids` + `dish_supplements` effectifs).
  const { data: allDishes } = useDishListQuery();
  // Récupérer toutes les catégories
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategoryListQuery();
  const categories = categoriesData || [];

  // Récupérer les plats de la catégorie sélectionnée (NB: l'endpoint backend
  // category.findOne ne passe PAS par withEffective ; on n'utilise donc ces
  // dishes que pour l'affichage de la grille, et on re-fetch la version
  // "withEffective" depuis allDishes au moment du clic — voir handleSelectDish).
  //
  // `formData.customer_id` : si un client est sélectionné pour la commande, on
  // masque la grille selon SON audience (carte/niveau) — c'est le SEUL endroit
  // du backoffice où le masque s'applique. Sans client (walk-in) → staff voit tout.
  const { data: categoryData, isLoading: isLoadingDishes } =
    useCategoryOneQuery(selectedCategoryId, formData.customer_id);

  const dishes = categoryData?.dishes || [];

  // RECHERCHE : même règle que la grille. Avec un client, les plats de SON
  // audience (masque du serveur) ; sans client, tout le catalogue. Si la liste
  // du client ne répond pas, on retombe sur le catalogue : le serveur refuse
  // de toute façon un plat réservé à l'enregistrement.
  const { data: platsClient, isLoading: chargementPlatsClient } = useDishListClientQuery(
    formData.customer_id || undefined,
  );
  const enRecherche = recherche.trim().length >= RECHERCHE_MIN;
  const platsRecherche = useMemo(
    () =>
      enRecherche
        ? chercherPlats((formData.customer_id ? platsClient : undefined) ?? allDishes ?? [], recherche)
        : [],
    [enRecherche, recherche, formData.customer_id, platsClient, allDishes],
  );
  const platsAffiches: Dish[] = enRecherche ? platsRecherche : dishes;
  const chargementGrille = enRecherche
    ? !!formData.customer_id && chargementPlatsClient && !allDishes
    : isLoadingDishes;

  // Quantité déjà au panier, par plat : rappelée sur sa carte.
  const quantiteParPlat = useMemo(() => {
    const table: Record<string, number> = {};
    items.forEach((item) => {
      table[item.dish_id] = (table[item.dish_id] ?? 0) + item.quantity;
    });
    return table;
  }, [items]);

  // Récupérer TOUS les suppléments du catalogue, groupés par catégorie.
  // Sert à afficher la liste complète dans la modal (les exclus du plat
  // apparaissent grisés au lieu d'être masqués).
  const { data: allSupplementsByCategory } = useQuery({
    queryKey: ["supplements", "all"],
    queryFn: getAllSupplements,
    staleTime: 5 * 60 * 1000,
  });

  const queryClient = useQueryClient();

  // MENUS COMPOSABLES. Le marqueur `composable` voyage déjà dans les listes :
  // un plat ORDINAIRE ne déclenche donc aucune requête supplémentaire, et la
  // prise de commande reste exactement aussi rapide qu'avant.
  const platComposable = Boolean(selectedDishForConfig?.composable);
  const {
    data: detailPlat,
    isLoading: chargementOptions,
    isError: erreurOptions,
    error: objetErreurOptions,
    refetch: rechargerOptions,
  } = useDishOneQuery(platComposable ? selectedDishForConfig?.id : undefined);
  const groupesModale = detailPlat?.option_groups ?? [];

  // Les lignes déjà composées ont besoin du prix de leurs choix pour le
  // sous-total du panier. Une requête par plat distinct, cache partagé avec la
  // modale : rouvrir une ligne ne coûte aucun appel.
  const platsComposes = useMemo(
    () =>
      Array.from(
        new Set(items.filter((i) => i.option_item_ids?.length).map((i) => i.dish_id)),
      ),
    [items],
  );
  const detailsPanier = useQueries({
    queries: platsComposes.map((id) => dishOneQueryOption(id)),
  });
  const groupesParPlat = useMemo(() => {
    const table: Record<string, DishOptionGroup[]> = {};
    detailsPanier.forEach((r) => {
      const plat = r.data as Dish | undefined;
      if (plat?.option_groups) table[plat.id] = plat.option_groups;
    });
    if (detailPlat?.option_groups) table[detailPlat.id] = detailPlat.option_groups;
    return table;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailsPanier, detailPlat]);

  // Choix par défaut posés UNE fois, à l'arrivée du détail, et seulement si
  // l'opérateur n'a rien décidé. En modification, `tempOptionIds` est déjà
  // renseigné, donc rien n'est écrasé.
  useEffect(() => {
    const groupes = detailPlat?.option_groups;
    if (!groupes?.length) return;
    setTempOptionIds((actuel) =>
      actuel === null ? idsParDefaut(groupes) : idsConnus(groupes, actuel),
    );
  }, [detailPlat]);

  const addItemToCart = () => {
    if (!selectedDishForConfig) return;
    // Un plat composable envoyé sans ses choix ferait rejeter TOUTE la
    // commande par le serveur, pas seulement cette ligne.
    if (blocageComposition) return;

    const optionIds = platComposable ? (tempOptionIds ?? []) : [];

    if (editingItemIndex !== null) {
      // Modifier l'article existant
      const newItems = [...items];
      newItems[editingItemIndex] = {
        dish_id: selectedDishForConfig.id,
        quantity: tempQuantity,
        supplements: tempSupplements.filter((s) => s.quantity > 0),
        epice: tempEpice,
        option_item_ids: optionIds,
      };
      onItemsChange(newItems);
      setEditingItemIndex(null);
    } else {
      // Ajouter un nouvel article
      onItemsChange([
        ...items,
        {
          dish_id: selectedDishForConfig.id,
          quantity: tempQuantity,
          supplements: tempSupplements.filter((s) => s.quantity > 0),
          epice: selectedDishForConfig.is_alway_epice ? true : tempEpice,
          option_item_ids: optionIds,
        },
      ]);
    }

    // Réinitialiser
    setSelectedDishForConfig(null);
    setTempQuantity(1);
    setTempSupplements([]);
    setTempEpice(false);
    setTempOptionIds(null);
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  /** Quantité changée depuis le panier, sans rouvrir la fenêtre du plat. */
  const changerQuantite = (index: number, quantite: number) => {
    if (quantite < 1) return;
    onItemsChange(items.map((item, i) => (i === index ? { ...item, quantity: quantite } : item)));
  };

  /**
   * Ouvre la fenêtre d'un plat. `depart` : sa dernière façon de le commander
   * (menus habituels) ; sans lui, la fenêtre part de zéro comme avant.
   */
  const ouvrirPlat = (dish: Dish, depart?: DepartPlat) => {
    // Privilégier la version "withEffective" (qui contient
    // excluded_supplement_ids) — celle du categoryData ne l'a pas.
    setSelectedDishForConfig(getDishById(dish.id) || dish);
    setEditingItemIndex(null);
    setTempQuantity(1);
    setTempSupplements(depart?.supplements ?? []);
    setTempEpice(depart?.epice ?? false);
    // `null` : les choix par défaut seront posés à l'arrivée du détail. Des
    // choix d'une commande passée sont nettoyés à l'arrivée (`idsConnus`).
    setTempOptionIds(depart && depart.option_item_ids.length > 0 ? depart.option_item_ids : null);
  };

  /**
   * « + » d'une carte : une unité au panier, sans passer par la fenêtre. Un
   * plat composable a des choix obligatoires : sa fenêtre s'ouvre.
   */
  const ajouterDirect = (dish: Dish) => {
    const plat = getDishById(dish.id) || dish;
    if (plat.composable) {
      ouvrirPlat(plat);
      return;
    }
    onItemsChange(ajouterLigne(items, lignePlatSimple(plat)));
  };

  /**
   * « Remettre au panier » la dernière commande du client. Les plats
   * ordinaires partent tels quels ; un plat à options n'est repris que si ses
   * choix d'alors tiennent toujours, sinon l'agent le compose de nouveau.
   */
  const remettreDerniereCommande = async (lignes: LigneDerniereCommande[]) => {
    if (remiseEnCours) return;
    const catalogue = new Map((allDishes ?? []).map((dish: Dish) => [dish.id, dish]));
    const reprise = preparerReprise(lignes, catalogue);
    const reprises = [...reprise.lignes];
    const aComposer: string[] = [];

    if (reprise.aVerifier.length > 0) {
      setRemiseEnCours(true);
      try {
        for (const { ligne, dish } of reprise.aVerifier) {
          try {
            const detail = (await queryClient.fetchQuery(dishOneQueryOption(dish.id))) as Dish;
            const composee = ligneComposee(ligne, dish, detail?.option_groups ?? []);
            if (composee) reprises.push(composee);
            else aComposer.push(ligne.nom);
          } catch {
            aComposer.push(ligne.nom);
          }
        }
      } finally {
        setRemiseEnCours(false);
      }
    }

    if (reprises.length > 0) {
      onItemsChange(reprises.reduce(ajouterLigne, itemsRef.current));
    }
    const nonRepris = messageNonRepris(reprise.retires, aComposer);
    if (nonRepris) toast(nonRepris, { duration: 6000 });
  };

  const editItem = (index: number) => {
    const item = items[index];
    const dish = getDishById(item.dish_id);
    if (!dish) return;

    setSelectedDishForConfig(dish);
    setEditingItemIndex(index);
    setTempQuantity(item.quantity);
    setTempSupplements(item.supplements);
    setTempEpice(item.epice);
    // Posé AVANT l'arrivée du détail : sans cela, les choix par défaut
    // écraseraient en silence la composition déjà validée par l'opérateur.
    setTempOptionIds(item.option_item_ids ?? []);
  };

  const getDishById = (dishId: string): Dish | undefined => {
    if (!allDishes) return undefined;
    return allDishes.find((dish: Dish) => dish.id === dishId);
  };

  // Aplatit la map { FOOD, DRINK, ACCESSORY } renvoyée par /supplements en un seul tableau.
  const allSupplementsFlat = useMemo<Supplement[]>(() => {
    if (!allSupplementsByCategory) return [];
    return [
      ...(allSupplementsByCategory.FOOD ?? []),
      ...(allSupplementsByCategory.DRINK ?? []),
      ...(allSupplementsByCategory.ACCESSORY ?? []),
    ];
  }, [allSupplementsByCategory]);

  // Construit la liste affichée dans la modal.
  // Source primaire : `dish.dish_supplements` (renvoyée par withEffective côté backend)
  // qui contient déjà les suppléments NON exclus de ce plat, avec leur info complète.
  // On enrichit avec les EXCLUS (depuis allSupplementsFlat si chargé) pour les afficher grisés.
  // Si la query catalogue n'a pas répondu, on liste au moins les non-exclus.
  const getSupplementsOptions = (dish: Dish): SupplementOption[] => {
    const excludedIds = new Set(
      ((dish as unknown as { excluded_supplement_ids?: string[] }).excluded_supplement_ids) ?? [],
    );

    // 1) Suppléments effectifs (non exclus, déjà filtrés available=true côté backend)
    const nonExcluded: SupplementOption[] = (dish.dish_supplements ?? [])
      .filter((ds) => ds.supplement && ds.supplement.available !== false)
      .map((ds) => ({
        value: ds.supplement!.id,
        label: ds.supplement!.name,
        price: ds.supplement!.price,
        image: formatImageUrl(ds.supplement!.image),
        type: ds.supplement!.category || "ACCESSORY",
        excluded: false,
      }));

    // 2) Exclus : depuis le catalogue complet (si chargé), pour avoir leurs name/price/image
    const excluded: SupplementOption[] = allSupplementsFlat
      .filter((s) => excludedIds.has(s.id) && s.available !== false)
      .map((s) => ({
        value: s.id,
        label: s.name,
        price: s.price,
        image: formatImageUrl(s.image),
        type: s.category,
        excluded: true,
      }));

    return [...nonExcluded, ...excluded];
  };

  // Grouper les suppléments par catégorie, exclus triés à la fin de chaque groupe
  // pour que les options sélectionnables apparaissent en premier.
  const groupedSupplements = useMemo(() => {
    if (!selectedDishForConfig) return { FOOD: [], DRINK: [], ACCESSORY: [] };

    const supplements = getSupplementsOptions(selectedDishForConfig);
    const grouped = supplements.reduce(
      (acc, supp) => {
        const category = supp.type as "FOOD" | "DRINK" | "ACCESSORY";
        if (!acc[category]) acc[category] = [];
        acc[category].push(supp);
        return acc;
      },
      { FOOD: [], DRINK: [], ACCESSORY: [] } as Record<
        "FOOD" | "DRINK" | "ACCESSORY",
        SupplementOption[]
      >
    );
    (["FOOD", "DRINK", "ACCESSORY"] as const).forEach((cat) => {
      grouped[cat].sort((a, b) => Number(a.excluded) - Number(b.excluded));
    });
    return grouped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDishForConfig, allSupplementsFlat]);

  const calculateItemTotal = (item: OrderItemFormData): number => {
    const dish = getDishById(item.dish_id);
    if (!dish) return 0;

    const basePrice =
      dish.is_promotion && dish.promotion_price
        ? dish.promotion_price
        : dish.price;

    // Le prix vient du catalogue complet (allSupplementsFlat) — couvre aussi le
    // cas d'un supplément ajouté avant qu'il ne devienne exclu du plat.
    const supplementsPrice = item.supplements.reduce((sum, supp) => {
      const fromCatalog = allSupplementsFlat.find((s) => s.id === supp.id);
      const fallback = dish.dish_supplements?.find(
        (ds) => ds.supplement?.id === supp.id
      )?.supplement;
      const price = fromCatalog?.price ?? fallback?.price ?? 0;
      return sum + price * supp.quantity;
    }, 0);

    // MENUS COMPOSABLES : les options suivent la quantité de la ligne, les
    // suppléments gardent la leur. C'est exactement la formule du serveur ;
    // toute divergence se verrait à l'encaissement.
    const optionsUnitaire = prixOptionsUnitaire(
      groupesParPlat[item.dish_id] ?? [],
      item.option_item_ids ?? [],
    );

    return (
      basePrice * item.quantity +
      optionsUnitaire * item.quantity +
      supplementsPrice
    );
  };

  // Calculer le prix actuel en temps réel dans le modal
  const calculateTempTotal = (): number => {
    if (!selectedDishForConfig) return 0;

    const basePrice =
      selectedDishForConfig.is_promotion &&
      selectedDishForConfig.promotion_price
        ? selectedDishForConfig.promotion_price
        : selectedDishForConfig.price;

    const supplementsPrice = tempSupplements.reduce((sum, supp) => {
      const fromCatalog = allSupplementsFlat.find((s) => s.id === supp.id);
      const fallback = selectedDishForConfig.dish_supplements?.find(
        (ds) => ds.supplement?.id === supp.id
      )?.supplement;
      const price = fromCatalog?.price ?? fallback?.price ?? 0;
      return sum + price * supp.quantity;
    }, 0);

    const optionsUnitaire = prixOptionsUnitaire(groupesModale, tempOptionIds ?? []);

    return (
      basePrice * tempQuantity +
      optionsUnitaire * tempQuantity +
      supplementsPrice
    );
  };

  /**
   * Ce qui verrouille « Ajouter au panier », ou `null`.
   *
   * Trois cas, tous propres à un plat composable : détail en cours de
   * chargement, détail introuvable, composition incomplète. Le vérifier ici
   * évite que le serveur rejette TOUTE la commande pour une seule ligne.
   */
  const blocageComposition: string | null = !platComposable
    ? null
    : chargementOptions
      ? "Chargement des options du plat"
      : erreurOptions
        ? "Options du plat indisponibles, réessayez"
        : verifierComposition(groupesModale, tempOptionIds ?? []);

  // Helpers pour gérer la quantité des suppléments
  const getSupplementQuantity = (suppId: string): number => {
    const found = tempSupplements.find((s) => s.id === suppId);
    return found ? found.quantity : 0;
  };

  const updateSupplementQuantity = (suppId: string, delta: number) => {
    const existing = tempSupplements.find((s) => s.id === suppId);
    if (existing) {
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        // Supprimer le supplément
        setTempSupplements(tempSupplements.filter((s) => s.id !== suppId));
      } else {
        setTempSupplements(
          tempSupplements.map((s) =>
            s.id === suppId ? { ...s, quantity: newQty } : s
          )
        );
      }
    } else if (delta > 0) {
      // Ajouter un nouveau supplément
      setTempSupplements([...tempSupplements, { id: suppId, quantity: delta }]);
    }
  };

  const totalCart = items.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  );

  const categoryLabels = {
    FOOD: { label: "🧂 Sauces", icon: "🧂" },
    DRINK: { label: "🥤 Boissons", icon: "🥤" },
    ACCESSORY: { label: "🍟 Suppléments", icon: "🍟" },
  };

  // Lignes du panier, prêtes pour le panneau à côté du formulaire. Une ligne
  // dont le plat n'est pas (encore) au catalogue n'a ni nom ni prix : elle
  // n'est pas affichée, comme avant.
  const lignesPanier: LignePanier[] = items.flatMap((item, index) => {
    const dish = getDishById(item.dish_id);
    if (!dish) return [];
    return [
      {
        index,
        item,
        dish,
        total: calculateItemTotal(item),
        // Nom pris du catalogue complet, sinon des suppléments du plat.
        supplements: supplementsNommes(
          item.supplements,
          (id) =>
            allSupplementsFlat.find((sup) => sup.id === id)?.name ??
            dish.dish_supplements?.find((ds) => ds.supplement?.id === id)?.supplement?.name,
        ),
        composition:
          (item.option_item_ids?.length ?? 0) > 0
            ? resumeComposition(groupesParPlat[item.dish_id] ?? [], item.option_item_ids ?? [])
            : null,
      },
    ];
  });

  // Remonte le sous-total au parent → transmis au calcul de frais pour appliquer
  // les offres de livraison conditionnées à un montant minimum.
  useEffect(() => {
    onSubtotalChange?.(totalCart);
  }, [totalCart, onSubtotalChange]);

  return (
    <div className="space-y-4">
      <EnTeteSection
        Icone={UtensilsCrossed}
        titre="Articles commandés *"
        sousTitre="Recherchez un plat ou choisissez une catégorie, puis ajoutez-le au panier."
      />

      {/* Ce que le client commande d'habitude, dès qu'il est choisi. */}
      <MenusHabituels
        customerId={formData.customer_id || undefined}
        platParId={getDishById}
        quantiteParPlat={quantiteParPlat}
        onChoisir={ouvrirPlat}
        onAjouter={ajouterDirect}
        onRemettre={remettreDerniereCommande}
        remiseEnCours={remiseEnCours}
        sansDerniereCommande={enModification}
      />

      {/* Recherche d'un plat, toutes catégories confondues */}
      <div className="flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 transition focus-within:border-[#F17922] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#F17922]/15">
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            // Entrée ouvre le premier plat trouvé : elle n'enregistre pas la commande.
            e.preventDefault();
            if (platsRecherche.length > 0) ouvrirPlat(platsRecherche[0]);
          }}
          className="w-full bg-transparent py-2.5 text-[13px] font-semibold text-hex-595959 placeholder:font-normal placeholder:text-gray-400 focus:outline-none"
          placeholder="Rechercher un plat"
          aria-label="Rechercher un plat"
        />
        {recherche && (
          <button
            type="button"
            onClick={() => setRecherche("")}
            aria-label="Effacer la recherche"
            className="shrink-0 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Catégories + plats. La disposition suit la largeur disponible (le
          panier occupe la droite de l'écran) : catégories en ligne au-dessus
          des plats quand la place manque, en colonne à gauche sinon.
          ⚠️ Aucune fenêtre (`fixed`) dans ces deux conteneurs : un conteneur
          de requête décalerait une fenêtre placée dedans. */}
      <div className="@container/catalogue">
        <div className="grid grid-cols-1 gap-4 @3xl/catalogue:grid-cols-[220px_minmax(0,1fr)]">
          {/* Catégories */}
          <div className="rounded-2xl border-2 border-hex-d9d9d9/50 bg-white p-3 @3xl/catalogue:p-4">
            <h4 className="mb-3 hidden text-sm font-semibold text-hex-595959 @3xl/catalogue:block">
              📂 Catégories
            </h4>

            {isLoadingCategories ? (
              <div className="flex gap-2 @3xl/catalogue:flex-col">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-32 shrink-0 animate-pulse rounded-xl bg-gray-200 @3xl/catalogue:h-12 @3xl/catalogue:w-full"
                  />
                ))}
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 @3xl/catalogue:max-h-[500px] @3xl/catalogue:flex-col @3xl/catalogue:overflow-x-visible @3xl/catalogue:overflow-y-auto @3xl/catalogue:pb-0">
                {categories.map((category: any) => {
                  const active = !enRecherche && selectedCategoryId === category.id;
                  return (
                    <motion.button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setRecherche("");
                        setSelectedCategoryId(category.id);
                      }}
                      className={`shrink-0 rounded-xl px-3 py-2 text-left transition-all @3xl/catalogue:w-full @3xl/catalogue:px-4 @3xl/catalogue:py-3 ${
                        active
                          ? "bg-[#F17922] text-blanc shadow-md"
                          : "bg-hex-f5f5f5 text-hex-595959 hover:bg-[#F17922]/10"
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-2">
                        {category.image && (
                          <Image
                            src={formatImageUrl(category.image)}
                            alt={category.name}
                            width={32}
                            height={32}
                            className="h-7 w-7 rounded-lg object-cover @3xl/catalogue:h-8 @3xl/catalogue:w-8"
                          />
                        )}
                        <span className="whitespace-nowrap text-sm font-semibold @3xl/catalogue:truncate">
                          {category.name}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Plats */}
          <div className="min-w-0 rounded-2xl border-2 border-hex-d9d9d9/50 bg-white p-4 @container/plats">
            <h4 className="mb-3 text-sm font-semibold text-hex-595959">
              🍽️ Plats
              {enRecherche && (
                <span className="font-normal text-gray-400"> · recherche « {recherche.trim()} »</span>
              )}
            </h4>

            {!enRecherche && !selectedCategoryId ? (
              <div className="py-12 text-center text-gray-400">
                <p>Sélectionnez une catégorie pour voir les plats</p>
              </div>
            ) : chargementGrille ? (
              <div className="grid grid-cols-2 gap-3 @lg/plats:grid-cols-3 @3xl/plats:grid-cols-4 @5xl/plats:grid-cols-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
                ))}
              </div>
            ) : platsAffiches.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p>
                  {enRecherche
                    ? `Aucun plat ne correspond à « ${recherche.trim()} »`
                    : "Aucun plat disponible dans cette catégorie"}
                </p>
              </div>
            ) : (
              <div className="grid max-h-[500px] grid-cols-2 gap-3 overflow-y-auto @lg/plats:grid-cols-3 @3xl/plats:grid-cols-4 @5xl/plats:grid-cols-5">
                {platsAffiches.map((dish: Dish) => (
                  <CartePlat
                    key={dish.id}
                    dish={dish}
                    auPanier={quantiteParPlat[dish.id] ?? 0}
                    onOuvrir={() => ouvrirPlat(dish)}
                    onAjouter={() => ajouterDirect(dish)}
                    // Préchargement au survol : le détail est presque toujours
                    // en cache au moment du clic, la saisie ne ralentit pas.
                    // Sans effet sur un plat ordinaire.
                    onSurvol={() => {
                      if (dish.composable) {
                        void queryClient.prefetchQuery(dishOneQueryOption(dish.id));
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de configuration du plat. Posée sur la page : le formulaire
          est un conteneur de requête (sa disposition suit sa largeur), et une
          fenêtre placée dedans serait cadrée sur lui, pas sur l'écran. */}
      {typeof document !== "undefined" &&
        createPortal(
      <AnimatePresence>
        {selectedDishForConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={() => {
              setSelectedDishForConfig(null);
              setEditingItemIndex(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              // ⚠️ `md:h-[92vh]` (hauteur FIXE) et non max-h : avec un simple
              // max-h, la hauteur du modal est « indéfinie » au sens flexbox →
              // le h-full de la grille interne retombe sur auto, les colonnes
              // poussent à la hauteur du contenu et l'overflow-hidden du corps
              // ROGNE les suppléments sans zone défilante. En hauteur fixe,
              // toute la chaîne (corps → grille → colonnes) est définie et
              // chaque colonne scrolle indépendamment.
              className="bg-white rounded-2xl w-full max-w-5xl max-h-[96vh] md:h-[92vh] md:max-h-none overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête */}
              <div className="flex items-center justify-between border-b border-gray-100 px-5 sm:px-6 py-4 shrink-0">
                <h4 className="text-[15px] font-bold text-gray-800">
                  {editingItemIndex !== null
                    ? "Modifier l'article"
                    : "Configuration du plat"}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDishForConfig(null);
                    setEditingItemIndex(null);
                  }}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corps : image + infos à gauche, configuration à droite.
                  Sur mobile les deux colonnes s'empilent et le corps scrolle
                  d'un bloc ; sur desktop chaque colonne scrolle séparément. */}
              <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
                {/* `grid-rows-[minmax(0,1fr)]` : sans elle, la rangée implicite
                    s'étire à la hauteur du CONTENU et les colonnes ne scrollent
                    jamais (le piège classique grid + overflow). */}
                <div className="md:grid md:grid-cols-[360px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] md:h-full">
                  {/* ── Colonne plat : image, infos, quantité, épicé ── */}
                  <div className="p-4 sm:p-6 md:min-h-0 md:h-full md:overflow-y-auto md:border-r md:border-gray-100">
                    {selectedDishForConfig.image && (
                      <Image
                        src={formatImageUrl(selectedDishForConfig.image)}
                        alt={selectedDishForConfig.name}
                        width={600}
                        height={400}
                        className="mb-4 h-52 w-full rounded-xl object-cover"
                      />
                    )}
                    <h5 className="mb-1 text-xl font-bold text-gray-800">
                      {selectedDishForConfig.name}
                    </h5>
                    {selectedDishForConfig.description && (
                      <p className="mb-3 text-sm leading-relaxed text-gray-500">
                        {selectedDishForConfig.description}
                      </p>
                    )}
                    <p className="text-lg font-bold text-[#F17922]">
                      {selectedDishForConfig.is_promotion &&
                      selectedDishForConfig.promotion_price ? (
                        <>
                          <span className="mr-2 text-sm font-semibold text-gray-400 line-through">
                            {Number(selectedDishForConfig.price).toLocaleString("fr-FR")} XOF
                          </span>
                          {Number(selectedDishForConfig.promotion_price).toLocaleString("fr-FR")} XOF
                        </>
                      ) : (
                        `${Number(selectedDishForConfig.price).toLocaleString("fr-FR")} XOF`
                      )}
                    </p>

                    {/* Quantité — sous le prix, avec l'identité du plat */}
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                      <label className="text-sm font-semibold text-hex-595959">
                        Quantité
                      </label>
                      <div className="flex items-center gap-1 rounded-full border border-gray-200 p-1">
                        <motion.button
                          type="button"
                          onClick={() =>
                            setTempQuantity(Math.max(1, tempQuantity - 1))
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full text-hex-595959 transition hover:bg-[#F17922] hover:text-blanc"
                          whileTap={{ scale: 0.9 }}
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>
                        <span className="min-w-[44px] text-center text-lg font-bold text-gray-800">
                          {tempQuantity}
                        </span>
                        <motion.button
                          type="button"
                          onClick={() => setTempQuantity(tempQuantity + 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-hex-595959 transition hover:bg-[#F17922] hover:text-blanc"
                          whileTap={{ scale: 0.9 }}
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Épicé — sous la quantité */}
                    {!selectedDishForConfig.is_alway_epice ? (
                      <div className="mt-3 flex items-center">
                        <Checkbox
                          id="temp-epice"
                          checked={tempEpice}
                          onChange={setTempEpice}
                        />
                        <label
                          htmlFor="temp-epice"
                          className="ml-2 text-sm font-semibold text-gray-700 cursor-pointer"
                        >
                          🌶️ Épicé
                        </label>
                      </div>
                    ) : (
                      <div className="mt-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl">
                        <span className="text-sm text-orange-600">
                          🌶️ Ce plat est toujours épicé
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── Colonne composition et suppléments (scroll indépendant) ── */}
                  <div className="p-4 sm:p-6 md:min-h-0 md:h-full md:overflow-y-auto">
              {/* Composer d'abord le plat, l'enrichir ensuite. */}
              {platComposable && (
                <DishOptionsPicker
                  groups={groupesModale}
                  selection={tempOptionIds ?? []}
                  onChange={setTempOptionIds}
                  chargement={chargementOptions}
                  erreur={
                    erreurOptions
                      ? ((objetErreurOptions as Error)?.message ?? "Chargement impossible")
                      : null
                  }
                  onReessayer={() => {
                    void rechargerOptions();
                  }}
                />
              )}

              {/* Suppléments groupés par catégorie — avec sélecteur de quantité ± */}
              {(groupedSupplements.FOOD.length > 0 ||
                groupedSupplements.DRINK.length > 0 ||
                groupedSupplements.ACCESSORY.length > 0) && (
                <div className="mb-4 space-y-4">
                  <label className="text-sm font-semibold text-hex-595959 block">
                    Suppléments
                  </label>

                  {(["FOOD", "DRINK", "ACCESSORY"] as const).map((cat) =>
                    groupedSupplements[cat].length > 0 ? (
                      <div key={cat} className="rounded-xl border border-gray-200 p-3">
                        <h6 className="text-sm font-semibold text-hex-595959 mb-2">
                          {categoryLabels[cat].label}
                        </h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {groupedSupplements[cat].map((supp) => {
                            const qty = getSupplementQuantity(supp.value);
                            const isExcluded = !!supp.excluded;
                            return (
                              <div
                                key={supp.value}
                                title={isExcluded ? "Non disponible pour ce plat" : undefined}
                                className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                                  isExcluded
                                    ? "border-hex-d9d9d9/50 bg-gray-100 opacity-60 cursor-not-allowed"
                                    : qty > 0
                                    ? "border-[#F17922] bg-[#F17922]/10"
                                    : "border-hex-d9d9d9/50 hover:border-[#F17922]/50"
                                }`}
                              >
                                {supp.image && (
                                  <Image
                                    src={supp.image}
                                    alt={supp.label}
                                    width={32}
                                    height={32}
                                    className={`rounded object-cover ${isExcluded ? "grayscale" : ""}`}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-semibold truncate ${isExcluded ? "text-gray-400 line-through" : "text-hex-595959"}`}>
                                    {supp.label}
                                  </p>
                                  <p className={`text-xs font-bold ${isExcluded ? "text-gray-400" : "text-[#F17922]"}`}>
                                    {isExcluded
                                      ? "Non proposé"
                                      : qty > 0
                                      ? `+${supp.price * qty} XOF`
                                      : `+${supp.price} XOF`}
                                  </p>
                                </div>
                                {!isExcluded && (
                                  <div className="flex items-center gap-1">
                                    <motion.button
                                      type="button"
                                      onClick={() => updateSupplementQuantity(supp.value, -1)}
                                      className={`w-7 h-7 rounded-md font-semibold text-sm flex items-center justify-center ${
                                        qty > 0
                                          ? "bg-[#F17922] text-blanc"
                                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                      }`}
                                      whileTap={qty > 0 ? { scale: 0.9 } : undefined}
                                      disabled={qty === 0}
                                    >
                                      −
                                    </motion.button>
                                    <span className="text-sm font-semibold text-hex-595959 min-w-[20px] text-center">
                                      {qty}
                                    </span>
                                    <motion.button
                                      type="button"
                                      onClick={() => updateSupplementQuantity(supp.value, 1)}
                                      className="w-7 h-7 bg-[#F17922] text-blanc rounded-md font-semibold text-sm flex items-center justify-center"
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      +
                                    </motion.button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )}

                  </div>
                </div>
              </div>

              {/* Pied collant : total temps réel + action, toujours visibles
                  même quand la liste de suppléments est longue. */}
              <div className="flex shrink-0 items-center justify-between gap-4 border-t border-gray-100 px-5 sm:px-6 py-4">
                <div>
                  <p className="text-xs text-gray-400">Prix total</p>
                  <p className="text-2xl font-bold text-[#F17922]">
                    {calculateTempTotal().toLocaleString("fr-FR")} XOF
                  </p>
                  {blocageComposition && (
                    <p className="mt-1 text-xs font-semibold text-red-500">
                      {blocageComposition}
                    </p>
                  )}
                </div>
                <motion.button
                  type="button"
                  onClick={addItemToCart}
                  disabled={!!blocageComposition}
                  className={`h-11 min-w-[220px] rounded-xl px-6 text-sm font-semibold text-blanc transition ${
                    blocageComposition
                      ? "cursor-not-allowed bg-gray-300"
                      : "bg-[#F17922] hover:bg-[#F17922]/90"
                  }`}
                  whileTap={blocageComposition ? undefined : { scale: 0.98 }}
                >
                  {editingItemIndex !== null
                    ? "Modifier l'article"
                    : "Ajouter au panier"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
          document.body,
        )}

      {/* Lignes du panier : rendues dans le panneau à côté du formulaire. */}
      {ciblePanier &&
        createPortal(
          <LignesPanier
            lignes={lignesPanier}
            onModifier={editItem}
            onRetirer={removeItem}
            onQuantite={changerQuantite}
          />,
          ciblePanier,
        )}
    </div>
  );
};

export default OrderItemsSection;
