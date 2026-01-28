import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend
} from 'recharts';

const RiasecRadar = ({ scores }) => {
  if (!scores) return null;

  const data = [
    { subject: 'Realistic (R)', A: scores.R || 0, fullMark: 30 },
    { subject: 'Investigative (I)', A: scores.I || 0, fullMark: 30 },
    { subject: 'Artistic (A)', A: scores.A || 0, fullMark: 30 },
    { subject: 'Social (S)', A: scores.S || 0, fullMark: 30 },
    { subject: 'Enterprising (E)', A: scores.E || 0, fullMark: 30 },
    { subject: 'Conventional (C)', A: scores.C || 0, fullMark: 30 },
  ];

  return (
    <div className="w-full h-[300px] md:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="oklch(var(--bc)/0.2)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'oklch(var(--bc))', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 30]} tick={false} axisLine={false} />
          <Radar
            name="Твоят профил"
            dataKey="A"
            stroke="oklch(var(--p))"
            fill="oklch(var(--p))"
            fillOpacity={0.6}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiasecRadar;
