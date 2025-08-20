import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { formatImageUrl, base64ToFile } from '@/utils/imageHelpers';

export const useMenuFormImage = (initialImage?: string | null) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string>('/images/placeholder-food.jpg');
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Initialiser l'image avec un effet
  useEffect(() => {
    if (initialImage) {
       
      setImagePreview(formatImageUrl(initialImage));
    }
  }, [initialImage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Veuillez sélectionner une image valide');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('L\'image ne doit pas dépasser 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setImageError(null);
    };
    reader.onerror = () => {
      setImageError('Erreur lors de la lecture du fichier');
      setImagePreview('/images/placeholder-food.jpg');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview('/images/placeholder-food.jpg');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageError = () => {
    console.warn('Erreur de chargement de l\'image, utilisation de l\'image par défaut');
    setImagePreview('/images/placeholder-food.jpg');
  };

  const getImageFile = async (): Promise<File | null> => {
    // Si un fichier est sélectionné dans l'input
    if (fileInputRef.current?.files?.[0]) {
      return fileInputRef.current.files[0];
    }
    
    // Si une image en base64 est disponible
    if (imagePreview && imagePreview.startsWith('data:')) {
      try {
        // Utiliser la fonction base64ToFile du module imageHelpers
        return await base64ToFile(imagePreview, "menu-image.jpg");
      } catch (error) {
        console.error('Erreur lors de la conversion de l\'image:', error);
        toast.error('Erreur lors de la conversion de l\'image');
        return null;
      }
    }
    
    return null;
  };

  return {
    fileInputRef,
    imagePreview,
    imageError,
    setImageError,
    handleImageUpload,
    handleRemoveImage,
    handleImageError,
    getImageFile
  };
};
