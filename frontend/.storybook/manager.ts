import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming';

addons.setConfig({
  theme: create({
    base: 'dark',
    brandTitle: 'Weaver Design System',
    brandTarget: '_self',
    appBg: '#151515',
    appContentBg: '#1f1f1f',
    appBorderColor: '#333333',
    appBorderRadius: 10,
    colorPrimary: '#d8e3d6',
    colorSecondary: '#d8e3d6',
  }),
});
