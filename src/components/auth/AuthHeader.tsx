"use client"

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const AuthHeader: React.FC = () => {
  return (
    <header className="bg-[#F17922] w-full text-white py-2 shadow-md relative">
      <div className="container mx-auto px-2 sm:px-3 md:px-4">
        <div className="flex items-center justify-between">
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
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;
