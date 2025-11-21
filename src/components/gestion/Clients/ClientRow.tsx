import React, {useEffect, useRef, useState} from 'react'
import Checkbox from '@/components/ui/Checkbox'
import {type Client} from './ClientsTable'
import {StatusBadge} from '@/components/gestion/Orders/StatusBadge'
import {Menu, User} from 'lucide-react'
import {useRBAC} from '@/hooks/useRBAC'

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
	const {canViewClient, canUpdateClient} = useRBAC()

	// ✅ ÉTAT POUR GÉRER LE MENU CONTEXTUEL
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const mobileMenuRef = useRef<HTMLDivElement>(null);
	const desktopMenuRef = useRef<HTMLDivElement>(null);

	// ✅ FERMER LE MENU QUAND ON CLIQUE AILLEURS
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			const isClickInsideMobile = mobileMenuRef.current && mobileMenuRef.current.contains(target);
			const isClickInsideDesktop = desktopMenuRef.current && desktopMenuRef.current.contains(target);

			if (!isClickInsideMobile && !isClickInsideDesktop) {
				setIsMenuOpen(false);
			}
		};

		if (isMenuOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}
	}, [isMenuOpen]);

	// ✅ FONCTION POUR BASCULER LE MENU
	const toggleMenu = (e: React.MouseEvent) => {
		e.stopPropagation(); // Empêcher le clic sur la ligne
		setIsMenuOpen(!isMenuOpen);
	};


	// ✅ FONCTION POUR VOIR LE PROFIL DU CLIENT
	const handleViewProfile = (e: React.MouseEvent) => {
		e.stopPropagation(); // Empêcher le clic sur la ligne
		if (onViewProfile) {
			onViewProfile(client.id);
		}
		setIsMenuOpen(false); // Fermer le menu après action
	};
	const handleClick = (e: React.MouseEvent) => {
		if ((e.target as HTMLElement).closest('.checkbox-wrapper')) return

		onClick();
	}

	// Formater la date de création pour l'affichage
	const formatDate = (dateString: string) => {

		if (!dateString) {

			return 'Aucune date';
		}

		try {
			const date = new Date(dateString);

			// Vérifier si la date est valide
			if (date instanceof Date && !isNaN(date.getTime())) {
				const formatted = date.toLocaleDateString('fr-FR', {
					day: '2-digit',
					month: 'short',
					year: 'numeric'
				});

				return formatted;
			}

			return 'Date invalide';
		} catch {

			return 'Date invalide';
		}
	};

	// Formater la date de dernière commande pour l'affichage
	const formatLastOrderDate = (dateString?: string) => {

		if (!dateString) {

			return 'Aucune commande';
		}

		try {
			const date = new Date(dateString);

			// Vérifier si la date est valide
			if (date instanceof Date && !isNaN(date.getTime())) {
				return date.toLocaleDateString('fr-FR', {
					day: '2-digit',
					month: 'short',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				});
			}

			return 'Date invalide';
		} catch (error) {
			console.error('Erreur de formatage de date de dernière commande:', error);
			return 'Date invalide';
		}
	};

	const highlightClass = isHighlighted ? 'bg-[#ff6200]' : '';
	const formattedCreationDate = formatDate(client.created_at || '');
	const formattedLastOrderDate = formatLastOrderDate(client.lastOrderDate);
	const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim();

	return (
		<>
			{/* Version mobile (card) */}
			<tr
				className={`md:hidden hover:bg-[#ff6200] cursor-pointer ${highlightClass}`}
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
									<div className="font-medium text-gray-900">{fullName || client.phone || client.email}</div>
									<div className="text-sm text-gray-500">{formattedCreationDate}</div>
								</div>
								<div className="flex items-center space-x-2">
									<StatusBadge status={client.isConnected ? 'online' : 'offline'}/>

									{/* ✅ BOUTON ACTIONS MOBILE - STYLE ORDERROW */}
									<div className="relative" ref={mobileMenuRef}>
										<button
											type="button"
											className="p-1.5 text-gray-500 hover:text-[#F17922] rounded-lg hover:bg-orange-100"
											onClick={toggleMenu}
											aria-label="Options"
										>
											<Menu size={20}/>
										</button>

										{/* ✅ MENU CONTEXTUEL MOBILE */}
										{isMenuOpen && (canViewClient || canUpdateClient) && (
											<div
												className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-[9999]">
												<div className="py-1">
													{canViewClient && (
														<button
															type="button"
															onClick={handleViewProfile}
															className="w-full text-left px-4 cursor-pointer py-2 text-sm text-[#888891] hover:bg-orange-50 font-semibold flex items-center gap-2"
														>
															<User size={16}/>
															<span>Voir le profil</span>
														</button>
													)}
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
							<div className="flex justify-between items-center text-sm">
								<div>
									<span className="text-gray-500">Total des commandes:</span>
									<span className="ml-1 font-medium">{client.totalOrders || 0}</span>
								</div>
								<div>
									<span className="text-gray-500">Dernières commandes:</span>
									<span className="ml-1">{formattedLastOrderDate}</span>
								</div>
							</div>
						</div>
					</div>
				</td>
			</tr>

			{/* Version desktop (tableau) */}
			<tr
				className={`hidden md:table-row hover:bg-[#ff6200] cursor-pointer ${highlightClass}`}
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
					<span className={`text-sm ${fullName ? 'text-gray-900' : "text-red-600"}`}>{fullName || client.phone || client.email}</span>
				</td>
				<td className="whitespace-nowrap py-3 px-3 sm:px-4">
					<span className="text-sm text-gray-500">{formattedCreationDate}</span>
				</td>
				<td className="whitespace-nowrap py-3 px-3 sm:px-4">
					<StatusBadge status={client.isConnected ? 'online' : 'offline'}/>
				</td>
				<td className="whitespace-nowrap py-3 px-3 sm:px-4">
					<span className="text-sm text-gray-500">{client.totalOrders || 0}</span>
				</td>
				<td className="whitespace-nowrap py-3 px-3 sm:px-4">
					<span className="text-sm text-gray-500">{formattedLastOrderDate}</span>
				</td>
				{/* ✅ COLONNE ACTIONS AVEC MENU CONTEXTUEL - STYLE ORDERROW */}
				<td className="whitespace-nowrap py-3 px-3 sm:px-4 text-center relative">
					<div ref={desktopMenuRef}>
						<button
							type="button"
							className="p-1 text-[#71717A] cursor-pointer hover:text-gray-700 rounded-lg hover:bg-orange-200"
							onClick={toggleMenu}
							aria-label="Options"
						>
							<Menu size={20}/>
						</button>

						{/* ✅ MENU CONTEXTUEL */}
						{isMenuOpen && (canViewClient || canUpdateClient) && (
							<div
								className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-slate-500 ring-opacity-5 z-[9999]">
								<div className="py-1">
									{canViewClient && (
										<button
											type="button"
											onClick={handleViewProfile}
											className="w-full text-left cursor-pointer px-4 py-2 text-sm text-[#888891] hover:bg-orange-50 font-semibold flex items-center gap-2"
										>
											<User size={16}/>
											<span>Voir le profil</span>
										</button>
									)}
								</div>
							</div>
						)}
					</div>
				</td>
			</tr>
		</>
	)
}