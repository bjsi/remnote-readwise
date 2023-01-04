interface ProgressBarProps {
  progress: number;
}

export const ProgressBar = (props: ProgressBarProps) => {
  const width = `${props.progress}%`;

  return (
    <div className="relative h-6 bg-gray-300 rounded-full">
      <div className="bg-blue-400 h-full rounded-full" style={{ width }}></div>
    </div>
  );
};
