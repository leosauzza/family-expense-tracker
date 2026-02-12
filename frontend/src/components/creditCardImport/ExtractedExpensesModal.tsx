import { useState, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTranslation } from '../../hooks/useTranslation';
import type { ExtractedExpense, ExpenseClassification, ExpenseClassificationType } from '../../types';
import styles from './ExtractedExpensesModal.module.css';

interface ExtractedExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExtractedExpense[];
  onConfirm: (classifications: ExpenseClassification[]) => void;
}

interface RowClassification {
  type: ExpenseClassificationType;
  isSharedWithExternal: boolean;
}

export function ExtractedExpensesModal({
  isOpen,
  onClose,
  expenses,
  onConfirm
}: ExtractedExpensesModalProps) {
  const { t } = useTranslation();
  
  const [classifications, setClassifications] = useState<Map<string, RowClassification>>(() => {
    const map = new Map<string, RowClassification>();
    expenses.forEach(expense => {
      map.set(expense.id, { type: 'personal', isSharedWithExternal: false });
    });
    return map;
  });

  const handleSharedChange = useCallback((expenseId: string, checked: boolean) => {
    setClassifications(prev => {
      const next = new Map(prev);
      if (checked) {
        next.set(expenseId, { type: 'shared', isSharedWithExternal: false });
      } else {
        next.set(expenseId, { type: 'personal', isSharedWithExternal: false });
      }
      return next;
    });
  }, []);

  const handleOtherPersonChange = useCallback((expenseId: string, checked: boolean) => {
    setClassifications(prev => {
      const next = new Map(prev);
      if (checked) {
        next.set(expenseId, { type: 'otherPerson', isSharedWithExternal: false });
      } else {
        next.set(expenseId, { type: 'personal', isSharedWithExternal: false });
      }
      return next;
    });
  }, []);

  const handleConfirm = () => {
    const result: ExpenseClassification[] = expenses.map(expense => {
      const rowClass = classifications.get(expense.id);
      return {
        extractedExpenseId: expense.id,
        classificationType: rowClass?.type || 'personal',
        isSharedWithExternal: rowClass?.isSharedWithExternal || false,
        sharedWithOption: 'system_family',
        externalPartyNames: [],
        otherPersonUserId: null,
        otherPersonName: null
      };
    });
    onConfirm(result);
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('creditCardImport.reviewTitle', { count: expenses.length })}
      size="large"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm}>
            {t('common.confirm')}
          </Button>
        </>
      }
    >
      <div className={styles.container}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.detailColumn}>{t('common.detail')}</th>
                <th className={styles.amountColumn}>{t('common.amountARS')}</th>
                <th className={styles.amountColumn}>{t('common.amountUSD')}</th>
                <th className={styles.checkboxColumn}>{t('creditCardImport.sharedColumn')}</th>
                <th className={styles.checkboxColumn}>{t('creditCardImport.otherPersonColumn')}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => {
                const rowClass = classifications.get(expense.id);
                const isShared = rowClass?.type === 'shared';
                const isOtherPerson = rowClass?.type === 'otherPerson';
                
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
                    <td className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={isShared}
                        onChange={(e) => handleSharedChange(expense.id, e.target.checked)}
                        className={styles.checkbox}
                      />
                    </td>
                    <td className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={isOtherPerson}
                        onChange={(e) => handleOtherPersonChange(expense.id, e.target.checked)}
                        className={styles.checkbox}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.legend}>
          <p>{t('creditCardImport.personalLegend')}</p>
        </div>
      </div>
    </Modal>
  );
}
