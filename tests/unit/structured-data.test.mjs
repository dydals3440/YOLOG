import assert from "node:assert/strict";
import { it } from "node:test";
import { serializeJsonLd } from "../../src/lib/structured-data.ts";

it("JSON-LD preserves content without allowing it to close the script element", () => {
  const article = {
    "@type": "BlogPosting",
    headline: '</script><script>alert("xss")</script>',
    description: '한글 & <이미지> "따옴표"',
  };
  const serialized = serializeJsonLd(article);
  assert(!serialized.includes("<"), "Raw HTML can escape the JSON-LD script element");
  assert.deepEqual(JSON.parse(serialized), article, "Content must survive serialization");
});
