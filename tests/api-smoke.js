const assert = require("node:assert/strict");
const app = require("../server/app");

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...options.headers },
  });
  const body = response.status === 204 ? null : await response.json();
  return { status: response.status, body };
}

async function run() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const empty = await request(baseUrl, "/api/burgers");
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.body, []);

    const invalid = await request(baseUrl, "/api/burgers", {
      method: "POST",
      body: JSON.stringify({ name: "ข้อมูลไม่ครบ", layers: ["sesame"] }),
    });
    assert.equal(invalid.status, 400);

    const created = await request(baseUrl, "/api/burgers", {
      method: "POST",
      body: JSON.stringify({
        name: "Classic Test",
        layers: ["sesame", "ketchup", "cheddar", "beef", "pickles", "lettuce"],
      }),
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.name, "Classic Test");
    assert.equal(created.body.layers.length, 6);

    const filtered = await request(baseUrl, "/api/burgers?protein=beef&minScore=50");
    assert.equal(filtered.status, 200);
    assert.equal(filtered.body.length, 1);

    const updated = await request(baseUrl, `/api/burgers/${created.body.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "Classic Test Updated" }),
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.name, "Classic Test Updated");

    const missing = await request(baseUrl, "/api/burgers/9999");
    assert.equal(missing.status, 404);

    const deleted = await request(baseUrl, `/api/burgers/${created.body.id}`, { method: "DELETE" });
    assert.equal(deleted.status, 204);

    console.log("API smoke test passed: GET, query, POST 400/201, PATCH, 404, DELETE 204");
  } finally {
    server.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
