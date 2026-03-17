// @ts-check
const Anthropic = require("@anthropic-ai/sdk");
const { Octokit } = require("@octokit/rest");
const { execSync } = require("child_process");
const fs = require("fs");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const RELEVANT_EXTENSIONS = [".ts", ".java", ".html", ".scss", ".css", ".yml", ".yaml", ".json"];
const IGNORE_PATTERNS = [
  /package-lock\.json$/,
  /\.min\.(js|css)$/,
  /\.map$/,
  /flyway\/.*\.sql$/,
  /node_modules\//,
  /dist\//,
  /target\//,
];
const MAX_DIFF_CHARS = 80_000;

function getChangedFiles() {
  const base = process.env.GITHUB_BASE_REF;
  const output = execSync(`git diff origin/${base}...HEAD --name-only`).toString();
  return output
    .split("\n")
    .filter(Boolean)
    .filter((f) => RELEVANT_EXTENSIONS.some((ext) => f.endsWith(ext)))
    .filter((f) => !IGNORE_PATTERNS.some((re) => re.test(f)));
}

function getDiff(file) {
  const base = process.env.GITHUB_BASE_REF;
  try {
    return execSync(`git diff origin/${base}...HEAD -- "${file}"`).toString();
  } catch {
    return "";
  }
}

function detectContext(files) {
  const hasBackend = files.some((f) => f.includes("backend/") || f.endsWith(".java"));
  const hasFrontend = files.some((f) => f.includes("frontend/") || f.endsWith(".ts") || f.endsWith(".html"));
  if (hasBackend && hasFrontend) return "Angular TypeScript + Spring Boot Java";
  if (hasBackend) return "Spring Boot Java";
  return "Angular TypeScript";
}

async function review(allDiffs, context, fileList) {
  const truncated = allDiffs.length > MAX_DIFF_CHARS
    ? allDiffs.slice(0, MAX_DIFF_CHARS) + "\n\n[...diff tronqué]"
    : allDiffs;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Tu es un expert en code review pour un projet ${context}.

Fichiers modifiés :
${fileList.map((f) => `- ${f}`).join("\n")}

Analyse ce diff et fournis une review structurée :

1. **Résumé** — que font ces changements en 2-3 phrases
2. **Problèmes critiques** — bugs, failles de sécurité (XSS, injection, auth bypass…), données sensibles exposées
3. **Avertissements** — mauvaises pratiques, performance, couplage fort
4. **Suggestions** — refactoring, lisibilité, tests manquants
5. **Points positifs** — ce qui est bien fait

Règles :
- Sois concis et direct, uniquement ce qui est pertinent
- Si une section est vide, écris "Rien à signaler"
- Cite les noms de fichiers/méthodes concernés
- N'invente pas de problèmes

Diff :
\`\`\`diff
${truncated}
\`\`\``,
      },
    ],
  });

  return msg.content[0].text;
}

async function main() {
  const [owner, repo] = process.env.REPO_NAME.split("/");
  const prNumber = parseInt(process.env.PR_NUMBER, 10);

  console.log("Récupération des fichiers modifiés...");
  const files = getChangedFiles();

  if (files.length === 0) {
    console.log("Aucun fichier pertinent modifié — review ignorée.");
    return;
  }

  console.log(`${files.length} fichier(s) à analyser :`, files);

  const allDiffs = files.map((f) => `\n// ── ${f} ──\n` + getDiff(f)).join("\n");
  const context = detectContext(files);

  console.log("Envoi à Claude...");
  const reviewText = await review(allDiffs, context, files);

  const body = [
    "## Claude Code Review",
    "",
    reviewText,
    "",
    "---",
    `*Review automatique — [claude-sonnet-4-6](https://anthropic.com) · ${new Date().toISOString().slice(0, 10)}*`,
  ].join("\n");

  await octokit.issues.createComment({ owner, repo, issue_number: prNumber, body });
  console.log("Review postée avec succès.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
