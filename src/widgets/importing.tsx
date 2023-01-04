import { renderWidget, useSyncedStorageState } from '@remnote/plugin-sdk';
import { ProgressBar } from '../components/ProgressBar';
import { storage } from '../lib/consts';

export function Importing() {
  const [progress] = useSyncedStorageState<number>(storage.syncProgress, 0);
  return (
    <div>
      <h1>Importing...</h1>
      <p>Please wait for the import to complete.</p>
      {progress == 100 && <p>Import done!</p>}
      <ProgressBar progress={progress}></ProgressBar>
    </div>
  );
}

renderWidget(Importing);
