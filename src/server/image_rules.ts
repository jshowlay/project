/**
 * Host-specific "hi-res" upgrade rules for common news/CDN providers.
 * Safe: all outputs remain http(s). If a rule doesn't apply, it returns the input.
 */
export function upgradeImageUrl(input: string): string {
  if (!input) return input;
  let urlStr = input.replace(/&amp;/g, '&').trim();

  let u: URL;
  try { u = new URL(urlStr); } catch { return input; }
  const host = u.hostname.toLowerCase();
  const path = u.pathname;

  // Helper: replace last -WxH before extension (WordPress style)
  const wpUnsizer = (p: string) => p.replace(/-(\d{2,4})x(\d{2,4})(\.[a-z0-9]+)$/i, '$3');

  // Generic param bump (w/width & h/height)
  const bumpDims = (wTarget = 2000, hTarget?: number) => {
    const w = Number(u.searchParams.get('w') || u.searchParams.get('width') || 0);
    const h = Number(u.searchParams.get('h') || u.searchParams.get('height') || 0);
    if (w && w < wTarget) {
      u.searchParams.set(u.searchParams.has('w') ? 'w' : 'width', String(wTarget));
    }
    if (hTarget && h && h < hTarget) {
      u.searchParams.set(u.searchParams.has('h') ? 'h' : 'height', String(hTarget));
    }
  };

  // --- Per-host rules ---
  // WordPress & common WP CDNs: drop -150x150 etc.
  if (/(\.|\/)(wp-content|wordpress)\b/i.test(path)) {
    u.pathname = wpUnsizer(path);
    return u.toString();
  }

  // Medium (miro / cdn-images-1): raise max/resize target
  if (['miro.medium.com','cdn-images-1.medium.com'].includes(host)) {
    // old: /max/1400/... → /max/2000/...
    u.pathname = u.pathname.replace(/\/max\/\d{3,4}\//, '/max/2000/');
    // new v2: /v2/resize:fit:<N>/... → bump to 2000
    u.pathname = u.pathname.replace(/\/v2\/resize:(fit|fill):(\d{3,4})\//, (_m, t) => `/v2/resize:${t}:2000/`);
    bumpDims(2000);
    return u.toString();
  }

  // NYTimes: swap sized variants → superJumbo
  if (host.endsWith('nytimes.com') || host.startsWith('static01.nyt.com')) {
    u.pathname = u.pathname
      .replace(/\/(mediumThreeByTwo|articleLarge|jumbo|superJumbo)\b[^/]*\//, '/superJumbo/')
      .replace(/(mediumThreeByTwo|articleLarge|jumbo)\b[^.]*\./, 'superJumbo.')
      .replace(/(mediumThreeByTwo|articleLarge|jumbo)\d+\./, 'superJumbo.');
    return u.toString();
  }

  // BBC: ichef size segment /news/<size>/ → /news/2048/
  if (host.includes('ichef.bbci.co.uk')) {
    u.pathname = u.pathname.replace(/\/news\/\d{2,4}\//, '/news/2048/');
    bumpDims(2000);
    return u.toString();
  }

  // The Guardian: i.guim.co.uk – boost width & quality
  if (host === 'i.guim.co.uk') {
    u.searchParams.set('width', '2000');
    u.searchParams.set('quality', '90');
    if (!u.searchParams.has('auto')) u.searchParams.set('auto', 'format');
    return u.toString();
  }

  // Vox / The Verge: thumbor chain often contains WxH; bump to 2000 wide
  if (host.endsWith('vox-cdn.com')) {
    u.pathname = u.pathname.replace(/\/(\d{3,4})x(\d{3,4})\//, '/2000x1333/');
    bumpDims(2000, 1333);
    return u.toString();
  }

  // Reddit preview: raise width
  if (host.endsWith('redd.it')) {
    if (u.searchParams.has('width')) u.searchParams.set('width', '1920');
    bumpDims(1920);
    return u.toString();
  }

  // Twitter images (pbs.twimg.com): name=orig
  if (host === 'pbs.twimg.com') {
    u.searchParams.set('name', 'orig');
    return u.toString();
  }

  // YouTube thumbs: ensure maxresdefault
  if (host === 'i.ytimg.com' && /\/vi\//.test(path)) {
    u.pathname = u.pathname.replace(/\/(hqdefault|mqdefault|sddefault|maxresdefault)\.(jpg|webp)$/i, '/maxresdefault.$2');
    return u.toString();
  }

  // Googleusercontent / gstatic / generic CDNs: bump w/h if present
  if (host.includes('googleusercontent.com') || host.includes('gstatic.com') || host.includes('akamaized.net')) {
    bumpDims(2000, 1200);
    return u.toString();
  }

  // Generic WordPress-like "size suffix" anywhere
  if (/-\d{2,4}x\d{2,4}\.[a-z0-9]+$/i.test(path)) {
    u.pathname = wpUnsizer(path);
    return u.toString();
  }

  // Generic: if clear width/height params are small, bump them
  bumpDims(1600, 1000);
  return u.toString();
}
