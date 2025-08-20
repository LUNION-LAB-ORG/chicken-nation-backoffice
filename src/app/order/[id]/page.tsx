import React from "react";
import { Content } from "./Content";
import { cookies } from "next/headers";
import { OrderData } from "./types";

async function getOrder(token: string, id: string): Promise<OrderData> {
  const baseURL =
    process.env.NEXT_PUBLIC_API_PREFIX || "http://localhost:8081/api/v1";

  const response = await fetch(`${baseURL}/orders/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) {
    return <div>Erreur: ID de commande non fourni</div>;
  }
  const cookieStore = await cookies();
  const token = cookieStore.get("chicken-nation-token");

  if (!token) {
    return <div>Erreur: Utilisateur non authentifié</div>;
  }
  const data = await getOrder(token.value, id);
  if (!data) {
    return <div>Erreur: Commande non trouvée</div>;
  }
  // Requête pour récupérer les données de la commande
  return <Content orderData={data} />;
}
