import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  textColorClass?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, textColorClass = "text-white" }) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-md shadow-sm">
      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block mb-1">{label}</span>
      <span className={`text-lg font-black tracking-tight ${textColorClass}`}>{value}</span>
    </div>
  );
};
