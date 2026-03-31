import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'react-hot-toast';
import { promoCodeKeyQuery } from './index.query';
import {
  getPromoCodes,
  getPromoCode,
  getPromoCodeStats,
} from '../services/promo-code.service';
import { PromoCodeQuery } from '../types/promo-code.types';

// Liste des codes promo
export const usePromoCodesQuery = (query?: PromoCodeQuery) => {
  const result = useQuery({
    queryKey: promoCodeKeyQuery('list', query),
    queryFn: () => getPromoCodes(query),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (result.isError) {
      toast.error(
        result.error instanceof Error
          ? result.error.message
          : 'Erreur de chargement',
      );
    }
  }, [result.isError, result.error]);

  return result;
};

// Détail d'un code promo
export const usePromoCodeQuery = (id: string) => {
  const result = useQuery({
    queryKey: promoCodeKeyQuery('detail', id),
    queryFn: () => getPromoCode(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (result.isError) {
      toast.error(
        result.error instanceof Error
          ? result.error.message
          : 'Erreur de chargement',
      );
    }
  }, [result.isError, result.error]);

  return result;
};

// Statistiques
export const usePromoCodeStatsQuery = () => {
  const result = useQuery({
    queryKey: promoCodeKeyQuery('stats'),
    queryFn: getPromoCodeStats,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (result.isError) {
      toast.error(
        result.error instanceof Error
          ? result.error.message
          : 'Erreur de chargement des statistiques',
      );
    }
  }, [result.isError, result.error]);

  return result;
};
