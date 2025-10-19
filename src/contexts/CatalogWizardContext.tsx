import React, { createContext, useContext, useState } from 'react';

interface WizardData {
  provider_type: string;
  config: Record<string, any>;
  mapping: Record<string, string>;
  category_crosswalk: Record<string, string>;
  attribute_defaults: Record<string, any>;
  region: string;
  price_mode: 'list_price' | 'account_price' | 'quote_required';
  media_settings: Record<string, any>;
  schedule: string;
  webhook_enabled: boolean;
  file?: File;
  detected_columns?: string[];
}

interface WizardContextType {
  wizardData: WizardData;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  updateWizardData: (data: Partial<WizardData>) => void;
  handleNext: () => void;
  handleBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const CatalogWizardContext = createContext<WizardContextType | undefined>(undefined);

export function CatalogWizardProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData>({
    provider_type: '',
    config: {},
    mapping: {},
    category_crosswalk: {},
    attribute_defaults: {},
    region: '',
    price_mode: 'list_price',
    media_settings: {},
    schedule: 'daily',
    webhook_enabled: false,
  });

  const updateWizardData = (data: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  return (
    <CatalogWizardContext.Provider
      value={{
        wizardData,
        currentStep,
        setCurrentStep,
        updateWizardData,
        handleNext,
        handleBack,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </CatalogWizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(CatalogWizardContext);
  if (!context) {
    throw new Error('useWizard must be used within CatalogWizardProvider');
  }
  return context;
}
