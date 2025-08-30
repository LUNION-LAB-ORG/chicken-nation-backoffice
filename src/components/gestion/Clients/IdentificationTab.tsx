import { useState, useEffect } from 'react'
import Image from 'next/image'

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface Client {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string;
  addresses?: Array<{
    id: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  }>;
  image?: string | null;
  created_at: string;
  updated_at: string;
  entity_status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'NEW';
  birth_day?: string | null;
  orderHistory?: Array<{
    id: string;
    reference?: string;
    date: string;
    total: number;
    amount?: number;
    paymentMethod: string;
    status: string;
    paiements?: unknown;
  }>;

}

interface IdentificationTabProps {
  client: Client;
  fullName: string;
  formatDate: (date: string) => string;
}

export function IdentificationTab({ client, fullName, formatDate }: IdentificationTabProps) {
  const [firstName, setFirstName] = useState(client.first_name || '')
  const [lastName, setLastName] = useState(client.last_name || '')
  const [displayName, setDisplayName] = useState(fullName)

  useEffect(() => {
    setDisplayName(`${firstName} ${lastName}`)
  }, [firstName, lastName])

  const handleSave = () => {

  }


  const handleNameChange = (value: string) => {
    setDisplayName(value)

    // Séparer le nom complet en prénom et nom
    const nameParts = value.trim().split(' ')
    if (nameParts.length > 0) {
      // Le premier élément est le prénom
      setFirstName(nameParts[0])

      // Le reste est le nom de famille
      if (nameParts.length > 1) {
        setLastName(nameParts.slice(1).join(' '))
      } else {
        setLastName('')
      }
    }
  }




  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="space-y-4 w-full lg:w-1/3">
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-light text-[#9796A1]">Nom et prénom</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => handleNameChange(e.target.value)}
            className="p-2 px-3 border-2 border-[#3C3C434A] text-slate-700  rounded-2xl text-sm focus:border-orange-500 focus:outline-none"
            onBlur={handleSave}
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-xs font-light text-[#9796A1]">Date d&apos;inscription</label>
          <input
            type="text"
            value={formatDate(client.created_at)}
            readOnly
            className="p-2 px-3 border-2 border-[#3C3C434A] text-slate-700 rounded-2xl text-sm"
          />
        </div>

        {/* <div className="flex flex-col space-y-1">
          <label className="text-xs font-light text-[#9796A1]">Connecté sur l&apos;application</label>
          <div className="mt-1">
            <span className={`inline-block px-3 py-1.5 text-xs font-light rounded-xl ${
              client.entity_status === 'ACTIVE'
                ? 'bg-[#4FCBBA] text-white'
                : client.entity_status === 'NEW'
                ? 'bg-[#FBD2B5] text-slate-700'
                : client.entity_status === 'BLOCKED'
                ? 'bg-red-100 text-red-800'
                : client.entity_status === 'INACTIVE'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {client.entity_status === 'ACTIVE' ? 'Connecté' :
               client.entity_status === 'NEW' ? 'Nouveau' :
               client.entity_status === 'BLOCKED' ? 'Bloqué' :
               client.entity_status === 'INACTIVE' ? 'Inactif' :
               client.entity_status}
            </span>
          </div>
        </div> */}

        <div className="flex flex-col space-y-1">
          <label className="text-xs font-light text-[#9796A1]">Image de profil</label>
          <div className="w-60 h-30 bg-[#F4F4F4] rounded-xl flex flex-col items-center justify-center mt-1 overflow-hidden">
            {client.image ? (
              <div className="relative w-full h-full">
                <Image
                  src={client.image.startsWith('http') || client.image.startsWith('/') ? client.image : `${API_URL}/${client.image}`}
                  alt="Photo de profil"
                  width={200}
                  height={200}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs">Aucune image</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="hidden lg:block w-2/3"></div>
    </div>
  )
}
