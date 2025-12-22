import React from "react";
import Image from "next/image";

export const getSafeImageSrc = (
  imageUrl: string | undefined | null
): string => {
  if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
    return "/images/food2.png";
  }

  const cleanUrl = imageUrl.trim();

  if (
    cleanUrl.startsWith("/") ||
    cleanUrl.startsWith("http://") ||
    cleanUrl.startsWith("https://")
  ) {
    return cleanUrl;
  }

  return "/images/food2.png";
};

interface SafeImageProps {
  src: string | undefined | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  onError,
}) => {
  const safeSrc = getSafeImageSrc(src);

  return (
    <Image
      src={safeSrc}
      alt={alt || "Image"}
      width={width}
      height={height}
      className={className}
      onError={(e) => {
        console.warn("Erreur de chargement d'image:");
        (e.target as HTMLImageElement).src = "/images/food2.png";
        if (onError) onError(e);
      }}
    />
  );
};

export default SafeImage;
