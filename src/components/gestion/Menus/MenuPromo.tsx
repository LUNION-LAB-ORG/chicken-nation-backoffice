import Image from "next/image"
import { MenuItem as MenuItemType } from "@/types"
import MenuItemSimple from "@/components/ui/MenuItemSimple"
import { useEffect, useState, useRef } from "react"
import { getAllMenus } from "@/services/menuService"
import { validateMenuItem, ValidatedMenuItem } from "@/schemas/menuSchemas"

// ✅ INTERFACE STRICTE POUR LES PROPS
interface MenuPromoProps {
  promoMenus: MenuItemType[]
  onEditMenu: (menu: MenuItemType) => void
  onViewMenu?: (menu: MenuItemType) => void
}

// ✅ COMPOSANT SÉCURISÉ POUR LES MENUS EN PROMOTION
export default function MenuPromo({ promoMenus: propPromoMenus, onViewMenu }: MenuPromoProps) {
  const [promoMenus, setPromoMenus] = useState<ValidatedMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  useEffect(() => {
    // ✅ Validation des props d'entrée
    try {
      if (propPromoMenus && Array.isArray(propPromoMenus)) {
        const validatedPromoMenus: ValidatedMenuItem[] = []
        for (const menu of propPromoMenus) {
          try {
            if (!menu.id) continue;
            const menuWithId = menu as MenuItemType;
            const validatedMenu = validateMenuItem(menuWithId)
            validatedPromoMenus.push(validatedMenu)
          } catch (validationError) {
            console.warn('Menu en promotion ignoré lors de la validation:', validationError)
          }
        }
        setPromoMenus(validatedPromoMenus)
      }
    } catch (propsError) {
      console.error('Erreur lors de la validation des props:', propsError)
      setPromoMenus([])
    }

    // Éviter les appels multiples à l'API
    if (fetchedRef.current) return;

    // ✅ FONCTION SÉCURISÉE DE RÉCUPÉRATION DES PROMOTIONS
    const fetchPromoMenus = async () => {
      try {
        setLoading(true)
        setError(null)

        // ✅ Récupération sécurisée des menus (service déjà sécurisé)
        const apiMenus = await getAllMenus()

        fetchedRef.current = true;

        // ✅ Validation stricte du format de réponse
        if (!Array.isArray(apiMenus)) {
          throw new Error('Format de données API invalide: attendu un tableau')
        }

        // ✅ Filtrage sécurisé des menus en promotion
        const promotionMenus: ValidatedMenuItem[] = []

        for (const menu of apiMenus) {
          try {
            if (!menu.id) continue;
            const menuWithId = menu as MenuItemType;
            // ✅ Validation de chaque menu
            const validatedMenu = validateMenuItem(menuWithId)

            // ✅ Vérification sécurisée des critères de promotion
            const menuWithPromotion = validatedMenu as MenuItemType & { promotion_id?: string };
            const isPromotion = validatedMenu.is_promotion === true ||
                               menuWithPromotion.promotion_id !== undefined ||
                               (validatedMenu.promotion_price && parseFloat(String(validatedMenu.promotion_price)) > 0)

            if (isPromotion) {
              promotionMenus.push(validatedMenu)
            }
          } catch (menuValidationError) {
            console.warn('Menu ignoré lors du filtrage des promotions:', menuValidationError)
          }
        }

        // ✅ Limitation sécurisée à 5 menus
        const limitedPromotions = promotionMenus.slice(0, 5)

        setPromoMenus(limitedPromotions)
        setError(null)
      } catch (apiError) {
        console.error('Erreur lors de la récupération des promotions:', apiError)
        setError('Impossible de charger les menus en promotion')

        // ✅ Fallback sécurisé vers les props validées
        try {
          if (propPromoMenus && Array.isArray(propPromoMenus)) {
            const validatedFallback: ValidatedMenuItem[] = []
            for (const menu of propPromoMenus) {
              try {
                if (!menu.id) continue;
                const menuWithId = menu as MenuItemType;
                const validatedMenu = validateMenuItem(menuWithId)
                validatedFallback.push(validatedMenu)
              } catch {
                // Menu ignoré silencieusement
              }
            }
            setPromoMenus(validatedFallback)
          }
        } catch (fallbackError) {
          console.error('Erreur lors du fallback:', fallbackError)
          setPromoMenus([])
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPromoMenus()

    // ✅ Cleanup sécurisé
    return () => {
      fetchedRef.current = false;
    };
  }, [propPromoMenus])

  // ✅ FONCTION DE GESTION SÉCURISÉE DES CLICS
  const handleViewMenu = (menu: ValidatedMenuItem) => {
    try {
      // ✅ Validation du menu avant transmission
      const validatedMenu = validateMenuItem(menu)
      // Convertir vers MenuItemType pour le callback
      onViewMenu?.(validatedMenu as unknown as MenuItemType)
    } catch (validationError) {
      console.error('Erreur lors de la validation du menu pour visualisation:', validationError)
      // Ne pas appeler onViewMenu si la validation échoue
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center mb-6">
        <Image
          src="/icons/chicken.png"
          alt="menu"
          width={12}
          height={12}
          className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5"
        />
        <h2 className="text-xs sm:text-sm font-medium text-[#F17922] pl-1.5 sm:pl-2">
          Promo en cours
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Chargement des promotions...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-red-500">{error}</p>
        </div>
      ) : promoMenus.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Aucune promotion en cours</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
          {promoMenus.map((menu) => {
            // ✅ Validation de chaque menu avant rendu
            try {
              const validatedMenu = validateMenuItem(menu)
              return (
                <MenuItemSimple
                  key={validatedMenu.id}
                  menu={validatedMenu as unknown as MenuItemType}
                  onView={() => handleViewMenu(validatedMenu)}
                />
              )
            } catch (renderError) {
              console.warn('Menu ignoré lors du rendu:', renderError)
              return null
            }
          })}
        </div>
      )}
      <div className="w-full h-px bg-gray-100 mt-8" />
    </div>
  )
}
