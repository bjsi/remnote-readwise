import { renderWidget, usePlugin, useSyncedStorageState } from '@remnote/plugin-sdk';
import { ProgressBar } from '../components/ProgressBar';
import { storage } from '../lib/consts';

const progressDogSrc = 'https://media.tenor.com/Kz9PePpNS-UAAAAM/searching-jifpom.gif';
const finishedDogSrc =
  'https://thumbs.gfycat.com/RewardingLonelyAmericanriverotter-size_restricted.gif';
const errorDog = 'https://media.tenor.com/jLiPnLzm6QcAAAAd/funny-animals-dog.gif';

function Done() {
  const plugin = usePlugin();
  const close = async () => await plugin.widget.closePopup();
  return (
    <>
      <p className="text-lg">🎉 Import done!</p>
      <p>
        From now on, imports will happen automatically in the background. No need to run any
        commands.
      </p>
      <img className="rounded-md" src={finishedDogSrc} alt="dog" />
      <button
        className="p-2 rounded-md bg-blue-40 text-white"
        onClick={async () => {
          const rem = await plugin.rem.findByName(['Readwise Books'], null);
          rem?.openRemAsPage();
          await close();
        }}
      >
        Go to Highlights
      </button>
    </>
  );
}

function Loading(props: { progress: number }) {
  return (
    <>
      <p>
        Please wait for the initial import to complete.{' '}
        <span className="font-semibold">Please don't refresh the page or close the tab</span>.
        Future imports will happen in the background.
      </p>
      <img className="rounded-md" src={progressDogSrc} alt="dog" />
      <ProgressBar progress={props.progress}></ProgressBar>
    </>
  );
}

function ImportError(props: { error: string }) {
  return (
    <>
      <p className="text-lg">🚨 Import failed!</p>
      <p className="text-red-40">Error: {props.error}</p>
      <p className="">
        Please report the error through GitHub using the button below, or message Jamesb in the
        RemNote Discord. Sorry for the inconvenience!
      </p>
      <img className="rounded-md" src={errorDog} alt="dog" />
      <button
        className="p-2 rounded-md bg-blue-40 text-white"
        onClick={async () => {
          window.open('https://github.com/bjsi/remnote-readwise/issues/new', '_blank');
        }}
      >
        🐛 Report Bug
      </button>
    </>
  );
}

export function Importing() {
  const [progress] = useSyncedStorageState<number>(storage.syncProgress, 0);
  const done = progress == 100;
  const [error] = useSyncedStorageState<string>(storage.syncError, '');
  const plugin = usePlugin();
  const close = async () => await plugin.widget.closePopup();
  return (
    <div className="flex flex-col gap-3 w-[400px] p-3">
      <div className="flex flex-row items-center justify-between">
        <h1>Sync All Highlights</h1>
        {(done || error) && (
          <button className="p-2 flex items-center" onClick={close}>
            ❌
          </button>
        )}
      </div>
      {done ? <Done /> : error ? <ImportError error={error} /> : <Loading progress={progress} />}
    </div>
  );
}

renderWidget(Importing);
