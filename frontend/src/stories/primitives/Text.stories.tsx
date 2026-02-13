import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Design System/Primitives/Text',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Hierarchy: Story = {
  render: () => (
    <div className="min-h-[340px] rounded-xl bg-canvas p-6">
      <div className="max-w-2xl space-y-4 rounded-xl border border-border bg-surface p-6 shadow-panel">
        <p className="text-xs font-ui uppercase tracking-[0.12em] text-text-muted">Label</p>
        <h1 className="text-3xl font-semibold text-text-primary">Knowledge Graph Overview</h1>
        <p className="text-text-secondary">
          This is secondary text for metadata, description blocks, and supporting copy.
        </p>
        <p className="text-text-muted">
          Muted text is used for helper content, timestamps, and low-priority hints.
        </p>
        <p className="text-text-accent">Accent text is reserved for interactive emphasis.</p>
      </div>
    </div>
  ),
};
