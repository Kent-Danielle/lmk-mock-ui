import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function api(method, path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || `API error ${res.status}`)
  return json.data
}

function App() {
  const [screen, setScreen] = useState('landing')
  const [prevScreen, setPrevScreen] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [participantId, setParticipantId] = useState(null)
  const [isHost, setIsHost] = useState(false)
  const [joinLink, setJoinLink] = useState('')
  const [sessionInfo, setSessionInfo] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [sseStatus, setSseStatus] = useState('disconnected')
  const sseRef = useRef(null)
  const navHistory = useRef(['landing'])

  const goTo = useCallback((id) => {
    setPrevScreen(screen)
    setScreen(id)
    setError(null)
    navHistory.current.push(id)
    setTimeout(() => setPrevScreen(null), 500)
  }, [screen])

  const goBack = useCallback(() => {
    if (navHistory.current.length <= 1) return
    navHistory.current.pop()
    const prev = navHistory.current[navHistory.current.length - 1]
    setPrevScreen(screen)
    setScreen(prev)
    setError(null)
    setTimeout(() => setPrevScreen(null), 500)
  }, [screen])

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1500)
  }, [])

  // SSE connection
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

  // URL hash parsing for join links
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#join/')) {
      const linkId = hash.slice(6)
      if (linkId) {
        setScreen('join')
        document.getElementById('join-link-id')?.setAttribute('value', linkId)
      }
    }
  }, [])

  const screenClass = (id) => {
    if (id === screen) return 'screen active'
    if (id === prevScreen) return 'screen exit-left'
    return 'screen'
  }

  // ============ CREATE SESSION ============
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

  // ============ JOIN SESSION ============
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

  // ============ REJOIN SESSION ============
  const handleRejoin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.target)
    const linkId = form.get('link_id').trim()
    const pid = form.get('participant_id').trim()
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

  const routeToState = async (sid, state) => {
    if (state === 'ANSWERING') {
      const qs = await api('GET', `/sessions/${sid}/questions`)
      setQuestions(qs)
      setCurrentQ(0)
      setAnswers({})
      goTo('questions')
    } else if (state === 'GENERATING') {
      goTo('generating')
    } else if (state === 'RESULTS') {
      const data = await api('GET', `/sessions/${sid}/results`)
      setResults(data)
      goTo('results')
    }
  }

  // ============ CONTINUE TO QUESTIONS (host) ============
  const handleContinueToQuestions = async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = await api('GET', `/sessions/${sessionId}/questions`)
      setQuestions(qs)
      setCurrentQ(0)
      setAnswers({})
      goTo('questions')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ============ SUBMIT ANSWERS ============
  const handleSubmitAnswers = async () => {
    setLoading(true)
    setError(null)
    try {
      const answerList = Object.entries(answers).map(([question_id, value]) => ({
        question_id,
        value,
      }))
      await api('POST', `/sessions/${sessionId}/answers`, {
        participant_id: participantId,
        answers: answerList,
      })
      goTo('waiting')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ============ ADVANCE SESSION (host) ============
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

  // ============ RESET ============
  const handleReset = () => {
    if (sseRef.current) sseRef.current.close()
    setScreen('landing')
    setPrevScreen(null)
    setSessionId(null)
    setParticipantId(null)
    setIsHost(false)
    setJoinLink('')
    setSessionInfo(null)
    setQuestions([])
    setCurrentQ(0)
    setAnswers({})
    setResults(null)
    setError(null)
    setSseStatus('disconnected')
    navHistory.current = ['landing']
  }

  // ============ QUESTION ANSWER HANDLERS ============
  const updateAnswer = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  const toggleMultiSelect = (qId, optionId) => {
    setAnswers((prev) => {
      const current = prev[qId] || []
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      return { ...prev, [qId]: next }
    })
  }

  const currentQuestion = questions[currentQ]
  const isLastQuestion = currentQ === questions.length - 1

  const optionColors = [
    'var(--color-primary)',
    'var(--color-secondary)',
    'var(--color-tertiary)',
    'var(--color-accent)',
    'rgba(0,0,0,0.06)',
  ]

  return (
    <div className="app">
      {/* SSE indicator */}
      {sessionId && (
        <div className="sse-indicator">
          <span className={`sse-dot ${sseStatus}`} />
          SSE: {sseStatus}
        </div>
      )}

      {/* Toast */}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>

      {/* ========== LANDING ========== */}
      <div className={screenClass('landing')}>
        <div className="screen-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div className="wordmark mb-md" style={{ fontSize: 72, color: 'var(--color-bg-dark)' }}>lmk</div>
          <p className="t-subhead mb-xl">
            <span style={{ fontWeight: 300, opacity: 0.6 }}>from</span> let me know,{' '}
            <span style={{ fontWeight: 300, opacity: 0.6 }}>to</span>{' '}
            <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>let's go</span>
          </p>
          <p className="t-body mb-xl text-muted" style={{ maxWidth: 320, margin: '0 auto' }}>
            Mock UI for testing the lmk backend. Create or join a session to get started.
          </p>
          <div className="hero-visual mb-2xl">
            <div className="hero-circle" style={{ background: 'var(--color-primary)', width: 28, height: 28 }} />
            <div className="hero-circle" style={{ background: 'var(--color-secondary)', width: 20, height: 20, animationDelay: '0.3s' }} />
            <div className="hero-circle" style={{ background: 'var(--color-tertiary)', width: 32, height: 32, animationDelay: '0.6s' }} />
            <div className="hero-circle" style={{ background: 'var(--color-accent)', width: 18, height: 18, animationDelay: '0.9s' }} />
            <div className="hero-circle" style={{ background: 'var(--color-primary)', width: 14, height: 14, opacity: 0.5, animationDelay: '1.2s' }} />
          </div>
          <div className="btn-stack" style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
            <button className="btn btn-primary" onClick={() => goTo('create')}>Host a Session</button>
            <button className="btn btn-outline" onClick={() => goTo('join')}>Join a Session</button>
            <button className="btn btn-ghost" onClick={() => goTo('rejoin')}>Rejoin Session</button>
          </div>
        </div>
      </div>

      {/* ========== CREATE SESSION ========== */}
      <div className={screenClass('create')}>
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
      </div>

      {/* ========== SESSION CREATED ========== */}
      <div className={screenClass('session-created')}>
        <div className="screen-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div className="wordmark mb-2xl" style={{ fontSize: 20, alignSelf: 'flex-start' }}>lmk</div>
          <h1 className="t-heading mb-lg" style={{ fontSize: 36 }}>you're in.</h1>
          <div className="link-pill mb-lg">{joinLink}</div>
          {error && <div className="error-msg">{error}</div>}
          <div className="btn-stack mb-xl">
            <button className="btn btn-primary" onClick={() => {
              navigator.clipboard.writeText(joinLink)
              showToast('Link copied!')
            }}>Copy Link</button>
            <button className="btn btn-outline" onClick={() => {
              const frontendUrl = `${window.location.origin}${window.location.pathname}#join/${joinLink.split('/').pop()}`
              navigator.clipboard.writeText(frontendUrl)
              showToast('Frontend join URL copied!')
            }}>Copy Join URL</button>
          </div>
          <p className="t-body text-muted mb-sm">Share this with your group</p>
          <p className="t-caption text-faint mb-xl">
            Session ID: {sessionId}<br />
            Participant ID: {participantId}
          </p>
          <button className="btn-ghost" onClick={handleContinueToQuestions} disabled={loading} style={{ fontSize: 16 }}>
            {loading ? 'Loading questions...' : 'Continue to questions →'}
          </button>
        </div>
      </div>

      {/* ========== JOIN SESSION ========== */}
      <div className={screenClass('join')}>
        <div className="nav-header">
          <button className="nav-back" onClick={goBack}>←</button>
          <span className="wordmark" style={{ fontSize: 20 }}>lmk</span>
        </div>
        <div className="screen-content" style={{ paddingTop: 16 }}>
          <h1 className="t-heading mb-xl">Join a session</h1>
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
      </div>

      {/* ========== REJOIN SESSION ========== */}
      <div className={screenClass('rejoin')}>
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
      </div>

      {/* ========== QUESTIONS ========== */}
      <div className={screenClass('questions')}>
        <div className="screen-content" style={{ paddingTop: 48 }}>
          {questions.length > 0 && (
            <>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
              </div>
              <p className="t-label text-center text-muted mb-sm">
                Question {currentQ + 1} of {questions.length}
              </p>
              <h2 className="t-heading mb-xl">{currentQuestion.text}</h2>

              {/* MULTISELECT */}
              {currentQuestion.mechanic === 'MULTISELECT' && (
                <div className="multi-options mb-xl">
                  {currentQuestion.options.map((opt, i) => (
                    <div
                      key={opt.id}
                      className={`multi-option ${(answers[currentQuestion.id] || []).includes(opt.id) ? 'selected' : ''}`}
                      style={{
                        background: optionColors[i % optionColors.length],
                        color: i >= 3 ? 'var(--color-text)' : '#fff',
                      }}
                      onClick={() => toggleMultiSelect(currentQuestion.id, opt.id)}
                    >
                      <div className="multi-check" style={i >= 3 ? { borderColor: 'rgba(0,0,0,0.2)' } : {}} />
                      <span>{opt.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* SLIDER */}
              {currentQuestion.mechanic === 'SLIDER' && (
                <div className="slider-container">
                  <div className="slider-value">{answers[currentQuestion.id] ?? 50}</div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={answers[currentQuestion.id] ?? 50}
                    style={{ '--slider-pct': `${answers[currentQuestion.id] ?? 50}%` }}
                    onChange={(e) => updateAnswer(currentQuestion.id, parseInt(e.target.value))}
                  />
                </div>
              )}

              {/* TEXT */}
              {currentQuestion.mechanic === 'TEXT' && (
                <textarea
                  className="textarea mb-xl"
                  placeholder="Type your answer..."
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                />
              )}

              {error && <div className="error-msg">{error}</div>}

              <div className="mt-auto">
                {!isLastQuestion ? (
                  <button className="btn btn-primary" onClick={() => setCurrentQ((q) => q + 1)}>
                    Next
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleSubmitAnswers} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Answers'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========== WAITING ========== */}
      <div className={screenClass('waiting')}>
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
      </div>

      {/* ========== GENERATING ========== */}
      <div className={screenClass('generating')}>
        <div className="screen loading-screen" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="screen-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <div className="wordmark mb-2xl" style={{ fontSize: 20, color: '#FAF8F5' }}>lmk</div>
            <div className="loading-dots mb-xl">
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
            <p className="t-subhead" style={{ color: 'rgba(250,248,245,0.7)' }}>
              Generating results...
            </p>
          </div>
        </div>
      </div>

      {/* ========== RESULTS ========== */}
      <div className={screenClass('results')}>
        <div className="screen-content" style={{ paddingTop: 48 }}>
          <div className="wordmark mb-lg" style={{ fontSize: 20 }}>lmk</div>
          <h1 className="t-heading mb-lg">Results</h1>
          {results && (
            <pre className="json-display mb-xl">
              {JSON.stringify(results, null, 2)}
            </pre>
          )}
          <div className="mt-auto btn-stack">
            <button className="btn btn-primary" onClick={handleReset}>Start New Session</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
