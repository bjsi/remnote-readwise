import { declareIndexPlugin, ReactRNPlugin } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import { registerCommands } from '../lib/commands';
import { registerPowerups } from '../lib/powerup';
import { registerSettings } from '../lib/settings';

async function onActivate(plugin: ReactRNPlugin) {
  await registerPowerups(plugin);
  await registerSettings(plugin);
  await registerCommands(plugin);
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
