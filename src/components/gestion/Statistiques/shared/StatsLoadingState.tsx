"use client";

import React from "react";

export default function StatsLoadingState() {
  return (
    <div className="space-y-4">
      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-2xl p-4 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
            <div className="h-7 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-2 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-48 mb-4" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-gray-50">
            <div className="h-3 bg-gray-100 rounded w-8" />
            <div className="h-3 bg-gray-100 rounded flex-1" />
            <div className="h-3 bg-gray-100 rounded w-20" />
            <div className="h-3 bg-gray-100 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
