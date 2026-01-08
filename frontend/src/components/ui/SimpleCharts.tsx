// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export function SimplePieChart({ data, size = 200 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div
          className="rounded-full bg-gray-200 flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-gray-400 text-sm">Ma'lumot yo'q</span>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">
                {item.label}: 0 (0%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  let cumulativePercent = 0;
  const segments = data.map(item => {
    const percent = ((item.value || 0) / total) * 100;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    return {
      ...item,
      percent: isNaN(percent) ? 0 : percent,
      startPercent: isNaN(startPercent) ? 0 : startPercent,
    };
  });

  // Create conic gradient
  const gradientStops = segments.map(segment => 
    `${segment.color} ${segment.startPercent}% ${segment.startPercent + segment.percent}%`
  ).join(', ');

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${gradientStops})`,
        }}
      />
      <div className="flex flex-wrap gap-3 justify-center">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-sm text-gray-600">
              {segment.label}: {segment.value || 0} ({segment.percent.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BarChartProps {
  data: { label: string; value: number; color: string }[];
  maxValue?: number;
}

export function SimpleBarChart({ data, maxValue }: BarChartProps) {
  const safeData = data.map(d => ({ ...d, value: d.value || 0 }));
  const max = maxValue || Math.max(...safeData.map(d => d.value), 1);

  return (
    <div className="space-y-3">
      {safeData.map((item, index) => {
        const widthPercent = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium text-gray-800">{item.value}</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}

export function SimpleLineChart({ data, color = '#8B5CF6', height = 150 }: LineChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1 || 1)) * 100;
    const y = ((maxValue - item.value) / range) * 100;
    return { x, y, ...item };
  });

  // Create SVG path
  const pathD = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    return `${path} L ${point.x} ${point.y}`;
  }, '');

  // Create area path (filled below line)
  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  return (
    <div className="w-full">
      <svg viewBox="0 0 100 100" className="w-full" style={{ height }}>
        {/* Area fill */}
        <path
          d={areaD}
          fill={color}
          fillOpacity="0.1"
        />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {/* Points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            fill={color}
            className="hover:r-4 transition-all"
          />
        ))}
      </svg>
      {/* Labels */}
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        {data.map((item, index) => (
          <span key={index} className={index > 0 && index < data.length - 1 ? 'hidden md:block' : ''}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  label: string;
  color?: string;
}

export function ScoreGauge({ score, maxScore = 10, label, color = '#8B5CF6' }: ScoreGaugeProps) {
  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r="45"
            stroke="#E5E7EB"
            strokeWidth="6"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r="45"
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">{score}</span>
        </div>
      </div>
      <span className="text-sm text-gray-600 mt-2">{label}</span>
    </div>
  );
}

interface StatsGridProps {
  stats: {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    color?: string;
    trend?: number;
  }[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            {stat.icon && (
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color || 'bg-gray-100'}`}>
                {stat.icon}
              </div>
            )}
            {stat.trend !== undefined && (
              <span className={`text-sm font-medium ${stat.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend >= 0 ? '+' : ''}{stat.trend}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          <p className="text-sm text-gray-500">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
