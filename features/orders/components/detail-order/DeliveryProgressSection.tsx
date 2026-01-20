import SafeImage from "@/components/ui/SafeImage";
import React from "react";
import { OrderTable } from "../../types/ordersTable.types";
import { getDeliverySectionTitle } from "../../hooks/getDeliverySectionTitle";
import { buildSteps, UI } from "../../utils/progressStyles";

const DeliveryProgressSection: React.FC<{ order: OrderTable }> = ({
  order,
}) => {
  if (order.orderType === "À récupérer" || order.orderType === "À table") {
    return null;
  }

  const steps = buildSteps(order);

  return (
    <div className="mb-6">
      <p className="text-[18px] font-medium text-[#F17922] mb-4">
        {getDeliverySectionTitle(order.orderType, order.status)}
      </p>

      <div className="bg-white p-5 border border-[#F17922] rounded-xl">
        {/* STEPS */}
        <div className="flex items-start">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              {/* STEP CONTAINER */}
              <div className="flex flex-col items-center flex-1">
                {/* ICON */}
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center
                  ${step.isActive ? UI.bg.active : UI.bg.inactive}
                  ${step.isActive ? UI.border.active : UI.border.inactive}`}
                >
                  <SafeImage
                    src={step.icon}
                    alt={step.title}
                    width={24}
                    height={24}
                  />
                </div>

                {/* TITLE */}
                <p
                  className={`mt-2 text-xs font-medium text-center ${
                    step.isActive ? "text-[#F17922]" : "text-[#A1A1AA]"
                  }`}
                >
                  {step.title}
                </p>

                {/* DATE */}
                {step.date && (
                  <p className="mt-1 text-[11px] text-center text-[#71717A]">
                    {step.date}
                  </p>
                )}
              </div>

              {/* LINE + DURATION */}
              {index < steps.length - 1 && (
                <div className="flex flex-col items-center justify-center flex-1 px-1 mt-5">
                  {/* LINE */}
                  <div
                    className={`w-full h-1 rounded
                    ${step.isActive && steps[index + 1].isActive 
                      ? UI.bg.lineActive 
                      : UI.bg.lineInactive}`}
                  />

                  {/* DURATION */}
                  {step.duration && (
                    <p className="mt-1 text-[10px] text-[#71717A] whitespace-nowrap">
                      {step.duration}
                    </p>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeliveryProgressSection;