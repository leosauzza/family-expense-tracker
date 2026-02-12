import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, User, Users, UserCheck } from 'lucide-react';
import styles from './SharedExpenseList.module.css';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { ExpenseModal } from './ExpenseModal';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrencyARS, formatCurrencyUSD } from '../../utils/formatters';
import type { SharedExpense, SharedExpenseType } from '../../types';

interface SharedExpenseListProps {
  title: string;
  subtitle?: string;
  expenses: SharedExpense[];
  listType: 'systemUser' | 'externalShared' | 'systemShared';
  targetUserName?: string;
  externalParties?: string[];
  isReadOnly?: boolean;
  onAdd: (expense: Omit<SharedExpense, 'id'>) => void;
  onUpdate: (id: string, expense: Partial<SharedExpense>) => void;
  onDelete: (id: string) => void;
  onTogglePaid?: (id: string, isPaid: boolean) => void;
}

export function SharedExpenseList({
  title,
  subtitle,
  expenses,
  listType,
  targetUserName,
  externalParties,
  isReadOnly = false,
  onAdd,
  onUpdate,
  onDelete,
  onTogglePaid
}: SharedExpenseListProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SharedExpense | null>(null);

  const getExpenseType = (): SharedExpenseType => {
    switch (listType) {
      case 'systemUser':
        return 'ForSpecificSystemUser';
      case 'externalShared':
        return 'SplitWithExternalParties';
      case 'systemShared':
      default:
        return 'SplitWithAllSystemUsers';
    }
  };

  const getIcon = () => {
    switch (listType) {
      case 'systemUser':
        return <User size={16} />;
      case 'externalShared':
        return <Users size={16} />;
      case 'systemShared':
        return <UserCheck size={16} />;
    }
  };

  const calculateTotals = () => {
    return expenses
      .filter(e => !e.isPaid)
      .reduce(
        (acc, expense) => {
          acc.ars += expense.amountARS;
          acc.usd += expense.amountUSD;
          return acc;
        },
        { ars: 0, usd: 0 }
      );
  };

  const totals = calculateTotals();

  const handleAdd = (expenseData: { detail: string; amountARS: number; amountUSD: number; isPaid: boolean }) => {
    const newExpense: Omit<SharedExpense, 'id'> = {
      ...expenseData,
      monthlyDataId: expenses[0]?.monthlyDataId || '',
      paidByUserId: expenses[0]?.paidByUserId || '',
      expenseType: getExpenseType(),
      targetUserId: listType === 'systemUser' ? expenses[0]?.targetUserId : undefined,
      externalParties: listType === 'externalShared' ? externalParties : undefined
    };
    onAdd(newExpense);
    setIsModalOpen(false);
  };

  const handleEdit = (expense: SharedExpense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleUpdate = (expenseData: { detail: string; amountARS: number; amountUSD: number; isPaid: boolean }) => {
    if (editingExpense) {
      onUpdate(editingExpense.id, expenseData);
      setEditingExpense(null);
      setIsModalOpen(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const getSubtitleText = () => {
    if (subtitle) return subtitle;
    if (listType === 'systemUser' && targetUserName) {
      return t('dashboard.sharedExpenseList.forUser', { name: targetUserName });
    }
    if (listType === 'externalShared' && externalParties && externalParties.length > 0) {
      return t('dashboard.sharedExpenseList.withExternal', { parties: externalParties.join(', ') });
    }
    return t('dashboard.sharedExpenseList.splitAmongAll');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={`${styles.icon} ${styles[listType]}`}>
            {getIcon()}
          </div>
          <div>
            <h3 className={styles.title}>{title}</h3>
            <div className={styles.subtitle}>{getSubtitleText()}</div>
          </div>
        </div>
        {!isReadOnly && (
          <div className={styles.actions}>
            <IconButton
              variant="default"
              size="small"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={18} />
            </IconButton>
          </div>
        )}
      </div>

      {expenses.length === 0 ? (
        <div className={styles.empty}>
          {t('dashboard.sharedExpenseList.empty')}
        </div>
      ) : (
        <>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div>{t('common.detail')}</div>
              <div>{t('common.amountARS')}</div>
              <div>{t('common.amountUSD')}</div>
              <div>{t('common.paid')}</div>
              {!isReadOnly && <div></div>}
            </div>
            <div className={styles.tableBody}>
              {expenses.map((expense) => (
                <div key={expense.id} className={styles.tableRow}>
                  <div className={styles.detail}>{expense.detail}</div>
                  <div className={`${styles.amount} ${styles.ars}`}>
                    {formatCurrencyARS(expense.amountARS)}
                  </div>
                  <div className={`${styles.amount} ${styles.usd}`}>
                    {expense.amountUSD > 0 ? formatCurrencyUSD(expense.amountUSD) : '-'}
                  </div>
                  <div className={styles.paid}>
                    {expense.isPaid ? (
                      <span 
                        className={styles.paidBadge}
                        onClick={() => !isReadOnly && onTogglePaid?.(expense.id, false)}
                        title={!isReadOnly ? t('common.clickToChange') : undefined}
                      >
                        <Check size={12} />
                        {t('common.paid')}
                      </span>
                    ) : (
                      <span 
                        className={styles.unpaidBadge}
                        onClick={() => !isReadOnly && onTogglePaid?.(expense.id, true)}
                        title={!isReadOnly ? t('common.clickToChange') : undefined}
                      >
                        <X size={12} />
                        {t('common.pending')}
                      </span>
                    )}
                  </div>
                  {!isReadOnly && (
                    <div className={styles.action}>
                      <IconButton
                        variant="ghost"
                        size="small"
                        onClick={() => handleEdit(expense)}
                      >
                        <Edit2 size={14} />
                      </IconButton>
                      <IconButton
                        variant="danger"
                        size="small"
                        onClick={() => onDelete(expense.id)}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.footer}>
            <div className={styles.total}>
              <span className={styles.totalLabel}>{t('common.total')}:</span>
              <span className={`${styles.totalValue} ${styles.ars}`}>
                {formatCurrencyARS(totals.ars)}
              </span>
              {totals.usd > 0 && (
                <span className={`${styles.totalValue} ${styles.usd}`}>
                  {formatCurrencyUSD(totals.usd)}
                </span>
              )}
            </div>
            {!isReadOnly && expenses.some(e => !e.isPaid) && onTogglePaid && (
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  const unpaidExpense = expenses.find(e => !e.isPaid);
                  if (unpaidExpense) {
                    onTogglePaid(unpaidExpense.id, true);
                  }
                }}
              >
                <Check size={14} />
                {t('common.markAllPaid')}
              </Button>
            )}
          </div>
        </>
      )}

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={editingExpense ? handleUpdate : handleAdd}
        initialData={editingExpense || undefined}
        title={editingExpense ? t('expenseModal.editTitle') : t('expenseModal.addTitle')}
      />
    </div>
  );
}
