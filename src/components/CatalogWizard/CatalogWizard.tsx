import React from 'react';
import { CatalogWizardProvider, useWizard } from '../../contexts/CatalogWizardContext';
import WizardSteps from './WizardSteps';
import SourceSelection from './steps/SourceSelection';
import AuthOrUpload from './steps/AuthOrUpload';
import FieldMapping from './steps/FieldMapping';

const WIZARD_STEPS = [
  { id: 'source', label: 'Source Selection', component: SourceSelection },
  { id: 'auth', label: 'Authentication', component: AuthOrUpload },
  { id: 'fields', label: 'Field Mapping', component: FieldMapping },
];

function WizardContent() {
  const { currentStep } = useWizard();
  const CurrentStepComponent = WIZARD_STEPS[currentStep].component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b px-6 py-3">
        <nav className="flex items-center space-x-2 text-sm">
          <button 
            onClick={() => window.location.href = '/'}
            className="text-gray-600 hover:text-gray-900"
          >
            Dashboard
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Connect a Catalog</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Steps sidebar */}
          <div className="col-span-3">
            <WizardSteps steps={WIZARD_STEPS} currentStep={currentStep} />
          </div>

          {/* Main content */}
          <div className="col-span-9">
            <div className="bg-white rounded-lg shadow-sm p-8">
              {/* Progress indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Step {currentStep + 1} of {WIZARD_STEPS.length}
                  </span>
                  <span className="text-sm font-medium">
                    {Math.round(((currentStep + 1) / WIZARD_STEPS.length) * 100)}% Complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step content */}
              <CurrentStepComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CatalogWizard() {
  return (
    <CatalogWizardProvider>
      <WizardContent />
    </CatalogWizardProvider>
  );
}
