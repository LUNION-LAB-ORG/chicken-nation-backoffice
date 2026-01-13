"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import {
  exportOrders,
  convertOrdersForExport,
  ExportFormat,
} from "@/services/exportService";
import { toast } from "react-hot-toast";
import { generateOrderReport } from "../lib/pdf/order-report-generator";
import { OrderStatus, OrderType } from "../types/order.types";
import { dateRangeToLocalString } from "../../../utils/date/format-date";
import { useDashboardStore } from "@/store/dashboardStore";
import { useOrderListQuery } from "../queries/order-list.query";
import { getAllOrders } from "../services/order-service";
import { startOfMonth } from "date-fns";

interface ExportDropdownProps {
  className?: string;
  buttonText?: string;
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({
  buttonText = "Exporter",
  className,
}) => {
  const {
    orders: { filters, pagination },
    selectedRestaurantId,
  } = useDashboardStore();

  const [isExporting, setIsExporting] = useState(false);
  const handleExportPDF = async () => {
    const startDate = !filters?.startDate
      ? startOfMonth(new Date())
      : typeof filters?.startDate == "string"
      ? new Date(filters?.startDate as string)
      : (filters?.startDate as Date);

    const endDate = !filters?.endDate
      ? new Date()
      : typeof filters?.endDate == "string"
      ? new Date(filters?.endDate as string)
      : (filters?.endDate as Date);

    setIsExporting(true);
    try {
      const result = await getAllOrders({
        restaurantId: selectedRestaurantId,
        pagination: false,
        page: pagination.page,
        reference: filters?.search as string,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: filters?.type ? (filters?.type as OrderType) : undefined,
        status: filters?.status ? (filters?.status as OrderStatus) : undefined,
        auto: filters?.source
          ? filters?.source == "auto"
            ? true
            : false
          : undefined,
      });

      const orders = result.data;

      if (!orders || orders.length === 0) {
        toast.error("Aucune commande à exporter");
        return;
      }
      const date = startDate && endDate ? dateRangeToLocalString(startDate, endDate) : "";

      await generateOrderReport(orders, date);
      toast.success("Rapport PDF généré avec succès");
    } catch (error) {
      console.error("[v0] Error generating PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    }
    setIsExporting(false);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleExportPDF}
      disabled={isExporting}
      className={`
        px-3 py-1 sm:py-1 cursor-pointer text-sm  font-light rounded-xl
        transition-all duration-200 flex items-center justify-center gap-2 min-w-[120px]
        ${
          isExporting
            ? "text-white bg-orange-400 cursor-wait"
            : "text-white bg-[#F17922] hover:bg-[#e06816] hover:shadow-md"
        }
       ${className}`}
    >
      {isExporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          Export...
        </>
      ) : (
        <>
          <FileText size={16} />
          {buttonText} PDF
        </>
      )}
    </motion.button>
  );
};

export default ExportDropdown;
