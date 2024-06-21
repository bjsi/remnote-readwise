# Readwise Sync

## Features

- Sync your Readwise highlights into RemNote

## Usage

- Add your Readwise API key in the plugin settings page. You can acquire a Readwise API key by following [these instructions](https://readwise.io/access_token).
- On your first time using the plugin, you should use the `Readwise Sync All` command to load all of your existing highlights into RemNote. You can find this command in the Omnibar by pressing `ctrl/cmd+k` and searching for "Readwise Sync All".
  - If you have a really large Readwise collection, this could take up to 10 minutes. Please be patient :)
  - While the initial sync is running, **don't refresh the page or close the tab**.

![CleanShot 2024-05-30 at 10 51 15](https://github.com/bjsi/remnote-readwise/assets/58147075/0b88aade-3db0-4608-bfd6-1b0b6c6cf40e)

- Once the initial sync is done, future syncing will happen **automatically in the background** every 2 minutes.

## Details

- Readwise books are stored under a Top Level Rem called "Readwise Books" - **please don't rename, move or delete this document otherwise the plugin won't be able to find where to save your highlights!**
- Readwise highlights are stored as children of the Readwise book they belong to.
