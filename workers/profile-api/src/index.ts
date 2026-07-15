/**
 * AliceJump Profile API — Cloudflare Workers
 * Typing SVG 使用与原版 readme-typing-svg 相同的 path 动画方案
 */

export interface Env {
	PROFILE_VIEWS: KVNamespace;
	GITHUB_TOKEN?: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		try {
			if (path === '/typing-svg') return handleTypingSvg(url);
			if (path.startsWith('/ghpvc/')) return handleViewsCounter(path, request, env);
			if (path.startsWith('/badge/')) return handleBadge(url, env);
			return new Response('Not Found', { status: 404 });
		} catch (err) {
			return new Response(String(err), { status: 500 });
		}
	},
};

// =============================================================================
// 1. Typing SVG — 使用 SVG Path 动画实现原版效果
// =============================================================================

function handleTypingSvg(url: URL): Response {
	const linesStr = url.searchParams.get('lines') || 'Hello World';
	const font = url.searchParams.get('font') || 'monospace';
	const size = parseInt(url.searchParams.get('size') || '20');
	const color = url.searchParams.get('color') || '#36BCF7';
	const bg = url.searchParams.get('background') || '#00000000';
	const duration = parseInt(url.searchParams.get('duration') || '5000');
	const pause = parseInt(url.searchParams.get('pause') || '0');
	const weight = url.searchParams.get('weight') || '400';
	const center = url.searchParams.get('center') === 'true';
	const vCenter = url.searchParams.get('vCenter') === 'true';
	const repeat = url.searchParams.get('repeat') !== 'false';
	const w = parseInt(url.searchParams.get('width') || '0') || 0;
	let h = parseInt(url.searchParams.get('height') || '0') || 0;

	const lines = linesStr.split(';').map(l => l.replace(/\+/g, ' '));
	const n = lines.length;
	const finalW = w || Math.max(...lines.map(l => l.length * size * 0.65 | 0)) + 40;
	if (!h) h = size * 4;
	const fw = finalW - 20;
	const tc = color.startsWith('#') ? color : '#' + color;
	const bgc = bg.length === 9 && bg.endsWith('00') ? 'transparent' : (bg.startsWith('#') ? bg : '#' + bg);
	const fc = font !== 'monospace'
		? '<style>@import url("https://fonts.googleapis.com/css2?family=' + font.replace(/ /g, '+') + ':wght@' + weight + '&amp;display=swap");</style>'
		: '';

	let d = '', b = '';
	for (let i = 0; i < n; i++) {
		const y = vCenter ? h / 2 : 20;
		const lineStart = i * (duration + pause);

		// clipPath: width 从 0 → fw (打字) → fw (暂停) → 0 (删除)
		d += '<clipPath id="c' + i + '"><rect x="0" y="' + (y - size) + '" width="0" height="' + (size * 2) + '">'
			+ '<animate attributeName="width" values="0;' + fw + ';' + fw + ';0"'
			+ ' keyTimes="0;0.7;0.85;1" dur="' + (duration + pause) + 'ms"'
			+ ' begin="' + lineStart + 'ms' + (repeat ? ';' + (lineStart + n * (duration + pause)) + 'ms' : '') + '"'
			+ ' repeatCount="' + (repeat ? 'indefinite' : '1') + '"/>'
			+ '</rect></clipPath>';

		// 文本
		b += '<g clip-path="url(#c' + i + ')">'
			+ '<text x="' + (center ? '50%' : '10') + '" y="' + y + '"'
			+ ' text-anchor="' + (center ? 'middle' : 'start') + '"'
			+ ' dominant-baseline="' + (vCenter ? 'middle' : 'auto') + '"'
			+ ' font-family="&quot;' + font + '&quot;, monospace"'
			+ ' font-size="' + size + '" font-weight="' + weight + '"'
			+ ' fill="' + tc + '">' + esc(lines[i])
			+ '</text></g>';
	}

	return new Response(
		'<svg xmlns="http://www.w3.org/2000/svg" width="' + finalW + '" height="' + h + '"'
		+ ' viewBox="0 0 ' + finalW + ' ' + h + '" style="background-color:' + bgc + '">'
		+ fc + d + b + '</svg>',
		{ headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' } }
	);
}

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// =============================================================================
// 2. Views Counter
// =============================================================================

async function handleViewsCounter(path: string, request: Request, env: Env): Promise<Response> {
	const username = path.replace('/ghpvc/', '').replace(/[^a-zA-Z0-9_-]/g, '');
	if (!username) return new Response('Invalid username', { status: 400 });

	const params = new URL(request.url).searchParams;
	const color = params.get('color') || '007ec6';
	const style = params.get('style') || 'flat';
	const label = params.get('label') || 'Profile views';
	const base = parseInt(params.get('base') || '0', 10);
	const key = 'views:' + username;

	let count: number;
	try {
		count = (await env.PROFILE_VIEWS.get(key, 'json') as number) || 0;
		count += 1;
		await env.PROFILE_VIEWS.put(key, JSON.stringify(count));
	} catch { count = 0; }

	return new Response(badge(label, String(count + base), color, style), {
		headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
	});
}

// =============================================================================
// 3. Badge API
// =============================================================================

function handleBadge(url: URL, env: Env): Response {
	const path = url.pathname;
	const style = url.searchParams.get('style') || 'flat';
	if (path.startsWith('/badge/github/')) return handleGitHubBadge(path, url, env);

	const parts = path.replace('/badge/', '').split('/');
	let label = decodeURIComponent(parts[0] || 'custom').replace(/-/g, ' ');
	let msg = decodeURIComponent(parts[1] || 'unknown').replace(/-/g, ' ');
	let color = decodeURIComponent(parts[2] || 'brightgreen');
	if (url.searchParams.has('label')) label = url.searchParams.get('label')!;
	if (url.searchParams.has('message')) msg = url.searchParams.get('message')!;
	if (url.searchParams.has('color')) color = url.searchParams.get('color')!;

	return new Response(badge(label, msg, color, style), {
		headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' },
	});
}

async function handleGitHubBadge(path: string, url: URL, env: Env): Promise<Response> {
	const parts = path.replace('/badge/github/', '').split('/');
	const type = parts[0], owner = parts[1] || '', repo = parts[2] || '';
	const style = url.searchParams.get('style') || 'flat';
	const data = owner ? await gh('/repos/' + owner + '/' + repo, env) : null;

	if (type === 'followers') {
		const u = await gh('/users/' + owner, env);
		if (u) return r('Followers', '' + (u.followers || 0), 'blue', style);
	}
	if (!data) return r('GitHub', 'error', 'red', style);

	switch (type) {
		case 'stars': return r('Stars', '' + (data.stargazers_count || 0), 'brightgreen', style);
		case 'forks': return r('Forks', '' + (data.forks_count || 0), 'blue', style);
		case 'license': return r('License', data.license?.spdx_id || 'Unknown', 'green', style);
		case 'last-commit': {
			const c = await gh('/repos/' + owner + '/' + repo + '/commits?per_page=1', env);
			const d = c?.[0]?.commit?.committer?.date;
			return r('Last commit', d ? ta(d) : 'unknown', 'brightgreen', style);
		}
		default: return r('GitHub', 'unknown', 'grey', style);
	}
}

function r(l: string, m: string, c: string, s: string): Response {
	return new Response(badge(l, m, c, s), {
		headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
	});
}

async function gh(e: string, env: Env): Promise<any> {
	try {
		const headers: Record<string, string> = { 'User-Agent': 'alicejump-worker', 'Accept': 'application/vnd.github.v3+json' };
		if (env.GITHUB_TOKEN) headers['Authorization'] = 'Bearer ' + env.GITHUB_TOKEN;
		const r = await fetch('https://api.github.com' + e, { headers });
		return r.ok ? await r.json() : null;
	} catch { return null; }
}

function ta(s: string): string {
	const d = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
	if (d < 60) return 'just now';
	if (d < 3600) return Math.floor(d / 60) + 'm ago';
	if (d < 86400) return Math.floor(d / 3600) + 'h ago';
	if (d < 2592000) return Math.floor(d / 86400) + 'd ago';
	return Math.floor(d / 2592000) + 'mo ago';
}

// =============================================================================
// SVG Badge
// =============================================================================

const C: Record<string, string> = {
	brightgreen: '#44CC11', green: '#97CA00', yellow: '#DFB317',
	yellowgreen: '#A4A61D', orange: '#FE7D37', red: '#E05D44',
	blue: '#007EC6', grey: '#555', lightgrey: '#9f9f9f',
};
function rc(c: string): string { return C[c.toLowerCase()] || (c.startsWith('#') ? c : '#' + c); }

function badge(label: string, msg: string, color: string, style: string): string {
	const c = rc(color), lw = label.length * 7 + 16, mw = msg.length * 7 + 16, tw = lw + mw;
	if (style === 'for-the-badge') {
		return '<svg xmlns="http://www.w3.org/2000/svg" width="' + tw + '" height="20">'
			+ '<clipPath id="r"><rect width="' + tw + '" height="20" rx="3"/></clipPath>'
			+ '<g clip-path="url(#r)">'
			+ '<rect width="' + lw + '" height="20" fill="#555"/>'
			+ '<rect x="' + lw + '" width="' + mw + '" height="20" fill="' + c + '"/>'
			+ '</g>'
			+ '<g fill="#fff" font-family="Verdana,sans-serif" font-size="11" text-anchor="middle">'
			+ '<text x="' + (lw / 2) + '" y="14">' + label + '</text>'
			+ '<text x="' + (lw + mw / 2) + '" y="14">' + msg + '</text>'
			+ '</g></svg>';
	}
	return '<svg xmlns="http://www.w3.org/2000/svg" width="' + tw + '" height="20">'
		+ '<linearGradient id="s" x2="0" y2="100%">'
		+ '<stop offset="0" stop-color="#fff" stop-opacity=".7"/>'
		+ '<stop offset="100%" stop-color="#fff" stop-opacity="0"/>'
		+ '</linearGradient>'
		+ '<clipPath id="r"><rect width="' + tw + '" height="20" rx="3"/></clipPath>'
		+ '<g clip-path="url(#r)">'
		+ '<rect width="' + lw + '" height="20" fill="#555"/>'
		+ '<rect x="' + lw + '" width="' + mw + '" height="20" fill="' + c + '"/>'
		+ '<rect width="' + tw + '" height="20" fill="url(#s)"/>'
		+ '</g>'
		+ '<g fill="#fff" font-family="Verdana,sans-serif" font-size="11" text-anchor="middle">'
		+ '<text x="' + (lw / 2) + '" y="14">' + label + '</text>'
		+ '<text x="' + (lw + mw / 2) + '" y="14">' + msg + '</text>'
		+ '</g></svg>';
}

function e(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
