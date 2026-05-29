import { api } from '../api'

export default function CreateScreen({ goBack, goTo, error, setError, loading, setLoading, setSessionId, setParticipantId, setJoinLink, setIsHost }) {
  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.target)
    try {
      const data = await api('POST', '/sessions/', {
        host_display_name: form.get('host_display_name'),
        topic: form.get('topic'),
        context: form.get('context') || null,
      })
      setSessionId(data.session_id)
      setParticipantId(data.host_participant_id)
      setJoinLink(data.join_link)
      setIsHost(true)
      goTo('session-created')
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
        <h1 className="t-heading mb-sm">Create a session</h1>
        <p className="t-body text-muted mb-xl">Set up a new group decision</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Your name</label>
            <input className="input" name="host_display_name" placeholder="e.g. Alex" required />
          </div>
          <div className="form-group">
            <label className="form-label">Topic</label>
            <input className="input" name="topic" placeholder="What are we deciding?" required />
          </div>
          <div className="form-group">
            <label className="form-label">Context (optional)</label>
            <textarea className="textarea" name="context" placeholder="Any extra context for the AI..." />
          </div>
          <div className="mt-auto">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
