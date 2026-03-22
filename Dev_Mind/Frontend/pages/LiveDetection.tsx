import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Card, Badge, Icons } from '../components/UI';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { Project } from '../types';

interface LiveDetectionProps {
   activeProject: Project | null;
}

interface ActiveApp {
   name: string;
   category: 'Coding' | 'Browser' | 'Documentation' | 'Entertainment';
}



export const LiveDetection: React.FC<LiveDetectionProps> = ({ activeProject }) => {
   const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString());
   const [burnoutLevel, setBurnoutLevel] = useState<'Low' | 'Moderate' | 'High'>('Low');
   const [kpm, setKpm] = useState(0);
   const [kpmHistory, setKpmHistory] = useState<{ i: number; val: number }[]>(Array.from({ length: 20 }, (_, i) => ({ i, val: 0 })));
   const [mouseSpeed, setMouseSpeed] = useState<'Slow' | 'Moderate' | 'Rapid'>('Slow');
   const [activeApp, setActiveApp] = useState<ActiveApp>({ name: 'Detecting...', category: 'Documentation' });
   const [switchCount, setSwitchCount] = useState(0);
   const [switchTrend, setSwitchTrend] = useState<'stable' | 'up' | 'down'>('stable');
   const [insight, setInsight] = useState("Monitoring baseline activity...");

   // Real Live Data
   const prevStats = React.useRef({ keys: 0, mouse: 0 });

   useEffect(() => {
      const fetchLive = async () => {
         try {
            const stats = await api.getLiveActivity();
            console.log("Live Stats:", stats);
            setTimestamp(new Date().toLocaleTimeString());

            // Update Context Switches
            if (stats.context_switches !== undefined) {
               setSwitchCount(stats.context_switches);
            }
            let deltaKeys = stats.keystrokes - prevStats.current.keys;
            let deltaMouse = stats.mouse_intensity - prevStats.current.mouse;

            // Handle server restart/reset
            if (deltaKeys < 0) deltaKeys = stats.keystrokes;
            if (deltaMouse < 0) deltaMouse = stats.mouse_intensity;

            // Update refs
            prevStats.current = { keys: stats.keystrokes, mouse: stats.mouse_intensity };

            // Calculate KPM (approx 2s interval -> * 30)
            const calculatedKpm = deltaKeys * 30;
            setKpm(calculatedKpm);
            setKpmHistory(prev => [...prev.slice(1), { i: prev[prev.length - 1].i + 1, val: calculatedKpm }]);

            // Mouse Speed
            if (deltaMouse > 7000) setMouseSpeed('Rapid');
            else if (deltaMouse > 3500) setMouseSpeed('Moderate');
            else setMouseSpeed('Slow');

            // Update Active App (from Backend)
            const appName = stats.active_window || "Unknown";
            let category: ActiveApp['category'] = 'Documentation';

            // Simple Category Logic
            if (appName.includes('VS Code') || appName.includes('Code') || appName.includes('.py') || appName.includes('.tsx')) category = 'Coding';
            else if (appName.includes('Chrome') || appName.includes('Edge') || appName.includes('Firefox')) category = 'Browser';
            else if (appName.includes('Spotify') || appName.includes('Netflix')) category = 'Entertainment';

            setActiveApp({ name: appName, category });

            // Update Burnout Risk logic based on ML prediction
            if (stats.burnout_risk) {
               // Map API string to UI state
               if (stats.burnout_risk === 'High Risk') setBurnoutLevel('High');
               else if (stats.burnout_risk === 'Moderate Risk') setBurnoutLevel('Moderate');
               else setBurnoutLevel('Low');
            } else {
               // Fallback
               if (stats.cognitive_load > 80) setBurnoutLevel('High');
               else if (stats.cognitive_load > 50) setBurnoutLevel('Moderate');
               else setBurnoutLevel('Low');
            }

            // Insight Logic
            if (stats.focus_score > 80) setInsight("High focus state detected. Maintain flow.");
            else if (stats.cognitive_load > 90) setInsight("High cognitive load. Consider a micro-break.");
            else if (calculatedKpm > 100) setInsight("High typing throughput.");
            else setInsight("Monitoring baseline activity...");

            // Context Switches
            if (stats.context_switches !== undefined) {
               setSwitchCount(stats.context_switches);
               // Simple trend logic
               // In a real app we'd track history. For now just keep it stable or random for demo?
               // Actually user wants real data. We just show the count.
            }

         } catch (e) {
            console.error("Live fetch error", e);
         }
      };

      const interval = setInterval(fetchLive, 2000);
      return () => clearInterval(interval);
   }, []);

   const getBurnoutColor = (level: string) => {
      switch (level) {
         case 'High': return 'text-red-500 border-red-200 bg-red-50';
         case 'Moderate': return 'text-amber-500 border-amber-200 bg-amber-50';
         default: return 'text-teal-500 border-teal-200 bg-teal-50';
      }
   };

   return (
      <div className="space-y-6">

         {/* Active Project Banner */}
         <div className={`rounded-xl p-4 flex items-center justify-between transition-colors ${activeProject ? 'bg-indigo-50 border border-indigo-100 text-indigo-900' : 'bg-slate-100 border border-slate-200 text-slate-500'}`}>
            <div className="flex items-center space-x-3">
               <Icons.Layers className={`w-5 h-5 ${activeProject ? 'text-indigo-500' : 'text-slate-400'}`} />
               {activeProject ? (
                  <span className="font-medium">Tracking context for: <span className="font-bold">{activeProject.name}</span></span>
               ) : (
                  <span className="font-medium">No specific project context selected.</span>
               )}
            </div>
         </div>

         {/* Live Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
               <div className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500"></span>
               </div>
               <h2 className="text-xl font-semibold text-slate-800">Live Detection - Active</h2>
            </div>
            <p className="text-sm text-slate-400 font-mono">Last updated: {timestamp}</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Burnout Risk Gauge */}
            <Card className="flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 via-amber-500 to-red-500 opacity-20"></div>
               <h3 className="text-slate-500 font-medium mb-6 uppercase tracking-wider text-xs">Real-time Burnout Risk</h3>

               <div className={`w-40 h-40 rounded-full border-8 flex items-center justify-center transition-all duration-1000 ${getBurnoutColor(burnoutLevel)}`}>
                  <div className="text-center">
                     <span className="block text-2xl font-bold">{burnoutLevel}</span>
                     <span className="text-xs opacity-70">Risk Level</span>
                  </div>
               </div>

               <div className="mt-6 flex items-center space-x-2 text-xs text-slate-400">
                  <Icons.Info className="w-3 h-3" />
                  <span>Based on cognitive load & activity patterns</span>
               </div>
            </Card>

            {/* Activity Metrics Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

               {/* Keystrokes */}
               <Card title="Keystroke Activity" subtitle="Typing cadence (KPM)">
                  <div className="flex items-end justify-between mb-4">
                     <div className="text-3xl font-bold text-slate-700">{kpm} <span className="text-sm font-normal text-slate-400">avg</span></div>
                     <div className="text-xs text-slate-400">Live 2s interval</div>
                  </div>
                  <div className="h-24 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={kpmHistory}>
                           <Line type="monotone" dataKey="val" stroke="#818cf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                           <YAxis domain={[0, 200]} hide />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </Card>

               {/* Mouse Speed */}
               <Card title="Mouse Dynamics" subtitle="Cursor velocity & navigation">
                  <div className="flex items-center space-x-4 mb-6 mt-2">
                     <div className="p-3 bg-mint-50 rounded-lg text-mint-500">
                        <Icons.Mouse className="w-6 h-6" />
                     </div>
                     <div>
                        <h4 className="text-lg font-bold text-slate-700">{mouseSpeed}</h4>
                        <p className="text-xs text-slate-400">Movement Intensity</p>
                     </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                     <div
                        className={`h-full transition-all duration-500 rounded-full ${mouseSpeed === 'Rapid' ? 'bg-amber-400 w-3/4' : mouseSpeed === 'Moderate' ? 'bg-teal-400 w-1/2' : 'bg-slate-300 w-1/4'}`}
                     ></div>
                  </div>
               </Card>

               {/* Active App */}
               <Card className="bg-gradient-to-br from-white to-lavender-50">
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="font-semibold text-slate-700">Active Window</h3>
                     <Badge color="purple">{activeApp.category}</Badge>
                  </div>
                  <div className="flex items-center space-x-3 mt-4">
                     <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-slate-500">
                        {activeApp.category === 'Coding' ? <Icons.Keyboard className="w-5 h-5" /> :
                           activeApp.category === 'Browser' ? <Icons.Monitor className="w-5 h-5" /> :
                              <Icons.Layers className="w-5 h-5" />}
                     </div>
                     <span className="font-medium text-slate-800">{activeApp.name}</span>
                  </div>
               </Card>

               {/* Switching Counter */}
               <Card>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Context Switches</h3>
                  <div className="flex items-center space-x-3">
                     <span className="text-3xl font-bold text-slate-700">{switchCount}</span>
                     {switchTrend === 'up' && <Icons.ArrowUp className="w-4 h-4 text-amber-500" />}
                     <span className="text-xs text-slate-400">this session</span>
                  </div>
                  {switchCount > 20 && (
                     <p className="text-xs text-amber-600 mt-2 font-medium">Frequent switching detected</p>
                  )}
               </Card>
            </div>
         </div>

         {/* Insight Strip */}
         <div className="bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl p-4 flex items-center space-x-4 shadow-sm animate-pulse-slow">
            <div className="p-2 bg-indigo-50 rounded-full text-indigo-600">
               <Icons.Zap className="w-4 h-4" />
            </div>
            <p className="text-sm text-slate-600 font-medium flex-1">
               {insight}
            </p>
         </div>

         {/* Privacy Footer */}
         <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2 text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
               <Icons.ShieldCheck className="w-4 h-4" />
               <span className="text-xs">Live detection analyzes activity patterns locally. No content recorded.</span>
            </div>
         </div>
      </div>
   );
};
