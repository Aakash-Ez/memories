import { useEffect, useState } from 'react'
import type { DocumentData, DocumentReference } from 'firebase/firestore'
import { onSnapshot } from 'firebase/firestore'

type DocumentState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

export function useDocument<T>(docRef: DocumentReference<DocumentData> | null) {
  const [state, setState] = useState<DocumentState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!docRef) {
      setState({ data: null, loading: false, error: null })
      return
    }

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setState({ data: null, loading: false, error: null })
          return
        }

        setState({
          data: { id: snapshot.id, ...(snapshot.data() as Omit<T, 'id'>) } as T,
          loading: false,
          error: null,
        })
      },
      (err) => {
        setState({ data: null, loading: false, error: err.message })
      }
    )

    return () => unsubscribe()
  }, [docRef])

  return state
}
