---
name: commit-push
description: Roda a suíte de testes, revisa o que será commitado, cria um commit com mensagem descritiva baseada nas mudanças reais, e faz push para o branch atual. Aborta sem commitar se os testes falharem. Use quando o usuário pedir para commitar e subir as mudanças de uma vez.
when_to_use: Disparar quando o usuário pedir para "commitar e dar push", "subir as mudanças", "commit e push", "publicar as mudanças", ou equivalente para este projeto.
---

Você vai rodar o fluxo completo de commit + push para este projeto, na ordem exata abaixo, sem pular etapas.

## 1. Rodar a suíte de testes

Execute `npm test`.

- **Se falhar:** pare imediatamente. Não rode `git add`, não crie commit, não faça push. Reporte ao usuário a saída do erro (quais testes falharam e por quê) e encerre a skill aqui. Não tente "corrigir" o código por conta própria dentro desta skill — isso é fora do escopo dela.
- **Se passar:** prossiga para o passo 2.

## 2. Revisar o que será commitado

Rode `git status` para ver arquivos modificados/novos, e `git diff` (+ `git diff --staged` se já houver algo staged) para revisar o conteúdo real das mudanças.

- Confirme que faz sentido as mudanças pertencerem a um único commit coerente. Se o `git status` revelar mudanças não relacionadas ao que você acabou de trabalhar (ex: arquivos de outra tarefa, edições que não fazem parte do contexto atual), avise o usuário antes de incluir tudo.
- Preste atenção a arquivos que não deveriam ser versionados (`.env`, credenciais, `tasks.db`, etc.) — se algo assim aparecer como untracked/modified, é sinal de que o `.gitignore` falhou ou algo está errado; alerte o usuário em vez de commitar silenciosamente.
- Nunca use `git add -A` ou `git add .` às cegas. Adicione arquivos específicos pelo nome, com base no que a revisão acima mostrou.

## 3. Criar o commit

Monte uma mensagem de commit que reflita as mudanças **reais** vistas no diff, não uma descrição genérica:

- Primeira linha: resumo curto (menos de ~70 caracteres), modo imperativo, prefixo de tipo quando fizer sentido (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, seguindo o padrão já usado nos commits deste repositório — confira `git log` se tiver dúvida)
- Corpo (opcional, para mudanças não triviais): 1-3 frases explicando o **porquê**, não apenas o que mudou (o diff já mostra o "o quê")
- Rodapé: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`

Use heredoc para a mensagem (`git commit -m "$(cat <<'EOF' ... EOF)"`) para preservar formatação multi-linha corretamente.

Se não houver nada para commitar (`git status` limpo), reporte isso ao usuário e encerre sem tentar criar um commit vazio.

## 4. Push para o branch atual

Identifique o branch atual (`git branch --show-current`).

- Se o branch já tem upstream configurado: `git push`
- Se não tem upstream ainda (branch novo local): `git push -u origin <branch-atual>`

Nunca use `--force` ou `--force-with-lease` nesta skill — se um push normal for rejeitado (non-fast-forward), pare e reporte a situação ao usuário em vez de forçar.

## 5. Reportar o resultado

Confirme ao usuário, de forma concisa: hash do commit criado, branch, e confirmação de que o push foi para o remoto (ou, se algo parou no meio do caminho — testes falhando, nada para commitar, push rejeitado — deixe claro em qual etapa parou e por quê).
