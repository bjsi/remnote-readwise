import { RNPlugin } from '@remnote/plugin-sdk';
import { settings } from './consts';

export const registerSettings = async (plugin: RNPlugin) => {
  await plugin.settings.registerStringSetting({
    id: settings.apiKey,
    title: 'Readwise API Key',
    defaultValue: '',
    description:
      'Paste your Readwise API key here. Follow the instructions here if you do not have a key: https://www.readwise.io/access_token',
  });
};
