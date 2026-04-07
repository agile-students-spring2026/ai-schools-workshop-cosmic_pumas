import type { Metadata } from 'next'
import Link from 'next/link'
import '@/app/globals.css'
import { CompareProvider } from '@/components/compare-provider'
import { CompareTray } from '@/components/compare-tray'
import { listDistricts } from '@/lib/server/repository'

export const metadata: Metadata = {
  title: 'National School District Explorer',
  description:
    'Transparent school district comparisons with public data and AI-generated district briefs.'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const allDistricts = listDistricts({ sort: 'name' })
  const sampleDistrictId = allDistricts[0]?.id

  return (
    <html lang='en'>
      <body>
        <CompareProvider allDistricts={allDistricts}>
          <div className='shell'>
            <header className='site-header'>
              <div className='site-header__branding'>
                <p className='eyebrow'>National School District Explorer</p>
                <Link className='site-header__title' href='/'>
                  Public education, read with context
                </Link>
              </div>

              <nav aria-label='Primary' className='shell__nav'>
                <Link href='/'>Discover</Link>
                <Link href='/compare'>Compare</Link>
                {sampleDistrictId ? (
                  <Link href={`/districts/${sampleDistrictId}`}>Sample district</Link>
                ) : null}
              </nav>
            </header>

            {children}
            <CompareTray />
          </div>
        </CompareProvider>
      </body>
    </html>
  )
}
