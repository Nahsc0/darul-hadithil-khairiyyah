function doPost(event) {
  try {
    const props = PropertiesService.getScriptProperties();
    const raw = event.postData.contents;
    if (raw.length > 10000) return reply({ ok: false });
    const input = JSON.parse(raw);
    const secret = props.getProperty("INTAKE_SECRET");
    if (!secret || input.secret !== secret) return reply({ ok: false });

    const token = input.token;
    if (typeof token !== "string" || !/^[a-f0-9-]{36}$/.test(token)) {
      return reply({ ok: false });
    }
    const student = input.kind === "registration";
    if (!student && input.kind !== "request") return reply({ ok: false });

    const name = field(input.name, 120);
    const phone = field(input.phone, 30);
    if (!/^[+0-9(). -]+$/.test(phone) || phone.replace(/\D/g, "").length < 7) {
      return reply({ ok: false });
    }
    let fields = [name, phone];
    if (student) {
      const birth = field(input.birth, 10);
      const date = new Date(birth + "T12:00:00Z");
      const today = Utilities.formatDate(new Date(), "Africa/Lagos", "yyyy-MM-dd");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birth) || !Number.isFinite(date.getTime()) ||
          date.toISOString().slice(0, 10) !== birth || birth < "1900-01-01" || birth > today) {
        return reply({ ok: false });
      }
      const age = Number(today.slice(0, 4)) - Number(birth.slice(0, 4)) -
        Number(today.slice(5) < birth.slice(5));
      const group = age < 18 ? "child" : "adult";
      const programme = input.programme;
      if (group !== input.group || !["Islamiyya", "Tahfeez", "Both"].includes(programme)) {
        return reply({ ok: false });
      }
      fields = [name, birth, programme, group, field(input.area, 120), phone,
        group === "child" ? field(input.guardian, 120) : ""];
    } else {
      fields.push(field(input.message, 2000));
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const book = SpreadsheetApp.openById(props.getProperty("INTAKE_SHEET_ID"));
      const sheet = book.getSheetByName(student ? "Registrations" : "Requests");
      const last = sheet.getLastRow();
      if (sheet.getRange("A1").getValue() !== "Submission token") return reply({ ok: false });
      const existing = find(sheet, 1, last, token);
      if (existing) {
        return reply(student ? { ok: true, studentId: sheet.getRange(existing.getRow(), 2).getValue() } : { ok: true });
      }
      let id;
      if (student) {
        do {
          id = "DHK-" + Utilities.getUuid().toUpperCase();
        } while (find(sheet, 2, last, id));
      }
      const row = [token, ...(student ? [id] : []), new Date().toISOString(),
        ...fields.map(value => value ? "'" + value : "")];
      sheet.appendRow(row);
      SpreadsheetApp.flush();
      return reply(student ? { ok: true, studentId: id } : { ok: true });
    } finally {
      lock.releaseLock();
    }
  } catch {
    return reply({ ok: false });
  }
}

function field(value, max) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new Error("Invalid field");
  }
  return value.trim();
}

function find(sheet, column, last, value) {
  return last > 1 && sheet.getRange(2, column, last - 1, 1)
    .createTextFinder(value).matchEntireCell(true).findNext();
}

function reply(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
