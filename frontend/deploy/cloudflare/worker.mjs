function matches(presented, expected) {
  if (!expected || presented.length !== expected.length) return false;

  const encoder = new TextEncoder();
  const presentedBytes = encoder.encode(presented);
  const expectedBytes = encoder.encode(expected);
  return presentedBytes.length === expectedBytes.length &&
    crypto.subtle.timingSafeEqual(presentedBytes, expectedBytes);
}

function withSession(response, token) {
  const result = new Response(response.body, response);
  result.headers.append(
    'Set-Cookie',
    `__Host-senviet=${token}; Max-Age=28800; Path=/; Secure; HttpOnly; SameSite=Strict`,
  );
  result.headers.set('Cache-Control', 'private, no-store');
  return result;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isStaticRequest = request.method === 'GET' || request.method === 'HEAD';
    if (isStaticRequest && publicPaths.has(url.pathname)) {
      const asset = new Request(request);
      asset.headers.delete('Authorization');
      asset.headers.delete('Cookie');
      return env.ASSETS.fetch(asset);
    }

    const isApi = url.pathname.startsWith('/api/') || url.pathname === '/actuator/health';
    if (url.pathname === '/login' || url.pathname === '/login/') url.pathname = '/management/';

    const session = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)__Host-senviet=([\w-]+)/)?.[1] || '';
    if (matches(session, env.DEMO_SESSION)) {
      const upstream = new Request(url, request);
      upstream.headers.delete('Cookie');
      if (isApi) return env.API.fetch(upstream);

      upstream.headers.delete('Authorization');
      return env.ASSETS.fetch(upstream);
    }

    const authorization = request.headers.get('Authorization') || '';
    if (isStaticRequest && !isApi && matches(authorization, env.DEMO_AUTHORIZATION) && env.DEMO_SESSION) {
      const asset = new Request(url, request);
      asset.headers.delete('Authorization');
      return withSession(await env.ASSETS.fetch(asset), env.DEMO_SESSION);
    }

    const headers = { 'Cache-Control': 'no-store' };
    if (!isApi) headers['WWW-Authenticate'] = 'Basic realm="Sen Viet Demo", charset="UTF-8"';
    return new Response('Authentication required', { status: 401, headers });
  },
};
