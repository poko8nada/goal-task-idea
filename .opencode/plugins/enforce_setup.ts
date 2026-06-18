import type { Plugin } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin';

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

    tool: {
      setup_agree: tool({
        description:
          'Signal that the user has agreed to the current Orient (Goal, Gate, Risks & Gaps) from /setup. Call this after the user explicitly agrees, before editing files. The harness resets this state after every git commit, so call it again for each new Goal.',
        args: {},
        async execute() {
          setupAgreed = true;
          isFirstInteraction = false;
          return 'OK, setup agreed. You may now edit files until the next commit.';
        },
      }),
    },

    'tool.execute.before': async (input) => {
      if (!['edit', 'write', 'apply_patch'].includes(input.tool)) return;

      if (!setupAgreed) {
        const msg = isFirstInteraction
          ? '[enforce-setup] Setup not agreed. Run /setup with the user, get their agreement on the Orient, then call `setup_agree` to signal the harness.'
          : '[enforce-setup] Setup no longer agreed (likely after a commit). Run /reflect to recover context, then /setup and `setup_agree` for the next Goal.';
        throw new Error(msg);
      }

      isFirstInteraction = false;
    },

    'tool.execute.after': async (input) => {
      if (input.tool !== 'bash') return;
      const command: string = (input.args as { command?: string } | undefined)?.command ?? '';
      if (/\bgit commit\b/.test(command)) {
        setupAgreed = false;
      }
    },
  };
};
