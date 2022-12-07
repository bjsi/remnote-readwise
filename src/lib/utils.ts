import { Rem, RNPlugin } from '@remnote/plugin-sdk';

export const setPowerupLinkProperty = async (
  plugin: RNPlugin,
  rem: Rem,
  powerup: string,
  slot: string,
  url: string
) => {
  const linkRem = await plugin.rem.createLinkRem(url);
  await rem.setPowerupProperty(powerup, slot, await plugin.richText.rem(linkRem!._id).value());
};
