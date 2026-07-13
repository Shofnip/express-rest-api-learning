#!/usr/bin/env node

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
  const command = toolInput.command || '';
  if (!command) {
    process.exit(0);
  }

  const statements = command.split(/&&|\|\||;|\n|\|/);

  const forcePushRegex = /\bgit\b.*\bpush\b.*(?:--force\b|(?:^|\s)-f(?:\s|$))/i;
  const resetHardRegex = /\bgit\b.*\breset\b.*--hard\b/i;

  let violation = null;
  for (const statement of statements) {
    if (forcePushRegex.test(statement)) {
      violation = { type: '"git push --force"', statement: statement.trim() };
      break;
    }
    if (resetHardRegex.test(statement)) {
      violation = { type: '"git reset --hard"', statement: statement.trim() };
      break;
    }
  }

  if (violation) {
    const reason =
      `Comando bloqueado: "${violation.statement}" contém ${violation.type}, uma operação git ` +
      'destrutiva e potencialmente irreversível (sobrescreve histórico remoto ou descarta mudanças ' +
      'locais sem chance de recuperação). Este hook bloqueia esse padrão de comando neste projeto ' +
      'mesmo que solicitado explicitamente na conversa — não é possível contornar pedindo ' +
      'diretamente, pois a decisão é tomada pelo harness, fora do controle do modelo. Se essa ' +
      'operação for realmente necessária, execute manualmente no terminal, fora do Claude Code.';

    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    };
    process.stdout.write(JSON.stringify(output));
    process.exit(0);
  }

  process.exit(0);
});
