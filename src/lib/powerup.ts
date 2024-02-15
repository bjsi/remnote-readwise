import { RNPlugin } from '@remnote/plugin-sdk';
import { powerups, bookSlots, highlightSlots } from './consts';

async function registerBookPowerup(plugin: RNPlugin) {
  await plugin.app.registerPowerup({
    name: 'Readwise Book',
    code: powerups.book,
    description: 'Represents a book from Readwise',
    options: {
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
    },
  });
}

async function registerHighlightPowerup(plugin: RNPlugin) {
  await plugin.app.registerPowerup({
    name: 'Readwise Highlight',
    code: powerups.highlight,
    description: 'Represents a highlight from Readwise',
    options: {
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
        {
          code: highlightSlots.note,
          name: 'Note',
        },
      ],
    },
  });
}

export async function registerPowerups(plugin: RNPlugin) {
  await registerBookPowerup(plugin);
  await registerHighlightPowerup(plugin);
}
