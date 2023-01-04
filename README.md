# Readwise Sync

## Features

- Sync your Readwise highlights into RemNote

## Usage

- Add your Readwise API key in the plugin settings page. You can acquire a Readwise API key by following [these instructions](https://readwise.io/access_token)
- On your first time using the plugin, you should use the `Readwise Sync All` command after filling in your API key to load all of your existing highlights into RemNote.
- If you have a really large Readwise collection, this could take up to 10 minutes.
- While the initial sync is running, don't refresh the page or close the tab.
- Once the initial sync is done, future syncing will happen **automatically in the background**, roughly every 30 minutes.

## Details

- Readwise books are stored under a Top Level Rem called "Readwise Books"
- Readwise highlights are stored as children of the Readwise book they belong to.
