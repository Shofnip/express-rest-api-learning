#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

const TRIGGER_DIR = 'services/';
const TRIGGER_FILE = 'utils/validators.js';
const DOC_FILES = ['CLAUDE.md', 'API.md'];

const getMtimeMs = (absPath) => {
  try {
    return fs.statSync(absPath).mtimeMs;
  } catch {
    return null;
  }
};

const extractExportedNames = (absPath) => {
  let content;
  try {
    content = fs.readFileSync(absPath, 'utf8');
  } catch {
    return [];
  }

  const match = content.match(/module\.exports\s*=\s*\{([\s\S]*?)\}/);
  if (!match) {
    return [];
  }

  return match[1]
    .split(',')
    .map((entry) => entry.split(':')[0].trim())
    .filter((name) => /^[a-zA-Z_$][\w$]*$/.test(name));
};

const findSkillsReferencing = (projectDir, names) => {
  const skillsDir = path.join(projectDir, '.claude', 'skills');
  let skillDirs;
  try {
    skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }

  const matches = [];
  for (const dir of skillDirs) {
    const skillPath = path.join(skillsDir, dir, 'SKILL.md');
    let content;
    try {
      content = fs.readFileSync(skillPath, 'utf8');
    } catch {
      continue;
    }

    const matchedNames = names.filter((name) => new RegExp(`\\b${name}\\b`).test(content));
    if (matchedNames.length > 0) {
      matches.push({ relPath: `.claude/skills/${dir}/SKILL.md`, matchedNames });
    }
  }

  return matches;
};

let input = '';
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const toolInput = payload.tool_input || {};
  const filePath = toolInput.file_path || toolInput.path || '';
  if (!filePath) {
    process.exit(0);
  }

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const absPath = path.resolve(filePath);
  const relPath = path.relative(projectDir, absPath).split(path.sep).join('/');

  const isTrigger = relPath.startsWith(TRIGGER_DIR) || relPath === TRIGGER_FILE;
  if (!isTrigger) {
    process.exit(0);
  }

  const triggerMtime = getMtimeMs(absPath);
  if (triggerMtime === null) {
    process.exit(0);
  }

  const isFresh = (targetAbsPath) => {
    const mtime = getMtimeMs(targetAbsPath);
    return mtime !== null && mtime >= triggerMtime;
  };

  const noticeParts = [];

  const docsFresh = DOC_FILES.some((doc) => isFresh(path.join(projectDir, doc)));
  if (!docsFresh) {
    noticeParts.push('CLAUDE.md/API.md podem estar desatualizados');
  }

  const exportedNames = extractExportedNames(absPath);
  const staleSkills = exportedNames.length > 0
    ? findSkillsReferencing(projectDir, exportedNames).filter(
      (match) => !isFresh(path.join(projectDir, match.relPath))
    )
    : [];

  if (staleSkills.length > 0) {
    noticeParts.push(`${staleSkills.length} Skill(s) podem estar desatualizadas`);
  }

  if (noticeParts.length === 0) {
    process.exit(0);
  }

  const output = {
    systemMessage:
      `"${relPath}" foi editado — ${noticeParts.join('; ')}. Peça uma auditoria (ex: subagent ` +
      'auditor) se quiser confirmar; nada é verificado automaticamente.',
  };
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
});
