import Image from 'next/image';
import { type ReactNode } from 'react';

interface ProductItemProps {
  name: string;
  price: string;
  image: string;
  progress: number;
}

interface CircularProgressProps {
  value: number;
}

function CircularProgress({ value }: CircularProgressProps): ReactNode {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r={radius}
        fill="none"
        stroke="#FF6B35"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
};

interface ProductItemProps {
  name: string;
  price: string;
  image: string;
  progress: number;
}

function ProductItem({ name, price, image, progress }: ProductItemProps): ReactNode {
  return (
    <div className="product-item">
      <Image width={44} height={44} src={image} alt={name} className="product-image" />
      <div className="product-info">
        <div className="product-name">{name}</div>
        <div className="product-price">{price}</div>
      </div>
      <CircularProgress value={progress} />
    </div>
  );
};

export default ProductItem;