import React, { useState, useEffect } from 'react';
import { Card, Icons, ProgressBar } from '../components/UI';
import { TimeGranularity, Project } from '../types';
import { api } from '../api';
import {
  BarChart, Bar, ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, ReferenceLine
} from 'recharts';

interface AnalyticsProps {
  activeProject: Project | null;
}

export const Analytics: React.FC<AnalyticsProps> = ({ activeProject }) => {
  const [comparativeMode, setComparativeMode] = useState(false);
  const [granularity, setGranularity] = useState<TimeGranularity>('hourly');
  const [currentData, setCurrentData] = useState<any[]>([]);
  const [blendedFocusScore, setBlendedFocusScore] = useState(0);

  // Metric Visibility State
  const [metrics, setMetrics] = useState({
    focus: true,
    avgFocus: true,
    workload: true,
    avgWorkload: false, // Default off to reduce clutter
  });

  const toggleMetric = (key: keyof typeof metrics) => {
    setMetrics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getAnalyticsData(activeProject ? activeProject.id : null, granularity);
        setCurrentData(data);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
        setCurrentData([]);
      }
    };
    fetchData();

    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, [granularity, activeProject]);

  useEffect(() => {
    const fetchBlendedFocus = async () => {
      try {
        const [dashboardData, liveData] = await Promise.all([
          api.getDashboardStats(),
          api.getLiveActivity(),
        ]);

        setBlendedFocusScore(Math.round((dashboardData.focus_score + liveData.focus_score) / 2));
      } catch (error) {
        console.error('Failed to fetch blended focus score', error);
      }
    };

    fetchBlendedFocus();

    const interval = setInterval(fetchBlendedFocus, 8000);
    return () => clearInterval(interval);
  }, []);

  // Calculate Averages for Summary Cards & Reference Lines
  const averages = React.useMemo(() => {
    if (currentData.length === 0) return { focus: 0, workload: 0 };

    const total = currentData.reduce((acc, curr) => ({
      focus: acc.focus + curr.focus,
      workload: acc.workload + curr.workload
    }), { focus: 0, workload: 0 });

    return {
      focus: Math.round(total.focus / currentData.length),
      workload: Math.round(total.workload / currentData.length)
    };
  }, [currentData]);

  const ComparisonLabel = () => {
    if (granularity === 'hourly') return <span className="text-xs text-slate-400">(vs Yesterday)</span>;
    if (granularity === 'daily') return <span className="text-xs text-slate-400">(vs Last Week)</span>;
    return <span className="text-xs text-slate-400">(vs Last Month)</span>;
  };

  return (
    <div className="space-y-6">

      {/* Active Project Banner */}
      <div className={`rounded-xl p-4 flex items-center justify-between transition-colors ${activeProject ? 'bg-indigo-50 border border-indigo-100 text-indigo-900' : 'bg-slate-100 border border-slate-200 text-slate-500'}`}>
        <div className="flex items-center space-x-3">
          <Icons.Layers className={`w-5 h-5 ${activeProject ? 'text-indigo-500' : 'text-slate-400'}`} />
          {activeProject ? (
            <span className="font-medium">Analytics for: <span className="font-bold">{activeProject.name}</span></span>
          ) : (
            <span className="font-medium">Global Analytics (No active project)</span>
          )}
        </div>
      </div>

      {/* --- CONTROL BAR --- */}
      <div className="bg-white/60 backdrop-blur-md border border-slate-200 p-4 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-4 shadow-sm">

        {/* Time Granularity */}
        <div className="flex bg-slate-100/80 p-1 rounded-xl">
          {(['hourly', 'daily', 'weekly'] as TimeGranularity[]).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${granularity === g
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {g === 'hourly' ? 'Time' : g}
            </button>
          ))}
        </div>

        {/* Metric Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-1">Metrics:</span>

          <button
            onClick={() => toggleMetric('focus')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${metrics.focus ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-400'
              }`}
          >
            <div className={`w-2 h-2 rounded-full ${metrics.focus ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
            <span>Focus</span>
          </button>

          <button
            onClick={() => toggleMetric('avgFocus')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${metrics.avgFocus ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-200 text-slate-400'
              }`}
          >
            <div className={`w-2 h-2 rounded-full ${metrics.avgFocus ? 'bg-purple-400' : 'bg-slate-300'}`}></div>
            <span>Avg Focus</span>
          </button>

          <button
            onClick={() => toggleMetric('workload')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${metrics.workload ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-400'
              }`}
          >
            <div className={`w-2 h-2 rounded-full ${metrics.workload ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
            <span>Workload</span>
          </button>

          <button
            onClick={() => toggleMetric('avgWorkload')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${metrics.avgWorkload ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-400'
              }`}
          >
            <div className={`w-2 h-2 rounded-full ${metrics.avgWorkload ? 'bg-teal-500' : 'bg-slate-300'}`}></div>
            <span>Avg Workload</span>
          </button>
        </div>

        {/* Comparative Mode Toggle */}
        <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
          <span className="text-xs text-slate-500 font-medium">Compare</span>
          <button
            onClick={() => setComparativeMode(!comparativeMode)}
            className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${comparativeMode ? 'bg-indigo-500' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${comparativeMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </button>
        </div>
      </div>

      {/* --- DYNAMIC SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.focus && (
          <Card>
            <div className="mb-2">
              <p className="text-sm font-medium text-slate-500 mb-1">Focus Score</p>
              <h3 className="text-3xl font-bold text-slate-800">
                {blendedFocusScore}
                <span className="text-sm font-normal text-slate-400">/100</span>
              </h3>
            </div>
            <ProgressBar value={blendedFocusScore} color="bg-gradient-to-r from-blue-400 to-indigo-500" />
            <p className="text-xs text-indigo-600 mt-2">Live Detection</p>
          </Card>
        )}

        {metrics.avgFocus && (
          <Card className="border-t-4 border-t-purple-400">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Avg Focus ({granularity})</p>
            <h3 className="text-2xl font-bold text-slate-700 mt-1">
              {averages.focus}%
            </h3>
            <p className="text-xs text-slate-400 mt-1">Baseline performance</p>
          </Card>
        )}

        {metrics.workload && (
          <Card className="border-t-4 border-t-amber-500">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Current Workload</p>
            <h3 className="text-2xl font-bold text-slate-700 mt-1">
              {currentData.length > 0 ? currentData[currentData.length - 1].workload : 0} <span className="text-sm font-normal text-slate-400">/100</span>
            </h3>
            <div className="mt-2 text-xs text-amber-600 bg-amber-50 inline-block px-2 py-0.5 rounded">
              High Intensity
            </div>
          </Card>
        )}

        {metrics.avgWorkload && (
          <Card className="border-t-4 border-t-teal-500">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Avg Workload ({granularity})</p>
            <h3 className="text-2xl font-bold text-slate-700 mt-1">
              {averages.workload}%
            </h3>
            <p className="text-xs text-slate-400 mt-1">Sustainable pace</p>
          </Card>
        )}
      </div>

      {/* --- MAIN CHART AREA --- */}
      <Card title={`Analytics Overview: ${granularity.charAt(0).toUpperCase() + granularity.slice(1)}`} action={comparativeMode ? <ComparisonLabel /> : null}>
        <div className="h-96 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            {currentData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-400">
                No data available. Start tracking to see analytics.
              </div>
            ) : comparativeMode ? (
              // COMPARATIVE CHART
              <BarChart data={currentData} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                {/* Focus Comparisons */}
                {metrics.focus && <Bar dataKey="focus" name="Focus (Current)" fill="#6366f1" radius={[4, 4, 0, 0]} />}
                {metrics.focus && <Bar dataKey="prevFocus" name="Focus (Previous)" fill="#c7d2fe" radius={[4, 4, 0, 0]} />}

                {/* Workload Comparisons */}
                {metrics.workload && <Bar dataKey="workload" name="Workload (Current)" fill="#f59e0b" radius={[4, 4, 0, 0]} />}
                {metrics.workload && <Bar dataKey="prevWorkload" name="Workload (Previous)" fill="#fde68a" radius={[4, 4, 0, 0]} />}
              </BarChart>
            ) : (
              // STANDARD DYNAMIC CHART
              <ComposedChart data={currentData}>
                <defs>
                  <linearGradient id="colorCognitive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />

                {/* Cognitive Background (Always subtle) */}
                <Area type="monotone" dataKey="cognitiveLoad" name="Cognitive Load" fill="url(#colorCognitive)" stroke="transparent" />

                {/* Dynamic Metrics */}
                {metrics.focus && (
                  <Bar dataKey="focus" name="Focus Level" barSize={granularity === 'hourly' ? 20 : 40} fill="#6366f1" radius={[4, 4, 0, 0]} />
                )}

                {metrics.workload && (
                  <Line type="monotone" dataKey="workload" name="Workload" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                )}

                {/* Averages as Reference Lines */}
                {metrics.avgFocus && (
                  <ReferenceLine y={averages.focus} label="Avg Focus" stroke="#a78bfa" strokeDasharray="3 3" />
                )}
                {metrics.avgWorkload && (
                  <ReferenceLine y={averages.workload} label="Avg Load" stroke="#14b8a6" strokeDasharray="3 3" />
                )}

              </ComposedChart>
            )}

          </ResponsiveContainer>
        </div>
      </Card>

      {/* --- FOOTER INFO --- */}

    </div>
  );
};
