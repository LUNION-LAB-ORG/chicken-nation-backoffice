export function LoyaltyTableHeader() {
  return (
    <>
      {/* En-tête mobile */}
      <thead className="md:hidden bg-gray-100">
        <tr className="border-b border-gray-200 rounded-xl">
          <th className="py-3 px-4" colSpan={7}>
            <span className="whitespace-nowrap text-sm font-normal text-gray-600">
              Points de fidélité
            </span>
          </th>
        </tr>
      </thead>

      {/* En-tête desktop */}
      <thead className="hidden md:table-header-group bg-gray-50">
        <tr className="border-b border-gray-200">
          <th className="whitespace-nowrap py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
            Client
          </th>
          <th className="whitespace-nowrap py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
            Points
          </th>
          <th className="whitespace-nowrap py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
            Type
          </th>
          <th className="whitespace-nowrap py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
            Statut
          </th>
          <th className="whitespace-nowrap py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
            Raison
          </th>
          <th className="whitespace-nowrap py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
            Date
          </th>
          <th className="whitespace-nowrap py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
            Expiration
          </th>
        </tr>
      </thead>
    </>
  );
}
