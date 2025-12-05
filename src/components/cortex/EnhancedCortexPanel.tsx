"use client";

import { useState, useEffect } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { CortexAIEngine } from '@/lib/engine/cortex-ai-engine';

interface EnhancedCortexPanelProps {
  onClose: () => void;
  onFeatureSelect: (feature: string) => void;
}

export default function EnhancedCortexPanel({
  onClose,
  onFeatureSelect
}: EnhancedCortexPanelProps) {
  const [step, setStep] = useState<'intro' | 'feature-select' | 'processing' | 'result'>('intro');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get AI capabilities and options
  const capabilities = CortexAIEngine.getCapabilities();
  const featureOptions = CortexAIEngine.getFeatureOptions();
  const welcomeMessage = CortexAIEngine.getWelcomeMessage();

  const handleFeatureSelect = (featureId: string) => {
    setSelectedFeature(featureId);
    setStep('processing');
    onFeatureSelect(featureId);

    // Simulate AI processing
    setIsLoading(true);
    setError(null);

    // Get the appropriate response for the selected feature
    const featureName = featureOptions.find(f => f.id === featureId)?.title || featureId;
    const response = CortexAIEngine.getFeatureSelectionPrompt();

    // Simulate API call delay
    setTimeout(() => {
      setAiResponse(response);
      setStep('result');
      setIsLoading(false);
    }, 1500);
  };

  const handleBack = () => {
    if (step === 'feature-select') {
      setStep('intro');
    } else if (step === 'result') {
      setStep('feature-select');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">CortexAI Assistant</h2>
              <p className="text-sm text-slate-500 mt-1">AI Writing Assistant</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition p-1"
              aria-label="Close CortexAI"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'intro' && (
            <div className="space-y-6">
              {/* Welcome Message */}
              <PremiumCard title="Welcome" gradient="from-white to-slate-50">
                <div className="space-y-4">
                  <p className="text-slate-700">{welcomeMessage}</p>

                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-3">My Capabilities</h4>
                    <p className="text-sm text-slate-600">{capabilities}</p>
                  </div>
                </div>
              </PremiumCard>

              {/* AI Ethics Badge */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-700">Ethical AI Certified</p>
                <p className="text-xs text-green-600 mt-1">Strict content safety and ethical guidelines</p>
              </div>

              {/* Continue Button */}
              <PremiumButton
                onClick={() => setStep('feature-select')}
                size="md"
                className="w-full"
              >
                Continue →
              </PremiumButton>
            </div>
          )}

          {step === 'feature-select' && (
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {/* Feature Selection */}
              <PremiumCard title="Select a Feature" gradient="from-white to-slate-50">
                <p className="text-slate-600 mb-4">
                  What would you like CortexAI to help you with?
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {featureOptions.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => handleFeatureSelect(feature.id)}
                      className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 transition text-left hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <span className="text-indigo-600 text-lg">{feature.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{feature.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">{feature.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </PremiumCard>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-600 font-medium">Processing your request...</p>
              <p className="text-sm text-slate-500 mt-2">CortexAI is analyzing your request</p>
            </div>
          )}

          {step === 'result' && (
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {/* Result */}
              <PremiumCard
                title={`CortexAI ${selectedFeature ? featureOptions.find(f => f.id === selectedFeature)?.title : ''}`}
                gradient="from-purple-50 to-indigo-50"
              >
                <div className="space-y-4">
                  <p className="text-slate-700 whitespace-pre-wrap">{aiResponse}</p>

                  {selectedFeature && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-2">Next Steps</h4>
                      <p className="text-sm text-slate-600">
                        You can now use the {featureOptions.find(f => f.id === selectedFeature)?.title} feature in the main editor.
                      </p>
                    </div>
                  )}
                </div>
              </PremiumCard>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <PremiumButton
                  onClick={onClose}
                  variant="secondary"
                  size="md"
                  className="flex-1"
                >
                  Close
                </PremiumButton>
                <PremiumButton
                  onClick={() => {
                    onClose();
                    // TODO: Navigate to appropriate feature page
                  }}
                  size="md"
                  className="flex-1"
                >
                  Use This Feature
                </PremiumButton>
              </div>
            </div>
          )}

          {error && (
            <PremiumCard title="Error" gradient="from-red-50 to-red-100">
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-600 font-medium">{error}</p>
                <PremiumButton
                  onClick={() => {
                    setError(null);
                    setStep('intro');
                  }}
                  size="sm"
                  className="mt-4"
                >
                  Try Again
                </PremiumButton>
              </div>
            </PremiumCard>
          )}
        </div>

        {/* AI Ethics Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-xs text-slate-500">
          <p>CortexAI follows strict ethical guidelines. All responses are filtered for content safety and appropriateness.</p>
        </div>
      </div>
    </div>
  );
}