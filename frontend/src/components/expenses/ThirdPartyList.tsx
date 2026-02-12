import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, UserPlus } from 'lucide-react';
import styles from './SharedExpenseList.module.css';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { ExpenseModal } from './ExpenseModal';
import { Input } from '../common/Input';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrencyARS, formatCurrencyUSD } from '../../utils/formatters';
import type { ThirdPartyExpenseList, ThirdPartyExpense } from '../../types';

interface ThirdPartyListProps {
  list: ThirdPartyExpenseList;
  isReadOnly?: boolean;
  onUpdateName: (id: string, name: string) => void;
  onDeleteList: (id: string) => void;
  onAddExpense: (listId: string, expense: Omit<ThirdPartyExpense, 'id' | 'thirdPartyExpenseListId'>) => void;
  onUpdateExpense: (id: string, expense: Partial<ThirdPartyExpense>) => void;
  onDeleteExpense: (id: string) => void;
  onToggleExpensePaid: (id: string, isPaid: boolean) => void;
}

export function ThirdPartyList({
  list,
  isReadOnly = false,
  onUpdateName,
  onDeleteList,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onToggleExpensePaid
}: ThirdPartyListProps) {
  const { t } = useTranslation();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(list.name);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ThirdPartyExpense | null>(null);

  const handleSaveName = () => {
    onUpdateName(list.id, editedName);
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditedName(list.name);
    setIsEditingName(false);
  };

  const handleAdd = (expenseData: { detail: string; amountARS: number; amountUSD: number; isPaid: boolean }) => {
    onAddExpense(list.id, expenseData);
    setIsModalOpen(false);
  };

  const handleEdit = (expense: ThirdPartyExpense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleUpdate = (expenseData: { detail: string; amountARS: number; amountUSD: number; isPaid: boolean }) => {
    if (editingExpense) {
      onUpdateExpense(editingExpense.id, expenseData);
      setEditingExpense(null);
      setIsModalOpen(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const calculateTotals = () => {
    return list.expenses
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {isEditingName && !isReadOnly ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder={t('dashboard.thirdParty.listNamePlaceholder')}
            />
            <IconButton size="small" onClick={handleSaveName}>
              <Check size={16} />
            </IconButton>
            <IconButton size="small" onClick={handleCancelEdit}>
              <X size={16} />
            </IconButton>
          </div>
        ) : (
          <div className={styles.titleSection}>
            <div className={`${styles.icon} ${styles.thirdParty}`}>
              <UserPlus size={16} />
            </div>
            <div>
              <h3 className={styles.title}>{list.name}</h3>
              <div className={styles.subtitle}>{t('dashboard.thirdParty.subtitle')}</div>
            </div>
          </div>
        )}
        {!isReadOnly && !isEditingName && (
          <div className={styles.actions}>
            <IconButton
              variant="ghost"
              size="small"
              onClick={() => setIsEditingName(true)}
            >
              <Edit2 size={16} />
            </IconButton>
            <IconButton
              variant="danger"
              size="small"
              onClick={() => onDeleteList(list.id)}
            >
              <Trash2 size={16} />
            </IconButton>
          </div>
        )}
      </div>

      {list.expenses.length === 0 ? (
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
              {list.expenses.map((expense) => (
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
                        onClick={() => !isReadOnly && onToggleExpensePaid(expense.id, false)}
                        title={!isReadOnly ? t('common.clickToChange') : undefined}
                      >
                        <Check size={12} />
                        {t('common.paid')}
                      </span>
                    ) : (
                      <span 
                        className={styles.unpaidBadge}
                        onClick={() => !isReadOnly && onToggleExpensePaid(expense.id, true)}
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
                        onClick={() => onDeleteExpense(expense.id)}
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
            {!isReadOnly && list.expenses.some(e => !e.isPaid) && (
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  const unpaidExpense = list.expenses.find(e => !e.isPaid);
                  if (unpaidExpense) {
                    onToggleExpensePaid(unpaidExpense.id, true);
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

      {!isReadOnly && (
        <div className={styles.footer} style={{ borderTop: list.expenses.length === 0 ? 'none' : undefined }}>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} />
            {t('dashboard.thirdParty.addExpense')}
          </Button>
        </div>
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
