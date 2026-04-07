'use client'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <main className='stack card'>
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <button type='button' onClick={reset}>
        Try again
      </button>
    </main>
  )
}
