import { useState, useEffect } from 'react';
import { Check, Circle, BookOpen, ClipboardList, Sparkles } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  icon: typeof BookOpen;
  action?: () => void;
}

interface ChecklistProgressProps {
  onConnectCatalog?: () => void;
  onStartQuestionnaire?: () => void;
  onGenerateSelections?: () => void;
}

export function ChecklistProgress({ 
  onConnectCatalog, 
  onStartQuestionnaire, 
  onGenerateSelections 
}: ChecklistProgressProps) {
  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: 'catalog',
      label: 'Connect a catalog or use the Ferguson demo set',
      completed: false,
      icon: BookOpen,
      action: onConnectCatalog
    },
    {
      id: 'questionnaire',
      label: 'Answer the project questionnaire',
      completed: false,
      icon: ClipboardList,
      action: onStartQuestionnaire
    },
    {
      id: 'generate',
      label: 'Generate selections book and quote',
      completed: false,
      icon: Sparkles,
      action: onGenerateSelections
    }
  ]);

  const completedCount = items.filter(item => item.completed).length;
  const progress = (completedCount / items.length) * 100;

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Get Started in 3 Steps
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Complete these steps to create your first project
          </p>
        </div>
        
        {/* Progress Ring */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 mx-auto sm:mx-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200 dark:text-slate-700"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
              className="text-blue-600 transition-all duration-500"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {completedCount}/{items.length}
            </span>
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  toggleItem(item.id);
                }
              }}
              className={`w-full flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 transition-all ${
                item.completed
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              {/* Checkbox */}
              <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                item.completed
                  ? 'bg-green-600 border-green-600'
                  : 'border-gray-300 dark:border-slate-500'
              }`}>
                {item.completed && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
              </div>

              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                item.completed
                  ? 'bg-green-100 dark:bg-green-800'
                  : 'bg-blue-100 dark:bg-blue-900'
              }`}>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  item.completed
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>

              {/* Label */}
              <div className="flex-1 text-left min-w-0">
                <p className={`font-medium text-sm sm:text-base ${
                  item.completed
                    ? 'text-green-900 dark:text-green-100 line-through'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {item.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Step {index + 1} of {items.length}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

