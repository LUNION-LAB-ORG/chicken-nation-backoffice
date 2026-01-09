"use client";

import { Users } from "lucide-react";

interface UserCounterProps {
  count: number;
}

export function UserCounter({ count = 0 }: UserCounterProps) {
  return (
    <div className="w-full max-w-xs rounded-3xl relative border border-gray-200 bg-white p-6 shadow-sm">
      <div className="absolute top-0 left-5 h-7 w-52 rounded-b-xl bg-[#007AFF] px-2 text-white flex items-center">
        <span className="ml-4 text-xs font-normal">
          NOMBRE D&apos;UTILISATEURS APP
        </span>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-xl font-medium text-[#9796A1]">
          {count} clients
        </h2>

        <Users className="h-7 w-7 text-[#F17922]" />
      </div>
    </div>
  );
}
