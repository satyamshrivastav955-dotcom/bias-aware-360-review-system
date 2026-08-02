import assert from "node:assert/strict";
import { parseBody, unwrapN8n } from "./n8n";

const res = (body: string, type = "application/json; charset=utf-8", status = 200) =>
  new Response(body, { status, headers: { "content-type": type } });

async function main() {
  // The live regression this guards: n8n answers 200 with a zero-byte body when
  // a node fails after the webhook already responded. That must read as
  // "nothing came back", not crash the route into its unreachable-host branch.
  assert.equal(await parseBody(res("")), null);
  assert.equal(await parseBody(res("   ")), null);
  assert.deepEqual(await parseBody(res('{"a":1}')), { a: 1 });
  await assert.rejects(() => parseBody(res("<html>500</html>", "text/html", 500)));

  // The three shapes an n8n Respond node produces, plus the empty case above.
  assert.deepEqual(unwrapN8n({ a: 1 }), { a: 1 });
  assert.deepEqual(unwrapN8n([{ a: 1 }]), { a: 1 });
  assert.deepEqual(unwrapN8n([{ json: { a: 1 } }]), { a: 1 });
  assert.equal(unwrapN8n(null), null);

  console.log("n8n: ok");
}

main();
