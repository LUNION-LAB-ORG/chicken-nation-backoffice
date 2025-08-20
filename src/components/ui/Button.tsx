import React from 'react';
import { cn } from '@/lib/utils';
 
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 
  variant?: 'primary' | 'secondary' | 'outline';
 
  size?: 'sm' | 'md' | 'lg';
 
  children: React.ReactNode;
 
  className?: string;
 
  isLoading?: boolean;
}

 
const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) => {
 
  const baseStyles = 'font-sofia rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-accent hover:bg-accent/90 text-white focus:ring-accent',
    secondary: 'bg-secondary hover:bg-secondary/90 text-dark focus:ring-secondary',
    outline: 'border border-accent text-accent hover:bg-accent/10 focus:ring-accent',
  };
  
  const sizeStyles = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
  };
  
  const loadingStyles = isLoading ? 'opacity-70 cursor-not-allowed' : '';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        loadingStyles,
        disabledStyles,
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Chargement...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button; 