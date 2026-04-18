function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }
}

function detectSource(url) {
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host.includes('instagram.com')) return 'instagram'
    if (host.includes('tiktok.com')) return 'tiktok'
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube'
    if (host.includes('twitter.com') || host.includes('x.com')) return 'twitter'
    if (host.includes('facebook.com') || host.includes('fb.com')) return 'facebook'
    if (host.includes('reddit.com')) return 'reddit'
    if (host.includes('linkedin.com')) return 'linkedin'
    if (host.includes('pinterest.com')) return 'pinterest'
    return 'web'
  } catch {
    return 'web'
  }
}

function extractMeta(html, name) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']og:${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${name}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
  }
  return ''
}

function extractTitle(html) {
  const og = extractMeta(html, 'title')
  if (og) return og
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? match[1].trim() : ''
}

function extractFavicon(html, baseUrl) {
  try {
    const origin = new URL(baseUrl).origin
    const patterns = [
      /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*icon[^"']*["']/i,
    ]
    for (const p of patterns) {
      const match = html.match(p)
      if (match) {
        const href = match[1]
        if (href.startsWith('http')) return href
        if (href.startsWith('//')) return 'https:' + href
        if (href.startsWith('/')) return origin + href
        return origin + '/' + href
      }
    }
    return origin + '/favicon.ico'
  } catch {
    return ''
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' }
  }

  const { url } = event.queryStringParameters || {}

  if (!url) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'url param required' }) }
  }

  const source = detectSource(url)
  const empty = { url, source, title: '', description: '', image_url: '', favicon_url: '' }

  // Instagram and TikTok block server-side fetching — return empty for user to fill in
  if (source === 'instagram' || source === 'tiktok') {
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(empty) }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkVaultBot/1.0; +https://linkvault.app)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(empty) }
    }

    const html = await response.text()

    const metadata = {
      url,
      source,
      title: extractTitle(html),
      description: extractMeta(html, 'description'),
      image_url: extractMeta(html, 'image'),
      favicon_url: extractFavicon(html, url),
    }

    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(metadata) }
  } catch {
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(empty) }
  }
}
