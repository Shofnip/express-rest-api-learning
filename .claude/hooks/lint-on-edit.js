#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const WATCHED_DIRS = ['routes', 'controllers', 'services', 'utils'];

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

  const isJs = relPath.endsWith('.js');
  const isWatchedDir = WATCHED_DIRS.some((dir) => relPath.startsWith(`${dir}/`));

  if (!isJs || !isWatchedDir || !fs.existsSync(absPath)) {
    process.exit(0);
  }

  const eslintConfigPath = path.join(projectDir, 'eslint.config.js');
  const eslintBin = path.join(projectDir, 'node_modules', 'eslint', 'bin', 'eslint.js');
  const hasEslint = fs.existsSync(eslintConfigPath) && fs.existsSync(eslintBin);

  let result;
  let checkName;

  if (hasEslint) {
    checkName = 'ESLint';
    result = spawnSync(process.execPath, [eslintBin, absPath], {
      cwd: projectDir,
      encoding: 'utf8',
    });
  } else {
    checkName = 'node --check (verificação de sintaxe)';
    result = spawnSync(process.execPath, ['--check', absPath], {
      cwd: projectDir,
      encoding: 'utf8',
    });
  }

  if (result.error) {
    process.exit(0);
  }

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
    process.stderr.write(
      `${checkName} encontrou erro(s) em "${relPath}" após a edição:\n\n` +
        `${output}\n\n` +
        'Corrija o(s) erro(s) acima antes de considerar essa edição concluída.\n'
    );
    process.exit(2);
  }

  process.exit(0);
});
