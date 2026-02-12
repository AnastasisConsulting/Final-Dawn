// components/ui/QuestBadge.tsx
import React from 'react';

interface QuestBadgeProps {
  status: string;
  checkpoint: number;
}

const QuestBadge: React.FC<QuestBadgeProps> = ({ status, checkpoint }) => {
  if (status === 'COMPLETED') {
    return <span className="bg-green-500/20 text-green-400 text-[9px] px-1 rounded border border-green-500/30">COMPLETE</span>;
  }
  if (status === 'ACTIVE') {
    return <span className="bg-yellow-500/20 text-yellow-400 text-[9px] px-1 rounded border border-yellow-500/30">ACTIVE ({checkpoint}/3)</span>;
  }
  return <span className="bg-white/10 text-white/40 text-[9px] px-1 rounded">QUEUED</span>;
};

export default QuestBadge;
