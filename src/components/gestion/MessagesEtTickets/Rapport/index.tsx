"use client";

import React from 'react';
import RapportHeader from './Header';
import StatsCards from './StatsCards';
import ConversationsRecentes from './ConversationsRecentes';
import TicketsRecent from './TicketsRecent';
import TempsDeReponse from './TempsDeReponse';
import SatisfactionClient from './SatisfactionClient';

function RapportModule() {
  return (
    <div className="p-6 bg-[#FBFBFB] min-h-screen">
      <RapportHeader />
      <StatsCards />
      <div className="flex-row md:flex w-full gap-6">
        <div className="flex-1 mb-4 md:mb-0 h-80">
          <ConversationsRecentes />
        </div>
        <div className="flex-1 h-80">
          <TicketsRecent />
        </div>
      </div>
      <div className="flex-row md:flex  w-full gap-6 mt-6">
        <div className="flex-1 mb-4  h-80">
          <TempsDeReponse />
        </div>
        <div className="flex-1 h-80">
          <SatisfactionClient />
        </div>
      </div>
      
    </div>
  );
}

export default RapportModule;
 