import { useState, useCallback, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTranslation } from '../../hooks/useTranslation';
import type { ExtractedExpense } from '../../types';
import styles from './OtherPersonConfigModal.module.css';

type PersonType = 'system' | 'external';

interface PersonConfig {
  type: PersonType;
  userId?: string;
  name?: string;
}

interface OtherPersonConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExtractedExpense[];
  systemUsers: Array<{ id: string; name: string }>;
  currentUserId: string;
  onConfirm: (config: Map<string, { type: 'system' | 'external', userId?: string, name?: string }>) => void;
}

export function OtherPersonConfigModal({
  isOpen,
  onClose,
  expenses,
  systemUsers,
  currentUserId,
  onConfirm
}: OtherPersonConfigModalProps) {
  const { t } = useTranslation();
  
  const availableUsers = useMemo(() => {
    return systemUsers.filter(user => user.id !== currentUserId);
  }, [systemUsers, currentUserId]);

  const [config, setConfig] = useState<Map<string, PersonConfig>>(() => {
    const map = new Map<string, PersonConfig>();
    const defaultUserId = availableUsers.length > 0 ? availableUsers[0].id : '';
    expenses.forEach(expense => {
      map.set(expense.id, { type: 'system', userId: defaultUserId });
    });
    return map;
  });

  const handleTypeChange = useCallback((expenseId: string, type: PersonType) => {
    setConfig(prev => {
      const next = new Map(prev);
      if (type === 'system') {
        const defaultUserId = availableUsers.length > 0 ? availableUsers[0].id : '';
        next.set(expenseId, { type, userId: defaultUserId });
      } else {
        next.set(expenseId, { type, name: '' });
      }
      return next;
    });
  }, [availableUsers]);

  const handleUserIdChange = useCallback((expenseId: string, userId: string) => {
    setConfig(prev => {
      const next = new Map(prev);
      const current = next.get(expenseId);
      if (current) {
        next.set(expenseId, { ...current, userId });
      }
      return next;
    });
  }, []);

  const handleNameChange = useCallback((expenseId: string, name: string) => {
    setConfig(prev => {
      const next = new Map(prev);
      const current = next.get(expenseId);
      if (current) {
        next.set(expenseId, { ...current, name });
      }
      return next;
    });
  }, []);

  const isValid = useMemo(() => {
    for (const expense of expenses) {
      const personConfig = config.get(expense.id);
      if (!personConfig) return false;
      
      if (personConfig.type === 'system') {
        if (!personConfig.userId) return false;
      } else {
        if (!personConfig.name || !personConfig.name.trim()) return false;
      }
    }
    return true;
  }, [expenses, config]);

  const handleConfirm = () => {
    if (!isValid) return;
    
    const result = new Map<string, { type: 'system' | 'external', userId?: string, name?: string }>();
    config.forEach((value, key) => {
      result.set(key, value);
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
      title={t('creditCardImport.otherPersonConfigTitle')}
      size="large"
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
          {t('creditCardImport.otherPersonConfigDescription')}
        </p>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.detailColumn}>{t('common.detail')}</th>
                <th className={styles.amountColumn}>{t('common.amountARS')}</th>
                <th className={styles.amountColumn}>{t('common.amountUSD')}</th>
                <th className={styles.typeColumn}>{t('creditCardImport.personTypeColumn')}</th>
                <th className={styles.selectionColumn}>{t('creditCardImport.selectionColumn')}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => {
                const personConfig = config.get(expense.id);
                const isSystem = personConfig?.type === 'system';
                
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
                    <td className={styles.typeCell}>
                      <select
                        value={personConfig?.type || 'system'}
                        onChange={(e) => handleTypeChange(expense.id, e.target.value as PersonType)}
                        className={styles.select}
                      >
                        <option value="system">
                          {t('creditCardImport.systemUser')}
                        </option>
                        <option value="external">
                          {t('creditCardImport.externalPerson')}
                        </option>
                      </select>
                    </td>
                    <td className={styles.selectionCell}>
                      {isSystem ? (
                        <select
                          value={personConfig?.userId || ''}
                          onChange={(e) => handleUserIdChange(expense.id, e.target.value)}
                          className={styles.select}
                        >
                          {availableUsers.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={personConfig?.name || ''}
                          onChange={(e) => handleNameChange(expense.id, e.target.value)}
                          placeholder={t('creditCardImport.externalNamePlaceholder')}
                          className={styles.input}
                        />
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
