import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

 
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
 
  label?: string;
 
  error?: string;
 
  icon?: LucideIcon;
 
  containerClassName?: string;
}
 
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon: Icon, containerClassName, ...props }, ref) => {
    return (
      <div className={cn('space-y-1', containerClassName)}>
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-dark"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-dark/60">
              <Icon size={18} />
            </div>
          )}
          <input
            className={cn(
              'w-full rounded-md border border-secondary bg-white px-3 py-2',
              'text-gray-700 dark:text-gray-700',
              'placeholder:text-gray-800 dark:placeholder:text-gray-700',
              'focus:border-orange-400 focus:outline-none focus:ring-orange-400',
              Icon && 'pl-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 