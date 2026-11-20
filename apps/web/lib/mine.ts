// Which tags this browser added, kept in the browser so "No longer there" is offered only where the server will allow
// it. The server decides by the visitor's cookie; this only decides what to show. Storage can be empty or throw, so
// every use is wrapped, and a browser that has lost its list just doesn't see the button.
const KEY = 'my-tags'
const MAX = 200

function read(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

/** Remembers that this browser added the tag. */
export function rememberMine(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...read().filter((other) => other !== id), id].slice(-MAX)))
  } catch {}
}

/** Calls back when another tab changes the list, for useSyncExternalStore. */
export function subscribeToStorage(onChange: () => void) {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

/** Whether this browser added the tag. */
export function isMine(id: string) {
  return read().includes(id)
}
