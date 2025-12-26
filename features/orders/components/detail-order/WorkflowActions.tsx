import clsx from "clsx";
import React from "react";
import { useOrderWorkFlow } from "../../hooks/useOrderWorkFlow";
import { OrderTable } from "../../types/ordersTable.types";

interface WorkflowActionsProps {
  order: OrderTable;
}

const WorkflowActions: React.FC<WorkflowActionsProps> = ({ order }) => {
  const {
    getWorkFlow: { actions },
  } = useOrderWorkFlow({
    order,
  });

  return (
    <>
      <div className="mt-6 flex justify-between gap-4">
        {actions &&
          actions.map((action) => {
            return (
              <button
                type="button"
                onClick={action.onClick}
                className={clsx(
                  "w-full cursor-pointer py-3 px-4 rounded-xl font-medium transition-colors",
                  {
                    "bg-white border border-[#FF3B30] hover:bg-gray-50 text-[#FF3B30]":
                      action.variant === "danger",

                    "bg-white border hover:bg-[#F17922] hover:text-white":
                      action.variant === "secondary",

                    "bg-[#F17922] hover:bg-[#F17972] text-white":
                      action.variant === "primary",
                  }
                )}
              >
                {action.label}
              </button>
            );
          })}
      </div>
    </>
  );
};

export default WorkflowActions;
