import React from 'react';
import { CheckCircle } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  component: React.ComponentType;
}

interface WizardStepsProps {
  steps: Step[];
  currentStep: number;
}

export default function WizardSteps({ steps, currentStep }: WizardStepsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Setup Steps</h3>
      
      <nav className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center space-x-3 ${
              index <= currentStep ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index < currentStep 
                ? 'bg-green-100 text-green-600' 
                : index === currentStep 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {index < currentStep ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                index <= currentStep ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {step.label}
              </p>
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
