import { Space_Grotesk, Space_Mono } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

export const metadata = {
  title: 'Sonar',
  description: 'Sonar monitors your sBTC lending positions on Stacks and alerts you before liquidation — with an explanation of why your health is dropping, not just that it is.',
  icons: {
    icon: '/fav-logo.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.className} ${spaceMono.className}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
