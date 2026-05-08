"use client";

import React from 'react';
import Image from 'next/image';
import { useTicketsQuery } from '@/hooks/useTicketsQuery';
import { Ticket } from '@/types/tickets';

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

function getPriorityBadge(priority: 'HIGH' | 'MEDIUM' | 'LOW') {
  if (priority === 'HIGH') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full md:text-[10px] text-[10px] font-medium bg-red-500 text-white">
        HIGH
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full md:text-[10px] text-[10px] font-medium bg-gray-100 text-slate-700">
      {priority}
    </span>
  );
}

function TicketItem({ ticket }: { ticket: Ticket }) {
  const requesterName = ticket.customer?.name || ticket.deliverer?.name;
  const assigneeName = (ticket.assignee as any)?.name ?? null;
  const assigneeAvatar = (ticket.assignee as any)?.image ?? null;

  return (
    <div className="py-1">
      <div className="flex items-center space-x-4">
        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1">
              <h4 className="md:text-sm lg:text-sm text-xs font-semibold text-gray-900 leading-tight">
                {ticket.code}
                {requesterName && (
                  <span className="font-normal"> — {requesterName}</span>
                )}
              </h4>
            </div>
            <div className="flex flex-col items-end justify-start ml-4 space-y-2">
              {getPriorityBadge(ticket.priority)}
              {ticket.createdAt && (
                <p className="md:text-[10px] lg:text-sm text-[10px] text-gray-400">
                  {getRelativeTime(ticket.createdAt)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {ticket.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full md:text-[10px] text-[10px] font-medium border-gray-200 border-1 text-gray-700 w-fit">
                {ticket.category.name}
              </span>
            )}
            {assigneeName && (
              <div className="flex items-center space-x-2">
                <Image
                  src={assigneeAvatar || '/icons/imageprofile.png'}
                  alt={assigneeName}
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-full flex-shrink-0"
                />
                <span className="md:text-[10px] lg:text-sm text-[10px] text-gray-500 truncate">
                  {assigneeName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketsRecent() {
  const { data, isLoading, isError } = useTicketsQuery({}, true);
  const tickets = data?.data?.slice(0, 5) ?? [];

  return (
    <div className="bg-white rounded-2xl border-0 overflow-hidden h-full flex flex-col">
      <div className="p-3 md:p-6">
        <div className="flex items-center justify-between">
          <h3 className="lg:text-2xl md:text-base text-md font-semibold text-gray-900 flex items-center">
            <Image
              src="/icons/rapport/ticket-dark.png"
              alt="Tickets"
              width={20}
              height={20}
              className="mr-2 self-center mt-1"
            />
            Tickets récents
          </h3>
          <button className="md:text-xs text-xs border-1 border-slate-400 md:p-1.5 p-1 px-2 md:px-2.5 cursor-pointer rounded-xl text-gray-600 hover:text-gray-800 font-medium">
            Voir tout
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {isLoading && (
          <p className="text-sm text-gray-400 text-center py-4">Chargement…</p>
        )}
        {isError && (
          <p className="text-sm text-red-400 text-center py-4">Erreur de chargement</p>
        )}
        {!isLoading && !isError && tickets.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Aucun ticket récent</p>
        )}
        {!isLoading && !isError && tickets.length > 0 && (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <TicketItem key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketsRecent;
