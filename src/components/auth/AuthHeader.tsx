"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, Menu, X } from 'lucide-react';
import Image from 'next/image';
 
const AuthHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-[#F17922] w-full text-white py-2 sm:py-3 md:py-4 shadow-md relative">
      <div className="container mx-auto px-2 sm:px-3 md:px-4">
        <div className="flex items-center justify-between">
          {/* Logo à gauche */}
          <div className="flex-shrink-0">
            <Link href="/" className="block">
              <Image 
                src="/icons/logo.png" 
                alt="Logo Chicken Nation" 
                width={300} 
                height={120}  
                className="h-6 w-auto sm:h-8 md:h-10 lg:h-12 xl:h-14"
              />
            </Link>
          </div>

          {/* Partie droite avec navigation et actions */}
          <div className="flex items-center">
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 xl:space-x-8 mr-4 lg:mr-6 xl:mr-8">
              <Link href="/" className="text-white text-sm md:text-base lg:text-lg font-light hover:underline block py-1 md:py-2">
                Accueil
              </Link>
              <Link href="/" className="text-white text-sm md:text-base lg:text-lg font-light hover:underline block py-1 md:py-2">
                Histoire
              </Link>
              <Link href="/" className="text-white text-sm md:text-base lg:text-lg font-light hover:underline block py-1 md:py-2">
                Nos restaurants
              </Link>
              <Link href="/" className="text-white text-sm md:text-base lg:text-lg font-light hover:underline block py-1 md:py-2">
                Franchise
              </Link>
            </nav>

            {/* Actions (recherche, panier, connexion) */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-5">
              <button className="p-1 sm:p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer" aria-label="Rechercher">
                <Search size={18} className="text-white sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </button>
              <button className="p-1 sm:p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer" aria-label="Panier">
                <ShoppingCart size={18} className="text-white sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </button>
              <Link 
                href="/" 
                className="bg-amber-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl text-sm sm:text-base lg:text-lg font-sofia-medium inline-block"
              >
                Connexion
              </Link>
            </div>

            {/* Bouton menu mobile */}
            <button 
              className="md:hidden p-1.5 sm:p-2 hover:bg-white/10 rounded-full cursor-pointer ml-2 sm:ml-3"
              onClick={toggleMenu}
              aria-label="Menu"
            >
              {isMenuOpen ? 
                <X size={18} className="sm:w-5 sm:h-5" /> : 
                <Menu size={18} className="sm:w-5 sm:h-5" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#F17922] md:hidden z-50 shadow-lg">
          <nav className="flex flex-col py-2 sm:py-3 px-4 sm:px-6">
            <Link 
              href="/" 
              className="text-sm font-sofia py-2 sm:py-3 border-b border-white/20 hover:bg-white/10 block"
              onClick={() => setIsMenuOpen(false)}
            >
              Accueil
            </Link>
            <Link 
              href="/histoire" 
              className="text-sm font-sofia py-2 sm:py-3 border-b border-white/20 hover:bg-white/10 block"
              onClick={() => setIsMenuOpen(false)}
            >
              Histoire
            </Link>
            <Link 
              href="/restaurants" 
              className="text-sm font-sofia py-2 sm:py-3 border-b border-white/20 hover:bg-white/10 block"
              onClick={() => setIsMenuOpen(false)}
            >
              Nos restaurants
            </Link>
            <Link 
              href="/franchise" 
              className="text-sm font-sofia py-2 sm:py-3 hover:bg-white/10 block"
              onClick={() => setIsMenuOpen(false)}
            >
              Franchise
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default AuthHeader;
