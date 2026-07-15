/**
 * AliceJump Profile API — Cloudflare Workers
 * 
 * 统一提供 Typing SVG、Views Counter、Badge 三项服务。
 * 替代原本需要 Docker/VPS 部署的三个独立服务。
 */

export interface Env {
	PROFILE_VIEWS: KVNamespace;
}

// =============================================================================
// 路由分发
// =============================================================================

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		try {
			if (path === '/typing-svg') {
				return handleTypingSvg(url);
			}
			if (path.startsWith('/ghpvc/')) {
				return handleViewsCounter(path, request, env);
			}
			if (path.startsWith('/badge/')) {
				return handleBadge(url);
			}
			return new Response('Not Found', { status: 404 });
		} catch (err) {
			return new Response(String(err), { status: 500 });
		}
	},
};

// =============================================================================
// 1. Typing SVG
// =============================================================================

function handleTypingSvg(url: URL): Response {
	const text = url.searchParams.get('text') || 'Hello World';
	const font = url.searchParams.get('font') || 'monospace';
	const size = url.searchParams.get('size') || '20';
	const color = url.searchParams.get('color') || '36BCF7';
	const duration = url.searchParams.get('duration') || '4';
	const bgColor = url.searchParams.get('background') || '00000000';

	// 拆分成行，支持用 ; 分隔
	const lines = text.split(';');
	const lineHeight = parseInt(size) * 1.5;
	const totalHeight = Math.max(lines.length * lineHeight + 20, 50);
	const totalWidth = Math.max(lines.reduce((max, l) => Math.max(max, l.length * parseInt(size) * 0.65), 0) + 40, 400);

	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${totalWidth}" height="${totalHeight}"
     viewBox="0 0 ${totalWidth} ${totalHeight}">
  <rect width="100%" height="100%" fill="#${bgColor}" rx="5"/>
  <style>
    @keyframes blink { 0%,50% { opacity:1 } 51%,100% { opacity:0 } }
    @keyframes typing {
      ${lines.map((_, i) => {
        const pct = (i / lines.length) * 100;
        return `${pct}% { width: 0 }
                ${pct + 5}% { width: ${lines[i].length * 0.65}em }
                ${pct + 40}% { width: ${lines[i].length * 0.65}em }
                ${pct + 45}% { width: 0 }`;
      }).join('\n      ')}
      100% { width: 0 }
    }
    .cursor { animation: blink 0.8s step-end infinite; }
    .text {
      font-family: '${font}', monospace;
      font-size: ${size}px;
      fill: #${color};
    }
  </style>
  ${lines.map((line, i) => {
    const y = 20 + (i + 1) * lineHeight;
    // 计算打字时长: 每行占总时长比例
    const lineDuration = parseFloat(duration) / lines.length;
    const delay = i * lineDuration;
    return `<text class="text" x="20" y="${y}">
      <tspan>
        <animate attributeName="--w" 
          from="0" to="${line.length}" 
          dur="${lineDuration}s" begin="${delay}s" 
          fill="freeze" repeatCount="indefinite"/>
        <tspan>
          ${line}
        </tspan>
      </tspan>
      <tspan class="cursor" x="20" y="${y}" fill="#${color}"
            style="animation-delay: ${delay}s">▌</tspan>
    </text>`;
  }).join('\n  ')}
</svg>`;

	return new Response(svg, {
		headers: {
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'public, max-age=3600',
		},
	});
}

// =============================================================================
// 2. Views Counter (KV 存储)
// =============================================================================

async function handleViewsCounter(path: string, request: Request, env: Env): Promise<Response> {
	const username = path.replace('/ghpvc/', '').replace(/[^a-zA-Z0-9_-]/g, '');
	if (!username) {
		return new Response('Invalid username', { status: 400 });
	}

	const color = new URL(request.url).searchParams.get('color') || '007ec6';
	const style = new URL(request.url).searchParams.get('style') || 'flat';
	const label = new URL(request.url).searchParams.get('label') || 'Profile views';
	const abbreviated = new URL(request.url).searchParams.get('abbreviated') === 'true';
	const base = parseInt(new URL(request.url).searchParams.get('base') || '0', 10);

	// KV 原子递增
	const key = `views:${username}`;
	let count: number;
	try {
		count = await env.PROFILE_VIEWS.get(key, 'json') as number || 0;
		// 仅非机器人/非刷新请求递增
		if (!request.headers.get('cf-worker') && !request.headers.get('x-forwarded-for')?.includes('github.com')) {
			count += 1;
			await env.PROFILE_VIEWS.put(key, JSON.stringify(count));
		}
	} catch {
		count = 0;
	}

	const total = count + base;
	const displayCount = abbreviated ? abbreviateNumber(total) : String(total);

	const svg = buildBadgeSvg(label, displayCount, color, style);

	return new Response(svg, {
		headers: {
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'no-cache, no-store, must-revalidate',
		},
	});
}

function abbreviateNumber(n: number): string {
	if (n < 1000) return String(n);
	if (n < 1000000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
	return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
}

// =============================================================================
// 3. Badge API (兼容 Shields.io 基础格式)
// =============================================================================

function handleBadge(url: URL): Response {
	const path = url.pathname;
	const parts = path.replace('/badge/', '').split('/');

	// 支持: /badge/label-message-color
	// 也支持: /badge/label/message/color
	let label: string, message: string, color: string;

	if (parts.length >= 2) {
		label = decodeURIComponent(parts[0].replace(/-/g, ' '));
		message = decodeURIComponent(parts[1].replace(/-/g, ' '));
		color = decodeURIComponent(parts[2] || 'brightgreen');
	} else {
		// 从 query 参数读取
		label = url.searchParams.get('label') || 'custom';
		message = url.searchParams.get('message') || 'unknown';
		color = url.searchParams.get('color') || 'brightgreen';
	}

	// 也支持 query 参数覆盖
	if (url.searchParams.has('label')) label = url.searchParams.get('label')!;
	if (url.searchParams.has('message')) message = url.searchParams.get('message')!;
	if (url.searchParams.has('color')) color = url.searchParams.get('color')!;
	const style = url.searchParams.get('style') || 'flat';

	// 处理 github/* 格式的快捷 badge (仅基础支持)
	if (path.startsWith('/badge/github/')) {
		return handleGitHubBadge(path, url);
	}

	const svg = buildBadgeSvg(label, message, color, style);

	return new Response(svg, {
		headers: {
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'public, max-age=300',
		},
	});
}

/**
 * 基础 GitHub Badge 支持 (通过 GitHub API 获取实时数据)
 * 格式: /badge/github/{type}/{owner}/{repo}
 */
async function handleGitHubBadge(path: string, url: URL): Promise<Response> {
	const parts = path.replace('/badge/github/', '').split('/');
	const type = parts[0]; // stars, forks, followers, last-commit, license
	const owner = parts[1] || '';
	const repo = parts[2] || '';
	const style = url.searchParams.get('style') || 'flat';

	if (type === 'followers') {
		const count = await fetchGitHubData(`/users/${owner}`);
		if (count) {
			return new Response(buildBadgeSvg('Followers', abbreviateNumber(count.followers || 0), 'blue', style), {
				headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
			});
		}
	}

	if (owner && repo) {
		const data = await fetchGitHubData(`/repos/${owner}/${repo}`);

		if (!data) {
			return new Response(buildBadgeSvg('GitHub', 'error', 'red', style), {
				headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=60' },
			});
		}

		switch (type) {
			case 'stars':
				return new Response(buildBadgeSvg('Stars', abbreviateNumber(data.stargazers_count || 0), 'brightgreen', style), {
					headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
				});
			case 'forks':
				return new Response(buildBadgeSvg('Forks', abbreviateNumber(data.forks_count || 0), 'blue', style), {
					headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
				});
			case 'license':
				return new Response(buildBadgeSvg('License', data.license?.spdx_id || 'Unknown', 'green', style), {
					headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
				});
			case 'last-commit': {
				const commits = await fetchGitHubData(`/repos/${owner}/${repo}/commits?per_page=1`);
				const date = commits?.[0]?.commit?.committer?.date;
				const relative = date ? timeAgo(date) : 'unknown';
				return new Response(buildBadgeSvg('Last commit', relative, 'brightgreen', style), {
					headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
				});
			}
		}
	}

	return new Response(buildBadgeSvg('GitHub', 'unknown', 'grey', style), {
		headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' },
	});
}

/**
 * 调用 GitHub REST API
 */
async function fetchGitHubData(endpoint: string): Promise<any> {
	try {
		const resp = await fetch(`https://api.github.com${endpoint}`, {
			headers: { 'User-Agent': 'alicejump-profile-worker', 'Accept': 'application/vnd.github.v3+json' },
		});
		if (!resp.ok) return null;
		return await resp.json();
	} catch {
		return null;
	}
}

function timeAgo(dateStr: string): string {
	const now = Date.now();
	const past = new Date(dateStr).getTime();
	const diff = Math.floor((now - past) / 1000);
	if (diff < 60) return 'just now';
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
	return `${Math.floor(diff / 2592000)}mo ago`;
}

// =============================================================================
// SVG Badge 生成器
// =============================================================================

const COLOR_MAP: Record<string, string> = {
	brightgreen: '#44CC11',
	green: '#97CA00',
	yellow: '#DFB317',
	yellowgreen: '#A4A61D',
	orange: '#FE7D37',
	red: '#E05D44',
	blue: '#007EC6',
	grey: '#555',
	lightgrey: '#9f9f9f',
	blueviolet: '#8A2BE2',
};

function resolveColor(color: string): string {
	return COLOR_MAP[color.toLowerCase()] || (color.startsWith('#') ? color : `#${color}`);
}

function buildBadgeSvg(label: string, message: string, color: string, style: string = 'flat'): string {
	const resolved = resolveColor(color);
	const labelLen = label.length * 7 + 16;
	const msgLen = message.length * 7 + 16;
	const totalW = labelLen + msgLen;

	if (style === 'for-the-badge') {
		return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalW + 4}" height="28" viewBox="0 0 ${totalW + 4} 28">
  <rect x="0.5" y="0.5" width="${totalW + 3}" height="27" rx="3" fill="#555" stroke="#555"/>
  <rect x="0.5" y="0.5" width="${labelLen + 2}" height="27" rx="3" fill="#555"/>
  <rect x="${labelLen + 1.5}" y="0.5" width="${msgLen + 2}" height="27" fill="${resolved}"/>
  <text x="${labelLen / 2 + 2}" y="18" fill="#fff" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">${label.toUpperCase()}</text>
  <text x="${labelLen + msgLen / 2 + 2}" y="18" fill="#fff" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">${message.toUpperCase()}</text>
</svg>`;
	}

	// flat / default
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="20" viewBox="0 0 ${totalW} 20">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
    <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalW}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelLen}" height="20" fill="#555"/>
    <rect x="${labelLen}" width="${msgLen}" height="20" fill="${resolved}"/>
    <rect width="${totalW}" height="20" fill="url(#s)"/>
  </g>
  <text x="${labelLen / 2}" y="14" fill="#fff" font-family="monospace" font-size="11" text-anchor="middle">${escapeXml(label)}</text>
  <text x="${labelLen + msgLen / 2}" y="14" fill="#fff" font-family="monospace" font-size="11" text-anchor="middle">${escapeXml(message)}</text>
</svg>`;
}

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
