import React, { useState, useEffect, useMemo } from 'react';
import { Card, Badge, ProgressBar, Button, Icons } from '../components/UI';
import { EMOJI_OPTIONS } from '../constants';
import { ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Project } from '../types';
import { api } from '../api';

interface DashboardProps {
  activeProject: Project | null;
}

const clamp = (value: number, low = 0, high = 100) => Math.max(low, Math.min(high, value));

const deriveRealtimeMetrics = (keystrokes: number, mouseDistance: number, contextSwitches: number) => {
  const keysPerMin = Math.max(0, keystrokes) * 12;
  const mousePerMin = Math.max(0, mouseDistance) * 12;

  const typingScore = clamp((keysPerMin / 120) * 100);
  const mouseScore = clamp((mousePerMin / 5000) * 100);
  const switchPenalty = Math.min(Math.max(0, contextSwitches) * 6, 24);

  const focus = Math.round(clamp((typingScore * 0.62) + (mouseScore * 0.28) - switchPenalty));
  const cognitive = Math.round(clamp((typingScore * 0.30) + (mouseScore * 0.45) + (Math.max(0, contextSwitches) * 8)));

  return { focus, cognitive };
};

export const Dashboard: React.FC<DashboardProps> = ({ activeProject }) => {
  const [journalEmoji, setJournalEmoji] = useState<string | null>(null);
  const [journalNote, setJournalNote] = useState('');

  const [stats, setStats] = useState({
    currentZone: 'Loading...',
    focusScore: 0,
    burnoutRisk: 'Low',
    chartData: [] as { name: string; val: number }[]
  });

  const [liveSnapshot, setLiveSnapshot] = useState({
    keystrokes: 0,
    mouse_intensity: 0,
    focus_score: 0,
    cognitive_load: 0,
    active_window: 'Unknown',
    burnout_risk: 'Low',
    context_switches: 0,
  });

  const [liveTrail, setLiveTrail] = useState<Array<{ name: string; liveVal: number }>>([]);
  const previousTotalsRef = React.useRef({
    initialized: false,
    keystrokes: 0,
    mouseIntensity: 0,
    contextSwitches: 0,
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const dashboardData = await api.getDashboardStats();

        setStats({
          currentZone: dashboardData.current_zone,
          focusScore: dashboardData.focus_score,
          burnoutRisk: dashboardData.burnout_risk,
          chartData: dashboardData.chart_data,
        });
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
        setStats(prev => ({ ...prev, currentZone: 'Error' }));
      }
    };

    fetchDashboardStats();

    const interval = setInterval(fetchDashboardStats, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const liveData = await api.getLiveActivity();

        const prev = previousTotalsRef.current;
        let deltaKeys = liveData.keystrokes - prev.keystrokes;
        let deltaMouse = liveData.mouse_intensity - prev.mouseIntensity;
        let deltaSwitches = liveData.context_switches - prev.contextSwitches;

        // Handle restarts/resets where counters jump backwards.
        if (deltaKeys < 0) deltaKeys = liveData.keystrokes;
        if (deltaMouse < 0) deltaMouse = liveData.mouse_intensity;
        if (deltaSwitches < 0) deltaSwitches = liveData.context_switches;

        previousTotalsRef.current = {
          initialized: true,
          keystrokes: liveData.keystrokes,
          mouseIntensity: liveData.mouse_intensity,
          contextSwitches: liveData.context_switches,
        };

        let realtimeFocus = liveData.focus_score;
        let realtimeCognitive = liveData.cognitive_load;

        if (prev.initialized) {
          // Normalize 2s deltas into 5s-like intervals used by backend model logic.
          const intervalScale = 2.5;
          const scaledKeys = Math.round(deltaKeys * intervalScale);
          const scaledMouse = deltaMouse * intervalScale;
          const scaledSwitches = Math.round(deltaSwitches * intervalScale);

          const hasRealtimeSignal = deltaKeys > 0 || deltaMouse > 0 || deltaSwitches > 0;
          if (hasRealtimeSignal) {
            const derived = deriveRealtimeMetrics(scaledKeys, scaledMouse, scaledSwitches);
            realtimeFocus = derived.focus;
            realtimeCognitive = derived.cognitive;
          }
        }

        setLiveSnapshot({
          ...liveData,
          focus_score: realtimeFocus,
          cognitive_load: realtimeCognitive,
        });

        const liveLabel = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });

        setLiveTrail(prevTrail => {
          const next = [...prevTrail, { name: liveLabel, liveVal: realtimeCognitive }];
          return next.slice(-6);
        });
      } catch (error) {
        console.error('Failed to load live stats', error);
      }
    };

    fetchLiveStats();

    const interval = setInterval(fetchLiveStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const blendedFocusScore = useMemo(() => {
    return Math.round((stats.focusScore + liveSnapshot.focus_score) / 2);
  }, [stats.focusScore, liveSnapshot.focus_score]);

  const chartDataWithLive = useMemo(() => {
    const historical = stats.chartData.map((point) => ({ name: point.name, val: point.val }));

    if (historical.length === 0) {
      return liveTrail.map(point => ({ name: point.name, val: point.liveVal }));
    }

    const trailRows = liveTrail.map(point => ({ name: point.name, val: point.liveVal }));

    return [
      ...historical,
      ...trailRows,
    ];
  }, [stats.chartData, liveTrail]);

  const avgCognitiveLoad = useMemo(() => {
    const historicalValues = stats.chartData.map((point) => point.val);
    const liveValue = liveSnapshot.cognitive_load > 0 ? [liveSnapshot.cognitive_load] : [];
    const values = [...historicalValues, ...liveValue];
    if (values.length === 0) return 0;
    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round(total / values.length);
  }, [stats.chartData, liveSnapshot.cognitive_load]);

  const intensityLabel = useMemo(() => {
    if (avgCognitiveLoad >= 70) return 'High Intensity';
    if (avgCognitiveLoad >= 40) return 'Moderate Intensity';
    return 'Low Intensity';
  }, [avgCognitiveLoad]);

  const burnoutLevel = useMemo(() => {
    const rawRisk = (liveSnapshot.burnout_risk || stats.burnoutRisk || 'Low').toLowerCase();
    if (rawRisk.includes('high')) return 'High';
    if (rawRisk.includes('moderate')) return 'Moderate';
    return 'Low';
  }, [liveSnapshot.burnout_risk, stats.burnoutRisk]);

  const burnoutText = useMemo(() => {
    if (burnoutLevel === 'High') return 'High strain detected';
    if (burnoutLevel === 'Moderate') return 'Elevated strain detected';
    return 'Stable levels detected';
  }, [burnoutLevel]);

  const burnoutColor = useMemo(() => {
    if (burnoutLevel === 'High') return 'bg-red-500';
    if (burnoutLevel === 'Moderate') return 'bg-amber-500';
    return 'bg-green-500';
  }, [burnoutLevel]);

  const xAxisInterval = chartDataWithLive.length > 18 ? 2 : 0;

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
        <Card className="relative overflow-hidden group hover:!shadow-2xl hover:!scale-[1.02] transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity duration-500">
            <Icons.Brain className="w-20 h-20 text-indigo-600 rotate-12" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 mb-1">Current Mental State</p>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">{stats.currentZone}</h3>
            <Badge color="purple">{intensityLabel}</Badge>
          </div>
        </Card>

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

        <Card>
          <p className="text-sm font-medium text-slate-500 mb-1">Burnout Risk</p>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">{burnoutLevel} Risk</h3>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <div className={`w-2 h-2 rounded-full ${burnoutColor} animate-pulse`}></div>
            <span>{burnoutText}</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up animation-delay-500">
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Today's Cognitive Load"
            subtitle={activeProject ? `Live detection trend for ${activeProject.name}` : 'Live detection trend with baseline history'}
          >
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartDataWithLive}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    interval={xAxisInterval}
                    minTickGap={24}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#4f46e5' }}
                    formatter={(value: number) => [value, 'Cognitive Load']}
                  />
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorVal)"
                    name="Cognitive Load"
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Live Detection Snapshot">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Keystrokes</span>
                <span className="font-semibold text-slate-800">{liveSnapshot.keystrokes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Mouse Intensity</span>
                <span className="font-semibold text-slate-800">{liveSnapshot.mouse_intensity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Context Switches</span>
                <span className="font-semibold text-slate-800">{liveSnapshot.context_switches}</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-start space-x-2 text-xs text-slate-500">
                  <Icons.Monitor className="w-4 h-4 mt-0.5" />
                  <span className="break-words">{liveSnapshot.active_window || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Reflection Journal" subtitle="How are you feeling right now?">
            <div className="flex justify-between mb-4 px-2">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setJournalEmoji(emoji)}
                  className={`text-2xl p-2 rounded-xl transition-all hover:bg-slate-100 ${journalEmoji === emoji ? 'bg-indigo-100 scale-110 shadow-sm' : 'grayscale opacity-70 hover:grayscale-0 hover:opacity-100'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <textarea
              value={journalNote}
              onChange={(e) => setJournalNote(e.target.value)}
              placeholder="Briefly note your state of mind..."
              className="w-full text-sm p-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none resize-none h-24 transition-all mb-3"
            />
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Private & Local</span>
              <Button size="sm" variant="secondary" onClick={() => { setJournalEmoji(null); setJournalNote(''); }}>Save Entry</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};