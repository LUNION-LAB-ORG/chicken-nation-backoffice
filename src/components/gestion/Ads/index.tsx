import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Ad } from '@/types/ad';
import { useCampaignListQuery, useCreateCampaignMutation } from '../../../../features/push-campaign/queries/push-campaign.query';
import type { PushCampaign } from '../../../../features/push-campaign/types/push-campaign.types';

// Composants
import AdsHeader from './AdsHeader';
import CreateAd from './CreateAd';
import AdCard from './AdCard';
import AdDetail from './AdDetail';
import AdFilter from './AdFilter';
import AdSearch from './AdSearch';

function campaignToAd(c: PushCampaign): Ad {
  return {
    id: c.id,
    title: c.title,
    content: c.body,
    image: c.image_url,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    publishedAt: c.sent_at ?? undefined,
    status: c.status === 'sent' ? 'published' : c.status === 'failed' ? 'draft' : (c.status as Ad['status']),
    authorId: c.created_by,
    stats: {
      sentTo: c.total_targeted,
      readBy: c.total_sent,
    },
  };
}

interface AdsState {
  view: 'list' | 'create' | 'edit' | 'view';
  selectedAd?: Ad | null;
}

export default function Ads() {
  const [activeTab, setActiveTab] = useState<'programmes' | 'publicites'>('publicites');
  const [adsState, setAdsState] = useState<AdsState>({ view: 'list' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const { data, isLoading, isError } = useCampaignListQuery({ limit: 100 });
  const createMutation = useCreateCampaignMutation();

  const allAds = useMemo(() => (data?.items ?? []).map(campaignToAd), [data]);

  const filteredAds = useMemo(() => {
    let result = allAds;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (ad) =>
          ad.title.toLowerCase().includes(q) ||
          ad.content.toLowerCase().includes(q)
      );
    }

    if (activeFilter === 'recent') {
      result = [...result].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (activeFilter === 'popular') {
      result = [...result].sort(
        (a, b) => (b.stats?.readBy || 0) - (a.stats?.readBy || 0)
      );
    }

    return result;
  }, [allAds, searchQuery, activeFilter]);

  const handleCreateAd = () => {
    setAdsState({ view: 'create' });
  };

  const handleAdCreated = (newAd: Ad) => {
    createMutation.mutate(
      {
        name: newAd.title,
        title: newAd.title,
        body: newAd.content,
        target_type: 'all',
        target_config: {},
      },
      {
        onSuccess: () => {
          setAdsState({ view: 'list' });
        },
      }
    );
  };

  const handleBackToList = () => {
    setAdsState({ view: 'list', selectedAd: null });
  };

  const handleAdClick = (ad: Ad) => {
    setAdsState({ view: 'view', selectedAd: ad });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-2 lg:pt-2 pb-2 sm:px-4 sm:pb-4 md:px-6 md:pb-6 lg:px-8 lg:pb-8">
        <AdsHeader
          currentView={adsState.view}
          onBack={handleBackToList}
          onCreateAd={handleCreateAd}
        />

        {/* Vue liste */}
        {adsState.view === 'list' && (
          <div className="bg-white rounded-[20px] p-6 mt-4 shadow-sm">
            <span className='text-[#F17922] text-[26px] font-regular'>Activités</span>

            <div className="border mt-4 px-4 border-gray-200 py-6 rounded-2xl mb-6 w-fit">
              <div className='flex items-center gap-14 justify-between'>
                <div>
                  <button
                    type="button"
                    className={`flex items-center gap-2 px-4 py-2 text-[14px] ${activeTab === 'programmes' ? 'text-[#424242] font-medium' : 'text-[#424242]'}`}
                    onClick={() => setActiveTab('programmes')}>
                    <Image src='/icons/calendar-outline.png' alt='programme' width={20} height={36} />
                    Programmes (0)
                  </button>
                  <div className='flex flex-row items-center justify-between'>
                    <div className='flex border-[2px] mt-2 w-44 justify-center border-[#F17922] rounded-xl items-center gap-2 px-4 py-1'>
                      <span className='text-[14px] cursor-pointer text-[#F17922]'>Voir le calendrier</span>
                    </div>
                  </div>
                </div>

                <div className='items-center justify-center'>
                  <button
                    type="button"
                    className={`flex items-center gap-2 px-4 ml-4 py-2 text-[14px] ${activeTab === 'publicites' ? 'text-[#424242] font-medium' : 'text-[#424242]'}`}
                    onClick={() => setActiveTab('publicites')}>
                    <Image src='/icons/send.png' alt='programme' width={20} height={36} />
                    Publiées ({allAds.filter(a => a.status === 'published').length})
                  </button>
                  <div className='flex flex-row items-center justify-between'>
                    <div className='flex border-2 mt-2 w-44 justify-center border-[#F17922] rounded-xl items-center gap-2 px-4 py-1'>
                      <span className='text-[14px] cursor-pointer text-[#F17922]'>Voir le calendrier</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex mb-4'>
              <span className='text-[#F17922] text-[26px] font-regular'>Connexion</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white cursor-pointer hover:scale-102 rounded-2xl p-2 border-2 border-[#E4E4E7]">
                <div className="gap-2 mb-2">
                  <Image src={'/icons/social.png'} alt='social' width={224} height={36} />
                  <h3 className="font-medium text-[#52525B]">Social media CRM</h3>
                </div>
                <p className="text-xs text-gray-500 mb-1">Gérez les intéractions de vos réseaux sociaux</p>
              </div>

              <div className="bg-white cursor-pointer hover:scale-102 rounded-2xl p-2 border-2 border-[#E4E4E7]">
                <div className="gap-2 mb-2">
                  <Image src={'/icons/htag.png'} alt='social' width={224} height={36} />
                  <h3 className="font-medium text-[#52525B]">Hashtag</h3>
                </div>
                <p className="text-xs text-gray-500 mb-1">Gérez les tendances des <br /> hashtags</p>
              </div>

              <div className="bg-white cursor-pointer hover:scale-102 rounded-2xl p-2 border-2 border-[#E4E4E7]">
                <div className="gap-2 mb-2">
                  <Image src={'/icons/htag.png'} alt='social' width={224} height={36} />
                  <h3 className="font-medium text-[#52525B]">analytiques</h3>
                </div>
                <p className="text-xs text-gray-500 mb-1">Gérer les tendances des <br /> hashtags</p>
              </div>
            </div>

            <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4'>
              <span className='text-[#F17922] text-[26px] font-regular'>Publicitées récentes</span>
            </div>

            <div className="border border-gray-200 rounded-2xl p-6">
              <div className='flex justify-end items-center mb-4'>
                <div className="flex items-center gap-2">
                  <AdFilter onFilterChange={setActiveFilter} />
                  <AdSearch
                    onSearch={setSearchQuery}
                    placeholder="Recherche"
                    className="w-48 md:w-64"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  Chargement…
                </div>
              ) : isError ? (
                <div className="flex items-center justify-center py-12 text-red-400">
                  Erreur lors du chargement des campagnes.
                </div>
              ) : filteredAds.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredAds.map((ad) => (
                    <div key={ad.id}>
                      <AdCard ad={ad} onClick={handleAdClick} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                  <span className="text-4xl">📢</span>
                  <p className="text-sm">Aucune campagne pour le moment.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vue création */}
        {adsState.view === 'create' && (
          <div className="flex flex-col bg-white rounded-xl p-4 lg:p-6 border-2 border-[#D8D8D8]/30 mt-4">
            <CreateAd
              onCancel={handleBackToList}
              onSuccess={handleAdCreated}
            />
          </div>
        )}

        {/* Vue détaillée */}
        {adsState.view === 'view' && adsState.selectedAd && (
          <AdDetail
            ad={adsState.selectedAd}
            onBack={handleBackToList}
            onEdit={(ad) => console.log('Modifier la publicité:', ad)}
            onResend={(ad) => console.log('Relancer la publicité:', ad)}
          />
        )}
      </div>
    </div>
  );
}
