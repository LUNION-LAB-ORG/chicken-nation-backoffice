"use client";

import DynamicModuleLoader from "@/components/gestion/DynamicModuleLoader";

export default function GestionPage() {
  return (
    <main className={`flex-1 pt-14 overflow-y-auto container mx-auto`}>
      <DynamicModuleLoader />
    </main>
  );
}
