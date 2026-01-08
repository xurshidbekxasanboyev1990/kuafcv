// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle, Brain, FileSearch, ScanText, Wand2, GitCompare } from 'lucide-react';

interface AnalysisProgressProps {
  type: 'file' | 'linguistic' | 'ocr' | 'compare' | 'improve' | 'batch';
  isActive: boolean;
  steps?: string[];
  currentStep?: number;
  progress?: number;
  estimatedTime?: number;
}

const defaultSteps: Record<string, string[]> = {
  file: [
    'Fayl o\'qilmoqda...',
    'AI tahlil qilinmoqda...',
    'Natijalar qayta ishlanmoqda...',
    'Tahlil yakunlanmoqda...',
  ],
  linguistic: [
    'Matn qayta ishlanmoqda...',
    'Lingvistik tahlil...',
    'AI signallari aniqlanmoqda...',
    'Inson signallari aniqlanmoqda...',
    'Xulosa chiqarilmoqda...',
  ],
  ocr: [
    'Rasm yuklanmoqda...',
    'AI ko\'rish tahlili...',
    'Matn tanib olinmoqda...',
    'Natija formatlanmoqda...',
  ],
  compare: [
    'Matnlar qabul qilindi...',
    'Leksik tahlil...',
    'Uslub taqqoslanmoqda...',
    'Mualliflik aniqlanmoqda...',
    'Xulosa tayyorlanmoqda...',
  ],
  improve: [
    'Matn qayta ishlanmoqda...',
    'Grammatika tekshirilmoqda...',
    'Uslub tahlil qilinmoqda...',
    'Tavsiyalar shakllanmoqda...',
    'Yaxshilangan variant yaratilmoqda...',
  ],
  batch: [
    'Matnlar yuklanmoqda...',
    'Har bir matn tahlil qilinmoqda...',
    'Natijalar jamlanmoqda...',
    'Xulosa tayyorlanmoqda...',
  ],
};

const typeConfig = {
  file: { icon: FileSearch, color: 'purple', label: 'Fayl Tahlili' },
  linguistic: { icon: Brain, color: 'blue', label: 'Lingvistik Analiz' },
  ocr: { icon: ScanText, color: 'cyan', label: 'OCR - Matn o\'qish' },
  compare: { icon: GitCompare, color: 'indigo', label: 'Matn Taqqoslash' },
  improve: { icon: Wand2, color: 'green', label: 'Matn Yaxshilash' },
  batch: { icon: FileSearch, color: 'orange', label: 'Batch Tahlil' },
};

export default function AnalysisProgress({ 
  type, 
  isActive, 
  steps, 
  currentStep: propCurrentStep,
  progress: propProgress,
  estimatedTime 
}: AnalysisProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const activeSteps = steps || defaultSteps[type];
  const config = typeConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      setProgress(0);
      setElapsedTime(0);
      return;
    }

    // Simulate progress
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < activeSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 95) {
          return prev + Math.random() * 10;
        }
        return prev;
      });
    }, 500);

    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 0.1);
    }, 100);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearInterval(timeInterval);
    };
  }, [isActive, activeSteps.length]);

  // Use prop values if provided
  const displayStep = propCurrentStep !== undefined ? propCurrentStep : currentStep;
  const displayProgress = propProgress !== undefined ? propProgress : Math.min(progress, 95);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r from-${config.color}-500 to-${config.color}-600 text-white p-6`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{config.label}</h2>
              <p className={`text-${config.color}-200 text-sm`}>Jarayonda...</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Jarayon</span>
              <span className="font-medium text-gray-800">{Math.round(displayProgress)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r from-${config.color}-500 to-${config.color}-600 rounded-full transition-all duration-500`}
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {activeSteps.map((step, index) => (
              <div 
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  index === displayStep
                    ? `bg-${config.color}-50 border border-${config.color}-200`
                    : index < displayStep
                    ? 'bg-green-50'
                    : 'bg-gray-50'
                }`}
              >
                {index < displayStep ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : index === displayStep ? (
                  <Loader2 className={`w-5 h-5 text-${config.color}-500 animate-spin`} />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                <span className={`text-sm ${
                  index <= displayStep ? 'text-gray-800' : 'text-gray-400'
                }`}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* Timer */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>O'tgan vaqt: {elapsedTime.toFixed(1)}s</span>
            {estimatedTime && (
              <span>Taxminiy: ~{estimatedTime}s</span>
            )}
          </div>

          {/* Tips */}
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-700">
              💡 AI tahlili bir necha soniya davom etishi mumkin. Iltimos, kuting...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple inline progress indicator
export function InlineProgress({ progress, label }: { progress: number; label?: string }) {
  return (
    <div className="space-y-1">
      {label && <span className="text-xs text-gray-500">{label}</span>}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-purple-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Pulse dot indicator
export function PulseIndicator({ active, color = 'purple' }: { active: boolean; color?: string }) {
  if (!active) return null;
  
  return (
    <span className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}-400 opacity-75`}></span>
      <span className={`relative inline-flex rounded-full h-3 w-3 bg-${color}-500`}></span>
    </span>
  );
}
