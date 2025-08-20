import Checkbox from '@/components/ui/Checkbox'

interface TableHeaderProps {
  onSelectAll?: (checked: boolean) => void  // ✅ Optionnel pour contrôle RBAC
  isAllSelected: boolean
  showRestaurantColumn?: boolean // ✅ Contrôler l'affichage de la colonne Restaurant
  showActionsColumn?: boolean    // ✅ Contrôler l'affichage de la colonne Actions
}

export function TableHeader({ onSelectAll, isAllSelected, showRestaurantColumn = true, showActionsColumn = true }: TableHeaderProps) {
  return (
    <thead className="bg-gray-50">
      <tr>
        {onSelectAll && (
          <th scope="col" className="w-8 py-3 px-3 sm:px-4">
            <Checkbox
              checked={isAllSelected}
              onChange={(checked) => onSelectAll(checked)}
            />
          </th>
        )}
        <th scope="col" className="whitespace-nowrap py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Référence
        </th>
        <th scope="col" className="whitespace-nowrap py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Date
        </th>
        <th scope="col" className="whitespace-nowrap py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Client
        </th>
        {/* ✅ Colonne Restaurant conditionnelle */}
        {showRestaurantColumn && (
          <th scope="col" className="whitespace-nowrap py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Restaurant
          </th>
        )}
        <th scope="col" className="whitespace-nowrap py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Type
        </th>
        <th scope="col" className="whitespace-nowrap py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Adresse
        </th>
        <th scope="col" className="whitespace-nowrap py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Montant
        </th>
        <th scope="col" className="whitespace-nowrap py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Paiement
        </th>
        <th scope="col" className="whitespace-nowrap py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Statut
        </th>
        {showActionsColumn && (
          <th scope="col" className="whitespace-nowrap py-3 px-3 sm:px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        )}
      </tr>
    </thead>
  )
}
