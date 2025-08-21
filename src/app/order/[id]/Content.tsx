"use client";

import React from "react";
import { OrderData } from "./types";
import Receipt from "./Receipt";

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
    throw new Error("Erreur lors de la récupération de la commande");
  }

  return response.json();
}
export function Content({ id }: { id: string }) {
  const [order, setOrder] = React.useState<OrderData | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  function getAuthToken() {
    try {
      const authData = localStorage.getItem("chicken-nation-auth");
      if (!authData) {
        console.error("Pas de données d'authentification trouvées");
        return null;
      }

      const parsedData = JSON.parse(authData);
      const token =
        parsedData?.state?.accessToken ||
        parsedData?.accessToken ||
        parsedData?.token;

      if (!token) {
        console.error("Token non trouvé dans les données d'authentification");
        return null;
      }

      return token;
    } catch (error) {
      console.error("Erreur lors de la récupération du token:", error);
      return null;
    }
  }

  React.useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setToken(token);
      console.log("Token récupéré:", token);
    } else {
      console.error("Aucun token trouvé");
    }
  }, []);

  React.useEffect(() => {
    if (id && token && token !== "null") {
      async function fetchOrder() {
        try {
          const data = await getOrder(token!, id);
          setOrder(data);
          console.log("Order data:", data);
        } catch (error) {}
      }
      fetchOrder();
    }
  }, [id, token]);

  console.log("Order:", order);
  if (!order) {
    return <div>Chargement de la commande...</div>;
  }
  return <div>
    <Receipt orderData={order}/>
  </div>;
}
