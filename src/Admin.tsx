import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  LockKeyhole,
  LogOut,
  Plus,
  Save,
  Trash2,
  ImagePlus,
  ShieldCheck,
} from "lucide-react";
import {
  defaultSettings,
  Kind,
  Locale,
  RecordItem,
  seedRecords,
  Settings,
  supabase,
  todayLagos,
  validateRecord,
  safeUrl,
} from "./lib";
const blank = (kind: Kind): RecordItem => ({
  id: crypto.randomUUID(),
  kind,
  slug: "",
  title_en: "",
  title_ha: "",
  body_en: "",
  body_ha: "",
  status: "draft",
  date: todayLagos(),
  category: kind === "article" ? "Community" : "",
  author: "",
  image: "",
  url: "",
  featured: false,
  details: {},
});
export default function Admin({ locale }: { locale: Locale }) {
  const t = (en: string, ha: string) => (locale === "en" ? en : ha);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState("");
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<RecordItem[]>([]);
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [tab, setTab] = useState("event");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [audit, setAudit] = useState<
    { id: number; action: string; created_at: string; actor: string }[]
  >([]);
  const [media, setMedia] = useState<{ name: string; url: string }[]>([]);
  const load = async () => {
    if (!supabase) return;
    const [a, b] = await Promise.all([
      supabase.from("content").select("*").order("date", { ascending: false }),
      supabase.from("settings").select("value").eq("id", "public").single(),
    ]);
    if (a.error) setMessage(a.error.message);
    else setItems(a.data || []);
    if (b.data) setSettings({ ...defaultSettings, ...b.data.value });
  };
  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setRole("");
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session || !supabase) return;
    supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        setRole(data?.role || "none");
        if (error)
          setMessage(
            t(
              "Your account has not been assigned a staff role.",
              "Ba a ba asusunku matsayin ma’aikaci ba.",
            ),
          );
      });
    load();
  }, [session]);
  useEffect(() => {
    if (!supabase || role !== "admin") return;
    if (tab === "audit")
      supabase
        .from("audit_log")
        .select("id,action,created_at,actor")
        .order("created_at", { ascending: false })
        .limit(100)
        .then(({ data, error }) => {
          if (error) setMessage(error.message);
          else setAudit(data || []);
        });
    if (tab === "media")
      supabase.storage
        .from("media")
        .list("", { limit: 100 })
        .then(({ data, error }) => {
          if (error) setMessage(error.message);
          else
            setMedia(
              (data || []).map((f) => ({
                name: f.name,
                url: supabase!.storage.from("media").getPublicUrl(f.name).data
                  .publicUrl,
              })),
            );
        });
  }, [tab, role]);
  const save = async () => {
    if (!selected || !supabase) return;
    const error = validateRecord(selected);
    if (error) {
      setMessage(error);
      return;
    }
    setBusy(true);
    const clean = {
      ...selected,
      status: role === "editor" ? "draft" : selected.status,
    };
    const { error: err } = await supabase.from("content").upsert(clean);
    setBusy(false);
    setMessage(
      err
        ? err.message
        : t(
            "Saved. Refresh public pages to see published changes.",
            "An adana. Ku sabunta shafukan jama’a don ganin abin da aka wallafa.",
          ),
    );
    if (!err) {
      setSelected(null);
      await load();
    }
  };
  const update = (key: keyof RecordItem, value: unknown) =>
    setSelected((s) => (s ? { ...s, [key]: value } : s));
  async function upload(file: File | undefined) {
    if (!file || !supabase) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setMessage(
        t(
          "Choose a JPEG, PNG or WebP image under 5 MB.",
          "Zaɓi hoton JPEG, PNG ko WebP wanda bai kai 5 MB ba.",
        ),
      );
      return;
    }
    setBusy(true);
    const name = `${crypto.randomUUID()}.${file.type.split("/")[1]}`;
    const { error } = await supabase.storage
      .from("media")
      .upload(name, file, { contentType: file.type, upsert: false });
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      const url = supabase.storage.from("media").getPublicUrl(name)
        .data.publicUrl;
      if (selected) update("image", url);
      setMedia((m) => [{ name, url }, ...m]);
      setMessage(t("Image uploaded.", "An ɗora hoto."));
    }
  }
  if (!ready)
    return (
      <section className="section">
        <p role="status">{t("Loading…", "Ana lodawa…")}</p>
      </section>
    );
  if (!supabase)
    return (
      <section className="section admin-setup">
        <LockKeyhole size={32} />
        <p className="eyebrow">{t("ADMINISTRATION", "GUDANARWA")}</p>
        <h1>
          {t(
            "A secure home for your content.",
            "Wurin kula da bayananku cikin tsaro.",
          )}
        </h1>
        <p>
          {t(
            "The public website is ready to explore. Staff sign-in and publishing require the mosque’s Supabase project to be connected.",
            "Shafin jama’a yana shirye. Dole a haɗa aikin Supabase na masallaci don shiga da wallafawa.",
          )}
        </p>
        <div className="notice">
          <strong>
            {t("Backend not connected", "Ba a haɗa bayanan uwar garke ba")}
          </strong>
          <p>
            {t(
              "No demo password or browser-only login is enabled. Follow the deployment guide in the repository to configure authentication, staff roles, database policies and media storage.",
              "Babu kalmar sirri ta gwaji. Ku bi jagorar da ke cikin ma’ajiyar aikin don saita shiga, matsayin ma’aikata, dokokin bayanai da ajiyar hotuna.",
            )}
          </p>
        </div>
        <div className="card-grid">
          {[
            t("Articles & translations", "Rubuce-rubuce da fassara"),
            t("Events & videos", "Taro da bidiyo"),
            t("Media & publishing", "Hotuna da wallafawa"),
          ].map((s) => (
            <div className="plain-card" key={s}>
              <ShieldCheck size={22} />
              <h3>{s}</h3>
            </div>
          ))}
        </div>
      </section>
    );
  if (!session)
    return (
      <section className="section login-section">
        <div className="login-card">
          <LockKeyhole />
          <p className="eyebrow">{t("STAFF ACCESS", "SHIGAR MA’AIKATA")}</p>
          <h1>{t("Welcome back.", "Barka da dawowa.")}</h1>
          <p>
            {t(
              "Sign in to manage mosque content.",
              "Shiga don kula da bayanan masallaci.",
            )}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const { error } = await supabase!.auth.signInWithPassword({
                email,
                password,
              });
              setBusy(false);
              setPassword("");
              setMessage(
                error
                  ? t(
                      "Sign-in failed. Check your details and try again.",
                      "Shiga bai yi nasara ba. Ku duba bayananku ku sake gwadawa.",
                    )
                  : "",
              );
            }}
          >
            <label>
              {t("Email address", "Adireshin imel")}
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              {t("Password", "Kalmar sirri")}
              <input
                type="password"
                autoComplete="current-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button className="button" disabled={busy}>
              {t("Sign in", "Shiga")}
            </button>
          </form>
          <p role="status">{message}</p>
          <p className="muted small-text">
            {t(
              "Accounts are provisioned by the mosque administrator. Contact them for access or password recovery.",
              "Mai gudanarwar masallaci ne yake samar da asusu. Ku tuntube shi don samun damar shiga ko sabunta kalmar sirri.",
            )}
          </p>
        </div>
      </section>
    );
  return (
    <section className="section admin">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {t("CONTENT WORKSPACE", "WURIN KULA DA BAYANAI")}
          </p>
          <h1>{t("Administration", "Gudanarwa")}</h1>
          <p>
            {session.user.email} ·{" "}
            {role || t("Checking access…", "Ana duba izini…")}
          </p>
        </div>
        <button
          className="button outline"
          onClick={() => supabase!.auth.signOut()}
        >
          <LogOut size={16} />
          {t("Sign out", "Fita")}
        </button>
      </div>
      {role === "none" || !role ? (
        <p>
          {t(
            "An administrator must grant your account a staff role before you can make changes.",
            "Dole mai gudanarwa ya ba ku matsayin ma’aikaci kafin ku yi gyara.",
          )}
        </p>
      ) : (
        <>
          <div className="tabs admin-tabs">
            {[
              ["event", "Events", "Taro"],
              ["article", "Articles", "Rubuce-rubuce"],
              ["video", "Videos", "Bidiyo"],
              ...(role === "admin"
                ? [
                    ["media", "Media", "Hotuna"],
                    ["settings", "Settings", "Saituna"],
                    ["audit", "Audit log", "Tarihin ayyuka"],
                  ]
                : []),
            ].map(([id, en, ha]) => (
              <button
                className={tab === id ? "active" : ""}
                key={id}
                onClick={() => {
                  setTab(id);
                  setSelected(null);
                  setMessage("");
                }}
              >
                {t(en, ha)}
              </button>
            ))}
          </div>
          {["event", "article", "video"].includes(tab) ? (
            selected ? (
              <form
                className="editor"
                onSubmit={(e) => {
                  e.preventDefault();
                  save();
                }}
              >
                <div className="section-heading">
                  <h2>{t("Edit content", "Gyara bayanai")}</h2>
                  <button
                    type="button"
                    className="button outline"
                    onClick={() => setSelected(null)}
                  >
                    {t("Cancel", "Soke")}
                  </button>
                </div>
                <div className="form-grid">
                  {(
                    [
                      ["title_en", "English title"],
                      ["title_ha", "Taken Hausa"],
                      ["slug", "URL slug"],
                      ["date", t("Date", "Rana")],
                      ["author", t("Author", "Marubuci")],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        type={key === "date" ? "date" : "text"}
                        required={
                          key !== "author" || selected.kind === "article"
                        }
                        value={selected[key]}
                        maxLength={key === "slug" ? 120 : 300}
                        onChange={(e) => update(key, e.target.value)}
                      />
                    </label>
                  ))}
                  <label>
                    {t("Category", "Rukuni")}
                    <select
                      value={selected.category}
                      onChange={(e) => update("category", e.target.value)}
                    >
                      {[
                        "Qur’an",
                        "Hadith",
                        "Aqidah",
                        "Fiqh",
                        "Seerah",
                        "Community",
                      ].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t("Publication status", "Matsayin wallafawa")}
                    <select
                      disabled={role === "editor"}
                      value={selected.status}
                      onChange={(e) => update("status", e.target.value)}
                    >
                      <option value="draft">{t("Draft", "Daftari")}</option>
                      <option value="published">
                        {t("Published", "An wallafa")}
                      </option>
                    </select>
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={selected.featured}
                      onChange={(e) => update("featured", e.target.checked)}
                    />
                    {t("Feature on homepage", "Nuna a shafin farko")}
                  </label>
                </div>
                <label>
                  English content
                  <textarea
                    rows={8}
                    value={selected.body_en}
                    onChange={(e) => update("body_en", e.target.value)}
                    maxLength={50000}
                  />
                </label>
                <label>
                  Rubutun Hausa
                  <textarea
                    rows={8}
                    value={selected.body_ha}
                    onChange={(e) => update("body_ha", e.target.value)}
                    maxLength={50000}
                  />
                </label>
                {selected.kind === "event" && (
                  <div className="form-grid">
                    <label>
                      {t("Schedule (Africa/Lagos)", "Jadawali (Africa/Lagos)")}
                      <input
                        value={selected.details.time || ""}
                        onChange={(e) =>
                          update("details", {
                            ...selected.details,
                            time: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      {t("Speaker", "Mai gabatarwa")}
                      <input
                        value={selected.details.speaker || ""}
                        onChange={(e) =>
                          update("details", {
                            ...selected.details,
                            speaker: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                )}
                {selected.kind === "video" && (
                  <label>
                    YouTube URL
                    <input
                      type="url"
                      value={selected.url}
                      onChange={(e) => update("url", e.target.value)}
                      required
                    />
                  </label>
                )}
                <label>
                  {t(
                    "Cover / poster image URL",
                    "Adireshin hoton rubutu ko sanarwa",
                  )}
                  <input
                    value={selected.image}
                    onChange={(e) => update("image", e.target.value)}
                  />
                </label>
                {role === "admin" && (
                  <label className="upload">
                    <ImagePlus size={17} />
                    {t("Upload image (max 5 MB)", "Ɗora hoto (iyaka 5 MB)")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => upload(e.target.files?.[0])}
                    />
                  </label>
                )}
                <p className="muted">
                  {t(
                    "Verify names, translations, sources and dates before publishing. HTML is rendered as plain text.",
                    "Ku tabbatar da sunaye, fassara, tushe da ranaku kafin wallafawa. Ana nuna HTML a matsayin rubutu.",
                  )}
                </p>
                <button className="button" disabled={busy}>
                  <Save size={17} />
                  {t("Save content", "Adana bayanai")}
                </button>
              </form>
            ) : (
              <>
                <div className="section-heading">
                  <h2>{t("Manage content", "Kula da bayanai")}</h2>
                  <button
                    className="button"
                    onClick={() => setSelected(blank(tab as Kind))}
                  >
                    <Plus size={17} />
                    {t("Create new", "Ƙirƙiri sabo")}
                  </button>
                </div>
                {items
                  .filter((r) => r.kind === tab)
                  .map((r) => (
                    <div className="admin-row" key={r.id}>
                      <div>
                        <strong>{r.title_en}</strong>
                        <p>
                          {r.status} · {r.date} · {r.slug}
                        </p>
                      </div>
                      <button
                        className="button outline"
                        onClick={() => setSelected(r)}
                      >
                        {t("Edit", "Gyara")}
                      </button>
                      {role === "admin" && (
                        <button
                          className="icon-button"
                          aria-label={`${t("Delete", "Goge")} ${r.title_en}`}
                          onClick={async () => {
                            if (
                              !window.confirm(
                                t(
                                  "Delete this record permanently?",
                                  "A goge wannan bayanin har abada?",
                                ),
                              )
                            )
                              return;
                            const { error } = await supabase!
                              .from("content")
                              .delete()
                              .eq("id", r.id);
                            setMessage(
                              error ? error.message : t("Deleted.", "An goge."),
                            );
                            load();
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                {!items.some((r) => r.kind === tab) && (
                  <p className="notice">
                    {t(
                      "No content yet. Create a draft to begin.",
                      "Babu bayanai tukuna. Ku ƙirƙiri daftari don farawa.",
                    )}
                  </p>
                )}
                {role === "admin" &&
                  tab === "event" &&
                  !items.some((r) => r.slug === seedRecords[0].slug) && (
                    <button
                      className="button outline"
                      onClick={async () => {
                        const { error } = await supabase!
                          .from("content")
                          .insert({
                            ...seedRecords[0],
                            id: crypto.randomUUID(),
                          });
                        setMessage(
                          error
                            ? error.message
                            : t(
                                "Verified archive event imported.",
                                "An shigo da tabbataccen taron da ya gabata.",
                              ),
                        );
                        load();
                      }}
                    >
                      {t(
                        "Import verified archive event",
                        "Shigo da tabbataccen taron da ya gabata",
                      )}
                    </button>
                  )}
              </>
            )
          ) : tab === "settings" ? (
            <form
              className="editor"
              onSubmit={async (e) => {
                e.preventDefault();
                for (const [key, host] of [
                  ["facebook_url", "facebook.com"],
                  ["youtube_url", "youtube.com"],
                  ["tiktok_url", "tiktok.com"],
                ] as const) {
                  if (settings[key] && !safeUrl(settings[key], host)) {
                    setMessage(`Use an HTTPS ${host} URL.`);
                    return;
                  }
                }
                setBusy(true);
                const { error } = await supabase!
                  .from("settings")
                  .upsert({ id: "public", value: settings });
                setBusy(false);
                setMessage(
                  error
                    ? error.message
                    : t("Settings saved.", "An adana saituna."),
                );
              }}
            >
              <h2>
                {t(
                  "Verified links & mission",
                  "Tabbatattun hanyoyin haɗi da manufa",
                )}
              </h2>
              <p>
                {t(
                  "Only add official URLs after the mosque confirms ownership. Leave unknown links empty.",
                  "Ku ƙara hanyoyin hukuma ne kawai bayan masallaci ya tabbatar da mallaka. Ku bar waɗanda ba a sani ba babu komai.",
                )}
              </p>
              {Object.entries(settings).map(([key, value]) => (
                <label key={key}>
                  {key.replaceAll("_", " ")}
                  {key.startsWith("mission") ? (
                    <textarea
                      value={value}
                      onChange={(e) =>
                        setSettings({ ...settings, [key]: e.target.value })
                      }
                    />
                  ) : (
                    <input
                      type="url"
                      value={value}
                      onChange={(e) =>
                        setSettings({ ...settings, [key]: e.target.value })
                      }
                    />
                  )}
                </label>
              ))}
              <button className="button" disabled={busy}>
                <Save size={16} />
                {t("Save settings", "Adana saituna")}
              </button>
            </form>
          ) : tab === "media" ? (
            <div>
              <h2>{t("Media library", "Ɗakin hotuna")}</h2>
              <label className="upload">
                {t("Upload image", "Ɗora hoto")}
                <input
                  disabled={busy}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => upload(e.target.files?.[0])}
                />
              </label>
              <div className="card-grid">
                {media.map((m) => (
                  <article className="plain-card" key={m.name}>
                    <img className="media-thumb" src={m.url} alt="" />
                    <label>
                      {t("Image URL", "Adireshin hoto")}
                      <input
                        readOnly
                        value={m.url}
                        onFocus={(e) => e.target.select()}
                      />
                    </label>
                    <p className="small-text">{m.name}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h2>
                {t(
                  "Recent administrative actions",
                  "Ayyukan gudanarwa na kwanan nan",
                )}
              </h2>
              {audit.map((a) => (
                <div className="admin-row" key={a.id}>
                  <strong>{a.action}</strong>
                  <span>
                    {new Date(a.created_at).toLocaleString(
                      locale === "en" ? "en-GB" : "ha-NG",
                      { timeZone: "Africa/Lagos" },
                    )}
                  </span>
                  <code>{a.actor}</code>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <p role="status" className={message ? "notice" : ""}>
        {message}
      </p>
    </section>
  );
}
