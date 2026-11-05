import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock3,
  MapPin,
  Phone,
  Menu,
  X,
  Globe2,
  Play,
  Users,
  ChevronRight,
  Download,
  Share2,
  Facebook,
  Youtube,
  CircleHelp,
  Leaf,
  HeartHandshake,
} from "lucide-react";
import {
  asset,
  defaultSettings,
  formatDate,
  imageUrl,
  isPast,
  Locale,
  nextLecture,
  RecordItem,
  safeUrl,
  seed,
  seedRecords,
  Settings,
  supabase,
  youtubeEmbed,
} from "./lib";
import Admin from "./Admin";
import { Calendar, Education, IntakeForm } from "./Community";
type T = (en: string, ha: string) => string;
const nav = [
  ["/", "Home", "Gida"],
  ["/about", "About", "Game da mu"],
  ["/lectures", "Weekly lectures", "Darussukan mako"],
  ["/events", "Events", "Taro"],
  ["/blog", "Journal", "Rubuce-rubuce"],
  ["/videos", "Videos", "Bidiyo"],
  ["/calendar", "Calendar", "Kalanda"],
  ["/education", "Education", "Ilimi"],
  ["/register", "Student registration", "Rajistar ɗalibai"],
  ["/requests", "Send a request", "Aika buƙata"],
  ["/contact", "Contact", "Tuntuɓa"],
];
export default function App() {
  const [locale, setLocale] = useState<Locale>(() =>
    localStorage.getItem("locale") === "ha" ? "ha" : "en",
  );
  const [path, setPath] = useState(location.hash.slice(1).split("?")[0] || "/");
  const [menu, setMenu] = useState(false);
  const [records, setRecords] = useState<RecordItem[]>(seedRecords);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loadError, setLoadError] = useState(false);
  const t: T = (en, ha) => (locale === "en" ? en : ha);
  useEffect(() => {
    const handle = () => {
      setPath(location.hash.slice(1).split("?")[0] || "/");
      setMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem("locale", locale);
  }, [locale]);
  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from("content").select("*").eq("status", "published"),
      supabase.from("settings").select("value").eq("id", "public").single(),
    ]).then(([a, b]) => {
      if (a.error) {
        setLoadError(true);
        return;
      }
      setRecords(a.data || []);
      if (b.data) setSettings({ ...defaultSettings, ...b.data.value });
    });
  }, []);
  useEffect(() => {
    const label =
      nav.find((n) => n[0] === path)?.[locale === "en" ? 1 : 2] ||
      t("Community", "Al’umma");
    document.title = `${label} | ${seed.identity.name}`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        t(
          "Worship, weekly Islamic lectures and community events in Kabama Layout, Zaria.",
          "Ibada, darussukan Musulunci na mako da taron al’umma a Kabama Layout, Zariya.",
        ),
      );
  }, [path, locale]);
  const articles = records.filter((r) => r.kind === "article");
  const events = records.filter((r) => r.kind === "event");
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        {t("Skip to content", "Tsallaka zuwa abun ciki")}
      </a>
      <header>
        <div className="nav-wrap">
          <a className="brand" href="#/" aria-label={seed.identity.name}>
            <img src={asset("assets/originals/mosque-logo.jpeg")} alt="" />
            <span>
              Darul Hadithil<small>Khairiyyah</small>
            </span>
          </a>
          <nav
            id="main-navigation"
            aria-label={t("Main navigation", "Babban kewayawa")}
            className={menu ? "open" : ""}
          >
            {nav.map(([url, en, ha]) => (
              <a
                key={url}
                href={`#${url}`}
                onClick={() => setMenu(false)}
                aria-current={path === url ? "page" : undefined}
              >
                {t(en, ha)}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <button
              className="language"
              onClick={() => setLocale(locale === "en" ? "ha" : "en")}
              aria-label={t("Switch to Hausa", "Sauya zuwa Turanci")}
            >
              <Globe2 size={15} />
              {locale === "en" ? "HA" : "EN"}
            </button>
            <a href="#/contact" className="button small desktop-contact">
              {t("Visit us", "Ziyarce mu")}
              <ArrowUpRight size={15} />
            </a>
            <button
              className="menu-button icon-button"
              onClick={() => setMenu(!menu)}
              aria-expanded={menu}
              aria-controls="main-navigation"
              aria-label={t("Toggle menu", "Buɗe ko rufe menu")}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {loadError && (
          <p className="notice">
            {t(
              "Live content is temporarily unavailable. Showing the verified mosque information.",
              "Ba a samu bayanai na yanzu ba. Ana nuna tabbatattun bayanan masallaci.",
            )}
          </p>
        )}
        {path === "/" ? (
          <Home
            t={t}
            locale={locale}
            articles={articles}
            events={events}
            settings={settings}
          />
        ) : path === "/about" ? (
          <>
            <PageHead
              eyebrow={t("OUR COMMUNITY", "AL’UMMARMU")}
              title={t(
                "Rooted in faith.\nTogether in learning.",
                "Ginshiƙinmu imani.\nTare muke koyo.",
              )}
              text={locale === "en" ? settings.mission_en : settings.mission_ha}
            />
            <section className="section two-column">
              <div>
                <p className="eyebrow">
                  {t("A SHARED PURPOSE", "MANUFA GUDA")}
                </p>
                <h2>
                  {t(
                    "A place to learn,\nand belong.",
                    "Wurin koyo\nda haɗin kai.",
                  )}
                </h2>
                <p>
                  {t(
                    "Join our weekly programme of Qur’an, Hadith, faith and Islamic learning. The supplied schedule includes learning opportunities throughout Friday, Saturday and Sunday.",
                    "Ku halarci darussukan Alƙur’ani, Hadisi, aqida da ilimin Musulunci na kowane mako. Darussukan suna gudana ranar Juma’a, Asabar da Lahadi.",
                  )}
                </p>
                <a className="text-link" href="#/lectures">
                  {t("Explore the programme", "Duba tsarin darussa")}
                  <ArrowRight size={16} />
                </a>
              </div>
              <div className="values">
                {[
                  [
                    BookOpen,
                    t("Knowledge", "Ilimi"),
                    t(
                      "Learning through the Qur’an and Sunnah.",
                      "Koyo ta hanyar Alƙur’ani da Sunnah.",
                    ),
                  ],
                  [
                    Leaf,
                    t("Worship", "Ibada"),
                    t(
                      "A space for reflection and devotion.",
                      "Wurin tunani da ibada.",
                    ),
                  ],
                  [
                    HeartHandshake,
                    t("Community", "Al’umma"),
                    t(
                      "Connecting through shared learning.",
                      "Haɗin kai ta hanyar koyo tare.",
                    ),
                  ],
                ].map(([Icon, title, desc]) => {
                  const I = Icon as typeof BookOpen;
                  return (
                    <div className="value" key={String(title)}>
                      <I size={22} />
                      <div>
                        <h3>{String(title)}</h3>
                        <p>{String(desc)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="section line-top">
              <h2>{t("Meet the speakers", "Masu gabatar da darussa")}</h2>
              <Speakers t={t} />
              <p className="muted small-text">
                {t(
                  "Further details about our history and leadership will be added after verification.",
                  "Za a ƙara tarihinmu da bayanan shugabanni bayan tabbatarwa.",
                )}
              </p>
            </section>
          </>
        ) : path === "/lectures" ? (
          <Lectures t={t} />
        ) : path === "/events" ? (
          <Events t={t} locale={locale} events={events} />
        ) : path.startsWith("/events/") ? (
          <EventDetail
            record={events.find((r) => r.slug === path.split("/")[2])}
            t={t}
            locale={locale}
          />
        ) : path === "/blog" ? (
          <Blog t={t} locale={locale} articles={articles} />
        ) : path.startsWith("/blog/") ? (
          <Article
            record={articles.find((r) => r.slug === path.split("/")[2])}
            t={t}
            locale={locale}
          />
        ) : path === "/videos" ? (
          <>
            <PageHead
              eyebrow={t("WATCH & LEARN", "KALLA KA KOYA")}
              title={t("Learning, wherever you are.", "Koyo, duk inda kuke.")}
              text={t(
                "Lectures and reflections from our community.",
                "Darussa da tunatarwa daga al’ummarmu.",
              )}
            />
            <section className="section">
              {safeUrl(settings.youtube_url, "youtube.com") ? (
                records.filter((r) => r.kind === "video" && youtubeEmbed(r.url))
                  .length ? (
                  <div className="card-grid">
                    {records
                      .filter((r) => r.kind === "video" && youtubeEmbed(r.url))
                      .map((r) => (
                        <article className="video-card" key={r.id}>
                          <iframe
                            loading="lazy"
                            src={youtubeEmbed(r.url)}
                            title={locale === "en" ? r.title_en : r.title_ha}
                            allowFullScreen
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                          <h3>{locale === "en" ? r.title_en : r.title_ha}</h3>
                        </article>
                      ))}
                  </div>
                ) : (
                  <Empty
                    icon={<Play />}
                    title={t("Videos coming soon", "Bidiyo na nan tafe")}
                    text={t(
                      "Our first videos will appear here when published.",
                      "Za a nuna bidiyonmu a nan idan an wallafa.",
                    )}
                  />
                )
              ) : (
                <Empty
                  icon={<Play />}
                  title={t("Videos coming soon", "Bidiyo na nan tafe")}
                  text={t(
                    "Our official YouTube channel is being confirmed. Please check back.",
                    "Ana tabbatar da tasharmu ta YouTube. Ku sake dubawa nan gaba.",
                  )}
                />
              )}
            </section>
          </>
        ) : path === "/connect" ? (
          <>
            <PageHead
              eyebrow={t("STAY CONNECTED", "KU KASANCE TARE DA MU")}
              title={t(
                "Our community, beyond the mosque.",
                "Al’ummarmu, har wajen masallaci.",
              )}
              text={t(
                "Official social links will appear here once verified.",
                "Za a nuna hanyoyin sadarwarmu a nan bayan tabbatarwa.",
              )}
            />
            <section className="section card-grid">
              {[
                [
                  Facebook,
                  "Facebook",
                  "Umar Kamaludeen",
                  safeUrl(settings.facebook_url, "facebook.com"),
                ],
                [
                  Youtube,
                  "YouTube",
                  t("Lectures & playlists", "Darussa da jerin bidiyo"),
                  safeUrl(settings.youtube_url, "youtube.com"),
                ],
                [
                  Globe2,
                  "TikTok",
                  t("Community updates", "Labaran al’umma"),
                  safeUrl(settings.tiktok_url, "tiktok.com"),
                ],
              ].map(([Icon, name, desc, url]) => {
                const I = Icon as typeof Facebook;
                return (
                  <article className="plain-card" key={String(name)}>
                    <I />
                    <h2>{String(name)}</h2>
                    <p>{String(desc)}</p>
                    {url ? (
                      <a
                        className="text-link"
                        href={String(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("Visit official page", "Ziyarci shafin hukuma")}
                        <ArrowUpRight size={16} />
                      </a>
                    ) : (
                      <span className="badge">
                        {t(
                          "Link awaiting verification",
                          "Ana jiran tabbatar da hanyar haɗi",
                        )}
                      </span>
                    )}
                  </article>
                );
              })}
            </section>
          </>
        ) : path === "/calendar" ? (
          <Calendar t={t} locale={locale} />
        ) : path === "/education" ? (
          <Education t={t} />
        ) : path === "/register" || path === "/requests" ? (
          <IntakeForm key={path} t={t} student={path === "/register"} />
        ) : path === "/contact" ? (
          <>
            <PageHead
              eyebrow={t("YOU ARE WELCOME", "BARKANKU DA ZUWA")}
              title={t("Come and join us.", "Ku zo mu kasance tare.")}
              text={t(
                "Visit, call or explore our weekly lecture programme.",
                "Ku ziyarce mu, ku kira ko ku duba darussukanmu na mako.",
              )}
            />
            <section className="section two-column">
              <div className="contact-card">
                <MapPin />
                <h2>{t("Find us in Zaria", "Ku same mu a Zariya")}</h2>
                <p>{seed.identity.location}</p>
                <p className="muted">
                  {t(
                    "Call for directions before your first visit.",
                    "Ku kira don samun kwatancen hanya kafin ziyararku ta farko.",
                  )}
                </p>
                <a className="text-link" href="#/lectures">
                  {t("Plan around a lecture", "Duba lokacin darasi")}
                  <ArrowRight size={16} />
                </a>
              </div>
              <div>
                <p className="eyebrow">{t("LET’S TALK", "KU TUNTUBE MU")}</p>
                <h2>
                  {t(
                    "A warm welcome\nstarts with a call.",
                    "Maraba da ku.\nKu kira mu.",
                  )}
                </h2>
                <a className="button" href="#/requests">
                  {t("Send a request", "Aika buƙata")}
                </a>
                {seed.identity.phone.map((phone) => (
                  <a className="phone-row" key={phone} href={`tel:${phone}`}>
                    <Phone size={20} />
                    {phone}
                    <ArrowUpRight size={18} />
                  </a>
                ))}
                <p className="muted">
                  {t(
                    "For visit enquiries and programme information, please use the verified phone numbers above.",
                    "Don tambayoyi game da ziyara da darussa, ku yi amfani da lambobin wayar da ke sama.",
                  )}
                </p>
              </div>
            </section>
          </>
        ) : path === "/admin" ? (
          <Admin locale={locale} />
        ) : (
          <NotFound t={t} />
        )}
      </main>
      <section className="welcome-band">
        <div>
          <p className="eyebrow">
            {t("THERE’S A PLACE FOR YOU HERE", "AKWAI WURI GARE KU A NAN")}
          </p>
          <h2>
            {t("Let’s grow in knowledge, together.", "Mu haɓaka ilimi tare.")}
          </h2>
        </div>
        <a className="button ivory" href="#/contact">
          {t("Plan your visit", "Shirya ziyararku")}
          <ArrowUpRight size={18} />
        </a>
      </section>
      <footer>
        <div className="footer-top">
          <div>
            <a className="brand footer-brand" href="#/">
              <img src={asset("assets/originals/mosque-logo.jpeg")} alt="" />
              <span>
                Darul Hadithil<small>Khairiyyah</small>
              </span>
            </a>
            <p>
              {t("Knowledge. Worship. Community.", "Ilimi. Ibada. Al’umma.")}
            </p>
            <span className="location">
              <MapPin size={14} /> {seed.identity.location}
            </span>
          </div>
          <div>
            <h3>{t("Explore", "Bincika")}</h3>
            <a href="#/lectures">{t("Weekly lectures", "Darussukan mako")}</a>
            <a href="#/events">{t("Events", "Taro")}</a>
            <a href="#/blog">{t("Journal", "Rubuce-rubuce")}</a>
          </div>
          <div>
            <h3>{t("Connect", "Tuntuɓa")}</h3>
            <a href="#/contact">
              {t("Contact & directions", "Tuntuɓa da hanya")}
            </a>
            <a href="#/connect">{t("Social media", "Kafofin sada zumunta")}</a>
            <a href="#/admin">{t("Administration", "Gudanarwa")}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Darul Hadithil Khairiyyah</span>
          <span>{t("Made for our community.", "An yi don al’ummarmu.")}</span>
        </div>
      </footer>
    </>
  );
}
function PageHead({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <section className="page-head">
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lead">{text}</p>
      </div>
    </section>
  );
}
function Home({
  t,
  locale,
  articles,
  events,
  settings,
}: {
  t: T;
  locale: Locale;
  articles: RecordItem[];
  events: RecordItem[];
  settings: Settings;
}) {
  const next = nextLecture();
  const featured = articles.find((a) => a.featured) || articles[0];
  const spotlight = events.find((e) => e.featured) || events[0];
  const day =
    next.day === "friday"
      ? t("Friday", "Juma’a")
      : next.day === "saturday"
        ? t("Saturday", "Asabar")
        : t("Sunday", "Lahadi");
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow location">
            <span className="dot" />
            {t("KABAMA LAYOUT · ZARIA", "KABAMA LAYOUT · ZARIYA")}
          </div>
          <h1>
            {t("A place for faith.", "Wurin imani.")}
            <br />
            <em>{t("A life of learning.", "Rayuwar neman ilimi.")}</em>
          </h1>
          <p>
            {t(
              "Come together in worship, grow in knowledge, and find community at Darul Hadithil Khairiyyah.",
              "Mu haɗu wajen ibada, mu haɓaka ilimi, mu ƙarfafa zumunci a Darul Hadithil Khairiyyah.",
            )}
          </p>
          <div className="hero-buttons">
            <a className="button" href="#/lectures">
              {t("Weekly lectures", "Darussukan mako")}
              <ArrowUpRight size={18} />
            </a>
            <a className="button outline" href="#/events">
              {t("Upcoming events", "Taro masu zuwa")}
              <ArrowRight size={17} />
            </a>
          </div>
          <div className="hero-note">
            <BookOpen size={16} />
            <span>
              {t(
                "Rooted in the Qur’an. Guided by the Sunnah.",
                "Alƙur’ani da Sunnah su ne jagora.",
              )}
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="arch-mark">
            <img
              src={asset("assets/originals/mosque-logo.jpeg")}
              alt="Darul Hadithil Khairiyyah — official mosque logo"
            />
            <span className="arabic" lang="ar">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </span>
          </div>
          <div className="visual-caption">
            <span>01 /</span>{" "}
            {t("KNOWLEDGE • WORSHIP • COMMUNITY", "ILIMI • IBADA • AL’UMMA")}
          </div>
        </div>
      </section>
      <section className="next-strip">
        <div className="next-label">
          <CalendarDays size={22} />
          <span className="eyebrow">
            {t("NEXT LECTURE DAY", "RANAR DARASI TA GABA")}
          </span>
        </div>
        <div>
          <strong>{day}</strong>
          <span>{next.lecture.when}</span>
        </div>
        <p>{next.lecture.title}</p>
        <a
          href="#/lectures"
          aria-label={t(
            "View the full lecture schedule",
            "Duba cikakken tsarin darussa",
          )}
        >
          <ArrowRight size={22} />
        </a>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t("FAITH IN EVERYDAY LIFE", "IMANI A RAYUWAR KULLUM")}
            </p>
            <h2>
              {t("Learn. Reflect. Connect.", "Koya. Yi tunani. Haɗa kai.")}
            </h2>
          </div>
          <p>
            {t(
              "A welcoming space for a shared journey\nof knowledge and worship.",
              "Wurin maraba don tafiya tare\na neman ilimi da ibada.",
            )}
          </p>
        </div>
        <div className="feature-grid">
          {[
            [
              BookOpen,
              "01",
              t("Weekly learning", "Darussukan mako"),
              t(
                "Explore our Friday, Saturday and Sunday lectures.",
                "Duba darussukan Juma’a, Asabar da Lahadi.",
              ),
              "/lectures",
            ],
            [
              CalendarDays,
              "02",
              t("Gather as a community", "Haɗuwar al’umma"),
              t(
                "Discover gatherings, lectures and community events.",
                "Duba taro, wa’azi da al’amuran al’umma.",
              ),
              "/events",
            ],
            [
              Users,
              "03",
              t("Get to know us", "Ku san mu"),
              t(
                "Discover our shared purpose and meet the speakers.",
                "Ku san manufarmu da masu gabatar da darussa.",
              ),
              "/about",
            ],
          ].map(([Icon, num, title, desc, url]) => {
            const I = Icon as typeof BookOpen;
            return (
              <a className="feature-card" href={`#${url}`} key={String(num)}>
                <div className="feature-top">
                  <I size={25} />
                  <span>{String(num)}</span>
                </div>
                <h3>{String(title)}</h3>
                <p>{String(desc)}</p>
                <ArrowUpRight size={19} />
              </a>
            );
          })}
        </div>
      </section>
      <section className="learning-section">
        <div className="section two-column">
          <div>
            <p className="eyebrow">
              {t("A WEEKLY INVITATION", "GAYYATAR KOWANE MAKO")}
            </p>
            <h2>
              {t("Make room\nfor knowledge.", "Ku ba ilimi\nwuri a rayuwa.")}
            </h2>
            <p>
              {t(
                "From Qur’an and Hadith to faith and the life of the Prophet, explore the weekly programme and choose a lecture to attend.",
                "Daga Alƙur’ani da Hadisi zuwa aqida da tarihin Annabi, ku duba tsarin darussukan mako ku zaɓi darasin da za ku halarta.",
              )}
            </p>
            <a href="#/lectures" className="text-link">
              {t("See the full schedule", "Duba cikakken jadawali")}
              <ArrowRight size={17} />
            </a>
          </div>
          <div className="schedule-preview">
            {[
              ["friday", t("Friday", "Juma’a"), "03"],
              ["saturday", t("Saturday", "Asabar"), "04"],
              ["sunday", t("Sunday", "Lahadi"), "04"],
            ].map(([d, label, count]) => (
              <a href={`#/lectures?day=${d}`} className="day-preview" key={d}>
                <div>
                  <h3>{label}</h3>
                  <span>{t("Weekly lectures", "Darussukan mako")}</span>
                </div>
                <span>
                  {count} <BookOpen size={16} />
                </span>
                <ChevronRight size={20} />
              </a>
            ))}
            <p>
              <Clock3 size={14} />
              {t(
                "All clock times are local to Zaria (Africa/Lagos).",
                "Dukkan lokuta na Zariya ne (Africa/Lagos).",
              )}
            </p>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t("FROM OUR COMMUNITY", "DAGA AL’UMMARMU")}
            </p>
            <h2>
              {t(
                "Shared moments. Lasting learning.",
                "Lokuta tare. Ilimi mai ɗorewa.",
              )}
            </h2>
          </div>
          <a href="#/events" className="text-link">
            {t("All events", "Dukkan taro")}
            <ArrowUpRight size={16} />
          </a>
        </div>
        {spotlight ? (
          <div className="two-column archive-feature">
            <div className="archive-image">
              <img
                src={
                  spotlight.slug === "jumuah-prayer-islamic-lecture-2026"
                    ? asset("assets/originals/muhammad-auwal-mai-shago.jpeg")
                    : imageUrl(spotlight.image) ||
                      asset("assets/originals/mosque-logo.jpeg")
                }
                alt={
                  spotlight.slug === "jumuah-prayer-islamic-lecture-2026"
                    ? seed.speakers[0].name
                    : locale === "en"
                      ? spotlight.title_en
                      : spotlight.title_ha
                }
                loading="lazy"
              />
              <span className="image-label">
                {t("COMMUNITY LECTURE", "WA’AZIN AL’UMMA")}
              </span>
            </div>
            <div>
              <span className="badge">
                {isPast(spotlight.date)
                  ? t("PAST EVENT", "TARON DA YA GABATA")
                  : t("UPCOMING EVENT", "TARO MAI ZUWA")}
              </span>
              <p className="date">{formatDate(spotlight.date, locale)}</p>
              <h2>
                {spotlight.slug === "jumuah-prayer-islamic-lecture-2026"
                  ? t(
                      "Building a stronger community through knowledge.",
                      "Gina al’umma mai ƙarfi ta hanyar ilimi.",
                    )
                  : locale === "en"
                    ? spotlight.title_en
                    : spotlight.title_ha}
              </h2>
              <p>
                {locale === "en"
                  ? spotlight.body_en.slice(0, 220)
                  : spotlight.body_ha.slice(0, 220)}
              </p>
              <a className="text-link" href={`#/events/${spotlight.slug}`}>
                {t("Explore the event", "Duba taron")}
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
        ) : (
          <Empty
            icon={<CalendarDays />}
            title={t("More shared moments ahead.", "Ƙarin taro na nan tafe.")}
            text={t(
              "Confirmed community events will appear here.",
              "Za a nuna tabbatattun taron al’umma a nan.",
            )}
          />
        )}
      </section>
      <section className="section line-top">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t("CONTINUE YOUR LEARNING", "CI GABA DA NEMAN ILIMI")}
            </p>
            <h2>
              {t("The journal & video library", "Rubuce-rubuce da bidiyo")}
            </h2>
          </div>
        </div>
        <div className="two-column">
          <a
            className="resource-card"
            href={featured ? `#/blog/${featured.slug}` : "#/blog"}
          >
            <BookOpen />
            <div>
              <span className="eyebrow">{t("READ", "KARANTA")}</span>
              <h3>
                {featured
                  ? locale === "en"
                    ? featured.title_en
                    : featured.title_ha
                  : t(
                      "Thoughtful reading, coming soon.",
                      "Rubuce-rubuce na nan tafe.",
                    )}
              </h3>
              <p>
                {t(
                  "Explore articles from our community.",
                  "Karanta rubuce-rubucen al’ummarmu.",
                )}
              </p>
            </div>
            <ArrowUpRight />
          </a>
          <a className="resource-card dark" href="#/videos">
            <Play />
            <div>
              <span className="eyebrow">{t("WATCH", "KALLA")}</span>
              <h3>
                {settings.youtube_url
                  ? t("Explore the video library", "Duba ɗakin bidiyo")
                  : t(
                      "A new way to learn, coming soon.",
                      "Sabuwar hanyar koyo na nan tafe.",
                    )}
              </h3>
              <p>
                {t(
                  "Lectures to return to, wherever you are.",
                  "Darussukan da za ku koma gare su ko ina kuke.",
                )}
              </p>
            </div>
            <ArrowUpRight />
          </a>
        </div>
      </section>
    </>
  );
}
function Speakers({ t }: { t: T }) {
  return (
    <div className="speaker-grid">
      {seed.speakers.map((s, i) => (
        <article className="speaker" key={s.name}>
          <img src={asset(s.photo)} alt={s.name} loading="lazy" />
          <div>
            <h3>{s.name}</h3>
            <p>
              {i === 0
                ? t(
                    "Islamic lecture speaker",
                    "Mai gabatar da wa’azin Musulunci",
                  )
                : t("Jumu’ah khutbah speaker", "Mai huɗubar Juma’a")}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
function Lectures({ t }: { t: T }) {
  const q = location.hash.split("?")[1];
  const initial = new URLSearchParams(q).get("day");
  const [day, setDay] = useState(
    initial && ["friday", "saturday", "sunday"].includes(initial)
      ? initial
      : "friday",
  );
  return (
    <>
      <PageHead
        eyebrow={t("THE WEEKLY PROGRAMME", "TSARIN MAKO")}
        title={t("A rhythm of learning.", "Dorewar neman ilimi.")}
        text={t(
          "Join us each Friday, Saturday and Sunday. There is always more to discover.",
          "Ku kasance tare da mu a Juma’a, Asabar da Lahadi. Koyo ba ya ƙarewa.",
        )}
      />
      <section className="section">
        <div
          className="tabs"
          role="tablist"
          aria-label={t("Lecture days", "Ranaku na darussa")}
        >
          {[
            ["friday", "Friday", "Juma’a"],
            ["saturday", "Saturday", "Asabar"],
            ["sunday", "Sunday", "Lahadi"],
          ].map(([d, en, ha]) => (
            <button
              role="tab"
              aria-selected={day === d}
              aria-controls="lecture-panel"
              id={`tab-${d}`}
              key={d}
              className={day === d ? "active" : ""}
              onClick={() => setDay(d)}
            >
              {t(en, ha)}
            </button>
          ))}
        </div>
        <div
          className="lecture-list"
          id="lecture-panel"
          role="tabpanel"
          aria-labelledby={`tab-${day}`}
        >
          {seed.weekly_lectures[day as keyof typeof seed.weekly_lectures].map(
            (l, i) => (
              <article className="lecture-row" key={l.title}>
                <span className="lecture-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <span className="eyebrow">
                    {t("WEEKLY LECTURE", "DARASIN MAKO")}
                  </span>
                  <h2>{l.title}</h2>
                  {"audience" in l && (
                    <span className="badge">{t("Women", "Mata")}</span>
                  )}
                </div>
                <span className="lecture-time">
                  <Clock3 size={17} />
                  {localeTime(l.when, t)}
                </span>
              </article>
            ),
          )}
        </div>
        <p className="schedule-note">
          <CircleHelp size={17} />
          {t(
            "“After” prayer labels are relative to the prayer, not calculated prayer times. Clock times use Africa/Lagos.",
            "Kalmar “bayan” sallah tana nufin bayan kammala sallar; ba ƙididdigar lokacin sallah ba ne. Lokuta na Africa/Lagos ne.",
          )}
        </p>
      </section>
      <section className="section line-top">
        <p className="eyebrow">
          {t("BEYOND OUR WALLS", "A SAURAN MASALLATAI")}
        </p>
        <h2>{t("Learning across the community.", "Koyo a cikin al’umma.")}</h2>
        <div className="card-grid">
          {seed.other_masjids.map((m, i) => (
            <article className="plain-card" key={m.name}>
              <MapPin size={21} />
              <h3>{m.name}</h3>
              <p>{m.lecture}</p>
              <span className="muted">
                {i === 0
                  ? t(m.recurrence, "Kowane mako biyu")
                  : i === 1
                    ? t(m.recurrence, "Asabar ta farko a kowane wata")
                    : t(m.recurrence, "Lahadi ta ƙarshe a kowane wata")}
              </span>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
function localeTime(value: string, t: T) {
  return t(
    value,
    value
      .replace("After Maghrib", "Bayan Magariba")
      .replace("After Isha", "Bayan Isha")
      .replace("After Fajr", "Bayan Asuba")
      .replace("After Asr", "Bayan La’asar"),
  );
}
function Events({
  t,
  locale,
  events,
}: {
  t: T;
  locale: Locale;
  events: RecordItem[];
}) {
  const [past, setPast] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = events
    .filter(
      (e) =>
        isPast(e.date) === past &&
        `${e.title_en} ${e.title_ha} ${e.body_en} ${e.body_ha}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      past ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
    );
  return (
    <>
      <PageHead
        eyebrow={t("GATHER & GROW", "HAƊUWA DA CI GABA")}
        title={t("Moments that bring us together.", "Taro masu haɗa kanmu.")}
        text={t(
          "Community gatherings, Islamic lectures and shared learning.",
          "Taron al’umma, wa’azi da koyo tare.",
        )}
      />
      <section className="section">
        <div className="filter-bar">
          <div className="tabs">
            <button
              aria-pressed={!past}
              className={!past ? "active" : ""}
              onClick={() => setPast(false)}
            >
              {t("Upcoming", "Masu zuwa")}
            </button>
            <button
              aria-pressed={past}
              className={past ? "active" : ""}
              onClick={() => setPast(true)}
            >
              {t("Past events", "Waɗanda suka gabata")}
            </button>
          </div>
          <label className="search-label">
            <span className="sr-only">{t("Search events", "Nemo taro")}</span>
            <input
              type="search"
              placeholder={t("Search events…", "Nemo taro…")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        {filtered.length ? (
          <div className="card-grid">
            {filtered.map((r) => (
              <a className="event-card" key={r.id} href={`#/events/${r.slug}`}>
                {r.image && (
                  <img
                    src={imageUrl(r.image)}
                    alt={t("Event poster", "Takardar sanarwar taro")}
                    loading="lazy"
                  />
                )}
                <div>
                  <span className="badge">
                    {past
                      ? t("Past event", "Taron da ya gabata")
                      : t("Upcoming", "Mai zuwa")}
                  </span>
                  <p className="date">{formatDate(r.date, locale)}</p>
                  <h2>{locale === "en" ? r.title_en : r.title_ha}</h2>
                  <span className="text-link">
                    {t("Event details", "Bayanin taro")}
                    <ArrowUpRight size={17} />
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <Empty
            icon={<CalendarDays />}
            title={
              query
                ? t("No matching events", "Ba a samu taro ba")
                : t(
                    "Our next gathering is on the horizon.",
                    "Taronmu na gaba yana nan tafe.",
                  )
            }
            text={
              query
                ? t("Try a different search.", "Gwada wata kalmar bincike.")
                : t(
                    "New dates will appear here once confirmed. Explore the archive or join a weekly lecture.",
                    "Za a sanya sabbin ranaku idan an tabbatar. Ku duba taron da ya gabata ko ku halarci darasi na mako.",
                  )
            }
          >
            <a href="#/lectures" className="button">
              {t("View weekly lectures", "Duba darussukan mako")}
              <ArrowRight size={16} />
            </a>
          </Empty>
        )}
      </section>
    </>
  );
}
function EventDetail({
  record: r,
  t,
  locale,
}: {
  record?: RecordItem;
  t: T;
  locale: Locale;
}) {
  const [share, setShare] = useState("");
  if (!r) return <NotFound t={t} />;
  const seeded = r.slug === "jumuah-prayer-islamic-lecture-2026";
  return (
    <>
      <PageHead
        eyebrow={
          isPast(r.date)
            ? t("FROM THE ARCHIVE", "DAGA TARIHIN TARO")
            : t("UPCOMING EVENT", "TARO MAI ZUWA")
        }
        title={locale === "en" ? r.title_en : r.title_ha}
        text={formatDate(r.date, locale)}
      />
      <section className="section detail-grid">
        <div>
          {r.image && (
            <img
              className="event-poster"
              src={imageUrl(r.image)}
              alt={t(
                "Original event poster; the verified schedule is provided alongside.",
                "Sanarwar taro ta asali; an rubuta tabbataccen jadawali a gefe.",
              )}
            />
          )}
          <p className="muted small-text">
            {t(
              "Original poster from the design archive. For the confirmed details, refer to the schedule on this page.",
              "Sanarwar asali daga kundin zane. Don tabbatattun bayanai, ku duba jadawalin wannan shafi.",
            )}
          </p>
          {r.image && (
            <a
              className="text-link"
              href={imageUrl(r.image)}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download size={17} />
              {t("Download poster", "Sauke sanarwar")}
            </a>
          )}
        </div>
        <div>
          <span className="location">
            <MapPin size={17} />
            Kabama Layout, Zaria
          </span>
          <h2>{t("The programme", "Tsarin taro")}</h2>
          {seeded ? (
            <>
              <div className="programme-block">
                <span className="eyebrow">
                  01 / {t("JUMU’AH PRAYER", "SALLAR JUMA’A")}
                </span>
                <h3>At-Taqwa</h3>
                <p>{seed.past_events[0].khutbah_speaker}</p>
                <p>
                  <Clock3 size={16} /> 12:00 · {t("Khutbah", "Huɗuba")}
                  <br />
                  12:30 · {t("Jumu’ah prayer", "Sallar Juma’a")}
                </p>
              </div>
              <div className="programme-block">
                <span className="eyebrow">
                  02 / {t("ISLAMIC LECTURE", "WA’AZIN MUSULUNCI")}
                </span>
                <h3>{locale === "en" ? r.body_en : r.body_ha}</h3>
                <p>{seed.past_events[0].lecture_speaker}</p>
                <p>
                  <Clock3 size={16} />
                  {t("After Maghrib until Isha", "Bayan Magariba zuwa Isha")}
                </p>
              </div>
              <Speakers t={t} />
            </>
          ) : (
            <>
              <p className="prose">{locale === "en" ? r.body_en : r.body_ha}</p>
              <p>{r.details.speaker}</p>
              <p>{r.details.time}</p>
            </>
          )}
          <p className="muted small-text">
            {t(
              "Times are local to Zaria, Nigeria (Africa/Lagos).",
              "Lokuta na Zariya, Najeriya ne (Africa/Lagos).",
            )}
          </p>
          <button
            className="button outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(location.href);
                setShare(t("Event link copied", "An kwafi hanyar taron"));
              } catch {
                setShare(
                  t(
                    "Copy the page address to share this event.",
                    "Ku kwafi adireshin wannan shafi don rabawa.",
                  ),
                );
              }
            }}
          >
            <Share2 size={16} />
            {t("Share event", "Raba taron")}
          </button>
          <p role="status">{share}</p>
        </div>
      </section>
    </>
  );
}
const categories = [
  "All",
  "Qur’an",
  "Hadith",
  "Aqidah",
  "Fiqh",
  "Seerah",
  "Community",
];
function Blog({
  t,
  locale,
  articles,
}: {
  t: T;
  locale: Locale;
  articles: RecordItem[];
}) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const filtered = articles.filter(
    (r) =>
      (category === "All" || category === r.category) &&
      `${r.title_en} ${r.title_ha} ${r.body_en} ${r.body_ha}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHead
        eyebrow={t("THE JOURNAL", "RUBUCE-RUBUCE")}
        title={t(
          "Space to read.\nTime to reflect.",
          "Wurin karatu.\nLokacin tunani.",
        )}
        text={t(
          "Articles and community reflections, shared with care.",
          "Rubuce-rubuce da tunatarwar al’umma cikin kulawa.",
        )}
      />
      <section className="section">
        <div className="filter-bar">
          <label>
            {t("Category", "Rukuni")}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? t("All", "Duka") : c}
                </option>
              ))}
            </select>
          </label>
          <input
            type="search"
            aria-label={t("Search articles", "Nemo rubutu")}
            placeholder={t("Search articles…", "Nemo rubutu…")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {filtered.length ? (
          <div className="card-grid">
            {filtered.map((r) => (
              <a
                className="plain-card article-card"
                href={`#/blog/${r.slug}`}
                key={r.id}
              >
                {r.image && (
                  <img src={imageUrl(r.image)} alt="" loading="lazy" />
                )}
                <span className="eyebrow">{r.category}</span>
                <h2>{locale === "en" ? r.title_en : r.title_ha}</h2>
                <p>
                  {formatDate(r.date, locale)} · {r.author}
                </p>
                <ArrowUpRight />
              </a>
            ))}
          </div>
        ) : (
          <Empty
            icon={<BookOpen />}
            title={
              articles.length
                ? t("No articles found", "Ba a samu rubutu ba")
                : t(
                    "Good reading is worth the wait.",
                    "Rubutu mai kyau ya cancanci jira.",
                  )
            }
            text={
              articles.length
                ? t(
                    "Try another category or search.",
                    "Gwada wani rukuni ko kalmar bincike.",
                  )
                : t(
                    "Our first articles are being prepared. Visit our weekly lectures while the journal takes shape.",
                    "Ana shirya rubuce-rubucenmu na farko. Ku halarci darussukan mako kafin a wallafa.",
                  )
            }
          >
            <a href="#/lectures" className="text-link">
              {t("Explore weekly lectures", "Duba darussukan mako")}
              <ArrowRight size={17} />
            </a>
          </Empty>
        )}
      </section>
    </>
  );
}
function Article({
  record: r,
  t,
  locale,
}: {
  record?: RecordItem;
  t: T;
  locale: Locale;
}) {
  if (!r) return <NotFound t={t} />;
  return (
    <>
      <PageHead
        eyebrow={r.category}
        title={locale === "en" ? r.title_en : r.title_ha}
        text={`${r.author} · ${formatDate(r.date, locale)}`}
      />
      <article className="section reading">
        {r.image && <img src={imageUrl(r.image)} alt="" />}
        <div className="prose">{locale === "en" ? r.body_en : r.body_ha}</div>
        <a className="text-link" href="#/blog">
          {t("Back to journal", "Koma rubuce-rubuce")}
          <ArrowRight size={16} />
        </a>
      </article>
    </>
  );
}
function Empty({
  icon,
  title,
  text,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}
function NotFound({ t }: { t: T }) {
  return (
    <section className="section">
      <Empty
        icon={<CircleHelp />}
        title={t("This page could not be found.", "Ba a samu wannan shafi ba.")}
        text={t(
          "It may have moved or is not yet published.",
          "Wataƙila an matsar da shi ko ba a wallafa shi ba.",
        )}
      >
        <a className="button" href="#/">
          {t("Return home", "Koma gida")}
        </a>
      </Empty>
    </section>
  );
}
