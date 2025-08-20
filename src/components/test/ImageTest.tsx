"use client"

import React from 'react'
import Image from 'next/image'
import { createSafeImageProps } from '@/utils/imageHelpers'

const ImageTest = () => {
  // Test avec différents types d'URLs invalides qui causaient l'erreur
  const testUrls = [
    null,
    undefined,
    '',
    'image-1748482035238.jpg', // URL relative invalide
    'invalid-url',
    'https://example.com/valid-image.jpg', // URL valide
    '/images/placeholder.svg' // URL locale valide
  ]

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Test des Images Sécurisées</h2>
      <div className="grid grid-cols-2 gap-4">
        {testUrls.map((url, index) => {
          const imageProps = createSafeImageProps(url, `Test image ${index}`)
          
          return (
            <div key={index} className="border p-2 rounded">
              <p className="text-sm mb-2">
                <strong>URL:</strong> {url || 'null/undefined'}
              </p>
              <p className="text-sm mb-2">
                <strong>Valide:</strong> {imageProps.isValid ? 'Oui' : 'Non'}
              </p>
              <p className="text-sm mb-2">
                <strong>Src utilisée:</strong> {imageProps.src}
              </p>
              <div className="w-20 h-20 border">
                <Image
                  src={imageProps.src}
                  alt={imageProps.alt}
                  width={80}
                  height={80}
                  className="object-contain"
                  onError={imageProps.onError}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ImageTest
