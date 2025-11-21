import localFont from 'next/font/local'

export const urbanist = localFont({
  src: [
    {
      path: '../../public/fonts/Urbanist-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Urbanist-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Urbanist-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Urbanist-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Urbanist-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Urbanist-ExtraBold.ttf',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Urbanist-Black.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-urbanist',
  display: 'swap',
})

export const blocklynCondensed = localFont({
  src: [
    {
      path: '../../public/fonts/Blocklyn-Condensed.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-blocklyn-condensed',
  display: 'swap',
})

export const blocklynGrunge = localFont({
  src: [
    {
      path: '../../public/fonts/Blocklyn-Grunge.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-blocklyn-grunge',
  display: 'swap',
})
