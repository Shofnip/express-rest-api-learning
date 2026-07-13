#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const os = require('os');

const TRIGGER_DIR = 'services/';
const TRIGGER_FILE = 'utils/validators.js';
const DOC_FILES = ['CLAUDE.md', 'API.md'];

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

  const docsTouched = DOC_FILES.some((doc) => touchedFiles.includes(doc));
  if (docsTouched) {
    process.exit(0);
  }

  const shortNotice =
    `"${relPath}" foi editado sem que CLAUDE.md/API.md fossem tocados nesta sessão — ` +
    'pedindo ao Claude para verificar e propor atualização de docs, se necessário.';

  const instruction =
    `AÇÃO REQUERIDA: você acabou de editar "${relPath}", e nem CLAUDE.md nem API.md foram ` +
    'tocados nesta sessão. Antes de considerar essa tarefa concluída:\n' +
    `1. Revise a mudança que você acabou de fazer em "${relPath}" (regras de negócio, ` +
    'validações, contratos de dados, mensagens de erro, nomes de campos, etc.).\n' +
    '2. Compare com o que está documentado em CLAUDE.md e API.md.\n' +
    '3. Se encontrar divergência, apresente ao usuário a sugestão de correção específica ' +
    '(qual arquivo, qual trecho, qual texto novo) e peça aprovação antes de aplicar.\n' +
    '4. NÃO edite CLAUDE.md ou API.md automaticamente — só proponha.\n' +
    '5. Se não houver divergência, apenas confirme brevemente que verificou e que a ' +
    'documentação já está consistente.';

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
