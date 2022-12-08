import { Rem, RNPlugin } from '@remnote/plugin-sdk';
import { bookSlots, highlightSlots, powerups } from '../widgets/consts';
import { Highlight, ReadwiseBook } from './types';
import { addLinkAsSource } from './utils';

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
    const bookRem = await plugin.rem.createRem();
    const highlightsRem = await plugin.rem.createRem();
    if (!bookRem || !highlightsRem) {
      return;
    }
    await bookRem.setText([book.title]);
    await bookRem.addPowerup(powerups.book);

    await bookRem.setPowerupProperty(powerups.book, bookSlots.bookId, [
      book.user_book_id.toString(),
    ]);
    await bookRem.setPowerupProperty(powerups.book, bookSlots.author, [book.author]);
    await addLinkAsSource(plugin, bookRem, book.readwise_url);
    await bookRem.setPowerupProperty(
      powerups.book,
      bookSlots.image,
      await plugin.richText.image(book.cover_image_url).value()
    );
    await bookRem.setPowerupProperty(powerups.book, bookSlots.category, [book.category]);
    if (book.book_tags && book.book_tags.length > 0) {
      await bookRem.setPowerupProperty(powerups.book, bookSlots.tags, book.book_tags);
    }
    await bookRem.setParent(bookParentRem._id);
    await highlightsRem.setText(['Highlights']);
    await highlightsRem.setParent(bookRem._id);
    return bookRem;
  }
};

const findOrCreateHighlight = async (
  plugin: RNPlugin,
  highlight: Highlight,
  bookRem: Rem,
  allHighlightsById: Record<string, Rem>
) => {
  let highlightRem = allHighlightsById[highlight.id.toString()];
  if (!highlightRem) {
    highlightRem = (await plugin.rem.createRem())!;
  }
  await highlightRem.setText([highlight.text]);
  await highlightRem.addPowerup(powerups.highlight);
  await highlightRem.setPowerupProperty(powerups.highlight, highlightSlots.highlightId, [
    highlight.id.toString(),
  ]);
  await addLinkAsSource(plugin, highlightRem, highlight.readwise_url);
  const parent = await plugin.rem.findByName(['Highlights'], bookRem._id);
  await highlightRem.setParent(parent!._id);
};

const findAllBooks = async (plugin: RNPlugin) => {
  const bookPowerup = await plugin.powerup.getPowerupByCode(powerups.book);
  const allBooks = (await bookPowerup?.taggedRem()) || [];
  const allBooksByBookId = Object.fromEntries(
    (await Promise.all(
      allBooks.map(async (b) => [await b.getPowerupProperty(powerups.book, bookSlots.bookId), b])
    )) as [string, Rem][]
  );
  return allBooksByBookId;
};

const findAllHighlights = async (plugin: RNPlugin) => {
  const highlightPowerup = await plugin.powerup.getPowerupByCode(powerups.highlight);
  const allHighlights = (await highlightPowerup?.taggedRem()) || [];
  const allHighlightsByHighlightId = Object.fromEntries(
    (await Promise.all(
      allHighlights.map(async (h) => [
        await h.getPowerupProperty(powerups.highlight, highlightSlots.highlightId),
        h,
      ])
    )) as [string, Rem][]
  );
  return allHighlightsByHighlightId;
};

export const importBooksAndHighlights = async (plugin: RNPlugin, books: ReadwiseBook[]) => {
  const bookParentRem = await findOrCreateBookParentRem(plugin);
  if (!bookParentRem) {
    const msg = 'Could not find or create parent rem for Readwise Books';
    plugin.app.toast(msg);
    console.log(msg);
    return;
  }

  const allBooksByd = await findAllBooks(plugin);
  const allHighlightsById = await findAllHighlights(plugin);

  await Promise.all(
    books.map(async (book) => {
      const bookRem = await findOrCreateBookRem(plugin, book, bookParentRem, allBooksByd);
      if (!bookRem) {
        return;
      } else {
        book.highlights.map(async (highlight) => {
          await findOrCreateHighlight(plugin, highlight, bookRem, allHighlightsById);
        });
      }
    })
  );
};
