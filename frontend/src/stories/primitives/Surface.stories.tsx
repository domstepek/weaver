import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Design System/Primitives/Surface',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Hierarchy: Story = {
  render: () => (
    <div className="min-h-[420px] rounded-xl bg-canvas p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4 shadow-panel">
          <p className="text-sm text-text-muted mb-1">surface</p>
          <p className="text-text-primary">Primary panel for dense content.</p>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted p-4 shadow-panel">
          <p className="text-sm text-text-muted mb-1">surface-muted</p>
          <p className="text-text-primary">Secondary panel inside sections.</p>
        </div>

        <div className="rounded-lg border border-border-strong bg-surface-elevated p-4 shadow-raised">
          <p className="text-sm text-text-muted mb-1">surface-elevated</p>
          <p className="text-text-primary">Raised card for focal information.</p>
        </div>
      </div>
    </div>
  ),
};
