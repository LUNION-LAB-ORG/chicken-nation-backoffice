import type { TabKey } from '@/store/dashboardStore';

/** Ce que l'ouverture d'une commande touche dans le store du tableau de bord. */
export interface NavigationCommande {
  setFilter: (section: TabKey, key: string, value: unknown) => void;
  setActiveTab: (tab: TabKey) => void;
}

/**
 * Page Commandes filtrée sur une référence, par le même chemin que la cloche
 * (`NotificationDropdown`) : les filtres de type, de statut et de source sont
 * remis à zéro pour que la commande soit visible quel que soit l'état de la
 * page. On y ouvre son tiroir et son menu ⋮.
 */
export function ouvrirCommandeParReference(reference: string, nav: NavigationCommande): void {
  nav.setFilter('orders', 'search', reference);
  nav.setFilter('orders', 'type', '');
  nav.setFilter('orders', 'status', '');
  nav.setFilter('orders', 'source', '');
  nav.setActiveTab('orders');
}
