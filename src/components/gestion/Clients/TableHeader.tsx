import Checkbox from '@/components/ui/Checkbox'

interface TableHeaderProps {
  onSelectAll: (checked: boolean) => void
  isAllSelected: boolean
}

export function TableHeader({ onSelectAll, isAllSelected }: TableHeaderProps) {
  return (
    <>
      {/* En-tête mobile */}
      <thead className="md:hidden bg-gray-100">
        <tr className="border-b border-gray-200  rounded-xl">
          <th className="py-3 px-4" colSpan={7}>
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={isAllSelected}
                onChange={onSelectAll}
              />
              <span className="whitespace-nowrap text-sm font-normal text-gray-600">Tout sélectionner</span>
            </div>
          </th>
        </tr>
      </thead>

      {/* En-tête desktop */}
      <thead className="hidden md:table-header-group bg-gray-100">
        <tr className="border-b border-gray-200">
          <th className="w-8 whitespace-nowrap py-3 px-3 text-left text-sm font-normal text-gray-600 sm:px-4">
            <Checkbox
              checked={isAllSelected}
              onChange={onSelectAll}
            />
          </th>
          <th className="whitespace-nowrap py-3 px-3 text-left text-sm font-urbanist text-gray-600 sm:px-4">Nom et Prénom</th>
          <th className="whitespace-nowrap py-3 px-3 text-left text-sm font-normal text-gray-600 sm:px-4">Date d&apos;inscription</th>
          <th className="whitespace-nowrap py-3 px-3 text-left text-sm font-normal text-gray-600 sm:px-4">Connecté sur l&apos;appli</th>
          <th className="whitespace-nowrap py-3 px-3 text-left text-sm font-normal text-gray-600 sm:px-4">Total des commandes</th>
          <th className="whitespace-nowrap py-3 px-3 text-left text-sm font-normal text-gray-600 sm:px-4">Dernières commandes</th>
          <th className="whitespace-nowrap py-3 px-3 text-left text-sm font-normal text-gray-600 sm:px-4">Actions</th>
        </tr>
      </thead>
    </>
  )
}
