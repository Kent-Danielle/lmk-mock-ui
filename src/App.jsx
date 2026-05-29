import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import { api } from './api'
import { useSessionStream } from './hooks/useSessionStream'
import LandingScreen from './screens/LandingScreen'
import CreateScreen from './screens/CreateScreen'
import SessionCreatedScreen from './screens/SessionCreatedScreen'
import JoinScreen from './screens/JoinScreen'
import RejoinScreen from './screens/RejoinScreen'
import QuestionsScreen from './screens/QuestionsScreen'
import WaitingScreen from './screens/WaitingScreen'
import GeneratingScreen from './screens/GeneratingScreen'
import ResultsScreen from './screens/ResultsScreen'

function App() {
  const [screen, setScreen] = useState('landing')
  const [prevScreen, setPrevScreen] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [participantId, setParticipantId] = useState(null)
  const [isHost, setIsHost] = useState(false)
  const [joinLink, setJoinLink] = useState('')
  const [, setSessionInfo] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [sseStatus, setSseStatus] = useState('disconnected')
  const navHistory = useRef(['landing'])

  const goTo = useCallback((id) => {
    setPrevScreen((p) => (p === id ? p : screen))
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

  const sseRef = useSessionStream({ sessionId, setSseStatus, setResults, setError, goTo })

  // URL hash → join screen
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#join/') && hash.slice(6)) {
      setScreen('join')
    }
  }, [])

  const screenClass = (id) => {
    if (id === screen) return 'screen active'
    if (id === prevScreen) return 'screen exit-left'
    return 'screen'
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

  return (
    <div className="app">
      {sessionId && (
        <div className="sse-indicator">
          <span className={`sse-dot ${sseStatus}`} />
          SSE: {sseStatus}
        </div>
      )}

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>

      <div className={screenClass('landing')}>
        <LandingScreen goTo={goTo} />
      </div>

      <div className={screenClass('create')}>
        <CreateScreen
          goBack={goBack} goTo={goTo}
          error={error} setError={setError}
          loading={loading} setLoading={setLoading}
          setSessionId={setSessionId} setParticipantId={setParticipantId}
          setJoinLink={setJoinLink} setIsHost={setIsHost}
        />
      </div>

      <div className={screenClass('session-created')}>
        <SessionCreatedScreen
          joinLink={joinLink} sessionId={sessionId} participantId={participantId}
          loading={loading} error={error} showToast={showToast}
          onContinueToQuestions={handleContinueToQuestions}
        />
      </div>

      <div className={screenClass('join')}>
        <JoinScreen
          goBack={goBack}
          error={error} setError={setError}
          loading={loading} setLoading={setLoading}
          setSessionInfo={setSessionInfo} setSessionId={setSessionId}
          setParticipantId={setParticipantId} setIsHost={setIsHost}
          routeToState={routeToState}
        />
      </div>

      <div className={screenClass('rejoin')}>
        <RejoinScreen
          goBack={goBack}
          error={error} setError={setError}
          loading={loading} setLoading={setLoading}
          setSessionInfo={setSessionInfo} setSessionId={setSessionId}
          setParticipantId={setParticipantId} setIsHost={setIsHost}
          routeToState={routeToState}
        />
      </div>

      <div className={screenClass('questions')}>
        <QuestionsScreen
          questions={questions} currentQ={currentQ} setCurrentQ={setCurrentQ}
          answers={answers} setAnswers={setAnswers}
          sessionId={sessionId} participantId={participantId} goTo={goTo}
          error={error} setError={setError}
          loading={loading} setLoading={setLoading}
        />
      </div>

      <div className={screenClass('waiting')}>
        <WaitingScreen
          isHost={isHost} sessionId={sessionId} participantId={participantId}
          error={error} setError={setError}
          loading={loading} setLoading={setLoading}
        />
      </div>

      <div className={screenClass('generating')}>
        <GeneratingScreen />
      </div>

      <div className={screenClass('results')}>
        <ResultsScreen results={results} onReset={handleReset} />
      </div>
    </div>
  )
}

export default App
