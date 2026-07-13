#!/usr/bin/env node

const path = require('path');

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
  const fileName = path.basename(filePath);

  const isEnvFile = /^\.env(\..+)?$/i.test(fileName);

  if (isEnvFile) {
    const result = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          `Acesso negado: "${fileName}" é um arquivo de variáveis de ambiente e pode conter segredos ` +
          '(chaves de API, tokens, senhas). Leitura e edição de arquivos .env / .env.* são bloqueadas ' +
          'por hook neste projeto (.claude/hooks/block-env-access.js). Se precisar alterar variáveis de ' +
          'ambiente, edite o arquivo manualmente fora do Claude Code.',
      },
    };
    process.stdout.write(JSON.stringify(result));
  }

  process.exit(0);
});
