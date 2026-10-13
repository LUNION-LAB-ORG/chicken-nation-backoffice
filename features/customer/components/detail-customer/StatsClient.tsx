import { Calendar, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { StatCard } from "./StatCard";
import { CustomerMapperData } from "../../types/customer-mapper.types";

const fmtMontant = (n: number) => `${n.toLocaleString("fr-FR")} F`;

/** « il y a 3 j », « il y a 2 mois ». */
function depuis(iso: string | null): string | undefined {
  if (!iso) return undefined;
  const jours = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return "hier";
  if (jours < 31) return `il y a ${jours} j`;
  return `il y a ${Math.round(jours / 30)} mois`;
}

/**
 * Les quatre chiffres d'un client.
 *
 * ⚠️ Ni les points de fidélité ni les favoris n'y figurent : les points sont
 * déjà dans la pastille de niveau en tête de fiche, et les favoris ont leur
 * onglet. Ils occupaient deux des quatre titres, et on lisait « 0 Favoris » en
 * gros. À leur place, le panier moyen et la dernière commande, qui répondent
 * aux deux questions qu'on se pose vraiment : combien dépense-t-il, est-il
 * encore là.
 */
export function StatsClient({ stats }: { stats: CustomerMapperData["stats"] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={<ShoppingBag className="h-4 w-4" />}
        label="Commandes"
        value={stats.totalOrders}
        detail="terminées"
      />
      <StatCard
        icon={<Wallet className="h-4 w-4" />}
        label="Total dépensé"
        value={fmtMontant(stats.totalSpent)}
      />
      <StatCard
        icon={<Receipt className="h-4 w-4" />}
        label="Panier moyen"
        value={stats.totalOrders > 0 ? fmtMontant(stats.panierMoyen) : "—"}
      />
      <StatCard
        icon={<Calendar className="h-4 w-4" />}
        label="Dernière commande"
        value={
          stats.derniereCommande
            ? new Date(stats.derniereCommande).toLocaleDateString("fr-FR")
            : "—"
        }
        detail={depuis(stats.derniereCommande)}
      />
    </div>
  );
}
