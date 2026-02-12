import { useState, useCallback } from 'react';
import { FileUploadModal } from './FileUploadModal';
import { ExtractedExpensesModal } from './ExtractedExpensesModal';
import { SharedExpensesConfigModal } from './SharedExpensesConfigModal';
import { ExternalPartiesModal } from './ExternalPartiesModal';
import { OtherPersonConfigModal } from './OtherPersonConfigModal';
import { creditCardImportService } from '../../services/creditCardImportService';
import type { 
  ExtractedExpense, 
  ExpenseClassification,
  SharedWithOption 
} from '../../types';

type WizardStep = 
  | 'closed' 
  | 'upload' 
  | 'analyzing' 
  | 'review' 
  | 'sharedConfig' 
  | 'externalParties' 
  | 'otherPersonConfig' 
  | 'confirming';

interface CreditCardImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyDataId: string;
  userId: string;
  systemUsers: Array<{ id: string; name: string }>;
  onImportComplete: () => void;
}

export function CreditCardImportWizard({
  isOpen,
  onClose,
  monthlyDataId,
  userId,
  systemUsers,
  onImportComplete
}: CreditCardImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [extractedExpenses, setExtractedExpenses] = useState<ExtractedExpense[]>([]);
  const [classifications, setClassifications] = useState<Map<string, ExpenseClassification>>(new Map());
  const [sharedConfig, setSharedConfig] = useState<Map<string, SharedWithOption>>(new Map());
  const [externalPartyNames, setExternalPartyNames] = useState<Map<string, string>>(new Map());
  const [, setOtherPersonConfig] = useState<Map<string, { type: 'system' | 'external'; userId?: string; name?: string }>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when opening
  const handleOpen = useCallback(() => {
    setStep('upload');
    setExtractedExpenses([]);
    setClassifications(new Map());
    setSharedConfig(new Map());
    setExternalPartyNames(new Map());
    setOtherPersonConfig(new Map());
    setError(null);
  }, [setOtherPersonConfig]);

  // Call handleOpen when wizard opens
  useState(() => {
    if (isOpen) {
      handleOpen();
    }
  });

  // Handle file upload
  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setStep('analyzing');

    try {
      const expenses = await creditCardImportService.analyzePdf(file, monthlyDataId);
      setExtractedExpenses(expenses);
      
      // Initialize classifications as personal (no checkboxes checked)
      const initialClassifications = new Map<string, ExpenseClassification>();
      expenses.forEach(expense => {
        initialClassifications.set(expense.id, {
          extractedExpenseId: expense.id,
          classificationType: 'personal',
          isSharedWithExternal: false,
          sharedWithOption: 'system_family',
          externalPartyNames: [],
          otherPersonUserId: null,
          otherPersonName: null
        });
      });
      setClassifications(initialClassifications);
      
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStep('upload');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle review step confirmation
  const handleReviewConfirm = (newClassifications: ExpenseClassification[]) => {
    const classMap = new Map<string, ExpenseClassification>();
    newClassifications.forEach(c => classMap.set(c.extractedExpenseId, c));
    setClassifications(classMap);

    // Get shared expenses
    const sharedExpenses = newClassifications
      .filter(c => c.classificationType === 'shared')
      .map(c => extractedExpenses.find(e => e.id === c.extractedExpenseId)!)
      .filter(Boolean);

    // Get other person expenses  
    const otherPersonExpenses = newClassifications
      .filter(c => c.classificationType === 'otherPerson')
      .map(c => extractedExpenses.find(e => e.id === c.extractedExpenseId)!)
      .filter(Boolean);

    if (sharedExpenses.length > 0) {
      // Initialize shared config with default "system_family"
      const initialSharedConfig = new Map<string, SharedWithOption>();
      sharedExpenses.forEach(e => initialSharedConfig.set(e.id, 'system_family'));
      setSharedConfig(initialSharedConfig);
      setStep('sharedConfig');
    } else if (otherPersonExpenses.length > 0) {
      setStep('otherPersonConfig');
    } else {
      // No shared or other person, go straight to confirm
      handleFinalConfirm(classMap, new Map(), new Map(), new Map());
    }
  };

  // Handle shared config confirmation
  const handleSharedConfigConfirm = (config: Map<string, SharedWithOption>) => {
    setSharedConfig(config);

    // Check if any are "other" (external parties)
    const hasExternal = Array.from(config.values()).some(v => v === 'other');
    
    if (hasExternal) {
      // Get expenses marked as "other"
      const externalExpenses = extractedExpenses.filter(e => config.get(e.id) === 'other');
      
      // Initialize external party names
      const initialNames = new Map<string, string>();
      externalExpenses.forEach(e => initialNames.set(e.id, ''));
      setExternalPartyNames(initialNames);
      
      setStep('externalParties');
    } else {
      // Check for other person expenses
      const otherPersonExpenses = Array.from(classifications.values())
        .filter(c => c.classificationType === 'otherPerson')
        .map(c => extractedExpenses.find(e => e.id === c.extractedExpenseId)!)
        .filter(Boolean);
      
      if (otherPersonExpenses.length > 0) {
        setStep('otherPersonConfig');
      } else {
        handleFinalConfirm(classifications, config, new Map(), new Map());
      }
    }
  };

  // Handle external parties confirmation
  const handleExternalPartiesConfirm = (partyNames: Map<string, string>) => {
    setExternalPartyNames(partyNames);

    // Check for other person expenses
    const otherPersonExpenses = Array.from(classifications.values())
      .filter(c => c.classificationType === 'otherPerson')
      .map(c => extractedExpenses.find(e => e.id === c.extractedExpenseId)!)
      .filter(Boolean);
    
    if (otherPersonExpenses.length > 0) {
      setStep('otherPersonConfig');
    } else {
      handleFinalConfirm(classifications, sharedConfig, partyNames, new Map());
    }
  };

  // Handle other person config confirmation
  const handleOtherPersonConfigConfirm = (config: Map<string, { type: 'system' | 'external'; userId?: string; name?: string }>) => {
    setOtherPersonConfig(config);
    handleFinalConfirm(classifications, sharedConfig, externalPartyNames, config);
  };

  // Final confirmation - build and send classifications
  const handleFinalConfirm = async (
    classMap: Map<string, ExpenseClassification>,
    sharedCfg: Map<string, SharedWithOption>,
    partyNames: Map<string, string>,
    otherCfg: Map<string, { type: 'system' | 'external'; userId?: string; name?: string }>
  ) => {
    setStep('confirming');

    try {
      // Build final classifications array
      const finalClassifications: ExpenseClassification[] = [];

      classMap.forEach((classification, expenseId) => {
        const updatedClassification: ExpenseClassification = { ...classification };

        if (classification.classificationType === 'shared') {
          const sharedOption = sharedCfg.get(expenseId) || 'system_family';
          updatedClassification.sharedWithOption = sharedOption;
          updatedClassification.isSharedWithExternal = sharedOption === 'other';
          
          if (sharedOption === 'other') {
            const partyName = partyNames.get(expenseId) || '';
            updatedClassification.externalPartyNames = [partyName];
          }
        }

        if (classification.classificationType === 'otherPerson') {
          const otherConfig = otherCfg.get(expenseId);
          if (otherConfig) {
            if (otherConfig.type === 'system' && otherConfig.userId) {
              updatedClassification.otherPersonUserId = otherConfig.userId;
              updatedClassification.otherPersonName = null;
            } else if (otherConfig.type === 'external' && otherConfig.name) {
              updatedClassification.otherPersonUserId = null;
              updatedClassification.otherPersonName = otherConfig.name;
            }
          }
        }

        finalClassifications.push(updatedClassification);
      });

      await creditCardImportService.confirmImport(monthlyDataId, finalClassifications);
      onImportComplete();
      handleWizardClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm import');
      setStep('review');
    }
  };

  // Handle wizard close - cleanup if needed
  const handleWizardClose = async () => {
    if (step !== 'closed' && step !== 'upload' && extractedExpenses.length > 0) {
      // Cancel any pending import
      try {
        await creditCardImportService.cancelImport(monthlyDataId);
      } catch {
        // Ignore cleanup errors
      }
    }
    setStep('closed');
    onClose();
  };

  // Get expenses for each step
  const getSharedExpenses = () => {
    return extractedExpenses.filter(e => {
      const c = classifications.get(e.id);
      return c?.classificationType === 'shared';
    });
  };

  const getExternalExpenses = () => {
    return extractedExpenses.filter(e => sharedConfig.get(e.id) === 'other');
  };

  const getOtherPersonExpenses = () => {
    return extractedExpenses.filter(e => {
      const c = classifications.get(e.id);
      return c?.classificationType === 'otherPerson';
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <FileUploadModal
        isOpen={step === 'upload' || step === 'analyzing'}
        onClose={handleWizardClose}
        onUpload={handleUpload}
        isUploading={isUploading}
        error={error}
      />

      <ExtractedExpensesModal
        isOpen={step === 'review'}
        onClose={handleWizardClose}
        expenses={extractedExpenses}
        onConfirm={handleReviewConfirm}
      />

      <SharedExpensesConfigModal
        isOpen={step === 'sharedConfig'}
        onClose={handleWizardClose}
        expenses={getSharedExpenses()}
        onConfirm={handleSharedConfigConfirm}
      />

      <ExternalPartiesModal
        isOpen={step === 'externalParties'}
        onClose={handleWizardClose}
        expenses={getExternalExpenses()}
        onConfirm={handleExternalPartiesConfirm}
      />

      <OtherPersonConfigModal
        isOpen={step === 'otherPersonConfig'}
        onClose={handleWizardClose}
        expenses={getOtherPersonExpenses()}
        systemUsers={systemUsers.filter(u => u.id !== userId)}
        currentUserId={userId}
        onConfirm={handleOtherPersonConfigConfirm}
      />
    </>
  );
}
