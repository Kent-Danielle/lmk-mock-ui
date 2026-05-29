export default function ResultsScreen({ results, onReset }) {
  return (
    <div className="screen-content" style={{ paddingTop: 48 }}>
      <div className="wordmark mb-lg" style={{ fontSize: 20 }}>lmk</div>
      <h1 className="t-heading mb-lg">Results</h1>
      {results && (
        <pre className="json-display mb-xl">
          {JSON.stringify(results, null, 2)}
        </pre>
      )}
      <div className="mt-auto btn-stack">
        <button className="btn btn-primary" onClick={onReset}>Start New Session</button>
      </div>
    </div>
  )
}
