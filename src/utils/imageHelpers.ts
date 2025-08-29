const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const formatImageUrl = (imageUrl?: string): string => {
  if (!imageUrl) return '';

  try {
    // URLs complètes (http/https)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // URLs avec uploads/ (format classique)
    if (imageUrl.startsWith('uploads/')) {
      return `${API_URL}/${imageUrl}`;
    }
 
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(imageUrl)) {
 
      if (imageUrl.includes(':')) {
        return `${API_URL}/uploads/customer-avatar/${imageUrl}`;
      } else {
        return `${API_URL}/uploads/${imageUrl}`;
      }
    }

 
    if (imageUrl.startsWith('/')) {
      return imageUrl;
    }

    // Autres cas - ajouter / au début
    return '/' + imageUrl;
  } catch {
    return '';
  }
};
 
export const formatPromotionImageUrl = (imageUrl?: string | null): string => {
  

  if (!imageUrl) {
  
    return '';
  }

  try {
    // URLs complètes (http/https)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    
      return imageUrl;
    }
 
    if (imageUrl.startsWith('uploads/promotions/')) {
      const result = `${API_URL}/${imageUrl}`;
    
      return result;
    }
 
    if (imageUrl.includes(':') && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(imageUrl)) {
      const correctedUrl = `uploads/promotions/${imageUrl}`;
      const result = `${API_URL}/${correctedUrl}`;
   
      return result;
    }

    // URLs relatives (commencent par /)
    if (imageUrl.startsWith('/')) {
  
      return imageUrl;
    }
 
    const fallbackResult = formatImageUrl(imageUrl);
    
    return fallbackResult;
  } catch (error) {
    console.error('❌ [formatPromotionImageUrl] Erreur:', error);
    return '';
  }
};

export const base64ToFile = async (base64Image: string, fileName: string = 'image.jpg'): Promise<File> => {
  try {
    const response = await fetch(base64Image);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  } catch (error) {
    throw error;
  }
};

export const addImageToFormData = async (
  formData: FormData,
  image: File | string | null,
  fieldName: string = 'image'
): Promise<FormData> => {
  if (!image) return formData;

   if (image instanceof File) {
    formData.append(fieldName, image);
    return formData;
  }

   if (typeof image === 'string' && image.startsWith('data:')) {
    try {
      const file = await base64ToFile(image);
      formData.append(fieldName, file);
    } catch { 
    }
  }
   else if (typeof image === 'string') {
    formData.append('image_url', image);
  }

  return formData;
};
 
export const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;

  try {
    // Check if it's a data URL (base64)
    if (url.startsWith('data:')) return true;

    // Check if it's an absolute URL
    if (url.startsWith('http://') || url.startsWith('https://')) return true;

    // Check if it's a valid path starting with '/'
    if (url.startsWith('/')) return true; 

    return false;
  } catch {
    return false;
  }
};

// ✅ Fonction utilitaire pour créer un composant Image sécurisé
export const createSafeImageProps = (imageUrl: string | null | undefined, altText: string = 'Image') => {
  const formattedUrl = formatPromotionImageUrl(imageUrl);
  const isValid = isValidImageUrl(formattedUrl);

  return {
    src: isValid ? formattedUrl : '/images/placeholder.svg',
    alt: altText,
    isValid,
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      console.warn('Erreur de chargement de l\'image:', imageUrl);
      (e.target as HTMLImageElement).style.display = 'none';
    }
  };
};
