import { describe, it, expect } from "vitest";
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
    expect(todayLagos(new Date("2026-11-02T23:30:00Z"))).toBe("2026-11-03");
  });
  it("archives the October event in November", () => {
    expect(isPast("2026-10-30", new Date("2026-11-03T10:00:00Z"))).toBe(true);
    expect(isPast("2026-11-03", new Date("2026-11-03T10:00:00Z"))).toBe(false);
  });
  it("keeps the exact supplied titles and counts", () => {
    expect(seed.weekly_lectures.friday).toHaveLength(3);
    expect(seed.weekly_lectures.saturday).toHaveLength(4);
    expect(seed.weekly_lectures.sunday).toHaveLength(4);
    expect(seed.weekly_lectures.friday[0].title).toBe(
      "Ummahātun Rabbaina Ulamā",
    );
    expect(nextLecture(new Date("2026-11-03T12:00:00Z")).day).toBe("friday");
  });
});
describe("safe rendering and publication", () => {
  it("rejects executable URLs and misleading social domains", () => {
    expect(safeUrl("javascript:alert(1)")).toBe("");
    expect(safeUrl("https://facebook.com.evil.example", "facebook.com")).toBe(
      "",
    );
    expect(
      safeUrl("https://www.facebook.com/official", "facebook.com"),
    ).toBeTruthy();
  });
  it("only embeds supported YouTube resources", () => {
    expect(youtubeEmbed("https://youtu.be/abcdefghijk")).toBe(
      "https://www.youtube-nocookie.com/embed/abcdefghijk",
    );
    expect(youtubeEmbed("https://evil.example/watch?v=abcdefghijk")).toBe("");
    expect(
      youtubeEmbed("https://youtube.com/playlist?list=PLabc123"),
    ).toContain("videoseries?list=PLabc123");
  });
  it("blocks incomplete publications and invalid slugs", () => {
    const r = { ...seedRecords[0] };
    expect(validateRecord(r)).toBe("");
    expect(validateRecord({ ...r, body_ha: "" })).toContain("both language");
    expect(validateRecord({ ...r, slug: "<script>" })).toContain("slug");
  });
});
