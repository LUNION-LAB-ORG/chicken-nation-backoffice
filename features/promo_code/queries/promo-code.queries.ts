import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'react-hot-toast';
import { promoCodeKeyQuery } from './index.query';
import {
  getPromoCodes,
  getPromoCode,
  getPromoCodeStats,
  getPromoCodeAnalytics,
  getPromoCodeUsages,
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

// Analytics détaillées d'un code promo (vue détail)
export const usePromoCodeAnalyticsQuery = (id: string) => {
  const result = useQuery({
    queryKey: promoCodeKeyQuery('analytics', id),
    queryFn: () => getPromoCodeAnalytics(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });

  React.useEffect(() => {
    if (result.isError) {
      toast.error(
        result.error instanceof Error
          ? result.error.message
          : 'Erreur de chargement des analytics',
      );
    }
  }, [result.isError, result.error]);

  return result;
};

// Utilisations paginées d'un code promo (vue détail)
export const usePromoCodeUsagesQuery = (id: string, page = 1, limit = 10) => {
  const result = useQuery({
    queryKey: promoCodeKeyQuery('usages', id, page, limit),
    queryFn: () => getPromoCodeUsages(id, page, limit),
    enabled: !!id,
    keepPreviousData: true,
    staleTime: 60 * 1000,
  });

  React.useEffect(() => {
    if (result.isError) {
      toast.error(
        result.error instanceof Error
          ? result.error.message
          : 'Erreur de chargement des utilisations',
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
