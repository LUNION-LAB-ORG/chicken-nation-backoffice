import React, { useState } from 'react';
import Image from 'next/image';
import { Ad } from '@/types/ad';
import { mockAds } from '@/data/mockAds';

// Composants
import AdsHeader from './AdsHeader';
import CreateAd from './CreateAd';
import AdCard from './AdCard';
import AdDetail from './AdDetail';
import AdFilter from './AdFilter';
import AdSearch from './AdSearch';

interface AdsState {
  view: 'list' | 'create' | 'edit' | 'view';
  selectedAd?: Ad | null;
}

export default function Ads() {
  const [activeTab, setActiveTab] = useState<'programmes' | 'publicites'>('publicites');
  const [adsState, setAdsState] = useState<AdsState>({
    view: 'list'
  });
  const [ads, setAds] = useState<Ad[]>(mockAds);
  const [filteredAds, setFilteredAds] = useState<Ad[]>(mockAds);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const handleCreateAd = () => {
    setAdsState({ view: 'create' });
  };

  const handleAdCreated = (newAd: Ad) => {
   
    
    const newAds = [...ads, { ...newAd, id: String(ads.length + 1) }];
    setAds(newAds);
    filterAndSearchAds(newAds, searchQuery, activeFilter);
    setAdsState({ view: 'list' });
  };

  const handleBackToList = () => {
    setAdsState({ view: 'list', selectedAd: null });
  };

  const handleAdClick = (ad: Ad) => {
    setAdsState({ view: 'view', selectedAd: ad });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterAndSearchAds(ads, query, activeFilter);
  };

  const handleFilter = (filter: string) => {
    setActiveFilter(filter);
    filterAndSearchAds(ads, searchQuery, filter);
  };

  const filterAndSearchAds = (adsList: Ad[], query: string, filter: string) => {
    // Filtrer par recherche
    let result = adsList;

    if (query) {
      result = result.filter(ad =>
        ad.title.toLowerCase().includes(query.toLowerCase()) ||
        ad.content.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Appliquer le filtre
    if (filter !== 'all') {
      if (filter === 'recent') {
        result = [...result].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (filter === 'popular') {
        result = [...result].sort((a, b) =>
          (b.stats?.readBy || 0) - (a.stats?.readBy || 0)
        );
      }
    }

    setFilteredAds(result);
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
            {/* titre */}
            <span className='text-[#F17922] text-[26px] font-regular'>Activités</span>
            {/* Tabs */}

            <div className=" border mt-4 px-4 border-gray-200 py-6 rounded-2xl mb-6 w-fit">
             <div className='flex items-center gap-14 justify-between'>
              {/* Programmes */}
            <div>
              <button
                type="button"
                className={`flex items-center gap-2 px-4 py-2 text-[14px] ${activeTab === 'programmes' ? 'text-[#424242] font-medium' : 'text-[#424242'}`}
                onClick={() => setActiveTab('programmes')}>
                <Image src = '/icons/calendar-outline.png' alt='programme' width={20} height={36}  />
                Programmes (0)
              </button>

                <div className='flex flex-row items-center justify-between'>
                <div className='flex border-[2px] mt-2 w-44 justify-center border-[#F17922] rounded-xl items-center gap-2 px-4 py-1 '>

                <span className='text-[14px] cursor-pointer text-[#F17922]'> Voir le calendrier</span>
                </div>

              </div>
            </div>
                {/* Publiées */}
            <div className=' items-center justify-center'>
              <button
                type="button"
                className={`flex items-center gap-2 px-4 ml-4 py-2 text-[14px] ${activeTab === 'programmes' ? 'text-[#424242] font-medium' : 'text-[#424242'}`}
                onClick={() => setActiveTab('programmes')}>
                <Image src = '/icons/send.png' alt='programme' width={20} height={36}  />
                Publiées (0)
              </button>

                <div className='flex flex-row items-center justify-between'>
                <div className='flex border-2 mt-2 w-44 justify-center border-[#F17922] rounded-xl items-center gap-2 px-4 py-1 '>

                <span className='text-[14px] cursor-pointer text-[#F17922]'> Voir le calendrier</span>
                </div>

              </div>
            </div>

             </div>

            </div>

              {/* Connexion */}

              <div className='flex mb-4'>
                  <span className='text-[#F17922] text-[26px] font-regular'>Connexion</span>
              </div>
            {/* Ad Types Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Social Media CRM Card */}
              <div className="bg-white cursor-pointer hover:scale-102 rounded-2xl p-2 border-2 border-[#E4E4E7]">
                <div className=" gap-2 mb-2">
                  <Image   src={'/icons/social.png'} alt='social' width={224} height={36}  />
                  <h3 className="font-medium text-[#52525B]">Social media CRM</h3>
                </div>
                <p className="text-xs text-gray-500 mb-1">Gérez les intéractions de vos réseaux sociaux</p>
              </div>

              {/* Hashtag Card */}
              <div className="bg-white cursor-pointer hover:scale-102 rounded-2xl p-2 border-2 border-[#E4E4E7]">
                <div className=" gap-2 mb-2">
                  <Image src={'/icons/htag.png'} alt='social' width={224} height={36}  />
                  <h3 className="font-medium text-[#52525B]">Hashtag</h3>
                </div>
                <p className="text-xs text-gray-500 mb-1">Gérez les tendances des <br/>  hashtags</p>
              </div>


              {/* Analytique Card */}
             <div className="bg-white cursor-pointer hover:scale-102 rounded-2xl p-2 border-2 border-[#E4E4E7]">
                <div className=" gap-2 mb-2">
                  <Image src={'/icons/htag.png'} alt='social' width={224} height={36}  />
                  <h3 className="font-medium text-[#52525B]">analytiques</h3>
                </div>
                <p className="text-xs text-gray-500 mb-1">Gérer les tendances des  <br/> hashtags</p>
              </div>

            </div>

              {/* Publicités en cours avec barre de recherche */}
              <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4'>
                <span className='text-[#F17922] text-[26px] font-regular'>Publicitées récentes</span>

              </div>


              <div className="border border-gray-200 rounded-2xl p-6">
                <div className='flex justify-end items-center mb-4'>
                  <div className="flex items-center gap-2">
                    {/* Filtre */}
                    <AdFilter
                      onFilterChange={handleFilter}
                    />

                    {/* Barre de recherche */}
                    <AdSearch
                      onSearch={handleSearch}
                      placeholder="Recherche"
                      className="w-48 md:w-64"
                    />
                  </div>
                </div>
                  {filteredAds.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredAds.map((ad) => (
                    <div key={ad.id}>
                      <AdCard ad={ad} onClick={handleAdClick} />
                    </div>
                  ))}
                </div>
                  ) : (
                       <></>
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