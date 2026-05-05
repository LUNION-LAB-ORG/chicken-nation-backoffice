'use client';

import DashboardPageHeader from '@/components/ui/DashboardPageHeader';
import { useDashboardStore } from '@/store/dashboardStore';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { courseKeyQuery } from '../queries/index.query';

/** Header du module Courses — titre + recherche + refresh. */
export function CoursesHeader() {
  const {
    courses: { view, filters },
    setFilter,
    setSectionView,
    setPagination,
  } = useDashboardStore();
  const queryClient = useQueryClient();

  const handleSearch = (query: string) => {
    setFilter('courses', 'search', query);
    setPagination('courses', 1, 10);
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: courseKeyQuery() });
    toast.success('Courses actualisées');
  };

  if (view === 'list') {
    return (
      <DashboardPageHeader
        mode="list"
        title="Courses"
        searchConfig={{
          placeholder: 'Rechercher par référence ou code retrait…',
          buttonText: 'Chercher',
          value: filters?.search as string,
          onSearch: handleSearch,
          realTimeSearch: true,
        }}
        actions={[
          {
            label: 'Actualiser',
            onClick: handleRefresh,
            variant: 'secondary' as const,
            className: 'bg-white border border-gray-300 text-[#595959] hover:bg-gray-50',
          },
        ]}
      />
    );
  }

  return (
    <DashboardPageHeader
      mode={view}
      onBack={() => setSectionView('courses', 'list')}
      title="Détail de la course"
      gradient
    />
  );
}
