"use client";
import React from "react";
import { OrderData, ReceiptItem, ParsedAddress } from "./types";
import JsBarCode from "jsbarcode";
// Interface for the component props
interface ReceiptProps {
  orderData?: OrderData;
}

export function Content({ orderData }: ReceiptProps) {
  const order = orderData;

  // Parsing the address string from the OrderData interface
  let parsedAddress: string = order.address;
  if (typeof order.address === "string" && order.address.startsWith("{")) {
    try {
      const addressObj: ParsedAddress = JSON.parse(order.address);
      parsedAddress = `${addressObj.title}, ${addressObj.city}`;
    } catch (e) {
      parsedAddress = order.address;
    }
  }

  // Mapping order items to a simpler structure for display
  const items: ReceiptItem[] =
    order.order_items?.map((item) => ({
      description: item.dish?.name || "Article inconnu",
      details: item.dish?.description || "",
      quantity: item.quantity || 1,
      unitPrice: item.dish?.is_promotion
        ? item.dish.promotion_price || 0
        : item.dish?.price || 0,
      price: item.amount || 0,
      isPromotion: item.dish?.is_promotion || false,
      isSpicy: item.epice || false,
    })) || [];

  const formatPrice = (price: number) => {
    if (typeof price !== "number") return "0 FCFA";
    return `${Math.round(price)} FCFA`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR");
  };

  React.useEffect(() => {
    JsBarCode("#ticket", order.reference, {
      width: 1, // Réduit la largeur du code-barres
      height: 30, // Réduit la hauteur du code-barres
      fontSize: 10, // Réduit la taille de la police du code-barres
      text: order.reference,
    });
  }, []);
  // The rest of the component remains the same
  return (
    <div className="w-full bg-white text-black text-[10px] font-mono shadow-none p-1">
      <div className="text-center mb-1">
        <div className="text-[8px] tracking-tight">
          ****************************
        </div>
      </div>
      <div className="text-center font-bold text-xs mb-1">BON DE COMMANDE</div>
      <div className="text-center mb-2">
        <div className="text-[8px] tracking-tight">
          ****************************
        </div>
      </div>

      <div className="text-center font-bold text-sm mb-2">
        {order.restaurant?.name || "RESTAURANT NAME"}
      </div>
      <div className="mb-2">
        <div className="flex justify-between mb-0">
          <span>Adresse:</span>
          <span className="text-right max-w-[60%]">
            {order.restaurant?.address || "Adresse restaurant"}
          </span>
        </div>
        <div className="flex justify-between mb-0">
          <span>Date:</span>
          <span>
            {formatDate(order.date)} {order.time}
          </span>
        </div>
        <div className="flex justify-between mb-0">
          <span>Téléphone:</span>
          <span>{order.restaurant?.phone || "0000000000"}</span>
        </div>
        <div className="flex justify-between">
          <span>Commande:</span>
          <span>{order.reference}</span>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between mb-0">
          <span>Client:</span>
          <span>
            {order.customer?.first_name && order.customer?.last_name
              ? `${order.customer.first_name} ${order.customer.last_name}`
              : order.fullname || "Client"}
          </span>
        </div>
        <div className="flex justify-between mb-0">
          <span>Tel Client:</span>
          <span>{order.customer?.phone || "+000000000"}</span>
        </div>
        <div className="flex justify-between">
          <span>Type:</span>
          <span>{order.type}</span>
        </div>
        {order.type === "DELIVERY" && (
          <div className="flex justify-between mt-1">
            <span>Livraison:</span>
            <span className="text-right max-w-[60%]">{parsedAddress}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between font-bold mb-1 border-b border-dashed border-gray-400 pb-1">
        <span>Description</span>
        <span>Price</span>
      </div>

      <div className="mb-2">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={index} className="mb-1">
              <div className="flex justify-between items-start">
                <span className="font-semibold flex items-center max-w-[70%]">
                  {item.description}
                  {item.isSpicy && (
                    <span className="ml-1 text-red-500">🌶️</span>
                  )}
                </span>
                <span className="text-right">{formatPrice(item.price)}</span>
              </div>
              {item.details && (
                <div className="text-[8px] text-gray-600 mb-0">
                  {item.details}
                </div>
              )}
              <div className="text-[8px] flex justify-between">
                <span>
                  Qté: {item.quantity} x {formatPrice(item.unitPrice)}
                </span>
                {item.isPromotion && (
                  <span className="text-red-500">PROMO</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 text-[10px]">
            Aucun article
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-gray-400 mb-1"></div>

      <div className="mb-2">
        <div className="flex justify-between mb-0">
          <span>Sous-total</span>
          <span>{formatPrice(order.net_amount)}</span>
        </div>
        {order.delivery_fee > 0 ? (
          <div className="flex justify-between mb-0">
            <span>Frais de livraison</span>
            <span>{formatPrice(order.delivery_fee)}</span>
          </div>
        ) : null}
        {order.discount > 0 && (
          <div className="flex justify-between mb-0 text-green-600">
            <span>Remise</span>
            <span>-{formatPrice(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between mb-1">
          <span>Taxe ({Math.round(order.tax * 100)}%)</span>
          <span>{formatPrice(order.tax * order.net_amount)}</span>
        </div>
        <div className="flex justify-between border-t border-dashed pt-1">
          <span className="font-bold text-xs">TOTAL</span>
          <span className="font-bold text-xs">
            {formatPrice(order.amount)}
          </span>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between mb-0">
          <span>Mode paiement:</span>
          <span>{order.paiements?.[0]?.mode || "N/A"}</span>
        </div>
        {order.paiements?.[0]?.reference && (
          <div className="flex justify-between mb-0">
            <span>Ref. paiement:</span>
            <span>{order.paiements?.[0]?.reference}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Statut:</span>
          <span
            className={`${
              order.status === "COMPLETED"
                ? "text-green-600"
                : order.status === "PENDING"
                ? "text-yellow-600"
                : "text-gray-600"
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <div className="text-center mb-2">
        <div className="text-[8px] tracking-tight">
          ****************************
        </div>
      </div>

      <div className="text-center mb-1">
        <svg
          id="ticket"
          className="w-full h-[50px]"
          jsbarcode-format="upc"
          jsbarcode-textmargin="0"
          jsbarcode-fontoptions="bold"
        ></svg>
      </div>

      <div className="text-center font-bold text-sm mb-2">THANK YOU</div>

      <div className="text-center text-gray-400">
        <svg viewBox="0 0 300 20" className="w-full h-4" fill="currentColor">
          <path d="M0,10 Q7.5,0 15,10 T30,10 T45,10 T60,10 T75,10 T90,10 T105,10 T120,10 T135,10 T150,10 T165,10 T180,10 T195,10 T210,10 T225,10 T240,10 T255,10 T270,10 T285,10 T300,10 L300,20 L0,20 Z" />
        </svg>
      </div>
    </div>
  );
}