import { useState, useCallback, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTranslation } from '../../hooks/useTranslation';
import type { ExtractedExpense } from '../../types';
import styles from './ExternalPartiesModal.module.css';

interface ExternalPartiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExtractedExpense[];
  onConfirm: (partyNames: Map<string, string>) => void;
}

export function ExternalPartiesModal({
  isOpen,
  onClose,
  expenses,
  onConfirm
}: ExternalPartiesModalProps) {
  const { t } = useTranslation();
  
  const [partyNames, setPartyNames] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>();
    expenses.forEach(expense => {
      map.set(expense.id, '');
    });
    return map;
  });

  const [errors, setErrors] = useState<Set<string>>(new Set());

  const handlePartyNameChange = useCallback((expenseId: string, value: string) => {
    setPartyNames(prev => {
      const next = new Map(prev);
      next.set(expenseId, value);
      return next;
    });
    
    // Clear error when user types
    if (value.trim()) {
      setErrors(prev => {
        const next = new Set(prev);
        next.delete(expenseId);
        return next;
      });
    }
  }, []);

  const isValid = useMemo(() => {
    for (const expense of expenses) {
      const name = partyNames.get(expense.id);
      if (!name || !name.trim()) {
        return false;
      }
    }
    return true;
  }, [expenses, partyNames]);

  const handleConfirm = () => {
    const newErrors = new Set<string>();
    
    for (const expense of expenses) {
      const name = partyNames.get(expense.id);
      if (!name || !name.trim()) {
        newErrors.add(expense.id);
      }
    }
    
    if (newErrors.size > 0) {
      setErrors(newErrors);
      return;
    }
    
    onConfirm(partyNames);
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('creditCardImport.externalPartiesTitle')}
      size="medium"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            {t('common.confirm')}
          </Button>
        </>
      }
    >
      <div className={styles.container}>
        <p className={styles.description}>
          {t('creditCardImport.externalPartiesDescription')}
        </p>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.detailColumn}>{t('common.detail')}</th>
                <th className={styles.amountColumn}>{t('common.amountARS')}</th>
                <th className={styles.amountColumn}>{t('common.amountUSD')}</th>
                <th className={styles.inputColumn}>{t('creditCardImport.partyNameColumn')}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => {
                const partyName = partyNames.get(expense.id) || '';
                const hasError = errors.has(expense.id);
                
                return (
                  <tr key={expense.id}>
                    <td className={styles.detailCell}>{expense.detail}</td>
                    <td className={styles.amountCell}>
                      {expense.amountARS > 0 && (
                        <span className={styles.amountARS}>
                          AR$ {formatAmount(expense.amountARS)}
                        </span>
                      )}
                    </td>
                    <td className={styles.amountCell}>
                      {expense.amountUSD > 0 && (
                        <span className={styles.amountUSD}>
                          US$ {formatAmount(expense.amountUSD)}
                        </span>
                      )}
                    </td>
                    <td className={styles.inputCell}>
                      <input
                        type="text"
                        value={partyName}
                        onChange={(e) => handlePartyNameChange(expense.id, e.target.value)}
                        placeholder={t('creditCardImport.partyNamePlaceholder')}
                        className={`${styles.input} ${hasError ? styles.inputError : ''}`}
                      />
                      {hasError && (
                        <span className={styles.errorMessage}>
                          {t('creditCardImport.partyNameRequired')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
