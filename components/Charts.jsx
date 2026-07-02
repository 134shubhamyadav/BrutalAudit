'use client';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

export function ScoreRadarChart({ scores }) {
  if (!scores) return null;

  const data = {
    labels: ['Security', 'Architecture', 'Performance', 'AI Slop', 'Test Coverage', 'Documentation'],
    datasets: [
      {
        label: 'Score',
        data: [
          scores.security || 0, 
          scores.architecture || 0, 
          scores.performance || 0,
          scores.slop || 0,
          scores.test_coverage || 0,
          scores.documentation || 0
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.25)', // Premium blue highlight
        borderColor: '#3B82F6',
        borderWidth: 2,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#0a0a0a',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3B82F6',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        pointLabels: { 
          color: 'var(--text-secondary)', 
          font: { size: 12, family: 'Inter, sans-serif' } 
        },
        ticks: { display: false, min: 0, max: 100 },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#121212',
        titleColor: '#fff',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context) => `Score: ${context.raw}/100`
        }
      }
    },
    maintainAspectRatio: false,
  };

  return <div style={{ height: '240px', width: '100%', marginTop: '16px' }}><Radar data={data} options={options} /></div>;
}

export function TrendsLineChart({ audits }) {
  if (!audits || audits.length === 0) return null;
  
  // Sort chronologically (oldest to newest)
  const sorted = [...audits].sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));
  
  const data = {
    labels: sorted.map(a => new Date(a.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Overall Score',
        data: sorted.map(a => a.scores?.overall || 0),
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
          return gradient;
        },
        borderColor: '#EF4444',
        borderWidth: 2,
        tension: 0.4, // Curved spline
        pointBackgroundColor: '#0a0a0a',
        pointBorderColor: '#EF4444',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-muted)', font: { family: 'Inter, sans-serif' } },
        border: { display: false }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
        ticks: { display: false, min: 0, max: 100 },
        border: { display: false }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#121212',
        titleColor: '#fff',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: (contexts) => {
            const idx = contexts[0].dataIndex;
            return sorted[idx].repo_name;
          },
          label: (context) => `Overall Score: ${context.raw}`
        }
      }
    },
    maintainAspectRatio: false,
  };

  return <div style={{ height: '240px', width: '100%', marginTop: '16px' }}><Line data={data} options={options} /></div>;
}

export function HistoryLineChart({ history }) {
  if (!history || history.length < 2) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Not enough historical data to show a trend.
      </div>
    );
  }

  const data = {
    labels: history.map(h => new Date(h.created_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Overall Score',
        data: history.map(h => h.scores.overall || 0),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Security',
        data: history.map(h => h.scores.security || 0),
        borderColor: '#EF4444',
        borderWidth: 1,
        borderDash: [5, 5],
        tension: 0.3,
      },
      {
        label: 'Architecture',
        data: history.map(h => h.scores.architecture || 0),
        borderColor: '#F59E0B',
        borderWidth: 1,
        borderDash: [5, 5],
        tension: 0.3,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#a1a1aa',
          padding: 20,
          font: { family: "'Space Grotesk', sans-serif" }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { family: "'Space Grotesk', sans-serif" },
        bodyFont: { family: "'Space Grotesk', sans-serif" },
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#71717a' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#71717a' }
      }
    }
  };

  return <Line data={data} options={options} />;
}
