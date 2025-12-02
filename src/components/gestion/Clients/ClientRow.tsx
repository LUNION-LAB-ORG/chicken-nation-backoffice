import React, { useEffect, useRef, useState } from 'react'
import Checkbox from '@/components/ui/Checkbox'
import { type Client } from './ClientsTable'
import { StatusBadge } from '@/components/gestion/Orders/StatusBadge'
import { Menu, User } from 'lucide-react'
import { useRBAC } from '@/hooks/useRBAC'

interface ClientRowProps {
	client: Client
	isSelected: boolean
	onSelect: (clientId: string, checked: boolean) => void
	onClick: () => void
	onDoubleClick: () => void
	onViewProfile?: (clientId: string) => void
	isHighlighted?: boolean
}

export function ClientRow({
	client,
	isSelected,
	onSelect,
	onClick,
	onDoubleClick,
	onViewProfile,
	isHighlighted = false
}: ClientRowProps) {
	const { canViewClient, canUpdateClient } = useRBAC()

	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	// Fermer le menu lors d'un clic à l'extérieur
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false)
			}
		}

		if (isMenuOpen) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isMenuOpen])

	// Basculer le menu
	const toggleMenu = (e: React.MouseEvent) => {
		e.stopPropagation()
		setIsMenuOpen(prev => !prev)
	}

	// Voir le profil du client
	const handleViewProfile = (e: React.MouseEvent) => {
		e.stopPropagation()
		onViewProfile?.(client.id)
		setIsMenuOpen(false)
	}

	// Gérer le clic sur la ligne (éviter le déclenchement via checkbox)
	const handleClick = (e: React.MouseEvent) => {
		if ((e.target as HTMLElement).closest('.checkbox-wrapper')) return
		onClick()
	}

	// Formater la date de création
	const formatDate = (dateString: string) => {
		if (!dateString) return 'Aucune date'

		try {
			const date = new Date(dateString)
			if (isNaN(date.getTime())) return 'Date invalide'

			return date.toLocaleDateString('fr-FR', {
				day: '2-digit',
				month: 'short',
				year: 'numeric'
			})
		} catch {
			return 'Date invalide'
		}
	}

	// Formater la date de dernière commande
	const formatLastOrderDate = (dateString?: string) => {
		if (!dateString) return 'Aucune commande'

		try {
			const date = new Date(dateString)
			if (isNaN(date.getTime())) return 'Date invalide'

			return date.toLocaleDateString('fr-FR', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			})
		} catch {
			return 'Date invalide'
		}
	}

	const highlightClass = isHighlighted ? 'bg-orange-50' : ''
	const formattedCreationDate = formatDate(client.created_at || '')
	const formattedLastOrderDate = formatLastOrderDate(client.lastOrderDate)
	const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim()
	const displayName = fullName || client.phone || client.email

	// Menu contextuel partagé
	const MenuDropdown = ({ isMobile = false }: { isMobile?: boolean }) => (
		<div className="relative" ref={menuRef}>
			<button
				type="button"
				className={`p-1.5 text-gray-500 hover:text-[#F17922] rounded-lg hover:bg-orange-100 transition-colors ${isMobile ? '' : 'hover:bg-orange-200'
					}`}
				onClick={toggleMenu}
				aria-label="Options du client"
				aria-expanded={isMenuOpen}
			>
				<Menu size={20} />
			</button>

			{isMenuOpen && (canViewClient || canUpdateClient) && (
				<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-[9999]">
					<div className="py-1" role="menu">
						{canViewClient && (
							<button
								type="button"
								onClick={handleViewProfile}
								className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 font-medium flex items-center gap-2 transition-colors"
								role="menuitem"
							>
								<User size={16} />
								<span>Voir le profil</span>
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	)

	return (
		<>
			{/* Version mobile (card) */}
			<tr
				className={`md:hidden hover:bg-[#F17922]/10 cursor-pointer transition-colors ${highlightClass}`}
				onClick={handleClick}
				onDoubleClick={onDoubleClick}
			>
				<td className="p-4" colSpan={7}>
					<div className="flex items-start space-x-3">
						<div className="pt-1 checkbox-wrapper">
							<Checkbox
								checked={isSelected}
								onChange={(checked) => onSelect(client.id, checked)}
							/>
						</div>
						<div className="flex-1 space-y-2">
							<div className="flex justify-between items-start">
								<div>
									<div className={`font-medium ${fullName ? 'text-gray-900' : 'text-red-600'}`}>
										{displayName}
									</div>
									<div className="text-sm text-gray-500">{formattedCreationDate}</div>
								</div>
								<div className="flex items-center space-x-2">
									<StatusBadge status={client.isConnected ? 'online' : 'offline'} />
								</div>
							</div>
							<div className="flex justify-between items-center text-sm">
								<div>
									<span className="text-gray-500">Total des commandes: </span>
									<span className="font-medium text-gray-900">{client.totalOrders || 0}</span>
								</div>
								<div>
									<span className="text-gray-500">Dernière: </span>
									<span className="text-gray-700">{formattedLastOrderDate}</span>
								</div>
							</div>
							<div className="flex items-center justify-end">
								<MenuDropdown isMobile />
							</div>
						</div>
					</div>
				</td>
			</tr>

			{/* Version desktop (tableau) */}
			<tr
				className={`hidden md:table-row hover:bg-[#F17922]/10 cursor-pointer transition-colors ${highlightClass}`}
				onClick={handleClick}
				onDoubleClick={onDoubleClick}
			>
				<td className="w-8 whitespace-nowrap py-3 px-3 sm:px-4 checkbox-wrapper">
					<Checkbox
						checked={isSelected}
						onChange={(checked) => onSelect(client.id, checked)}
					/>
				</td>
				<td className="whitespace-nowrap py-3 px-3 sm:px-4">
					<span className={`text-sm ${fullName ? 'text-gray-900' : 'text-red-600'}`}>
						{displayName}
					</span>
				</td>
				<td className="whitespace-nowrap py-3 px-3 sm:px-4">
					<span className="text-sm text-gray-500">{formattedCreationDate}</span>
				</td>
				<td className="whitespace-nowrap py-3 px-3 sm:px-4">
					<StatusBadge status={client.isConnected ? 'online' : 'offline'} />
				</td>
				<td className="whitespace-nowrap py-3 px-3 sm:px-4">
					<span className="text-sm text-gray-500">{client.totalOrders || 0}</span>
				</td>
				<td className="whitespace-nowrap py-3 px-3 sm:px-4">
					<span className="text-sm text-gray-500">{formattedLastOrderDate}</span>
				</td>
				<td className="whitespace-nowrap py-3 px-3 sm:px-4 text-center">
					<MenuDropdown />
				</td>
			</tr>
		</>
	)
}