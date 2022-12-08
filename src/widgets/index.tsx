import { declareIndexPlugin, ReactRNPlugin } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import { bookSlots, highlightSlots, powerups, settings, storage } from './consts';
import { fetchFromExportApi as getReadwiseExportsSince } from '../lib/readwise';
import { importBooksAndHighlights } from '../lib/import';

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.settings.registerStringSetting({
    id: settings.apiKey,
    title: 'Readwise API Key',
    defaultValue: '',
    description:
      'Paste your Readwise API key here. Follow the instructions here if you do not have a key: https://www.readwise.io/access_token',
  });

  await plugin.app.registerPowerup(
    'Readwise Book',
    powerups.book,
    'Represents a book from Readwise',
    {
      slots: [
        {
          code: bookSlots.bookId,
          name: 'Book ID',
          hidden: true,
        },
        {
          code: bookSlots.author,
          name: 'Author',
        },
        {
          code: bookSlots.image,
          name: 'Image',
        },
        {
          code: bookSlots.category,
          name: 'Category',
        },
        {
          code: bookSlots.tags,
          name: 'Tags',
        },
      ],
    }
  );

  await plugin.app.registerPowerup(
    'Readwise Highlight',
    powerups.highlight,
    'Represents a highlight from Readwise',
    {
      slots: [
        {
          code: highlightSlots.highlightId,
          name: 'Highlight ID',
          hidden: true,
        },
        {
          code: highlightSlots.tags,
          name: 'Tags',
        },
      ],
    }
  );

  let timeout: NodeJS.Timeout | undefined;

  const syncHighlights = async () => {
    const apiKey = await plugin.settings.getSetting<string>(settings.apiKey);
    if (!apiKey) {
      const msg = 'No Readwise API key set. Please follow the instructions in the plugin settings.';
      console.log(msg);
      plugin.app.toast(msg);
      return;
    }

    const lastSync = await plugin.storage.getSynced<string>(storage.lastSync);
    try {
      const result = await getReadwiseExportsSince(apiKey, lastSync);
      if (result.success) {
        const books = result.data;
        if (books && books.length > 0) {
          await importBooksAndHighlights(plugin, books);
        }
        await plugin.storage.setSynced(storage.lastSync, new Date().toISOString());
      } else {
        if (result.error == 'auth') {
          const msg =
            'Readwise API key is invalid. Please follow the instructions in the plugin settings.';
          console.log(msg);
          plugin.app.toast(msg);
          return;
        } else {
          console.log(result.error);
          plugin.app.toast('Failed to sync Readwise highlights: ' + result.error);
          return;
        }
      }
    } catch (e) {
      console.log(e);
      plugin.app.toast('Failed to sync Readwise highlights.');
    } finally {
      clearTimeout(timeout);
      setTimeout(syncHighlights, 1000 * 60 * 30);
    }
  };

  plugin.app.registerCommand({
    id: 'syncHighlights',
    name: 'Sync Readwise Highlights',
    action: async () => {
      await syncHighlights();
    },
  });

  const lastSync = await plugin.storage.getSynced<string>(storage.lastSync);
  if (!lastSync || new Date(lastSync).getTime() < new Date().getTime() - 1000 * 60 * 30) {
    syncHighlights();
  }
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
