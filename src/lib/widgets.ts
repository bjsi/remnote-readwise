import { RNPlugin, WidgetLocation } from '@remnote/plugin-sdk';

export const registerWidgets = async (plugin: RNPlugin) => {
  await plugin.app.registerWidget('importing', WidgetLocation.Popup, {
    dimensions: { height: 'auto', width: 'auto' },
  });
};
