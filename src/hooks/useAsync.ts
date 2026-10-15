import { useCallback, useState } from 'react'
import { getErrorMessage } from '../lib/api'

export function useAsync<T, TArgs extends unknown[] = []>(operation: (...args: TArgs) => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const execute = useCallback(async (...args: TArgs) => {
    setLoading(true)
    setError(null)
    try {
      const result = await operation(...args)
      setData(result)
      return result
    } catch (cause) {
      setError(getErrorMessage(cause))
      throw cause
    } finally {
      setLoading(false)
    }
  }, [operation])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, error, loading, execute, reset }
}

