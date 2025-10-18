import { Home, Building, Wrench, ArrowRight } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: typeof Home;
  color: string;
  bgColor: string;
}

interface StarterTemplatesProps {
  onSelectTemplate: (templateId: string) => void;
}

export function StarterTemplates({ onSelectTemplate }: StarterTemplatesProps) {
  const templates: Template[] = [
    {
      id: 'spec-home',
      name: 'Spec Home',
      description: 'Standard builder selections for spec homes',
      icon: Home,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      id: 'custom-build',
      name: 'Custom Build',
      description: 'Premium selections for custom homes',
      icon: Building,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      id: 'remodel',
      name: 'Remodel',
      description: 'Renovation and remodel packages',
      icon: Wrench,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-slate-700">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Start with a Template
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          Choose a pre-configured project template to get started quickly
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
              className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 rounded-lg p-4 sm:p-6 border-2 border-gray-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-lg"
            >
              {/* Placeholder image area */}
              <div className={`w-full h-24 sm:h-32 ${template.bgColor} rounded-lg mb-3 sm:mb-4 flex items-center justify-center relative overflow-hidden`}>
                <Icon className={`w-10 h-10 sm:w-12 sm:h-12 ${template.color}`} />
                
                {/* Placeholder text overlay */}
                <div className="absolute bottom-2 right-2 text-xs font-mono text-gray-400 dark:text-gray-500 bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded">
                  [placeholder-{template.id}]
                </div>
              </div>

              <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1 flex items-center justify-between">
                {template.name}
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {template.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

