export const formatAddress = (addressString: string) => {
  try {
    const addressObj = JSON.parse(addressString);
    // Pour l'affichage court, on ne prend que la ville
    const shortDisplay = addressObj.city || "Ville non disponible";

    // Pour le tooltip, on garde l'adresse complète
    const fullParts = [];
    if (addressObj.formattedAddress) {
      return {
        short: shortDisplay,
        full: addressObj.formattedAddress,
      };
    }

    if (addressObj.title) fullParts.push(addressObj.title);
    if (addressObj.address || addressObj.road)
      fullParts.push(addressObj.address || addressObj.road);
    if (addressObj.city) fullParts.push(addressObj.city);
    if (addressObj.postalCode) fullParts.push(addressObj.postalCode);

    return {
      short: shortDisplay,
      full: fullParts.join(", ") || "Adresse non disponible",
    };
  } catch {
    // Si l'adresse n'est pas un JSON valide, retourner l'adresse brute
    return {
      short:
        addressString.length > 20
          ? addressString.substring(0, 20) + "..."
          : addressString,
      full: addressString,
    };
  }
};
