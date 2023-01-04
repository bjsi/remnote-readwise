interface ProgressBarProps {
  progress: number;
  className?: string;
}

export const ProgressBar = (props: ProgressBarProps) => {
  const width = `${props.progress}%`;
  return (
    <div className={'h-6 bg-gray-30 rounded-full w-[100%]'}>
      <div className="bg-blue-40 h-full rounded-full" style={{ width }}></div>
    </div>
  );
};
