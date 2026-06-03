'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartElementProps {
  chartType: 'bar' | 'line' | 'pie';
  chartData: { labels: string[]; datasets: { label: string; data: number[]; backgroundColor?: string; borderColor?: string }[] };
  width: number;
  height: number;
}

export default function ChartElement({ chartType, chartData, width, height }: ChartElementProps) {
  const data = useMemo(() => ({
    labels: chartData.labels,
    datasets: chartData.datasets.map((ds, i) => ({
      label: ds.label || `Dataset ${i + 1}`,
      data: ds.data,
      backgroundColor: ds.backgroundColor || getDefaultColor(i, 0.6),
      borderColor: ds.borderColor || getDefaultColor(i, 1),
      borderWidth: 2,
      fill: chartType === 'line',
      tension: chartType === 'line' ? 0.3 : 0,
    })),
  }), [chartData, chartType]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { size: 12 },
          padding: 10,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        cornerRadius: 4,
      },
    },
    scales: chartType === 'pie' ? {} : {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { size: 11 } },
      },
    },
  }), [chartType]);

  const chartStyle = { width, height };

  if (chartType === 'bar') {
    return <div style={chartStyle}><Bar data={data} options={options} /></div>;
  }
  if (chartType === 'line') {
    return <div style={chartStyle}><Line data={data} options={options} /></div>;
  }
  if (chartType === 'pie') {
    return <div style={chartStyle}><Pie data={data} options={options} /></div>;
  }

  return <div style={{ ...chartStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Unsupported chart type</div>;
}

function getDefaultColor(index: number, alpha: number): string {
  const colors = [
    `rgba(54, 162, 235, ${alpha})`,   // blue
    `rgba(75, 192, 192, ${alpha})`,   // teal
    `rgba(255, 206, 86, ${alpha})`,   // yellow
    `rgba(255, 99, 132, ${alpha})`,   // red
    `rgba(153, 102, 255, ${alpha})`,  // purple
    `rgba(255, 159, 64, ${alpha})`,   // orange
    `rgba(199, 199, 199, ${alpha})`,  // gray
    `rgba(83, 102, 255, ${alpha})`,   // indigo
  ];
  return colors[index % colors.length];
}
