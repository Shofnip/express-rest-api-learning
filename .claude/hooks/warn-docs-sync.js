#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const os = require('os');

const TRIGGER_DIR = 'services/';
const TRIGGER_FILE = 'utils/validators.js';
const DOC_FILES = ['CLAUDE.md', 'API.md'];

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

  const sessionId = payload.session_id || 'default-session';
  const stateKey = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const stateFile = path.join(os.tmpdir(), `claude-hook-docs-sync-${stateKey}.json`);

  let touchedFiles = [];
  try {
    touchedFiles = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    touchedFiles = [];
  }

  if (!touchedFiles.includes(relPath)) {
    touchedFiles.push(relPath);
  }

  try {
    fs.writeFileSync(stateFile, JSON.stringify(touchedFiles));
  } catch {
    process.exit(0);
  }

  const isTrigger = relPath.startsWith(TRIGGER_DIR) || relPath === TRIGGER_FILE;
  if (!isTrigger) {
    process.exit(0);
  }

  const instructionParts = [];
  const noticeParts = [];

  const docsTouched = DOC_FILES.some((doc) => touchedFiles.includes(doc));
  if (!docsTouched) {
    noticeParts.push('CLAUDE.md/API.md ainda não tocados');
    instructionParts.push(
      `1. Revise a mudança que você acabou de fazer em "${relPath}" (regras de negócio, ` +
        'validações, contratos de dados, mensagens de erro, nomes de campos, etc.) e compare ' +
        'com o que está documentado em CLAUDE.md e API.md. Se encontrar divergência, apresente ' +
        'ao usuário a sugestão de correção específica (qual arquivo, qual trecho, qual texto ' +
        'novo) e peça aprovação antes de aplicar. NÃO edite CLAUDE.md ou API.md ' +
        'automaticamente — só proponha. Se não houver divergência, apenas confirme brevemente ' +
        'que verificou.'
    );
  }

  const exportedNames = extractExportedNames(absPath);
  const skillMatches = exportedNames.length > 0
    ? findSkillsReferencing(projectDir, exportedNames).filter(
      (match) => !touchedFiles.includes(match.relPath)
    )
    : [];

  if (skillMatches.length > 0) {
    const skillList = skillMatches
      .map((match) => `   - "${match.relPath}" referencia: ${match.matchedNames.join(', ')}`)
      .join('\n');

    noticeParts.push(`${skillMatches.length} Skill(s) podem referenciar código alterado`);
    instructionParts.push(
      `2. As seguintes Skills mencionam nomes exportados por "${relPath}" e podem estar ` +
        `descrevendo um comportamento que você acabou de mudar:\n${skillList}\n   Releia cada ` +
        'trecho relevante dessas Skills e confirme se ainda descreve o comportamento real. Se ' +
        'estiver desatualizado, apresente ao usuário a sugestão de correção específica (qual ' +
        'Skill, qual trecho, qual texto novo) e peça aprovação antes de aplicar. NÃO edite ' +
        'nenhuma Skill automaticamente — só proponha. Se a Skill ainda estiver correta, apenas ' +
        'confirme brevemente que verificou.'
    );
  }

  if (instructionParts.length === 0) {
    process.exit(0);
  }

  const shortNotice =
    `"${relPath}" foi editado (${noticeParts.join('; ')}) — pedindo ao Claude para verificar ` +
    'e propor atualização, se necessário.';

  const instruction =
    `AÇÃO REQUERIDA após editar "${relPath}":\n${instructionParts.join('\n')}`;

  const output = {
    systemMessage: shortNotice,
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: instruction,
    },
  };
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
});
