import { api } from '../api'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function RejoinScreen({ goBack, error, setError, loading, setLoading, setSessionInfo, setSessionId, setParticipantId, setIsHost, routeToState }) {
  const handleRejoin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.target)
    const linkId = form.get('link_id').trim()
    const pid = form.get('participant_id').trim()
    if (!UUID_RE.test(pid)) {
      setError('Participant ID must be a valid UUID (e.g. 5607a507-18a3-4d64-9862-bff1d2bc9395)')
      setLoading(false)
      return
    }
    try {
      const info = await api('GET', `/sessions/link/${linkId}`)
      setSessionInfo(info)
      setSessionId(info.id)
      setParticipantId(pid)
      setIsHost(false)
      routeToState(info.id, info.state)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="nav-header">
        <button className="nav-back" onClick={goBack}>←</button>
        <span className="wordmark" style={{ fontSize: 20 }}>lmk</span>
      </div>
      <div className="screen-content" style={{ paddingTop: 16 }}>
        <h1 className="t-heading mb-xl">Rejoin session</h1>
        <p className="t-body text-muted mb-lg">Enter your link ID and participant ID to rejoin</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleRejoin}>
          <div className="form-group">
            <label className="form-label">Session Link ID</label>
            <input className="input" name="link_id" placeholder="e.g. a7x3k9" required />
          </div>
          <div className="form-group">
            <label className="form-label">Your Participant ID</label>
            <input className="input" name="participant_id" placeholder="Your participant UUID" required />
          </div>
          <div className="mt-auto">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Rejoining...' : 'Rejoin'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
