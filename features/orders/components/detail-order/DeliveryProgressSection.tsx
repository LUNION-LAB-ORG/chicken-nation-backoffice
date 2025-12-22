
import SafeImage from "@/components/ui/SafeImage";
import React from "react";
import { getProgressStyles } from "../../utils/progressStyles";
import { getDeliverySectionTitle } from "../../utils/workflowConfig";

interface DeliveryProgressSectionProps {
  orderType: string | undefined;
  currentStatus: string;
  deliveryService?: string;
}

const DeliveryProgressSection: React.FC<DeliveryProgressSectionProps> = ({
  orderType,
  currentStatus,
  deliveryService,
}) => {
  const progressStyles = getProgressStyles(orderType, currentStatus);

  // Masquer pour PICKUP et TABLE
  if (orderType === "PICKUP" || orderType === "TABLE") {
    return null;
  }

  return (
    <div className="mb-4 md:mb-8">
      <p className="text-[18px] font-medium text-[#F17922] mb-4">
        {getDeliverySectionTitle(orderType, currentStatus)}
      </p>
      
      <div className="bg-white p-5 px-2 border-[#F17922] border-1 rounded-xl">
        <div className="flex justify-between items-center">
          {/* Étape 1 - Restaurant */}
          <div
            className={`w-10 h-10 rounded-[12px] border-1 ${progressStyles.step1Border} ${progressStyles.step1Bg} flex items-center justify-center transition-all duration-500 ease-in-out transform hover:scale-110`}
          >
            <SafeImage
              src={progressStyles.step1Icon}
              alt="restaurant"
              width={24}
              height={24}
            />
          </div>

          {/* Ligne entre étape 1 et 2 */}
          <div
            className={`flex-1 h-1 ${progressStyles.line1} transition-all duration-500 ease-in-out`}
          ></div>

          {/* Étape 2 - Préparation */}
          <div
            className={`w-10 h-10 rounded-[12px] border-1 ${progressStyles.step2Border} ${progressStyles.step2Bg} flex items-center justify-center transition-all duration-500 ease-in-out transform hover:scale-110`}
          >
            <SafeImage
              src={progressStyles.step2Icon}
              alt="box"
              width={24}
              height={24}
            />
          </div>

          {/* Ligne entre étape 2 et 3 */}
          <div
            className={`flex-1 h-1 ${progressStyles.line2} transition-all duration-500 ease-in-out`}
          ></div>

          {/* Étape 3 - Livraison */}
          <div
            className={`w-10 h-10 rounded-[12px] border-1 ${progressStyles.step3Border} ${progressStyles.step3Bg} flex items-center justify-center transition-all duration-500 ease-in-out transform hover:scale-110`}
          >
            <SafeImage
              src={progressStyles.step3Icon}
              alt="pin"
              width={24}
              height={24}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-center mt-3 md:mt-4 text-[#71717A]">
        Processus de livraison proposé par{" "}
        <span className="text-[#71717A] font-bold">
          {deliveryService === "TURBO" ? "Turbo Delivery" : "Chicken Nation"}
        </span>
      </p>

      <button
        type="button"
        className="w-full mt-3 md:mt-4 py-3 px-4 bg-[#F17922] hover:bg-[#F17972] cursor-pointer rounded-xl flex items-center justify-center text-sm font-medium text-white"
      >
        <SafeImage
          src="/icons/external-link.png"
          alt="eye"
          width={20}
          height={20}
          className="mr-2"
        />
        <span>Voir le suivi de livraison</span>
      </button>
    </div>
  );
};

export default DeliveryProgressSection;