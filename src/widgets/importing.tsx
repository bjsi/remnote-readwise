import { renderWidget, usePlugin, useSyncedStorageState } from '@remnote/plugin-sdk';
import { ProgressBar } from '../components/ProgressBar';
import { storage } from '../lib/consts';

const progressDogSrc = 'https://media.tenor.com/Kz9PePpNS-UAAAAM/searching-jifpom.gif';
const finishedDogSrc =
  'https://thumbs.gfycat.com/RewardingLonelyAmericanriverotter-size_restricted.gif';

export function Importing() {
  const plugin = usePlugin();
  const [progress] = useSyncedStorageState<number>(storage.syncProgress, 0);
  const close = async () => await plugin.widget.closePopup();
  return (
    <div className="flex flex-col gap-3 w-[400px] p-3">
      <h1>Sync All Highlights...</h1>
      {progress == 100 ? (
        <>
          <p className="text-lg">Import done!</p>
          <button
            className="p-2 rounded-md bg-blue-40 text-white"
            onClick={async () => {
              await close();
              const rem = await plugin.rem.findByName(['Readwise Books'], null);
              rem?.openRemInContext();
            }}
          >
            Go to Highlights
          </button>
          <img className="rounded-md" src={finishedDogSrc} alt="dog" />
        </>
      ) : (
        <>
          <p>
            Please wait for the initial import to complete. Future imports will happen in the
            background.
          </p>
          <img className="rounded-md" src={progressDogSrc} alt="dog" />
        </>
      )}
      <ProgressBar progress={progress}></ProgressBar>
    </div>
  );
}

renderWidget(Importing);
