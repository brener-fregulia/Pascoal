#!/usr/bin/env node

/**
 * Claude Code PreToolUse hook.
 *
 * Read-only Git commands pass through. Commands that may modify the working
 * tree, index, refs, history, remotes, pull requests, workflows, or releases
 * require an explicit permission prompt from the repository owner.
 */

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(input || '{}');
  } catch {
    process.stderr.write('Git guard could not parse hook input.\n');
    process.exit(2);
  }

  if (payload.tool_name !== 'Bash') process.exit(0);

  const command = String(payload.tool_input?.command || '').trim();
  if (!command) process.exit(0);

  const gitCalls = extractInvocations(command, 'git');
  const ghCalls = extractInvocations(command, 'gh');

  const restrictedGit = gitCalls.find((call) => !isReadOnlyGit(call));
  const restrictedGh = ghCalls.find((call) => !isReadOnlyGh(call));

  if (!restrictedGit && !restrictedGh) process.exit(0);

  const detected = restrictedGit ? `git ${restrictedGit}` : `gh ${restrictedGh}`;
  const output = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason:
        `Pascoal protects Git and publication state. Confirm that this exact ` +
        `operation was explicitly requested for the current task: ${detected}`,
      additionalContext:
        'Approval applies only to this exact tool call. Do not infer permission for subsequent Git or publication operations.'
    }
  };

  process.stdout.write(JSON.stringify(output));
});

function extractInvocations(command, executable) {
  const escaped = executable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[;&|()\\n]\\s*|\\b(?:sudo|env)\\s+)(?:[^;&|\\n]*?\\s+)?${escaped}\\s+([^;&|\\n]+)`, 'gi');
  const results = [];
  let match;
  while ((match = re.exec(command)) !== null) results.push(match[1].trim());
  return results;
}

function normalizeGitArgs(args) {
  const tokens = args.split(/\s+/).filter(Boolean);
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token === '-C' || token === '--git-dir' || token === '--work-tree' || token === '-c') {
      i += 2;
      continue;
    }
    if (token.startsWith('--git-dir=') || token.startsWith('--work-tree=') || token.startsWith('-c=')) {
      i += 1;
      continue;
    }
    if (token.startsWith('-')) {
      i += 1;
      continue;
    }
    break;
  }
  return tokens.slice(i);
}

function hasOnlyReadFlags(tokens, allowed) {
  return tokens.every((token) => !token.startsWith('-') || allowed.has(token) || [...allowed].some((flag) => token.startsWith(`${flag}=`)));
}

function isReadOnlyGit(args) {
  const tokens = normalizeGitArgs(args);
  const sub = tokens[0];
  const rest = tokens.slice(1);
  if (!sub) return true;

  const alwaysReadOnly = new Set([
    'status', 'diff', 'log', 'show', 'rev-parse', 'rev-list', 'ls-files',
    'ls-tree', 'cat-file', 'show-ref', 'for-each-ref', 'blame', 'grep',
    'shortlog', 'describe', 'name-rev', 'count-objects', 'merge-base'
  ]);
  if (alwaysReadOnly.has(sub)) return true;

  if (sub === 'branch') {
    const allowed = new Set(['--show-current', '--list', '-l', '--contains', '--merged', '--no-merged', '-a', '-r', '-v', '-vv', '--verbose']);
    return rest.length === 0 || hasOnlyReadFlags(rest, allowed);
  }

  if (sub === 'tag') {
    const allowed = new Set(['--list', '-l', '--contains', '--points-at', '--merged', '--no-merged', '-n', '--sort', '--format']);
    return rest.length === 0 || hasOnlyReadFlags(rest, allowed);
  }

  if (sub === 'remote') return rest.length === 0 || ['-v', '--verbose', 'show', 'get-url'].includes(rest[0]);
  if (sub === 'config') return rest.some((t) => ['--get', '--get-all', '--get-regexp', '--list', '-l', '--show-origin', '--show-scope'].includes(t));
  if (sub === 'worktree') return rest[0] === 'list';
  if (sub === 'stash') return rest[0] === 'list' || rest[0] === 'show';
  if (sub === 'reflog') return rest.length === 0 || rest[0] === 'show' || rest[0] === 'exists';
  if (sub === 'help' || sub === 'version' || sub === '--version') return true;

  return false;
}

function isReadOnlyGh(args) {
  const tokens = args.split(/\s+/).filter(Boolean);
  const group = tokens[0];
  const action = tokens[1];
  if (!group) return true;

  if (group === 'auth' && action === 'status') return true;
  if (group === 'status') return true;

  const readActions = new Set(['list', 'view', 'status', 'checks', 'diff']);
  if (['issue', 'pr', 'release', 'run', 'workflow', 'repo'].includes(group) && readActions.has(action)) return true;

  if (group === 'api') {
    const joined = tokens.slice(1).join(' ');
    return !/(?:^|\s)(?:-X|--method)(?:=|\s+)(?!GET\b)/i.test(joined) && !/(?:^|\s)-f\s|(?:^|\s)--field\s/i.test(joined);
  }

  if (group === '--version' || group === 'version' || group === 'help') return true;
  return false;
}
