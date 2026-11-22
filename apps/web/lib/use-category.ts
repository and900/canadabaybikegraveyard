'use client'
import { type Category, DEFAULT_CATEGORY, isCategory } from '@iwb/shared'
import { useSyncExternalStore } from 'react'

const EVENT = 'iwb:category'

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback)
  window.addEventListener(EVENT, callback)
  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener(EVENT, callback)
  }
}

const read = (): Category => {
  const value = new URLSearchParams(window.location.search).get('c')
  return isCategory(value) ? value : DEFAULT_CATEGORY
}

/** The URL for a page of this category: bikes, the default, leave the address as it was. */
export function withCategory(path: string, category: Category) {
  return category === DEFAULT_CATEGORY ? path : `${path}?c=${category}`
}

/**
 * The category the visitor is looking at, kept in the address as ?c= (bikes, the default, leaves it out), so a link
 * or the back button keeps it. Read after load: the server and the first paint are bikes.
 */
export function useCategory(): [Category, (category: Category) => void] {
  const category = useSyncExternalStore(subscribe, read, () => DEFAULT_CATEGORY)
  const set = (next: Category) => {
    const url = new URL(window.location.href)
    if (next === DEFAULT_CATEGORY) url.searchParams.delete('c')
    else url.searchParams.set('c', next)
    window.history.replaceState(null, '', url)
    window.dispatchEvent(new Event(EVENT))
  }
  return [category, set]
}
