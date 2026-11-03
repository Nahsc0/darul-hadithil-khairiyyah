// Uses the existing Git Credential Manager session; never prints or stores credentials.
import { execFileSync } from "node:child_process";
const operation = process.argv[2] || "check";
const repo = "darul-hadithil-khairiyyah";
let raw;
try {
  raw = execFileSync("git", ["credential", "fill"], {
    input: "protocol=https\nhost=github.com\n\n",
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never" },
    stdio: ["pipe", "pipe", "pipe"],
  });
} catch {
  console.error("No existing GitHub CLI credential is available.");
  process.exit(2);
}
const secret = raw
  .split(/\r?\n/)
  .find((l) => l.startsWith("password="))
  ?.slice(9);
if (!secret) {
  console.error("No GitHub credential found.");
  process.exit(2);
}
async function api(path, method = "GET", body) {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = response.status === 204 ? {} : await response.json();
  if (!response.ok) throw Error(`${response.status}: ${data.message}`);
  return data;
}
try {
  const user = await api("/user");
  if (operation === "check") {
    console.log(JSON.stringify({ login: user.login, authenticated: true }));
  } else if (operation === "create") {
    const data = await api("/user/repos", "POST", {
      name: repo,
      description:
        "English and Hausa community website for Darul Hadithil Khairiyyah, Zaria",
      private: false,
      auto_init: false,
    });
    console.log(
      JSON.stringify({ url: data.html_url, clone_url: data.clone_url }),
    );
  } else if (operation === "pages") {
    try {
      await api(`/repos/${user.login}/${repo}/pages`, "POST", {
        build_type: "workflow",
      });
    } catch (e) {
      if (!e.message.startsWith("409")) throw e;
    }
    console.log(
      JSON.stringify(await api(`/repos/${user.login}/${repo}/pages`)),
    );
  } else if (operation === "status") {
    const runs = await api(
      `/repos/${user.login}/${repo}/actions/runs?per_page=3`,
    );
    console.log(
      JSON.stringify(
        runs.workflow_runs.map((r) => ({
          id: r.id,
          status: r.status,
          conclusion: r.conclusion,
          url: r.html_url,
        })),
      ),
    );
    try {
      const p = await api(`/repos/${user.login}/${repo}/pages`);
      console.log(JSON.stringify({ url: p.html_url, status: p.status }));
    } catch (e) {
      console.error(e.message);
    }
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
