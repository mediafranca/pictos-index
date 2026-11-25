import test from 'node:test';
import assert from 'node:assert/strict';
import { readLibraryAddress } from '../web/library-address.js';
test('individual and panel URL loading share CORS fetching without credentials', async () => {
  const payload = { config: { name: 'Cuentos' }, rows: [{ id: 'one', bitmap: 'data:image/png;base64,aA==' }] };
  const result = await readLibraryAddress('https://libraries.example/library.json', { fetcher: async (url, options) => {
    assert.equal(url.href, 'https://libraries.example/library.json');
    assert.deepEqual(options, { mode: 'cors', credentials: 'omit' });
    return new Response(JSON.stringify(payload));
  } });
  assert.deepEqual(result.payload, payload); assert.equal(result.fileName, 'library.json');
});
test('bundled sample paths resolve relative to the app and preserve file names', async () => {
  const result = await readLibraryAddress('examples/my%20library.json', { baseUrl: 'https://mediafranca.net/pictos-index/', fetcher: async url => {
    assert.equal(url.href, 'https://mediafranca.net/pictos-index/examples/my%20library.json');
    return new Response('{"rows":[{"id":"one"}]}');
  } });
  assert.equal(result.fileName, 'my library.json');
});
test('invalid protocols, empty addresses and embedded credentials never trigger a request', async () => {
  for (const address of ['', 'file:///tmp/private.json', 'javascript:alert(1)', 'data:application/json,{}', 'https://name:password@example.com/file.json']) {
    await assert.rejects(readLibraryAddress(address, { fetcher: () => { assert.fail('must not fetch'); } }), error => error.reason === 'badUrl');
  }
});
test('private files, preview HTML and CORS failures produce a retryable address error', async () => {
  for (const fetcher of [async () => new Response('', { status: 403 }), async () => new Response('<html>preview</html>'), async () => { throw new TypeError('CORS'); }]) {
    await assert.rejects(readLibraryAddress('https://example.com/file.json', { fetcher }), error => error.reason === 'unreachable');
  }
});
test('arbitrary JSON, evaluation output and empty libraries are rejected', async () => {
  for (const payload of [null, [], {}, { items: [] }, { rows: [] }]) {
    await assert.rejects(readLibraryAddress('https://example.com/file.json', { fetcher: async () => new Response(JSON.stringify(payload)) }), error => error.reason === 'notALibrary');
  }
});
