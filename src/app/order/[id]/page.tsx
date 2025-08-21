import React from "react";
import { Content } from "./Content";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  if (!id) {
    return <div>Erreur: ID de commande non fourni</div>;
  }
  return <Content id={id} />;
};

export default Page;
