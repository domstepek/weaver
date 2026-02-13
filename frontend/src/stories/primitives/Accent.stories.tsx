import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Design System/Primitives/Accent',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Controls: Story = {
  render: () => (
    <div className="min-h-[340px] rounded-xl bg-canvas p-6">
      <div className="max-w-lg rounded-xl border border-border bg-surface p-6 shadow-panel space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Accent Controls</h2>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast">
            Primary
          </button>
          <button className="rounded-md bg-accent-hover px-4 py-2 text-sm font-medium text-accent-contrast">
            Hover
          </button>
          <button className="rounded-md border border-border-accent bg-surface-accent px-4 py-2 text-sm font-medium text-text-accent ring-2 ring-accent">
            Focus
          </button>
          <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast opacity-disabled" disabled>
            Disabled
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-border-accent bg-surface-accent px-2.5 py-1 text-xs font-medium text-text-accent">
            Context selected
          </span>
          <a
            className="text-sm text-text-accent underline hover:text-accent-hover"
            href="https://example.com"
          >
            Inline token link
          </a>
        </div>
      </div>
    </div>
  ),
};
