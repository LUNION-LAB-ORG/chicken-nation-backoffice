 

import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { SecureError, sanitizeErrorMessage } from '@/utils/errorHandling';

export interface ErrorDisplayProps {
  error: SecureError | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'inline' | 'modal' | 'toast';
  className?: string;
  showRetry?: boolean;
  showDismiss?: boolean;
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  variant = 'inline',
  className = '',
  showRetry = true,
  showDismiss = true
}: ErrorDisplayProps) {
  if (!error) return null;

  // ✅ SÉCURITÉ : Sanitisation du message d'erreur
  const errorMessage = typeof error === 'string' 
    ? sanitizeErrorMessage(error)
    : error.userMessage || 'Une erreur est survenue';

  const baseClasses = {
    inline: 'bg-red-50 border border-red-200 rounded-lg p-4',
    modal: 'bg-white border border-red-200 rounded-xl p-6 shadow-lg',
    toast: 'bg-red-500 text-white rounded-lg p-4 shadow-lg'
  };

  const textClasses = {
    inline: 'text-red-800',
    modal: 'text-red-800',
    toast: 'text-white'
  };

  const iconClasses = {
    inline: 'text-red-500',
    modal: 'text-red-500',
    toast: 'text-white'
  };

  return (
    <div className={`${baseClasses[variant]} ${className}`}>
      <div className="flex items-start space-x-3">
        {/* Icône d'erreur */}
        <AlertTriangle 
          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconClasses[variant]}`}
          aria-hidden="true"
        />
        
        <div className="flex-1 min-w-0">
          {/* Message d'erreur */}
          <p className={`text-sm font-medium ${textClasses[variant]}`}>
            {errorMessage}
          </p>
          
          {/* Code d'erreur (uniquement en développement) */}
          {process.env.NODE_ENV === 'development' && typeof error === 'object' && error.code && (
            <p className={`text-xs mt-1 opacity-75 ${textClasses[variant]}`}>
              Code: {error.code}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Bouton Réessayer */}
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className={`
                inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md
                transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${variant === 'toast' 
                  ? 'bg-white/20 hover:bg-white/30 text-white focus:ring-white' 
                  : 'bg-red-100 hover:bg-red-200 text-red-800 focus:ring-red-500'
                }
              `}
              type="button"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Réessayer
            </button>
          )}

          {/* Bouton Fermer */}
          {showDismiss && onDismiss && (
            <button
              onClick={onDismiss}
              className={`
                p-1 rounded-md transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${variant === 'toast'
                  ? 'hover:bg-white/20 text-white focus:ring-white'
                  : 'hover:bg-red-100 text-red-500 focus:ring-red-500'
                }
              `}
              type="button"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Composant d'erreur pour les formulaires
 */
export interface FormErrorProps {
  errors: string[];
  onClear?: () => void;
  className?: string;
}

export function FormError({ errors, onClear, className = '' }: FormErrorProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            {errors.length === 1 ? 'Erreur à corriger :' : 'Erreurs à corriger :'}
          </h4>
          
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{sanitizeErrorMessage(error)}</span>
              </li>
            ))}
          </ul>
        </div>

        {onClear && (
          <button
            onClick={onClear}
            className="p-1 hover:bg-red-100 rounded-md transition-colors"
            type="button"
            aria-label="Effacer les erreurs"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Composant d'erreur pour les pages entières
 */
export interface PageErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
}

export function PageError({
  title = 'Une erreur est survenue',
  message = 'Nous rencontrons des difficultés techniques. Veuillez réessayer.',
  onRetry,
  onGoHome,
  className = ''
}: PageErrorProps) {
  return (
    <div className={`min-h-[400px] flex items-center justify-center ${className}`}>
      <div className="text-center max-w-md mx-auto p-6">
        {/* Icône */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        {/* Titre */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {sanitizeErrorMessage(title)}
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {sanitizeErrorMessage(message)}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              type="button"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </button>
          )}

          {onGoHome && (
            <button
              onClick={onGoHome}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              type="button"
            >
              Retour à l&apos;accueil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook pour gérer l'affichage des erreurs
 */
export function useErrorDisplay() {
  const [error, setError] = React.useState<SecureError | string | null>(null);

  const showError = React.useCallback((error: SecureError | string) => {
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const ErrorComponent = React.useCallback((props: Omit<ErrorDisplayProps, 'error'>) => (
    <ErrorDisplay {...props} error={error} onDismiss={clearError} />
  ), [error, clearError]);

  return {
    error,
    showError,
    clearError,
    ErrorComponent
  };
}
