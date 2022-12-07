import { declareIndexPlugin, ReactRNPlugin } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import { bookSlots, highlightSlots, powerups, settings, storage } from './consts';
import { fetchFromExportApi as getReadwiseBooks } from '../lib/readwise';
import { importBooksAndHighlights } from '../lib/import';

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.settings.registerStringSetting({
    id: settings.apiKey,
    title: 'Readwise API Key',
    defaultValue: '',
    description: 'Readwise API key acquired from readwise.io/access_token',
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
          // TODO: make this true
          hidden: false,
        },
        {
          code: bookSlots.author,
          name: 'Author',
        },
        {
          code: bookSlots.image,
          name: 'Image',
        },
      ],
    }
  );

  await plugin.app.registerPowerup(
    'Readwise Highlight',
    powerups.book,
    'Represents a highlight from Readwise',
    {
      slots: [
        {
          code: highlightSlots.highlightId,
          name: 'Highlight ID',
          // TODO: make this true
          hidden: false,
        },
      ],
    }
  );

  const syncHighlights = async () => {
    const apiKey = await plugin.settings.getSetting<string>(settings.apiKey);
    if (!apiKey) {
      const msg = 'No Readwise API key set. Please set one in the settings.';
      console.log(msg);
      plugin.app.toast(msg);
      return;
    }

    const lastSync = await plugin.storage.getSynced<number>(storage.lastSync);
    try {
      const books = await getReadwiseBooks(apiKey, lastSync);
      if (books && books.length > 0) {
        await importBooksAndHighlights(plugin, books);
      }
      await plugin.storage.setSynced(storage.lastSync, new Date().getTime());
    } catch (e) {
      console.log(e);
      plugin.app.toast('Failed to sync highlights.');
    }
  };

  let timeout: NodeJS.Timeout | undefined;

  plugin.track(async (rp) => {
    const apiKey = await rp.settings.getSetting<string>(settings.apiKey);
    if (apiKey) {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(syncHighlights, 1000 * 10);
    }
  });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
