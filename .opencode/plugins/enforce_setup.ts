import type { Plugin } from '@opencode-ai/plugin';

function isMetaFile(filePath: string): boolean {
  const basename = filePath.split('/').pop() ?? '';
  const metaFilenames = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', '.cursorrules'];
  const metaPathPatterns = [
    '.opencode/',
    '/.config/opencode/',
    '.cursor/',
    '.clinerules/',
    '.cline/',
    '.windsurf/',
    '.windsurfrules',
    '.roo/',
    '.roorules',
    '.claude/',
    '.aider/',
    '.continue/',
  ];
  if (metaFilenames.includes(basename)) return true;
  if (metaPathPatterns.some((p) => filePath.includes(p))) return true;
  return false;
}

export const EnforceSetupPlugin: Plugin = async () => {
  let setupAgreed = false;
  let isFirstInteraction = true;

  return {
    event: async ({ event }) => {
      if (event.type === 'session.created') {
        setupAgreed = false;
        isFirstInteraction = true;
      }
    },

    'tool.execute.before': async (input, output) => {
      if (!['edit', 'write', 'apply_patch'].includes(input.tool)) return;

      const args = (output?.args ?? {}) as Record<string, unknown>;
      const filePath = String(args.filePath ?? args.path ?? args.file ?? '');
      if (isMetaFile(filePath)) return;

      if (!setupAgreed) {
        const msg = isFirstInteraction
          ? '[enforce-setup] Setup not agreed. Run /setup with the user, get their agreement on the Orient, then run `echo "setup-ack"` in a bash command to signal the harness.'
          : '[enforce-setup] Setup no longer agreed (likely after a commit). Run /reflect to recover context, then /setup and `echo "setup-ack"` for the next Goal.';
        throw new Error(msg);
      }

      isFirstInteraction = false;
    },

    'tool.execute.after': async (input) => {
      if (input.tool !== 'bash') return;
      const command: string = (input.args as { command?: string } | undefined)?.command ?? '';
      if (/\becho\s+["']setup-ack["']/.test(command)) {
        setupAgreed = true;
        isFirstInteraction = false;
      }
    },
  };
};
