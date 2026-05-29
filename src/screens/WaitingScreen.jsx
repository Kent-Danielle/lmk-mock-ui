import { api } from '../api'

export default function WaitingScreen({ isHost, sessionId, participantId, error, setError, loading, setLoading }) {
  const handleAdvance = async () => {
    setLoading(true)
    setError(null)
    try {
      await api('POST', `/sessions/${sessionId}/advance`, {
        participant_id: participantId,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
      <div className="wordmark mb-2xl" style={{ fontSize: 20 }}>lmk</div>
      <div className="loading-dots mb-lg" style={{ opacity: 0.5 }}>
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
      <h2 className="t-heading mb-lg">
        {isHost ? 'Everyone submitted?' : 'Waiting for host...'}
      </h2>
      <p className="t-body text-muted mb-xl">
        {isHost
          ? 'When everyone is done answering, advance the session.'
          : 'The host will advance the session when everyone is ready.'}
      </p>
      {error && <div className="error-msg">{error}</div>}
      {isHost && (
        <button className="btn btn-primary" onClick={handleAdvance} disabled={loading} style={{ maxWidth: 300, margin: '0 auto' }}>
          {loading ? 'Advancing...' : 'Advance Session'}
        </button>
      )}
      <p className="t-caption text-faint" style={{ marginTop: 'auto' }}>
        Session: {sessionId}<br />
        You: {participantId} {isHost ? '(host)' : '(participant)'}
      </p>
    </div>
  )
}
