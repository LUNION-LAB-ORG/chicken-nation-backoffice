"use client";

import React, { useState } from 'react';
import TicketsSidebar from './TicketsSidebar';
import TicketView from './TicketView';
import TicketsRightbar from './TicketsRightbar';
import NewTicketModal from './NewTicketModal';
import NewCategoryModal from './NewCategoryModal';
import { useTicketSocketSync } from '../../../../../features/messagerie';

function TicketsModule() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);

  // WebSocket pour les mises à jour en temps réel
  useTicketSocketSync({ enabled: true, playSound: true });

  return (
    <>
      <div className="h-full flex bg-gray-50 overflow-hidden">
        {/* Sidebar gauche avec la liste des tickets - Responsive */}
        <div className={`
          ${selectedTicket ? 'hidden lg:block' : 'block'} 
          lg:w-96 xl:w-[400px] 2xl:w-[450px] md:w-80 w-full bg-white border-r border-slate-300 h-full
        `}>
          <TicketsSidebar 
            selectedTicket={selectedTicket}
            onSelectTicket={setSelectedTicket}
            onNewTicket={() => setShowNewTicketModal(true)}
            onNewCategory={() => setShowNewCategoryModal(true)}
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

      {/* Modal de création de ticket */}
      <NewTicketModal
        isOpen={showNewTicketModal}
        onClose={() => setShowNewTicketModal(false)}
      />

      {/* Modal de création de catégorie */}
      <NewCategoryModal
        isOpen={showNewCategoryModal}
        onClose={() => setShowNewCategoryModal(false)}
      />
    </>
  );
}

export default TicketsModule;
