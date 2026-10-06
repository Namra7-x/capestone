const BASE = 'http://localhost:5000';

async function api(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

const results = [];
const check = (name, cond) => { results.push({ name, pass: cond }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`); };

const spa = await fetch(BASE + '/');
check('SPA served at /', spa.status === 200 && (await spa.text()).includes('Flowboard'));

const reg = await api('POST', '/api/auth/register', { body: { username: 'gituser', email: 'git@example.com', password: 'Password123' } });
check('Register', reg.status === 201 || reg.status === 409);
const login = await api('POST', '/api/auth/login', { body: { email: 'git@example.com', password: 'Password123' } });
check('Login', login.status === 200 && !!login.data.token);
const token = login.data.token;

const created = await api('POST', '/api/todos', { token, body: { title: 'Git deploy task', priority: 'high' } });
check('Create todo', created.status === 201);
const id = created.data.id;
check('List todos', (await api('GET', '/api/todos', { token })).status === 200);
check('Stats', (await api('GET', '/api/todos/stats', { token })).status === 200);
check('Toggle', (await api('PATCH', `/api/todos/${id}/toggle`, { token })).status === 200);
check('Delete', (await api('DELETE', `/api/todos/${id}`, { token })).status === 204);

const spaRoute = await fetch(BASE + '/high-priority');
check('SPA fallback', spaRoute.status === 200 && (await spaRoute.text()).includes('Flowboard'));
check('API 404 is JSON', (await api('GET', '/api/nonexistent')).data?.error?.code === 'NOT_FOUND');
check('Static asset', (await fetch(BASE + '/assets/' + (await spa.text()).match(/assets\/index-[^"]+\.js/)?.[0]?.split('/').pop() || '')).status === 200);

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} tests passed`);
if (failed.length) { console.log('FAILED:', failed.map((f) => f.name).join(', ')); process.exit(1); }
