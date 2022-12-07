import { Rem, RNPlugin } from '@remnote/plugin-sdk';
import { bookSlots, highlightSlots, powerups } from '../widgets/consts';
import { Highlight, ReadwiseBook } from './types';
import { setPowerupLinkProperty } from './utils';

const findOrCreateBookParentRem = async (plugin: RNPlugin) => {
  let bookParentRem = await plugin.rem.findByName(['Readwise Books'], null);
  if (bookParentRem) {
    return bookParentRem;
  } else {
    const r = await plugin.rem.createRem();
    await r?.setText(['Readwise Books']);
    return r;
  }
};

const findOrCreateBookRem = async (
  plugin: RNPlugin,
  book: ReadwiseBook,
  bookParentRem: Rem,
  allBooksByBookId: Record<string, Rem>
) => {
  let bookRem = allBooksByBookId[book.user_book_id];
  if (bookRem) {
    return bookRem;
  } else {
    const r = await plugin.rem.createRem();
    await r?.setText([book.title]);
    await r?.addPowerup(powerups.book);
    await r?.setPowerupProperty(powerups.book, bookSlots.bookId, [book.user_book_id.toString()]);
    await r?.setPowerupProperty(powerups.book, bookSlots.author, [book.author]);
    await r?.setPowerupProperty(
      powerups.book,
      bookSlots.image,
      await plugin.richText.image(book.cover_image_url).value()
    );
    await r?.setParent(bookParentRem._id);
    return r;
  }
};

const createHighlight = async (plugin: RNPlugin, highlight: Highlight, bookRem: Rem) => {
  const highlightRem = await plugin.rem.createRem();
  if (!highlightRem) {
    return;
  }
  await highlightRem.setText([highlight.text]);
  await highlightRem.addPowerup(powerups.highlight);
  await highlightRem.setPowerupProperty(powerups.highlight, highlightSlots.highlightId, [
    highlight.id.toString(),
  ]);
  await setPowerupLinkProperty(
    plugin,
    highlightRem,
    powerups.highlight,
    highlightSlots.readwiseUrl,
    highlight.readwise_url
  );
  if (highlight.url) {
    await setPowerupLinkProperty(
      plugin,
      highlightRem,
      powerups.highlight,
      highlightSlots.url,
      highlight.url
    );
  }
  await highlightRem.setParent(bookRem._id);
};

export const importBooksAndHighlights = async (plugin: RNPlugin, books: ReadwiseBook[]) => {
  const bookParentRem = await findOrCreateBookParentRem(plugin);
  if (!bookParentRem) {
    const msg = 'Could not find or create parent rem for Readwise books';
    plugin.app.toast(msg);
    console.log(msg);
    return;
  }
  const bookPowerup = await plugin.powerup.getPowerupByCode(powerups.book);
  const allBooks = (await bookPowerup?.taggedRem()) || [];
  const allBooksByBookId = Object.fromEntries(
    (await Promise.all(
      allBooks.map(async (b) => [await b.getPowerupProperty(powerups.book, bookSlots.bookId), b])
    )) as [string, Rem][]
  );

  await Promise.all(
    books.map(async (book) => {
      const bookRem = await findOrCreateBookRem(plugin, book, bookParentRem, allBooksByBookId);
      if (!bookRem) {
        return;
      } else {
        book.highlights.map(async (highlight) => {
          await createHighlight(plugin, highlight, bookRem);
        });
      }
    })
  );
};
