import Image from "next/image"
import { MenuItem as MenuItemType } from "@/types"
import { useState, useEffect } from "react"
import { formatImageUrl } from "@/utils/imageHelpers"

interface MenuItemSimpleProps {
  menu: MenuItemType
  onView?: (menu: MenuItemType) => void
  onEdit?: (menu: MenuItemType) => void
}

export default function MenuItemSimple({ menu, onView }: MenuItemSimpleProps) {
  const [imageSrc, setImageSrc] = useState<string>('/images/placeholder-food.jpg')
  
  useEffect(() => {
     setImageSrc(formatImageUrl(menu.image));
  }, [menu.image]);

  return (
    <div className="flex flex-col border border-gray-100 rounded-lg sm:rounded-xl p-2 sm:p-2.5 hover:border-orange-100 transition-colors">
      <div 
        className="relative mb-2 cursor-pointer"
        onClick={() => onView?.(menu)}
      >
        <Image
          src={imageSrc}          
          alt={menu.name}
          className="w-full h-[80px] xs:h-[100px] sm:h-[120px] object-cover rounded-md sm:rounded-lg"
          width={250}
          height={150}
          priority
          onError={() => setImageSrc('/images/placeholder-food.jpg')}
        />
  
      </div>
      <h3 
        className="text-xs xs:text-sm sm:text-base font-bold mb-1 text-[#9796A1] line-clamp-2 cursor-pointer hover:text-[#F17922] transition-colors"
        onClick={() => onView?.(menu)}
      >
        {menu.name}
      </h3>
      <div className="flex items-center gap-1.5 xs:gap-2">
        <span className="text-xs xs:text-sm sm:text-base font-semibold text-[#F17922]">
          {menu.price} CFA
        </span>
        <span className="text-[10px] xs:text-xs sm:text-sm font-light line-through text-[#9796A1]">
          {menu.price} CFA
        </span>
      </div>
    </div>
  )
}
