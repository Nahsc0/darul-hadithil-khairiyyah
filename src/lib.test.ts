import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isPast,
  todayLagos,
  nextLecture,
  seed,
  seedRecords,
  safeUrl,
  youtubeEmbed,
  validateRecord,
} from "./lib";
describe("authoritative schedule and date boundaries", () => {
  it("uses Lagos date at the UTC day boundary", () => {
    assert.equal(todayLagos(new Date("2026-11-02T23:30:00Z")), "2026-11-03");
  });
  it("archives the October event in November", () => {
    assert.equal(isPast("2026-10-30", new Date("2026-11-03T10:00:00Z")), true);
    assert.equal(isPast("2026-11-03", new Date("2026-11-03T10:00:00Z")), false);
  });
  it("keeps exact supplied titles and counts", () => {
    assert.equal(seed.weekly_lectures.friday.length, 3);
    assert.equal(seed.weekly_lectures.saturday.length, 4);
    assert.equal(seed.weekly_lectures.sunday.length, 4);
    assert.equal(
      seed.weekly_lectures.friday[0].title,
      "Ummahātun Rabbaina Ulamā",
    );
    assert.equal(nextLecture(new Date("2026-11-03T12:00:00Z")).day, "friday");
  });
});
describe("safe rendering and publication", () => {
  it("rejects executable URLs and misleading social domains", () => {
    assert.equal(safeUrl("javascript:alert(1)"), "");
    assert.equal(
      safeUrl("https://facebook.com.evil.example", "facebook.com"),
      "",
    );
    assert.ok(safeUrl("https://www.facebook.com/official", "facebook.com"));
  });
  it("only embeds supported YouTube resources", () => {
    assert.equal(
      youtubeEmbed("https://youtu.be/abcdefghijk"),
      "https://www.youtube-nocookie.com/embed/abcdefghijk",
    );
    assert.equal(youtubeEmbed("https://evil.example/watch?v=abcdefghijk"), "");
    assert.ok(
      youtubeEmbed("https://youtube.com/playlist?list=PLabc123").includes(
        "videoseries?list=PLabc123",
      ),
    );
  });
  it("blocks incomplete publications and invalid slugs", () => {
    const r = { ...seedRecords[0] };
    assert.equal(validateRecord(r), "");
    assert.ok(validateRecord({ ...r, body_ha: "" }).includes("both language"));
    assert.ok(validateRecord({ ...r, slug: "<script>" }).includes("slug"));
  });
});
