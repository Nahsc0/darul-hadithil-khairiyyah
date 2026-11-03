import { createClient } from "@supabase/supabase-js";
import seed from "./content.json";
export { seed };
export type Locale = "en" | "ha";
export type Kind = "event" | "article" | "video";
export type RecordItem = {
  id: string;
  kind: Kind;
  slug: string;
  title_en: string;
  title_ha: string;
  body_en: string;
  body_ha: string;
  status: "draft" | "published";
  date: string;
  category: string;
  author: string;
  image: string;
  url: string;
  featured: boolean;
  details: { time?: string; speaker?: string; topic?: string };
};
export type Settings = {
  facebook_url: string;
  youtube_url: string;
  tiktok_url: string;
  mission_en: string;
  mission_ha: string;
};
export const defaultSettings: Settings = {
  facebook_url: "",
  youtube_url: "",
  tiktok_url: "",
  mission_en:
    "A place for worship, Islamic learning and community connection in Kabama Layout, Zaria.",
  mission_ha:
    "Wurin ibada, koyon ilimin Musulunci da haɗin kan al’umma a Kabama Layout, Zariya.",
};
const env = import.meta.env;
export const supabase =
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY
    ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
    : null;
export const asset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
export const poster = Object.keys(import.meta.glob("/public/assets/posters/*"))
  .map((p) => p.replace("/public/", ""))
  .find((p) => p.includes("/18-"))!;
export const seedRecords: RecordItem[] = [
  {
    id: "seed-event",
    kind: "event",
    slug: "jumuah-prayer-islamic-lecture-2026",
    title_en: seed.past_events[0].title,
    title_ha: "Sallar Juma’a da Wa’azin Musulunci",
    body_en: seed.past_events[0].lecture_topic_en,
    body_ha: seed.past_events[0].lecture_topic_ha,
    status: "published",
    date: "2026-10-30",
    category: "Community",
    author: "",
    image: poster,
    url: "",
    featured: true,
    details: {
      time: "12:00 · Khutbah / 12:30 · Jumu’ah",
      speaker: seed.past_events[0].lecture_speaker,
      topic: "At-Taqwa",
    },
  },
];
export function todayLagos(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function isPast(date: string, now = new Date()) {
  return date < todayLagos(now);
}
export function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ha" ? "ha-NG" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(`${date}T12:00:00+01:00`));
}
export function safeUrl(value: string, host?: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" &&
      (!host || u.hostname === host || u.hostname.endsWith("." + host))
      ? u.href
      : "";
  } catch {
    return "";
  }
}
export function imageUrl(value: string) {
  return value.startsWith("assets/") ? asset(value) : safeUrl(value);
}
export function youtubeEmbed(url: string) {
  try {
    const u = new URL(safeUrl(url));
    const id =
      u.hostname === "youtu.be"
        ? u.pathname.slice(1)
        : u.hostname === "www.youtube.com" || u.hostname === "youtube.com"
          ? u.searchParams.get("v")
          : null;
    if (id && /^[\w-]{11}$/.test(id))
      return `https://www.youtube-nocookie.com/embed/${id}`;
    const list = u.searchParams.get("list");
    if (
      (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") &&
      list &&
      /^[\w-]+$/.test(list)
    )
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${list}`;
  } catch {
    /* invalid links do not embed */
  }
  return "";
}
export function nextLecture(now = new Date()) {
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "Africa/Lagos",
  })
    .format(now)
    .toLowerCase();
  const next =
    day === "saturday" ? "sunday" : day === "friday" ? "saturday" : "friday";
  return {
    day: next,
    lecture: seed.weekly_lectures[next as keyof typeof seed.weekly_lectures][0],
  };
}
export function validateRecord(r: RecordItem) {
  if (!r.title_en.trim() || !r.title_ha.trim())
    return "Both language titles are required.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug))
    return "Use a lowercase slug with hyphens.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || isNaN(Date.parse(r.date)))
    return "A valid date is required.";
  if (r.status === "published" && (!r.body_en.trim() || !r.body_ha.trim()))
    return "Add both language versions before publishing.";
  if (r.kind === "video" && !youtubeEmbed(r.url))
    return "Use a valid YouTube video or playlist URL.";
  if (r.image && !imageUrl(r.image))
    return "Use an HTTPS image URL or a bundled asset path.";
  return "";
}
