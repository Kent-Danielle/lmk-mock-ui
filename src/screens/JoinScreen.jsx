import { api } from '../api'

export default function JoinScreen({ goBack, error, setError, loading, setLoading, setSessionInfo, setSessionId, setParticipantId, setIsHost, routeToState }) {
  const handleJoin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.target)
    const linkId = form.get('link_id').trim()
    const displayName = form.get('display_name').trim()
    try {
      const info = await api('GET', `/sessions/link/${linkId}`)
      setSessionInfo(info)
      const joinData = await api('POST', `/sessions/${info.id}/participants`, {
        display_name: displayName,
      })
      setSessionId(info.id)
      setParticipantId(joinData.participant_id)
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
        <h1 className="t-heading mb-sm">Join a session</h1>
        <p className="t-body text-muted mb-xl">
          New here? Pick any name. Coming back? Use the same name you joined with.
        </p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleJoin}>
          <div className="form-group">
            <label className="form-label">Session Link ID</label>
            <input className="input" name="link_id" id="join-link-id"
              placeholder="e.g. a7x3k9" required
              defaultValue={window.location.hash.startsWith('#join/') ? window.location.hash.slice(6) : ''} />
          </div>
          <div className="form-group">
            <label className="form-label">Your name</label>
            <input className="input" name="display_name" placeholder="e.g. Jordan" required />
          </div>
          <div className="mt-auto">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Joining...' : 'Join Session'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
