import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { compile } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';
import { parse } from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import SwaggerParser from '@apidevtools/swagger-parser';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFile(path.join(root, p), 'utf8');
async function files(dir = '') {
  const found = [];
  for (const item of await readdir(path.join(root, dir), { withFileTypes: true })) {
    if (item.name.startsWith('.') || item.name === 'node_modules') continue;
    const relative = path.posix.join(dir, item.name);
    if (item.isDirectory()) found.push(...await files(relative));
    else if (item.name.endsWith('.mdx')) found.push(relative);
  }
  return found;
}
const config = JSON.parse(await read('documentation.json'));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(JSON.parse(await read('scripts/documentation.schema.json')));
assert(validate(config), JSON.stringify(validate.errors, null, 2));
assert.equal(config.url, 'https://docs.aegisrunner.com');
assert.equal(config.seo.siteUrl, config.url);
assert.equal(config.name, 'AegisRunner');
const paths = await files();
const routes = new Set(paths.map(p => p.replace(/\.mdx$/, '')));
const linked = new Set();
const links = [];
let examples = 0;
function walk(node, fn) {
  fn(node);
  for (const child of node.children || []) walk(child, fn);
}
function inspect(file) {
  return () => tree => walk(tree, node => {
    if (node.type === 'link' || node.type === 'image') links.push([file, node.url]);
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      for (const attr of node.attributes || []) {
        if (['href', 'src'].includes(attr.name) && typeof attr.value === 'string') links.push([file, attr.value]);
      }
    }
    if (node.type === 'code' && ['json', 'yaml', 'yml'].includes(node.lang)) {
      if (node.lang === 'json') JSON.parse(node.value);
      else parse(node.value, { uniqueKeys: true });
      examples++;
    }
  });
}
for (const file of paths) {
  const source = await read(file);
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  assert(match, `${file}: missing frontmatter`);
  const meta = parse(match[1], { uniqueKeys: true });
  assert(typeof meta.title === 'string' && meta.title.trim(), `${file}: title required`);
  assert(typeof meta.description === 'string' && meta.description.trim(), `${file}: description required`);
  assert(!/SecuredAll|securedall\.com|api\.example\.com|starter kit/.test(source), `${file}: stale template content`);
  await compile(source.slice(match[0].length), { remarkPlugins: [remarkGfm, inspect(file)] });
}
function navigation(value) {
  if (Array.isArray(value)) return value.forEach(navigation);
  if (!value || typeof value !== 'object') return;
  if (value.path) {
    assert(routes.has(value.path), `Navigation target missing: ${value.path}`);
    assert(!linked.has(value.path), `Duplicate navigation page: ${value.path}`);
    linked.add(value.path);
  }
  if (value.openapi) assert(existsSync(path.join(root, value.openapi)), `Missing OpenAPI file: ${value.openapi}`);
  Object.values(value).forEach(navigation);
}
navigation(config.navigation);
assert(routes.has(config.initialRoute), 'Initial route missing');
for (const route of routes) assert(linked.has(route), `Page missing from navigation: ${route}`);
for (const [file, href] of links) {
  if (!href.startsWith('/')) continue;
  assert(!href.startsWith('//'), `${file}: protocol-relative link`);
  const target = href.slice(1).split(/[?#]/)[0].replace(/\/$/, '');
  assert(routes.has(target) || existsSync(path.join(root, target)), `${file}: broken link ${href}`);
}
const api = await SwaggerParser.validate(path.join(root, 'api-reference/openapi.yaml'));
assert.equal(api.servers[0].url, 'https://app.aegisrunner.com/api/v1');
assert.deepEqual(Object.keys(api.paths).sort(), ['/ci/crawls/{crawlId}/events', '/ci/runs/{runId}', '/ci/trigger']);
console.log(`Validated ${paths.length} MDX pages, navigation, ${links.length} links, ${examples} JSON/YAML examples, site schema, and ${Object.keys(api.paths).length} API endpoints.`);
