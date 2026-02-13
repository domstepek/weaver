import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'canvas',
      values: [
        { name: 'canvas', value: '#151515' },
        { name: 'surface', value: '#1f1f1f' },
      ],
    },
    layout: 'padded',
  },
};

export default preview;
