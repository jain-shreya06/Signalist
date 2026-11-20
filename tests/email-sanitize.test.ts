import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeEmailHtml } from "../lib/email/sanitize";

test("email HTML sanitizer preserves safe formatting while removing scripts and unsafe links", () => {
  const cleaned = sanitizeEmailHtml('<p onclick="run()">Market <strong>update</strong></p><script>alert(1)</script><a href="javascript:alert(1)">link</a><a href="https://example.com" onclick="run()">source</a>');
  assert.match(cleaned, /<p>Market <strong>update<\/strong><\/p>/);
  assert.doesNotMatch(cleaned, /<script|onclick=|javascript:/i);
  assert.match(cleaned, /<a href="https:\/\/example\.com" rel="noopener noreferrer">source<\/a>/);
});
