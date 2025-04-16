// import {
//   AtUri,
//   type BskyAgent,
// } from '@atproto/api'

// import { retry } from '#/lib/async/retry'

const CONSTELLATION_INSTANCE = 'https://constellation.microcosm.blue/'

type ConstellationLink = {
  did: string
  collection: string
  rkey: string
}

type Collection =
  | 'app.bsky.actor.profile'
  | 'app.bsky.feed.generator'
  | 'app.bsky.feed.like'
  | 'app.bsky.feed.post'
  | 'app.bsky.feed.repost'
  | 'app.bsky.feed.threadgate'
  | 'app.bsky.graph.block'
  | 'app.bsky.graph.follow'
  | 'app.bsky.graph.list'
  | 'app.bsky.graph.listblock'
  | 'app.bsky.graph.listitem'
  | 'app.bsky.graph.starterpack'
  | 'chat.bsky.actor.declaration'

// using an async generator lets us kick off dependent requests before finishing pagination
// this doesn't solve the gross N+1 queries thing going on here to get records, but it should make it faster :3
export async function* constellationRequest(
  route: string,
  params: {target: string; collection: Collection; path: string},
) {
  const headers = new Headers({
    Accept: 'application/json',
    'User-Agent': 'deer.social (contact @aviva.gay)',
  })

  const url = new URL(CONSTELLATION_INSTANCE)
  url.pathname = route
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  const req = async () =>
    (await (await fetch(url, {method: 'GET', headers})).json()) as {
      total: number
      linking_records: ConstellationLink[]
      cursor: string | null
    }

  let cursor: string | null = null
  while (true) {
    const resp = await req()

    for (const link of resp.linking_records) {
      yield link
    }

    cursor = resp.cursor
    if (cursor === null) break
    url.searchParams.set('cursor', cursor)
  }
}

export async function* asyncGenMap<K, V>(
  gen: AsyncGenerator<K, void, unknown>,
  fn: (_: K) => Promise<V>,
) {
  for await (const v of gen) {
    yield fn(v)
  }
}

export function asUri(link: ConstellationLink): string {
  return `at://${link.did}/${link.collection}/${link.rkey}`
}
