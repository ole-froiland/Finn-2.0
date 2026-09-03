import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const HEADERS = {
  'User-Agent': USER_AGENT,
  'Accept-Language': 'nb-NO,nb;q=0.9,no;q=0.8,en;q=0.7',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Node's built-in fetch ignores HTTP(S)_PROXY, which matters on machines that
 * only reach the internet through one. We try fetch first and fall back to
 * curl — which does honour the proxy — remembering whichever works.
 */
let transport = null;

async function viaFetch(url) {
  const response = await fetch(url, { headers: HEADERS, redirect: 'follow' });
  return { status: response.status, body: await response.text() };
}

async function viaCurl(url) {
  // -L matters: ad links are FINN short links that redirect to the real path.
  const args = ['-sS', '-L', '--compressed', '--max-time', '45', '-w', '\n%{http_code}'];
  for (const [key, value] of Object.entries(HEADERS)) args.push('-H', `${key}: ${value}`);
  args.push(url);
  const { stdout } = await run('curl', args, { maxBuffer: 64 * 1024 * 1024 });
  const cut = stdout.lastIndexOf('\n');
  return { status: Number(stdout.slice(cut + 1).trim()), body: stdout.slice(0, cut) };
}

async function request(url) {
  if (transport) return transport(url);
  try {
    const result = await viaFetch(url);
    transport = viaFetch;
    return result;
  } catch (error) {
    const code = error?.cause?.code ?? error?.code;
    if (code !== 'ENOTFOUND' && code !== 'ECONNREFUSED' && code !== 'ECONNRESET') throw error;
    const result = await viaCurl(url);
    transport = viaCurl;
    return result;
  }
}

/** GET with backoff. Returns the body, or null once the retries are spent. */
export async function get(url, { retries = 3, backoff = 1500 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { status, body } = await request(url);
      if (status === 200) return body;
      // 404 is a genuine answer; anything else is worth another go.
      if (status === 404) return null;
      if (attempt === retries) {
        throw new Error(`HTTP ${status} after ${retries + 1} attempts: ${url}`);
      }
    } catch (error) {
      if (attempt === retries) throw error;
    }
    await sleep(backoff * 2 ** attempt);
  }
  return null;
}

/** Run tasks with a fixed number in flight, preserving input order. */
export async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}
