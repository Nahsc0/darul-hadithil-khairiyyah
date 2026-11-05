import { useState, type FormEvent } from "react";
import { supabase, todayLagos } from "./lib";

const intakeUrl = import.meta.env.VITE_INTAKE_URL?.trim();
const intakeAvailable = Boolean(intakeUrl || supabase);

async function sendIntake(body: Record<string, FormDataEntryValue>) {
  if (intakeUrl) {
    const response = await fetch(intakeUrl, {
      method: "POST",
      body: JSON.stringify(body),
      credentials: "omit",
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) throw new Error("Intake request failed");
    return response.json();
  }
  const result = await supabase?.functions.invoke("intake", { body });
  if (!result || result.error) throw new Error("Intake request failed");
  return result.data;
}

type T = (en: string, ha: string) => string;

export function Calendar({ t, locale }: { t: T; locale: string }) {
  const today = todayLagos();
  const [month, setMonth] = useState(
    () => new Date(today.slice(0, 7) + "-01T12:00:00Z"),
  );
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: "Africa/Lagos" });
  const gregorian = format({ calendar: "gregory", dateStyle: "full" });
  const hijri = format({
    calendar: "islamic-civil",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const title = format({ calendar: "gregory", month: "long", year: "numeric" });
  const year = month.getUTCFullYear();
  const index = month.getUTCMonth();
  const dayAt = (day: number) => new Date(Date.UTC(year, index, day, 12));
  const offset = month.getUTCDay();
  const days = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();

  return (
    <section className="section intake">
      <h1>
        {t("Gregorian and Hijri calendar", "Kalandar Miladiyya da Hijiriyya")}
      </h1>
      <p>
        {t(
          "Hijri dates are calculated and may differ from local moon sightings.",
          "Ana ƙididdige ranakun Hijiriyya. Za su iya bambanta da ganin watan gida.",
        )}
      </p>
      <div className="calendar-controls">
        <button
          className="button small"
          onClick={() => setMonth(new Date(Date.UTC(year, index - 1, 1, 12)))}
        >
          {t("Previous month", "Watan baya")}
        </button>
        <h2 aria-live="polite">{title.format(month)}</h2>
        <button
          className="button small"
          onClick={() => setMonth(new Date(Date.UTC(year, index + 1, 1, 12)))}
        >
          {t("Next month", "Wata na gaba")}
        </button>
      </div>
      <div className="calendar-grid">
        {Array.from({ length: 7 }, (_, i) => (
          <strong key={i}>
            {format({ weekday: "short" }).format(
              new Date(Date.UTC(2026, 0, 4 + i, 12)),
            )}
          </strong>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={i} aria-hidden="true" />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = dayAt(i + 1);
          const iso = date.toISOString().slice(0, 10);
          return (
            <time
              key={iso}
              dateTime={iso}
              aria-current={iso === today ? "date" : undefined}
            >
              <strong aria-label={gregorian.format(date)}>{i + 1}</strong>
              <small>{hijri.format(date)}</small>
            </time>
          );
        })}
      </div>
    </section>
  );
}

export function Education({ t }: { t: T }) {
  return (
    <section className="section intake">
      <h1>{t("Islamiyya and Tahfeez", "Islamiyya da Tahfeez")}</h1>
      <p>
        {t(
          "Islamic studies and Qur’an memorisation for children and adults.",
          "Karatun addinin Musulunci da haddar Alƙur’ani ga yara da manya.",
        )}
      </p>
      <div className="two-column">
        <div className="contact-card">
          <h2>{t("Children", "Yara")}</h2>
          <p>
            {t(
              "Apply for Islamiyya, Tahfeez or both on behalf of your child.",
              "Yi wa yaronka rajistar Islamiyya, Tahfeez ko duka biyun.",
            )}
          </p>
        </div>
        <div className="contact-card">
          <h2>{t("Adults", "Manya")}</h2>
          <p>
            {t(
              "Apply for Islamiyya, Tahfeez or both.",
              "Yi rajistar Islamiyya, Tahfeez ko duka biyun.",
            )}
          </p>
        </div>
      </div>
      <a className="button" href="#/register">
        {t("Student registration", "Rajistar ɗalibai")}
      </a>
    </section>
  );
}

export function IntakeForm({ t, student }: { t: T; student: boolean }) {
  const [group, setGroup] = useState("");
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState<{ studentId?: string }>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState<{ payload: string; token: string }>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!intakeAvailable || pending) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const payload = JSON.stringify(fields);
    const token =
      attempt?.payload === payload ? attempt.token : crypto.randomUUID();
    setAttempt({ payload, token });
    setPending(true);
    setError(false);
    try {
      const data = await sendIntake({
        ...fields,
        token,
        kind: student ? "registration" : "request",
      });
      if (
        data?.ok !== true ||
        (student && !/^DHK-[0-9A-F-]{36}$/.test(data.studentId))
      ) {
        throw new Error("No confirmed receipt");
      }
      setReceipt(data);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="section intake">
      <h1>
        {student
          ? t("Student registration", "Rajistar ɗalibai")
          : t("Send a request", "Aika buƙata")}
      </h1>
      {receipt ? (
        <div className="contact-card" role="status">
          <p>
            {student
              ? t(
                  "Application received. Save your student ID.",
                  "An karɓi rajistarka. Ajiye lambar ɗalibinka.",
                )
              : t("Your request was received.", "An karɓi buƙatarka.")}
          </p>
          {student && (
            <strong className="student-id">{receipt.studentId}</strong>
          )}
        </div>
      ) : (
        <form className="intake-form" onSubmit={submit}>
          <p>
            {student
              ? t(
                  "A parent or guardian should complete the form for a child. The Masjid uses these details to process the application and contact you.",
                  "Iyaye ko waliyyi su cika fom ɗin yaro. Masallaci zai yi amfani da bayanan don duba rajista da tuntuɓarku.",
                )
              : t(
                  "The Masjid uses your contact details to respond to your request.",
                  "Masallaci zai yi amfani da bayanan tuntuɓarka don amsa buƙatarka.",
                )}
          </p>
          <fieldset disabled={pending || !intakeAvailable}>
            <label>
              {student
                ? t("Student’s full name", "Cikakken sunan ɗalibi")
                : t("Your name", "Sunanka")}
              <input name="name" required maxLength={120} />
            </label>
            {student && (
              <>
                <label>
                  {t("Date of birth", "Ranar haihuwa")}
                  <input
                    name="birth"
                    type="date"
                    required
                    min="1900-01-01"
                    max={todayLagos()}
                  />
                </label>
                <label>
                  {t("Age group", "Rukunin shekaru")}
                  <select
                    name="group"
                    required
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                  >
                    <option value="">
                      {t("Choose an age group", "Zaɓi rukunin shekaru")}
                    </option>
                    <option value="child">
                      {t("Child (under 18)", "Yaro (ƙasa da shekara 18)")}
                    </option>
                    <option value="adult">
                      {t("Adult (18 or older)", "Babba (shekara 18 ko fiye)")}
                    </option>
                  </select>
                </label>
                <label>
                  {t("Programme", "Tsarin karatu")}
                  <select name="programme" required defaultValue="">
                    <option value="">
                      {t("Choose a programme", "Zaɓi tsarin karatu")}
                    </option>
                    <option value="Islamiyya">Islamiyya</option>
                    <option value="Tahfeez">Tahfeez</option>
                    <option value="Both">
                      {t("Islamiyya and Tahfeez", "Islamiyya da Tahfeez")}
                    </option>
                  </select>
                </label>
                <label>
                  {t("Town or area", "Gari ko unguwa")}
                  <input name="area" required maxLength={120} />
                </label>
                {group === "child" && (
                  <label>
                    {t("Parent or guardian name", "Sunan iyaye ko waliyyi")}
                    <input name="guardian" required maxLength={120} />
                  </label>
                )}
              </>
            )}
            <label>
              {group === "child"
                ? t("Parent or guardian phone", "Wayar iyaye ko waliyyi")
                : t("Contact phone", "Lambar waya")}
              <input name="phone" type="tel" required maxLength={30} />
            </label>
            {!student && (
              <label>
                {t("Describe your request", "Bayyana buƙatarka")}
                <textarea name="message" required maxLength={2000} rows={6} />
              </label>
            )}
            <button className="button" type="submit">
              {pending ? t("Sending…", "Ana aikawa…") : t("Submit", "Aika")}
            </button>
          </fieldset>
          {!intakeAvailable && (
            <p role="status">
              {t(
                "Online submissions are unavailable. Please call the Masjid.",
                "Ba a iya aikawa ta intanet yanzu. A kira masallaci.",
              )}
            </p>
          )}
          {error && (
            <p role="alert">
              {t(
                "We couldn’t confirm your submission. Please retry without changing your details or call the Masjid.",
                "Ba mu iya tabbatar da aikawar ba. A sake gwadawa da bayanan nan ko a kira masallaci.",
              )}
            </p>
          )}
          <a className="text-link" href="#/contact">
            {t("Masjid contact details", "Bayanan tuntuɓar masallaci")}
          </a>
        </form>
      )}
    </section>
  );
}
