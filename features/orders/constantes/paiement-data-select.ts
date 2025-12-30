import { PaiementMode } from "../types/paiement.types";


export const paiementDataSelect = [
    {
        label: "Espèce",
        source: "cash",
        image: "/images/mode-paiement/cash.jpg",
        key: PaiementMode.CASH,
    },
    {
        label: "Orange Money",
        source: "orange-ci",
        image: "/images/mode-paiement/orange-ci.png",
        key: PaiementMode.MOBILE_MONEY,
    },
    {
        label: "MTN Mobile Money",
        source: "mtn-ci",
        image: "/images/mode-paiement/mtn-ci.jpg",
        key: PaiementMode.MOBILE_MONEY,
    },
    {
        label: "MOOV Money",
        source: "moov-ci",
        image: "/images/mode-paiement/moov-ci.png",
        key: PaiementMode.MOBILE_MONEY,
    },
    {
        label: "Wave Money",
        source: "wave",
        image: "/images/mode-paiement/wave.jpg",
        key: PaiementMode.WALLET,
    },
    {
        label: "Carte",
        source: "card",
        image: "/images/mode-paiement/card.png",
        key: PaiementMode.CARD,
    },
];
