import { T } from '../theme';

function Skeleton() {
  return (
    <div className="rounded-xl border px-5 py-4 animate-pulse" style={{ background: T.card, borderColor: T.border }}>
      <div className="h-4 rounded w-2/3 mb-3" style={{ background: '#E4E1D5' }} />
      <div className="h-3 rounded w-full mb-2" style={{ background: '#ECE9DE' }} />
      <div className="h-3 rounded w-1/3" style={{ background: '#ECE9DE' }} />
    </div>
  );
}

export default Skeleton;
