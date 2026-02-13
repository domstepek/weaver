import type { Meta, StoryObj } from '@storybook/react-vite';

type TokenDef = {
  name: string;
  className: string;
  textClassName?: string;
};

const colorTokens: Record<string, TokenDef[]> = {
  Canvas: [
    { name: 'canvas', className: 'bg-canvas' },
    { name: 'canvas-muted', className: 'bg-canvas-muted' },
  ],
  Surfaces: [
    { name: 'surface', className: 'bg-surface' },
    { name: 'surface-muted', className: 'bg-surface-muted' },
    { name: 'surface-elevated', className: 'bg-surface-elevated' },
    { name: 'surface-overlay', className: 'bg-surface-overlay' },
    { name: 'surface-selected', className: 'bg-surface-selected' },
    { name: 'surface-accent', className: 'bg-surface-accent' },
  ],
  Borders: [
    { name: 'border', className: 'bg-border' },
    { name: 'border-strong', className: 'bg-border-strong' },
    { name: 'border-accent', className: 'bg-border-accent' },
  ],
  Text: [
    { name: 'text-primary', className: 'bg-text-primary' },
    { name: 'text-secondary', className: 'bg-text-secondary' },
    { name: 'text-muted', className: 'bg-text-muted' },
    { name: 'text-inverse', className: 'bg-text-inverse' },
  ],
  Accent: [
    { name: 'accent', className: 'bg-accent' },
    { name: 'accent-hover', className: 'bg-accent-hover' },
    { name: 'accent-soft', className: 'bg-accent-soft' },
  ],
  Status: [
    { name: 'status-success', className: 'bg-status-success' },
    { name: 'status-warning', className: 'bg-status-warning' },
    { name: 'status-danger', className: 'bg-status-danger' },
    { name: 'status-info', className: 'bg-status-info' },
  ],
};

const meta = {
  title: 'Design System/Tokens',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function Swatch({ token }: { token: TokenDef }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
      <div className={`h-16 rounded-md border border-border ${token.className}`} />
      <div className="text-xs text-text-muted font-ui">{token.name}</div>
    </div>
  );
}

export const Overview: Story = {
  render: () => (
    <div className="min-h-screen bg-canvas text-text-primary p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-text-muted font-ui">
            Weaver Design System
          </p>
          <h1 className="text-3xl font-semibold">Token Foundations</h1>
          <p className="text-text-secondary max-w-3xl">
            Semantic tokens for dark dashboard surfaces, muted green accents, and
            dense information layouts. Components should consume these semantic
            names rather than raw color values.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-border bg-surface p-4 shadow-panel">
            <h2 className="text-sm font-semibold mb-3">Typography Scale</h2>
            <div className="space-y-2">
              <p className="text-3xl leading-tight">Display / 30px</p>
              <p className="text-xl leading-snug">Title / 20px</p>
              <p className="text-[15px]">Body / 15px</p>
              <p className="text-xs font-ui uppercase tracking-wide text-text-muted">
                Label / 12px
              </p>
            </div>
          </article>

          <article className="rounded-xl border border-border bg-surface p-4 shadow-panel">
            <h2 className="text-sm font-semibold mb-3">Shape and Elevation</h2>
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm">
                radius-md + shadow-panel
              </div>
              <div className="rounded-xl border border-border-strong bg-surface-elevated px-3 py-2 text-sm shadow-raised">
                radius-xl + shadow-raised
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-border bg-surface p-4 shadow-panel">
            <h2 className="text-sm font-semibold mb-3">Interaction States</h2>
            <div className="space-y-2 text-sm">
              <button className="w-full rounded-md bg-accent px-3 py-2 text-accent-contrast text-left">
                Default
              </button>
              <button className="w-full rounded-md bg-accent-hover px-3 py-2 text-accent-contrast text-left">
                Hover
              </button>
              <button className="w-full rounded-md bg-accent px-3 py-2 text-accent-contrast text-left ring-2 ring-accent">
                Focus
              </button>
              <button className="w-full rounded-md bg-accent px-3 py-2 text-accent-contrast text-left opacity-disabled" disabled>
                Disabled
              </button>
            </div>
          </article>
        </section>

        {Object.entries(colorTokens).map(([group, tokens]) => (
          <section key={group} className="space-y-3">
            <h2 className="text-lg font-semibold">{group}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {tokens.map((token) => (
                <Swatch key={token.name} token={token} />
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-xl border border-border bg-surface p-5 shadow-panel space-y-3">
          <h2 className="text-lg font-semibold">Usage Rules</h2>
          <ul className="list-disc pl-5 text-sm text-text-secondary space-y-1">
            <li>Use semantic token classes like `bg-surface` and `text-text-muted`.</li>
            <li>Avoid raw palette names in components.</li>
            <li>Use `surface` hierarchy for depth: canvas, surface, elevated, overlay.</li>
            <li>Use `accent` only for interactive emphasis and selected state.</li>
          </ul>
        </section>
      </div>
    </div>
  ),
};
