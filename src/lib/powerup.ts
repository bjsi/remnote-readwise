import { RNPlugin } from '@remnote/plugin-sdk';
import { powerups, bookSlots, highlightSlots } from './consts';

async function registerBookPowerup(plugin: RNPlugin) {
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
}

async function registerHighlightPowerup(plugin: RNPlugin) {
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
}

export async function registerPowerups(plugin: RNPlugin) {
  await registerBookPowerup(plugin);
  await registerHighlightPowerup(plugin);
}
