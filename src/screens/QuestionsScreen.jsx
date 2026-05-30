import { api } from '../api'

const optionColors = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-tertiary)',
  'var(--color-accent)',
  'rgba(0,0,0,0.06)',
]

export default function QuestionsScreen({
  questions, currentQ, setCurrentQ, answers, setAnswers,
  sessionId, participantId, goTo,
  error, setError, loading, setLoading,
}) {
  if (questions.length === 0) return null

  const currentQuestion = questions[currentQ]
  const isLastQuestion = currentQ === questions.length - 1

  const updateAnswer = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  const toggleMultiSelect = (qId, optionValue) => {
    setAnswers((prev) => {
      const current = prev[qId] || []
      const next = current.includes(optionValue)
        ? current.filter((id) => id !== optionValue)
        : [...current, optionValue]
      return { ...prev, [qId]: next }
    })
  }

  // Serialize answers to the shape the backend expects:
  //   TEXT        -> string
  //   SWIPE       -> string
  //   MULTISELECT -> array of option ids
  //   SLIDER      -> { value: number }
  const serializeForBackend = (question, raw) => {
    if (question.mechanic === 'SLIDER') {
      return { value: typeof raw === 'number' ? raw : 50 }
    }
    if (question.mechanic === 'MULTISELECT') {
      return Array.isArray(raw) ? raw : []
    }
    return raw ?? ''
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const answerList = questions.map((q) => ({
        question_id: q.id,
        value: serializeForBackend(q, answers[q.id]),
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

  return (
    <div className="screen-content" style={{ paddingTop: 48 }}>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="t-label text-center text-muted mb-sm">
        Question {currentQ + 1} of {questions.length}
      </p>
      <h2 className="t-heading mb-xl">{currentQuestion.text}</h2>

      {currentQuestion.mechanic === 'MULTISELECT' && (
        <div className="multi-options mb-xl">
          {currentQuestion.options.map((opt, i) => (
            <div
              key={opt.id}
              className={`multi-option ${(answers[currentQuestion.id] || []).includes(opt.label) ? 'selected' : ''}`}
              style={{
                background: optionColors[i % optionColors.length],
                color: i >= 3 ? 'var(--color-text)' : '#fff',
              }}
              onClick={() => toggleMultiSelect(currentQuestion.id, opt.label)}
            >
              <div className="multi-check" style={i >= 3 ? { borderColor: 'rgba(0,0,0,0.2)' } : {}} />
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      )}

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
          <div className="slider-labels">
            <span>{currentQuestion.options[0]?.label || 0}</span>
            <span>{currentQuestion.options[1]?.label || 100}</span>
          </div>
        </div>
      )}

      {currentQuestion.mechanic === 'TEXT' && (
        <textarea
          className="textarea mb-xl"
          placeholder="Type your answer..."
          value={answers[currentQuestion.id] || ''}
          onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
        />
      )}

      {currentQuestion.mechanic === 'SWIPE' && (
        <div className="multi-options mb-xl">
          <textarea
            className="textarea mb-xl"
            placeholder={`Type your answer ${currentQuestion.options[0].label} or ${currentQuestion.options[1].label}...`}
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
          />
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      <div className="mt-auto">
        {!isLastQuestion ? (
          <button className="btn btn-primary" onClick={() => setCurrentQ((q) => q + 1)}>
            Next
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Answers'}
          </button>
        )}
      </div>
    </div>
  )
}
