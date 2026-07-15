/**
 * AliceJump Profile API — Cloudflare Workers
 *
 * 统一提供 Typing SVG、Views Counter、Badge 三项服务。
 */

export interface Env {
	PROFILE_VIEWS: KVNamespace;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		try {
			if (path === '/typing-svg') return handleTypingSvg(url);
			if (path.startsWith('/ghpvc/')) return handleViewsCounter(path, request, env);
			if (path.startsWith('/badge/')) return handleBadge(url);
			return new Response('Not Found', { status: 404 });
		} catch (err) {
			return new Response(String(err), { status: 500 });
		}
	},
};

// =============================================================================
// 1. Typing SVG — 逐字出现动画
// =============================================================================

function handleTypingSvg(url: URL): Response {
	const text = url.searchParams.get('text') || 'Hello World';
	const font = url.searchParams.get('font') || 'monospace';
	const size = parseInt(url.searchParams.get('size') || '20');
	const color = url.searchParams.get('color') || '36BCF7';
	const bg = url.searchParams.get('background') || '00000000';

	const lines = text.split(';');
	const charW = size * 0.6;
	const lineH = size * 1.5;
	const maxLen = Math.max(...lines.map(l => l.length));
	const w = Math.max(maxLen * charW + 40, 200);
	const h = Math.max(lines.length * lineH + 30, 50);

	let body = '';

	lines.forEach((line, li) => {
		const y = 28 + li * lineH;
		const lineDelay = li * 2;

		line.split('').forEach((ch, ci) => {
			const d = (lineDelay + ci * 0.08).toFixed(3);
			body += '<tspan opacity="0">'
				+ '<animate attributeName="opacity" from="0" to="1"'
				+ ' begin="' + d + 's" dur="0.01s" fill="freeze"/>'
				+ esc(ch) + '</tspan>';
		});

		const cd = (lineDelay + line.length * 0.08 + 0.5).toFixed(3);
		body += '<tspan fill="#' + color + '" opacity="0">'
			+ '<animate attributeName="opacity" from="0" to="1"'
			+ ' begin="' + cd + 's" dur="0.01s" fill="freeze"/>'
			+ '<animate attributeName="opacity" values="1;0;1" dur="0.8s"'
			+ ' begin="' + cd + 's" repeatCount="indefinite"/>'
			+ '\u258c</tspan>';
	});

	const svg = '<svg xmlns="http://www.w3.org/2000/svg"'
		+ ' width="' + w + '" height="' + h + '"'
		+ ' viewBox="0 0 ' + w + ' ' + h + '">'
		+ '<rect width="100%" height="100%" fill="#' + bg + '" rx="5"/>'
		+ '<text x="20" y="40" font-family="' + font + ',monospace"'
		+ ' font-size="' + size + '" fill="#' + color + '">'
		+ body + '</text></svg>';

	return new Response(svg, {
		headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
	});
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
	} catch {
		count = 0;
	}

	return new Response(buildBadge(label, String(count + base), color, style), {
		headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
	});
}

// =============================================================================
// 3. Badge API
// =============================================================================

function handleBadge(url: URL): Response {
	const path = url.pathname;
	const parts = path.replace('/badge/', '').split('/');
	const style = url.searchParams.get('style') || 'flat';

	if (path.startsWith('/badge/github/')) return handleGitHubBadge(path, url);

	let label = parts[0] || 'custom';
	let msg = parts[1] || 'unknown';
	let color = parts[2] || 'brightgreen';
	if (url.searchParams.has('label')) label = url.searchParams.get('label')!;
	if (url.searchParams.has('message')) msg = url.searchParams.get('message')!;
	if (url.searchParams.has('color')) color = url.searchParams.get('color')!;

	return new Response(buildBadge(label, msg, color, style), {
		headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' },
	});
}

async function handleGitHubBadge(path: string, url: URL): Promise<Response> {
	const parts = path.replace('/badge/github/', '').split('/');
	const type = parts[0], owner = parts[1] || '', repo = parts[2] || '';
	const style = url.searchParams.get('style') || 'flat';
	const data = owner ? await ghFetch('/repos/' + owner + '/' + repo) : null;

	if (type === 'followers') {
		const u = await ghFetch('/users/' + owner);
		if (u) return respond('Followers', '' + (u.followers || 0), 'blue', style);
	}

	if (!data) return respond('GitHub', 'error', 'red', style);

	switch (type) {
		case 'stars': return respond('Stars', '' + (data.stargazers_count || 0), 'brightgreen', style);
		case 'forks': return respond('Forks', '' + (data.forks_count || 0), 'blue', style);
		case 'license': return respond('License', data.license?.spdx_id || 'Unknown', 'green', style);
		case 'last-commit': {
			const commits = await ghFetch('/repos/' + owner + '/' + repo + '/commits?per_page=1');
			const date = commits?.[0]?.commit?.committer?.date;
			return respond('Last commit', date ? timeAgo(date) : 'unknown', 'brightgreen', style);
		}
		default: return respond('GitHub', 'unknown', 'grey', style);
	}
}

function respond(label: string, msg: string, color: string, style: string): Response {
	return new Response(buildBadge(label, msg, color, style), {
		headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
	});
}

async function ghFetch(endpoint: string): Promise<any> {
	try {
		const resp = await fetch('https://api.github.com' + endpoint, {
			headers: { 'User-Agent': 'alicejump-worker', 'Accept': 'application/vnd.github.v3+json' },
		});
		return resp.ok ? await resp.json() : null;
	} catch { return null; }
}

function timeAgo(s: string): string {
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

const CM: Record<string, string> = {
	brightgreen: '#44CC11', green: '#97CA00', yellow: '#DFB317',
	yellowgreen: '#A4A61D', orange: '#FE7D37', red: '#E05D44',
	blue: '#007EC6', grey: '#555', lightgrey: '#9f9f9f',
};

function rc(c: string): string {
	return CM[c.toLowerCase()] || (c.startsWith('#') ? c : '#' + c);
}

function buildBadge(label: string, msg: string, color: string, style: string): string {
	const c = rc(color);
	const lw = label.length * 7 + 16;
	const mw = msg.length * 7 + 16;
	const tw = lw + mw;

	if (style === 'for-the-badge') {
		return '<svg xmlns="http://www.w3.org/2000/svg" width="' + tw + '" height="28">'
			+ '<clipPath id="r"><rect width="' + tw + '" height="28" rx="3"/></clipPath>'
			+ '<g clip-path="url(#r)">'
			+ '<rect width="' + lw + '" height="28" fill="#555"/>'
			+ '<rect x="' + lw + '" width="' + mw + '" height="28" fill="' + c + '"/>'
			+ '</g>'
			+ '<g fill="#fff" font-family="monospace" font-size="13" text-anchor="middle">'
			+ '<text x="' + (lw / 2) + '" y="19">' + esc(label.toUpperCase()) + '</text>'
			+ '<text x="' + (lw + mw / 2) + '" y="19">' + esc(msg.toUpperCase()) + '</text>'
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
		+ '<g fill="#fff" font-family="monospace" font-size="11" text-anchor="middle">'
		+ '<text x="' + (lw / 2) + '" y="14">' + esc(label) + '</text>'
		+ '<text x="' + (lw + mw / 2) + '" y="14">' + esc(msg) + '</text>'
		+ '</g></svg>';
}
