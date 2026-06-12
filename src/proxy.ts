import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const url = req.nextUrl
  const hostname = req.headers.get('host') || ''

  // Exclude static files, images, next internal files, and API endpoints
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Determine the subdomain
  const baseDomains = ['healsync-ai-six.vercel.app', 'localhost:3000']
  let subdomain = ''

  for (const base of baseDomains) {
    if (hostname.endsWith(base)) {
      // Extract the subdomain prefix before the main base domain (e.g. 'tender.localhost:3000' -> 'tender.')
      const parts = hostname.replace(base, '')
      if (parts && parts !== 'www.' && parts.endsWith('.')) {
        subdomain = parts.slice(0, -1)
        break
      }
    }
  }

  // If we have a tenant subdomain (e.g., 'tender')
  const reservedSubdomains = ['www', 'api', 'static', 'admin', 'master', 'onboard-org']
  if (subdomain && !reservedSubdomains.includes(subdomain)) {
    // Rewrite the request internally to /org/[subdomain]/<original_path>
    return NextResponse.rewrite(
      new URL(`/org/${subdomain}${url.pathname}`, req.url)
    )
  }

  return NextResponse.next()
}
