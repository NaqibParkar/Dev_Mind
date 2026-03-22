import React from 'react';
import { Card, Button, Icons } from '../components/UI';
import { AppSettings, AlertConfig } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (newSettings: AppSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  
  const Toggle = ({ 
    label, 
    desc, 
    active, 
    onChange 
  }: { 
    label: string, 
    desc: string, 
    active: boolean, 
    onChange: (val: boolean) => void 
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div className="pr-4">
        <h4 className="text-sm font-medium text-slate-700">{label}</h4>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <button 
        onClick={() => onChange(!active)}
        className={`flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 relative ${active ? 'bg-indigo-500' : 'bg-slate-200'}`}
      >
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
      </button>
    </div>
  );

  const updateAlerts = (updates: Partial<AlertConfig> | Partial<AlertConfig['types']>, isType = false) => {
    if (isType) {
      onUpdate({
        ...settings,
        alerts: {
          ...settings.alerts,
          types: { ...settings.alerts.types, ...updates }
        }
      });
    } else {
      onUpdate({
        ...settings,
        alerts: { ...settings.alerts, ...updates }
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Settings & Privacy</h2>
        <p className="text-slate-500">Manage your data, alerts, and application preferences.</p>
      </div>

      <Card title="Alerts & Notifications">
         <div className="mb-4">
           <Toggle 
             label="Enable Cognitive Alerts" 
             desc="Show popup suggestions based on live behavior analysis."
             active={settings.alerts.enabled}
             onChange={(val) => updateAlerts({ enabled: val })}
           />
         </div>
         
         {settings.alerts.enabled && (
           <div className="pl-4 border-l-2 border-slate-100 space-y-2 animate-in slide-in-from-left-2 duration-200">
              <div className="mb-4">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sensitivity</label>
                 <div className="flex gap-2 mt-2">
                    {(['Low', 'Medium', 'High'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => updateAlerts({ sensitivity: level })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          settings.alerts.sensitivity === level 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                 </div>
              </div>

              <Toggle 
                label="Burnout Risk" 
                desc="Alert when sustained high workload is detected."
                active={settings.alerts.types.burnout}
                onChange={(val) => updateAlerts({ burnout: val }, true)}
              />
               <Toggle 
                label="Focus Drop" 
                desc="Notify when focus drifts significantly."
                active={settings.alerts.types.focusDrop}
                onChange={(val) => updateAlerts({ focusDrop: val }, true)}
              />
               <Toggle 
                label="Context Switching" 
                desc="Alert on excessive application toggling."
                active={settings.alerts.types.contextSwitching}
                onChange={(val) => updateAlerts({ contextSwitching: val }, true)}
              />
               <Toggle 
                label="Prolonged Work" 
                desc="Remind to take breaks after long sessions."
                active={settings.alerts.types.prolongedWork}
                onChange={(val) => updateAlerts({ prolongedWork: val }, true)}
              />
           </div>
         )}
      </Card>

      <Card title="Productivity Engine">
         <Toggle 
           label="Smart Break Suggestions" 
           desc="Suggest breaks based on fatigue detection" 
           active={settings.smartBreaks}
           onChange={(val) => onUpdate({...settings, smartBreaks: val})} 
         />
         <Toggle 
           label="Comparative Mode" 
           desc="Enable 'You vs You' analytics dashboards" 
           active={settings.comparativeMode} 
           onChange={(val) => onUpdate({...settings, comparativeMode: val})}
         />
         <Toggle 
           label="Reflection Journal" 
           desc="Show mood prompt after deep work sessions" 
           active={settings.reflectionJournal} 
           onChange={(val) => onUpdate({...settings, reflectionJournal: val})}
         />
         <Toggle 
           label="Passive Mode" 
           desc="Run analytics without any UI popups" 
           active={settings.passiveMode} 
           onChange={(val) => onUpdate({...settings, passiveMode: val})}
         />
      </Card>

      <Card title="About">
         <div className="text-center py-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/20">
              <Icons.Brain className="text-white w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">DevMind</h3>
            <p className="text-sm text-slate-500 mb-4">Version 1.0.0 (Beta)</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Designed for cognitive sustainability. 
              Built with React, Tailwind, and privacy-preserving ML.
            </p>
         </div>
      </Card>
    </div>
  );
};