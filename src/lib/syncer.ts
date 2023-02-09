import { RNPlugin } from '@remnote/plugin-sdk';
import { settings, storage } from './consts';
import { importBooksAndHighlights } from './import';
import { log } from './log';
import { getReadwiseExportsSince } from './readwise';

let syncer: Syncer | undefined = undefined;
export const getSyncer = (plugin: RNPlugin) => {
  if (!syncer) {
    syncer = new Syncer(plugin);
  }
  return syncer;
};

const SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes

class Syncer {
  plugin: RNPlugin;
  timeout: NodeJS.Timeout | undefined;
  isSyncing = false;

  constructor(plugin: RNPlugin) {
    this.plugin = plugin;
  }

  /**
   * Undefined if the user hasn't done an initial syncAll.
   */
  private getLastSync = async () => {
    const lastSync = await this.plugin.storage.getSynced<string>(storage.lastSync);
    return lastSync ? new Date(lastSync) : undefined;
  };

  private updateLastSync = async () => {
    await this.plugin.storage.setSynced(storage.hasDoneFirstRun, true);
    await this.plugin.storage.setSynced(storage.lastSync, new Date().toISOString());
  };

  private getAPIKey = async () => {
    return await this.plugin.settings.getSetting<string>(settings.apiKey);
  };

  private openSyncProgressModal = async () => {
    await this.plugin.widget.openPopup('importing', {}, false);
  };

  private updateSyncError = async (error: string) => {
    await this.plugin.storage.setSynced(storage.syncError, error);
  };

  private updateSyncProgress = async (percentageDone: number) => {
    await this.plugin.storage.setSynced(storage.syncProgress, percentageDone);
  };

  private log(msg: string, notify = false) {
    log(this.plugin, msg, notify);
  }

  private timeUntilNextSync = async () => {
    const lastSync = await this.getLastSync();
    if (!lastSync) {
      return 0;
    }
    return Math.max(0, SYNC_INTERVAL - (Date.now() - lastSync.getTime()));
  };

  private async shouldRunPeriodicSync() {
    const lastSync = await this.plugin.storage.getSynced<string>(storage.lastSync);
    // If there's no last sync time, we haven't done an initial syncAll.
    if (!lastSync) {
      return false;
    }
    // has there been SYNC_INTERVAL ms since the last sync?
    return new Date(lastSync).getTime() < new Date().getTime() - SYNC_INTERVAL;
  }

  public async debug() {
    const lastSync = await this.getLastSync();
    this.log(`Last sync: ${lastSync}`);
    const timeUntilNextSync = await this.timeUntilNextSync();
    this.log(`Time until next sync: ${timeUntilNextSync / 1000} seconds`);
  }

  /**
   * Sync ALL books and highlights.
   * Opens a modal to show progress.
   * Should only be run once, when the user first installs the plugin.
   */
  public async syncAll() {
    return this.syncHighlights({ ignoreLastSync: true, notify: true, showModal: true });
  }

  /**
   * Sync any books and highlights since the last sync time.
   * Runs periodically in the background.
   * Shouldn't run if the user hasn't done an initial syncAll.
   * If runImmediately is true, ignore the current sync timeout and run immediately.
   */
  public async syncLatest(runImmediately = false) {
    const lastSync = await this.plugin.storage.getSynced<string>(storage.lastSync);
    if (!lastSync) {
      return;
    } else if (runImmediately || (await this.shouldRunPeriodicSync())) {
      clearTimeout(this.timeout);
      await this.syncHighlights({});
    } else {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.syncHighlights({}), await this.timeUntilNextSync());
    }
  }

  private syncHighlights = async (opts: {
    ignoreLastSync?: boolean;
    notify?: boolean;
    showModal?: boolean;
  }) => {
    const apiKey = await this.getAPIKey();
    if (!apiKey) {
      this.log(
        'No Readwise API key set. Please follow the instructions in the plugin settings.',
        true
      );
      return;
    } else if (this.isSyncing) {
      this.log('Sync already in progress.', true);
      return;
    } else if (!(await this.plugin.kb.isPrimaryKnowledgeBase())) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.syncLatest(), SYNC_INTERVAL);
      console.log('Skipping sync - not primary KB');
      return;
    }
    const lastSync = opts.ignoreLastSync ? undefined : await this.getLastSync();
    try {
      this.isSyncing = true;
      const result = await getReadwiseExportsSince(apiKey, lastSync?.toISOString());
      if (result.success) {
        const books = result.data;
        const total = books.reduce((acc, b) => acc + b.highlights.length, 0);
        this.log(`Found ${books.length} books with ${total} highlights.`);
        if (books && books.length > 0) {
          await this.updateSyncError('');
          await this.updateSyncProgress(0);
          if (opts.showModal) {
            await this.openSyncProgressModal();
          }
          const result = await importBooksAndHighlights(
            this.plugin,
            books,
            this.updateSyncProgress.bind(this),
            !!lastSync
          );
          if (result.success) {
            this.log(`Successfully imported ${result.data} books and highlights.`, !!opts.notify);
            await this.updateLastSync();
          } else {
            this.log('Failed to import books and highlights: ' + result.error, true);
            await this.updateSyncError(result.error);
          }
        } else {
          this.log('No new books or highlights to import.', !!opts.notify);
        }
      } else {
        if (result.error == 'auth') {
          this.log(
            'Readwise API key is invalid. Please follow the instructions in the plugin settings.',
            true
          );
        } else {
          this.log('Failed to sync Readwise highlights: ' + result.error, true);
        }
      }
    } catch (e) {
      this.log(`Unexpected Error while syncing Readwise highlights: ${e}`, true);
      await this.updateSyncError('Unexpected Error while syncing Readwise highlights');
    } finally {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.syncLatest(), SYNC_INTERVAL);
      this.isSyncing = false;
    }
  };
}
