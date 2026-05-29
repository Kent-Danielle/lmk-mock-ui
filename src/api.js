const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export { API_URL }

export async function api(method, path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || `API error ${res.status}`)
  return json.data
}
