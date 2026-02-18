"use client"

import { useEffect } from "react"

import type { QueryKey } from "@/lib/data/query-keys"

type InvalidationSubscriber = {
  id: number
  keys: QueryKey[]
  callback: () => void
}

const subscribers = new Map<number, InvalidationSubscriber>()
let nextSubscriberId = 1

function keyPartEquals(left: unknown, right: unknown): boolean {
  return String(left) === String(right)
}

function isPrefix(prefix: QueryKey, full: QueryKey): boolean {
  if (prefix.length > full.length) return false

  for (let index = 0; index < prefix.length; index += 1) {
    if (!keyPartEquals(prefix[index], full[index])) {
      return false
    }
  }

  return true
}

function matchesInvalidation(registered: QueryKey[], incoming: QueryKey[]): boolean {
  return registered.some((registeredKey) =>
    incoming.some(
      (incomingKey) => isPrefix(registeredKey, incomingKey) || isPrefix(incomingKey, registeredKey),
    ),
  )
}

export function invalidateQueryKeys(...keys: QueryKey[]) {
  if (keys.length === 0) return

  for (const subscriber of subscribers.values()) {
    if (matchesInvalidation(subscriber.keys, keys)) {
      subscriber.callback()
    }
  }
}

export function subscribeInvalidation(keys: QueryKey[], callback: () => void): () => void {
  const id = nextSubscriberId
  nextSubscriberId += 1

  subscribers.set(id, {
    id,
    keys,
    callback,
  })

  return () => {
    subscribers.delete(id)
  }
}

export function useQueryInvalidation(keys: QueryKey[], callback: () => void) {
  useEffect(() => subscribeInvalidation(keys, callback), [callback, keys])
}
