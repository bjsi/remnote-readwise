import { BuiltInPowerupCodes, Rem, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import { bookSlots, highlightSlots, powerups } from './consts';
import { log } from './log';
import { Either } from './types/either';
import { Highlight, ReadwiseBook } from './types/readwise';
import { addLinkAsSource } from './utils';

const findBookParentRem = async (plugin: RNPlugin) => {
  return await plugin.rem.findByName(['Readwise Books'], null);
};

const createBookParentRem = async (plugin: RNPlugin) => {
  const r = await plugin.rem.createRem();
  await r?.setText(['Readwise Books']);
  r?.setIsDocument(true);
  r?.setPowerupProperty(BuiltInPowerupCodes.Document, 'Status', ['Pinned']);
  return r;
};

const findOrCreateHighlightsParentRem = async (plugin: RNPlugin, bookRem: Rem) => {
  let highlightsRem = await plugin.rem.findByName(['Highlights'], bookRem!._id);
  if (!highlightsRem) {
    highlightsRem = await plugin.rem.createRem();
    await highlightsRem?.setText(['Highlights']);
  }
  return highlightsRem;
};

const findOrCreateTopLevelRem = async (plugin: RNPlugin, str: string) => {
  let rem = await plugin.rem.findByName([str], null);
  if (!rem) {
    rem = await plugin.rem.createRem();
    await rem?.setText(['Highlights']);
  }
  return rem;
};

const findOrCreateBookRem = async (
  plugin: RNPlugin,
  book: ReadwiseBook,
  bookParentRem: Rem,
  allBooksByBookId: Record<string, Rem>
): Promise<Either<string, string>> => {
  return await plugin.app.transaction<() => Promise<Either<string, string>>>(async () => {
    let bookRem: Rem | undefined = allBooksByBookId[book.user_book_id];
    if (!bookRem) {
      bookRem = await plugin.rem.createRem();
    }
    if (!bookRem) {
      return { success: false, error: `Failed to create the book rem for book ${book.title}` };
    }
    const highlightsRem = await findOrCreateHighlightsParentRem(plugin, bookRem);
    if (!highlightsRem) {
      return {
        success: false,
        error: `Failed to create the highlights parent rem inside book ${book.title}`,
      };
    }
    await highlightsRem.setParent(bookRem._id);
    if (book.title) {
      bookRem.setText([book.title]);
    }
    await bookRem.addPowerup(powerups.book);

    if (book.user_book_id != null) {
      bookRem.setPowerupProperty(powerups.book, bookSlots.bookId, [book.user_book_id.toString()]);
    } else {
      return { success: false, error: `Book ${book.title} has no user_book_id` };
    }

    if (book.author) {
      bookRem.setPowerupProperty(powerups.book, bookSlots.author, [book.author]);
    }
    if (book.readwise_url) {
      addLinkAsSource(plugin, bookRem, book.readwise_url);
    }
    if (book.cover_image_url) {
      bookRem.setPowerupProperty(
        powerups.book,
        bookSlots.image,
        await plugin.richText.image(book.cover_image_url).value()
      );
    }
    if (book.category) {
      bookRem.setPowerupProperty(powerups.book, bookSlots.category, [book.category]);
    }
    if (book.book_tags && book.book_tags.length > 0) {
      for (const tag of book.book_tags) {
        const tagRem = await findOrCreateTopLevelRem(plugin, tag.name);
        if (tagRem) {
          bookRem.addTag(tagRem);
        }
      }
    }
    await bookRem.setParent(bookParentRem._id);
    return { success: true, data: bookRem._id };
  });
};

// TODO: doesn't parse bold/italic properly
export async function convertToRichTextArray(plugin: RNPlugin, text: string) {
  // Create a regex that matches substrings wrapped in two _ characters
  const highlightedStringRegex = /__(.*?)__/g;

  // Create an array to store the highlighted strings and non-highlighted strings
  let highlightedStringArray: RichTextInterface = [];

  // Loop through the input string, searching for highlighted substrings using the regex
  let match;
  let str = text;
  while ((match = highlightedStringRegex.exec(str)) !== null) {
    // Add the non-highlighted substring before the highlighted substring to the array
    const preMatchString = str.slice(0, match.index);
    if (preMatchString.length > 0) {
      highlightedStringArray.push(preMatchString);
    }

    // Add the highlighted substring to the array as an object with the highlighted string as the value of the "highlightedString" property
    const matchString = match[1];
    if (matchString.length > 0) {
      highlightedStringArray = highlightedStringArray.concat(
        await plugin.richText.text(matchString, ['Yellow']).value()
      );
    }

    // Remove the processed substrings from the input string
    str = str.slice(match.index + match[0].length);
  }

  // Add the remaining non-highlighted substring to the array
  highlightedStringArray.push(str);

  return highlightedStringArray;
}

const findOrCreateHighlight = async (
  plugin: RNPlugin,
  highlight: Highlight,
  bookRem: Rem,
  allHighlightsById: Record<string, Rem>
): Promise<Either<string, Rem>> => {
  let highlightRem: Rem | undefined = allHighlightsById[highlight.id.toString()];
  highlightRem = highlightRem ? highlightRem : await plugin.rem.createRem();
  if (!highlightRem) {
    return { success: false, error: 'Could not create highlight rem for book: ' + bookRem.text[0] };
  }
  const parent = await plugin.rem.findByName(['Highlights'], bookRem._id);
  if (!parent) {
    return {
      success: false,
      error: 'Could not find highlights parent for book: ' + bookRem.text[0],
    };
  }
  highlightRem.setParent(parent!._id);
  if (highlight.text) {
    highlightRem.setText(await convertToRichTextArray(plugin, highlight.text));
  }
  await highlightRem.addPowerup(powerups.highlight);
  if (highlight.id) {
    highlightRem.setPowerupProperty(powerups.highlight, highlightSlots.highlightId, [
      highlight.id.toString(),
    ]);
  } else {
    return { success: false, error: `Highlight for book ${bookRem.text[0]} has no id` };
  }
  if (highlight.note) {
    highlightRem.setPowerupProperty(powerups.highlight, highlightSlots.note, [highlight.note]);
  }

  if (highlight.tags && highlight.tags.length > 0) {
    // highlightRem.setPowerupProperty(powerups.highlight, highlightSlots.tags, [
    //   highlight.tags.map((x) => x.name).join(', '),
    // ]);

    for (const tag of highlight.tags) {
      const tagRem = await findOrCreateTopLevelRem(plugin, tag.name);
      if (tagRem) {
        highlightRem.addTag(tagRem);
      }
    }
  }
  if (highlight.readwise_url) {
    addLinkAsSource(plugin, highlightRem, highlight.readwise_url);
  }
  return { success: true, data: highlightRem };
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

export const importBooksAndHighlights = async (
  plugin: RNPlugin,
  books: ReadwiseBook[],
  updateSyncProgressModal: (percentageDone: number) => Promise<void>,
  isUpdateSync: boolean // ie, is not first sync
): Promise<Either<string, number>> => {
  let readwiseBooksRem = await findBookParentRem(plugin);
  if (!readwiseBooksRem && isUpdateSync) {
    const err = 'Could not find or create Readwise Books Rem. Did you move or rename it?';
    return { success: false, error: err };
  }
  readwiseBooksRem = readwiseBooksRem || (await createBookParentRem(plugin));
  if (!readwiseBooksRem) {
    const err = 'Failed to create Readwise Books Rem.';
    return { success: false, error: err };
  }

  const allBooksById = await findAllBooks(plugin);
  const allHighlightsById = await findAllHighlights(plugin);

  const total = books.reduce((acc, b) => acc + b.highlights.length, 0);
  let count = 0;
  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const bookRemResult = await findOrCreateBookRem(plugin, book, readwiseBooksRem, allBooksById);
    if (!bookRemResult.success) {
      return bookRemResult;
    }
    const bookRem = await plugin.rem.findOne(bookRemResult.data);
    if (!bookRem) {
      return { success: false, error: 'Could not findOne after create book rem for ' + book.title };
    } else {
      await Promise.all(
        book.highlights.map(async (highlight) => {
          const highlightResult = await findOrCreateHighlight(
            plugin,
            highlight,
            bookRem,
            allHighlightsById
          );
          if (!highlightResult.success) {
            log(plugin, 'Error creating highlight: ' + highlightResult.error, true);
          }
          count++;
          await updateSyncProgressModal((count / total) * 100);
        })
      );
    }
  }

  return { success: true, data: count };
};
