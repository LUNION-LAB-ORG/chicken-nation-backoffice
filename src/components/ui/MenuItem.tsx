import Image from "next/image";
import { MenuItem as MenuItemType } from "@/types";
import { useState, useEffect } from "react";
import { formatImageUrl } from "@/utils/imageHelpers";
import { useRBAC } from "@/hooks/useRBAC";

interface MenuItemProps {
  menu: MenuItemType;
  onEdit?: (menu: MenuItemType) => void;
  onView?: (menu: MenuItemType) => void;
}

export default function MenuItem({ menu, onEdit, onView }: MenuItemProps) {
  const { canUpdatePlat } = useRBAC();
  const [imageSrc, setImageSrc] = useState<string>("/images/food1.png");

  useEffect(() => {
    setImageSrc(formatImageUrl(menu.image));
  }, [menu.image]);

  return (
    <div className="flex flex-col gap-2 p-2 sm:p-2.5 lg:p-3">
      <div className="relative cursor-pointer" onClick={() => onView?.(menu)}>
        <Image
          src={imageSrc}
          alt={menu.name}
          className="w-full max-w-[200px] sm:max-w-[220px]
           lg:max-w-[250px] h-[100px] sm:h-[120px] lg:h-[140px] object-cover rounded-xl border border-orange-200 hover:border-orange-400 transition-colors"
          width={250}
          height={150}
          priority
          onError={() => setImageSrc("/images/placeholder-food.jpg")}
        />
      </div>
      <div>
        <h3
          className="text-xs sm:text-sm lg:text-base uppercase font-bold text-[#9796A1] line-clamp-2 cursor-pointer hover:text-[#F17922] transition-colors"
          onClick={() => onView?.(menu)}
        >
          {menu.name}
        </h3>
        <p className="text-xs sm:text-sm lg:text-base">
          {menu.private ? "Privé" : "Public"}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {menu.is_promotion && menu.promotion_price ? (
          <>
            {/* Prix réel barré à gauche */}
            <span className="text-xs sm:text-sm lg:text-base font-medium text-gray-500 line-through">
              {menu.price} CFA
            </span>
            {/* Prix de promotion (style normal) */}
            <span className="text-xs sm:text-sm lg:text-base font-semibold text-[#F17922]">
              {menu.promotion_price} CFA
            </span>
            {/* Badge PROMO rouge */}
            <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded-md">
              PROMO
            </span>
          </>
        ) : (
          /* Prix normal sans promotion */
          <span className="text-xs sm:text-sm lg:text-base font-semibold text-[#F17922]">
            {menu.price} CFA
          </span>
        )}
      </div>
{/* 
      {canUpdatePlat() && (
        <button
          type="button"
          onClick={() => onEdit?.(menu)}
          className="mt-auto w-full sm:w-32 lg:w-36 py-1 sm:py-1.5 lg:py-1.5 px-2 bg-[#F17922] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#f17522] transition-colors cursor-pointer"
        >
          Modifier le plat
        </button>
      )} */}
    </div>
  );
}
