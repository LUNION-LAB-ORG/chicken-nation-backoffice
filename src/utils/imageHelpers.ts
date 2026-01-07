const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;

export const formatImageUrl = (imageUrl?: string, placeholder?: string): string => {
  if (!imageUrl) return formatImageUrl(placeholder || '/icons/image.png');

  try {
    // URLs complètes
    if (imageUrl.startsWith('http') || imageUrl.startsWith('https')) {
      return imageUrl;
    }

    // URLs avec uploads/ (format classique)
    if (imageUrl.startsWith('uploads/') || imageUrl.includes('uploads/')) {
      return `${API_URL}/${imageUrl}`;
    }

    // URLs avec uploads/ (cloudfront)
    if (imageUrl.startsWith('chicken-nation/') || imageUrl.includes('chicken-nation/')) {
      return `https://${CLOUDFRONT_URL}/${imageUrl}`;
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


export const base64ToFile = async (base64Image: string, fileName: string = 'image.jpg'): Promise<File> => {
  try {
    const response = await fetch(base64Image);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  } catch (error) {
    throw error;
  }
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

