import Link from 'next/link'

export default function NotFound() {
  return (
    <main className='stack card'>
      <h1>District not found</h1>
      <p>The requested district could not be found in the current snapshot.</p>
      <Link href='/'>Return home</Link>
    </main>
  )
}
