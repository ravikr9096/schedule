type Props = {
  onGoToSchedule: () => void;
};

export function HomePage({ onGoToSchedule }: Props) {
  return (
    <div className="section">
      <h1>Welcome To Six One Productions</h1>
      <button className="toggleButton" onClick={onGoToSchedule}>
        View schedule
      </button>
    </div>
  );
}

