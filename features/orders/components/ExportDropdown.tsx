"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { startOfMonth } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ChevronDown } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import { dateRangeToLocalString } from "../../../utils/date/format-date";
import { generateOrderReport } from "../lib/pdf/order-report-generator";
import {
  exportReportOrdersToExcel,
  getAllOrders,
} from "../services/order-service";
import { OrderStatus, OrderType } from "../types/order.types";

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportPDF = async () => {
    const startDate = !filters?.startDate
      ? startOfMonth(new Date())
      : typeof filters?.startDate === "string"
      ? new Date(filters?.startDate as string)
      : (filters?.startDate as Date);

    const endDate = !filters?.endDate
      ? new Date()
      : typeof filters?.endDate === "string"
      ? new Date(filters?.endDate as string)
      : (filters?.endDate as Date);

    setIsExporting(true);
    setIsOpen(false);

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
          ? filters?.source === "auto"
            ? true
            : false
          : undefined,
      });

      const orders = result.data;

      if (!orders || orders.length === 0) {
        toast.error("Aucune commande à exporter");
        return;
      }
      const date =
        startDate && endDate ? dateRangeToLocalString(startDate, endDate) : "";

      await generateOrderReport(orders, date);
      toast.success("Rapport PDF généré avec succès");
    } catch (error) {
      console.error("[v0] Error generating PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction exemple pour l'export Excel (à implémenter)
  const handleExportExcel = async () => {
    setIsExporting(true);
    setIsOpen(false);
    const startDate = !filters?.startDate
      ? startOfMonth(new Date())
      : typeof filters?.startDate === "string"
      ? new Date(filters?.startDate as string)
      : (filters?.startDate as Date);

    const endDate = !filters?.endDate
      ? new Date()
      : typeof filters?.endDate === "string"
      ? new Date(filters?.endDate as string)
      : (filters?.endDate as Date);
    try {
      await exportReportOrdersToExcel({
        restaurantId: selectedRestaurantId,
        pagination: false,
        page: pagination.page,
        reference: filters?.search as string,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: filters?.type ? (filters?.type as OrderType) : undefined,
        status: filters?.status ? (filters?.status as OrderStatus) : undefined,
        auto: filters?.source
          ? filters?.source === "auto"
            ? true
            : false
          : undefined,
      });
      toast.success("Export Excel - À implémenter");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error("Erreur lors de l'exportation Excel");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => !isExporting && setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`
          px-3 py-1 sm:py-1 cursor-pointer text-sm font-light rounded-xl
          transition-all duration-200 flex items-center justify-center gap-2 min-w-[120px]
          ${
            isExporting
              ? "text-white bg-orange-400 cursor-wait"
              : "text-white bg-[#F17922] hover:bg-[#e06816] hover:shadow-md"
          }
        `}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            Export...
          </>
        ) : (
          <>
            <FileText size={16} />
            {buttonText}
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && !isExporting && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
          >
            {/* Bouton Export PDF */}
            <button
              onClick={handleExportPDF}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <FileText size={18} className="text-red-600" />
              <span>Exporter en PDF</span>
            </button>

            <div className="border-t border-gray-100" />

            {/* Bouton Export Excel - Tu peux ajouter ta logique */}
            <button
              onClick={handleExportExcel}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <FileText size={18} className="text-green-600" />
              <span>Exporter en Excel</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExportDropdown;
