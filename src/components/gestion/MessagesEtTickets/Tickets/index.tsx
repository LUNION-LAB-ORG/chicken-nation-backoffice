"use client";

import React, { useState } from 'react';
import TicketsSidebar from './TicketsSidebar';
import TicketView from './TicketView';
import TicketsRightbar from './TicketsRightbar';

function TicketsModule() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar gauche avec la liste des tickets - Responsive */}
      <div className={`
        ${selectedTicket ? 'hidden lg:block' : 'block'} 
        lg:w-96 xl:w-[400px] 2xl:w-[450px] md:w-80 w-full bg-white border-r border-slate-300 h-full
      `}>
        <TicketsSidebar 
          selectedTicket={selectedTicket}
          onSelectTicket={setSelectedTicket}
        />
      </div>
      
      {/* Zone principale - Responsive */}
      <div className={`
        ${selectedTicket ? 'block' : 'hidden lg:block'} 
        flex-1 flex h-full
      `}>
        <TicketView 
          ticketId={selectedTicket}
          onBack={() => setSelectedTicket(null)}
        />
        
        {/* Sidebar droite - Détails du ticket - Responsive */}
        {selectedTicket && (
          <div className="hidden xl:block">
            <TicketsRightbar ticketId={selectedTicket} />
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketsModule;
