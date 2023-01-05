import { Rem, RNPlugin } from '@remnote/plugin-sdk';

export const addLinkAsSource = async (plugin: RNPlugin, rem: Rem, url: string) => {
  const linkRem = await plugin.rem.createLinkRem(url, false);
  await rem.addSource(linkRem!._id);
};
