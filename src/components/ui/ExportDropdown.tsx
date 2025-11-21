"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { exportOrders, convertOrdersForExport, ExportFormat } from '@/services/exportService';
import { toast } from 'react-hot-toast';
 

interface ExportDropdownProps {
  orders: unknown[];
  disabled?: boolean;
  className?: string;
  buttonText?: string;
}
 

const ExportDropdown: React.FC<ExportDropdownProps> = ({
  orders,
  disabled = false,
  buttonText = 'Exporter'
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    if (orders.length === 0) {
      toast.error('Aucune commande à exporter');
      return;
    }

    setIsExporting(true);

    try {
      const exportData = convertOrdersForExport(orders);

      // Ajouter un petit délai pour l'UX
      await new Promise(resolve => setTimeout(resolve, 500));

      exportOrders(exportData, format);

      toast.success(
        `Export ${format.toUpperCase()} réussi ! ${orders.length} commande${orders.length > 1 ? 's' : ''} exportée${orders.length > 1 ? 's' : ''}.`
      );
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erreur lors de l\'export des commandes'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleDirectExport = () => {
    if (!disabled && orders.length > 0) {
      handleExport('csv');
    } else if (orders.length === 0) {
      toast.error('Aucune commande à exporter');
    }
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={handleDirectExport}
      disabled={disabled || isExporting}
      className={`
        px-3 py-1 sm:py-1 cursor-pointer text-sm  font-light rounded-xl
        transition-all duration-200 flex items-center justify-center gap-2 min-w-[120px]
        ${disabled || orders.length === 0
          ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
          : isExporting
          ? 'text-white bg-orange-400 cursor-wait'
          : 'text-white bg-[#F17922] hover:bg-[#e06816] hover:shadow-md'
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
          {buttonText} CSV
        </>
      )}
    </motion.button>
  );
};

export default ExportDropdown;
