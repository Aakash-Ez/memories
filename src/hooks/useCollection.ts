import { useEffect, useState } from 'react'
import type { DocumentData, Query } from 'firebase/firestore'
import { onSnapshot } from 'firebase/firestore'

type CollectionState<T> = {
  data: T[]
  loading: boolean
  error: string | null
}

export function useCollection<T>(queryRef: Query<DocumentData> | null) {
  const [state, setState] = useState<CollectionState<T>>({
    data: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!queryRef) {
      setState({
        data: [],
        loading: false,
        error: null,
      })
      return undefined
    }

    const unsubscribe = onSnapshot(
      queryRef,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<T, 'id'>),
        })) as T[]

        setState({
          data: items,
          loading: false,
          error: null,
        })
      },
      (err) => {
        setState({
          data: [],
          loading: false,
          error: err.message,
        })
      }
    )

    return () => unsubscribe()
  }, [queryRef])

  return state
}
