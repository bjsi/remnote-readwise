import { declareIndexPlugin, ReactRNPlugin } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import { registerCommands } from '../lib/commands';
import { registerPowerups } from '../lib/powerup';
import { registerSettings } from '../lib/settings';
import { getSyncer } from '../lib/syncer';
import { registerWidgets } from '../lib/widgets';

async function onActivate(plugin: ReactRNPlugin) {
  await registerPowerups(plugin);
  await registerSettings(plugin);
  await registerCommands(plugin);
  await registerWidgets(plugin);
  const syncer = getSyncer(plugin);
  syncer.syncLatest();
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
