import Checkbox from "@/components/ui/Checkbox";

interface TableHeaderProps {
  onSelectAll: (checked: boolean) => void;
  isAllSelected: boolean;
}
export function TableHeader({ onSelectAll, isAllSelected }: TableHeaderProps) {
  return (
    <>
      {/* En-tête mobile */}
      <thead className="md:hidden bg-gray-100">
        <tr className="border-b border-gray-200 rounded-xl">
          <th className="py-3 px-4" colSpan={6}>
            <div className="flex items-center space-x-3">
              <Checkbox checked={isAllSelected} onChange={onSelectAll} />
              <span className="whitespace-nowrap text-sm font-normal text-gray-600">
                Tout sélectionner
              </span>
            </div>
          </th>
        </tr>
      </thead>

      {/* En-tête desktop */}
      <thead className="hidden md:table-header-group bg-gray-100">
        <tr className="border-b border-gray-200">
          <th className="w-8 py-3 px-4 text-left">
            <Checkbox checked={isAllSelected} onChange={onSelectAll} />
          </th>
          <th className="whitespace-nowrap py-3 px-4 text-left text-sm font-semibold text-gray-600">
            Détenteur
          </th>
          <th className="whitespace-nowrap py-3 px-4 text-left text-sm font-semibold text-gray-600">
            N° Carte
          </th>
          <th className="whitespace-nowrap py-3 px-4 text-left text-sm font-semibold text-gray-600">
            Institution
          </th>
          <th className="whitespace-nowrap py-3 px-4 text-left text-sm font-semibold text-gray-600">
            Statut
          </th>
          <th className="whitespace-nowrap py-3 px-4 text-left text-sm font-semibold text-gray-600">
            Date émission
          </th>
          <th className="whitespace-nowrap py-3 px-4 text-center text-sm font-semibold text-gray-600">
            Actions
          </th>
        </tr>
      </thead>
    </>
  );
}
