import { useEffect, useRef } from 'react'
import { api, API_URL } from '../api'

export function useSessionStream({ sessionId, setSseStatus, setResults, setError, goTo }) {
  const sseRef = useRef(null)

  useEffect(() => {
    if (!sessionId) return

    const evtSource = new EventSource(`${API_URL}/sessions/${sessionId}/stream`)
    sseRef.current = evtSource

    evtSource.addEventListener('open', () => setSseStatus('connected'))
    evtSource.addEventListener('state_change', (e) => {
      const { state } = JSON.parse(e.data)
      setSseStatus('connected')

      if (state === 'GENERATING') {
        goTo('generating')
      } else if (state === 'RESULTS') {
        api('GET', `/sessions/${sessionId}/results`)
          .then((data) => {
            setResults(data)
            goTo('results')
          })
          .catch((err) => setError(err.message))
      }
    })
    evtSource.addEventListener('error', () => setSseStatus('error'))

    return () => {
      evtSource.close()
      sseRef.current = null
      setSseStatus('disconnected')
    }
  }, [sessionId])

  return sseRef
}
