import { useState, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTranslation } from '../../hooks/useTranslation';
import type { ExtractedExpense, SharedWithOption } from '../../types';
import styles from './SharedExpensesConfigModal.module.css';

interface SharedExpensesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExtractedExpense[];
  onConfirm: (config: Map<string, SharedWithOption>) => void;
}

export function SharedExpensesConfigModal({
  isOpen,
  onClose,
  expenses,
  onConfirm
}: SharedExpensesConfigModalProps) {
  const { t } = useTranslation();
  
  const [config, setConfig] = useState<Map<string, SharedWithOption>>(() => {
    const map = new Map<string, SharedWithOption>();
    expenses.forEach(expense => {
      map.set(expense.id, 'system_family');
    });
    return map;
  });

  const handleConfigChange = useCallback((expenseId: string, value: SharedWithOption) => {
    setConfig(prev => {
      const next = new Map(prev);
      next.set(expenseId, value);
      return next;
    });
  }, []);

  const handleConfirm = () => {
    onConfirm(config);
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('creditCardImport.sharedConfigTitle', { count: expenses.length })}
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
        <p className={styles.description}>
          {t('creditCardImport.sharedConfigDescription')}
        </p>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.detailColumn}>{t('common.detail')}</th>
                <th className={styles.amountColumn}>{t('common.amountARS')}</th>
                <th className={styles.amountColumn}>{t('common.amountUSD')}</th>
                <th className={styles.selectColumn}>{t('creditCardImport.sharedWithColumn')}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => {
                const sharedWith = config.get(expense.id) || 'system_family';
                
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
                    <td className={styles.selectCell}>
                      <select
                        value={sharedWith}
                        onChange={(e) => handleConfigChange(expense.id, e.target.value as SharedWithOption)}
                        className={styles.select}
                      >
                        <option value="system_family">
                          {t('creditCardImport.sharedWithSystem')}
                        </option>
                        <option value="other">
                          {t('creditCardImport.sharedWithOther')}
                        </option>
                      </select>
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
