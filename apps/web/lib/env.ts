// The web app's server environment. Database settings live in @iwb/server.
export const isDev = process.env.NODE_ENV === 'development'
/** Deployed on Vercel, where BotID can judge requests (§6). */
export const onVercel = !!process.env.VERCEL

/** The token Vercel Cron sends to the hourly job (§5.4). Off Vercel a fixed one, so the job runs locally with curl. */
export function cronSecret() {
  const secret = process.env.CRON_SECRET ?? (onVercel ? '' : 'dev-cron-secret')
  if (!secret) throw new Error('CRON_SECRET is not set')
  return secret
}

/** The Christmas cards admin password. Empty on Vercel when it isn't set, which leaves that page closed. Off Vercel a fixed one. */
export function cardsAdminPassword() {
  return process.env.CARDS_ADMIN_PASSWORD ?? (onVercel ? '' : 'dev-cards-password')
}

/** The secret in the private /other/ card's link. Unset, that card stays closed. */
export function ollieCardCode() {
  return process.env.OLLIE_CARD_CODE
}

/** Where the private card's page is kept in private Vercel Blob storage. Unset, the card isn't ready. */
export function ollieMovieUrl() {
  return process.env.OLLIE_PRIVATE_MOVIE_URL
}

/** The token that reads private Vercel Blob storage. */
export function blobReadWriteToken() {
  return process.env.BLOB_READ_WRITE_TOKEN
}
