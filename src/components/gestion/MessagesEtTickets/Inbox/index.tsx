"use client";

import React, { useState } from 'react';
import InboxSidebar from './InboxSidebar';
import ConversationView from './ConversationView';

function InboxModule() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  return (
    <div className="h-full bg-[#FBFBFB]">
      <div className="flex h-full">
        {/* Liste des conversations */}
        <div className={`
          ${selectedConversation ? 'hidden lg:block' : 'block'} 
          lg:w-96 xl:w-[400px] 2xl:w-[450px] md:w-80 w-full bg-white border-r border-slate-300 h-full
        `}>
          <InboxSidebar 
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
          />
        </div>
        
        {/* Vue de la conversation */}
        <div className={`
          ${selectedConversation ? 'block' : 'hidden lg:block'} 
          flex-1 bg-white h-full
        `}>
          <ConversationView 
            conversationId={selectedConversation}
            onBack={() => setSelectedConversation(null)}
          />
        </div>
      </div>
    </div>
  );
}

export default InboxModule;
