import { ProgressStyles } from "../types/orderDetails.types";

export const getProgressStyles = (
    orderType: string | undefined,
    currentStatus: string
): ProgressStyles => {
    const styles: ProgressStyles = {
        step1Border: "border-[#F17922]",
        step1Bg: "bg-white",
        step1Icon: "/icons/poulet.png",
        line1: "bg-[#FFE8D7]",
        step2Border: "border-[#F17922]",
        step2Bg: "bg-white",
        step2Icon: "/icons/package_orange.png",
        line2: "bg-[#FFE8D7]",
        step3Border: "border-[#F17922]",
        step3Bg: "bg-white",
        step3Icon: "/icons/location-outline.png",
    };

    // Pour les commandes TABLE, si le statut est PRÊT, tout est complété
    if (orderType === "TABLE" && currentStatus === "PRÊT") {
        styles.step1Bg = "bg-[#F17922]";
        styles.step1Icon = "/icons/poulet-blanc.png";
        styles.line1 = "bg-[#F17922]";
        styles.step2Bg = "bg-[#F17922]";
        styles.step2Icon = "/icons/package.png";
        styles.line2 = "bg-[#F17922]";
        styles.step3Bg = "bg-[#F17922]";
        styles.step3Icon = "/icons/location_white.png";
        return styles;
    }

    if (currentStatus === "EN COURS" || currentStatus === "EN PRÉPARATION") {
        styles.step1Bg = "bg-[#F17922]";
        styles.step1Icon = "/icons/poulet-blanc.png";
    } else if (currentStatus === "PRÊT") {
        styles.step1Bg = "bg-[#F17922]";
        styles.step1Icon = "/icons/poulet-blanc.png";
        styles.line1 = "bg-[#F17922]";
        styles.step2Bg = "bg-[#F17922]";
        styles.step2Icon = "/icons/package.png";
    } else if (currentStatus === "COLLECTÉE") {
        styles.step1Bg = "bg-[#F17922]";
        styles.step1Icon = "/icons/poulet-blanc.png";
        styles.line1 = "bg-[#F17922]";
        styles.step2Bg = "bg-[#F17922]";
        styles.step2Icon = "/icons/package.png";
    } else if (
        currentStatus === "LIVRÉE" ||
        currentStatus === "TERMINÉE" ||
        currentStatus === "COMPLETED"
    ) {
        styles.step1Bg = "bg-[#F17922]";
        styles.step1Icon = "/icons/poulet-blanc.png";
        styles.line1 = "bg-[#F17922]";
        styles.step2Bg = "bg-[#F17922]";
        styles.step2Icon = "/icons/package.png";
        styles.line2 = "bg-[#F17922]";
        styles.step3Bg = "bg-[#F17922]";
        styles.step3Icon = "/icons/location_white.png";
    } else if (currentStatus === "ANNULÉE") {
        styles.step1Border = "border-[#FF3B30]";
        styles.step1Bg = "bg-[#FF3B30]";
        styles.step1Icon = "/icons/poulet-blanc.png";
        styles.line1 = "bg-[#FFE8D7]";
        styles.step2Border = "border-[#FF3B30]";
        styles.step2Bg = "bg-white";
        styles.line2 = "bg-[#FFE8D7]";
        styles.step3Border = "border-[#FF3B30]";
        styles.step3Bg = "bg-white";
    }

    return styles;
};