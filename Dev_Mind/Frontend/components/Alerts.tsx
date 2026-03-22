import React, { useState, useEffect, useRef } from 'react';
import { Button, Icons } from './UI';
import { AppSettings, AlertType } from '../types';

// --- Presentational Component ---

interface AlertPopupProps {
  type: AlertType;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}

const AlertContent = {
  'burnout': {
    title: 'Workload Alert',
    message: 'Sustained mental workload detected. A short recovery break may help restore cognitive resources.',
    icon: Icons.Activity,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-100'
  },
  'focus-drop': {
    title: 'Focus Drift',
    message: 'Your focus level has reduced significantly compared to earlier activity.',
    icon: Icons.Zap, // Using Zap as a focus/energy icon alternative
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-100'
  },
  'context-switching': {
    title: 'Context Switching',
    message: 'Frequent application switching detected. This often indicates fragmentation of attention.',
    icon: Icons.Layers,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-100'
  },
  'prolonged-work': {
    title: 'Deep Work Duration',
    message: 'You’ve been working continuously for a long time. Consider taking a short pause.',
    icon: Icons.Brain,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-100'
  }
};

export const AlertPopup: React.FC<AlertPopupProps> = ({ type, onDismiss, onSnooze }) => {
  const content = AlertContent[type];
  const Icon = content.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onDismiss}
      ></div>
      
      {/* Modal Content */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl p-6 w-full max-w-sm relative z-10 animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
        
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-xl flex-shrink-0 ${content.bgColor} ${content.color}`}>
             <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{content.title}</h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{content.message}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-4 ml-1 mb-6 text-[10px] text-slate-400">
           <Icons.Info className="w-3 h-3" />
           <span>Detected just now • Based on activity patterns</span>
        </div>

        <div className="flex space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 text-slate-500 hover:text-slate-700" 
            onClick={onDismiss}
          >
            Dismiss
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1" 
            onClick={() => onSnooze(15)}
          >
            Snooze 15m
          </Button>
        </div>
        
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400">
                This alert is generated locally. No content monitored.
            </p>
        </div>
      </div>
    </div>
  );
};

// --- Logic System ---

interface AlertSystemProps {
  settings: AppSettings;
}

export const AlertSystem: React.FC<AlertSystemProps> = ({ settings }) => {
  const [activeAlert, setActiveAlert] = useState<AlertType | null>(null);
  
  // Track snoozed alerts or cooldowns to avoid spam
  const cooldowns = useRef<Record<string, number>>({});
  
  // Use settings to determine frequency check
  // For Demo: High sensitivity = faster checks, higher probability
  useEffect(() => {
    if (!settings.alerts.enabled) return;
    if (activeAlert) return; // Don't trigger if one is already showing

    const sensitivityMultiplier = {
      'Low': 0.05, // 5% chance
      'Medium': 0.1, // 10% chance
      'High': 0.2    // 20% chance
    }[settings.alerts.sensitivity];

    const checkInterval = setInterval(() => {
      // Simulation Logic
      const now = Date.now();
      const types: AlertType[] = ['burnout', 'focus-drop', 'context-switching', 'prolonged-work'];
      
      // Filter by enabled types
      const enabledTypes = types.filter(t => {
        if (t === 'burnout' && !settings.alerts.types.burnout) return false;
        if (t === 'focus-drop' && !settings.alerts.types.focusDrop) return false;
        if (t === 'context-switching' && !settings.alerts.types.contextSwitching) return false;
        if (t === 'prolonged-work' && !settings.alerts.types.prolongedWork) return false;
        return true;
      });

      if (enabledTypes.length === 0) return;

      // Random trigger
      if (Math.random() < sensitivityMultiplier) {
        const randomType = enabledTypes[Math.floor(Math.random() * enabledTypes.length)];
        
        // Check cooldown (5 minutes by default for demo, real app would be longer)
        const lastTrigger = cooldowns.current[randomType] || 0;
        if (now - lastTrigger > 1000 * 60 * 1) { // 1 minute cooldown for demo purposes
           setActiveAlert(randomType);
        }
      }

    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [settings, activeAlert]);

  const handleDismiss = () => {
    if (activeAlert) {
      cooldowns.current[activeAlert] = Date.now();
      setActiveAlert(null);
    }
  };

  const handleSnooze = (minutes: number) => {
    if (activeAlert) {
      // Set cooldown for X minutes
      cooldowns.current[activeAlert] = Date.now() + (minutes * 60 * 1000);
      setActiveAlert(null);
    }
  };

  if (!activeAlert) return null;

  return (
    <AlertPopup 
      type={activeAlert} 
      onDismiss={handleDismiss} 
      onSnooze={handleSnooze} 
    />
  );
};