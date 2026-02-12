import { useState } from 'react';
import { Plus } from 'lucide-react';
import styles from './ExpenseList.module.css';
import { ExpenseItem } from './ExpenseItem';
import { Button } from '../common/Button';
import { ExpenseModal } from './ExpenseModal';
import { TotalRow } from './TotalRow';
import { useTranslation } from '../../hooks/useTranslation';
import type { Expense } from '../../types';

interface ExpenseListProps {
  title: string;
  expenses: Expense[];
  isReadOnly?: boolean;
  showPaidCheckbox?: boolean;
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onUpdate: (id: string, expense: Partial<Expense>) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  addButtonText?: string;
}

export function ExpenseList({
  title,
  expenses,
  isReadOnly = false,
  showPaidCheckbox = true,
  onAdd,
  onUpdate,
  onDelete,
  onTogglePaid,
  addButtonText
}: ExpenseListProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleAdd = (expenseData: { detail: string; amountARS: number; amountUSD: number; isPaid: boolean }) => {
    onAdd(expenseData as Omit<Expense, 'id'>);
    setIsModalOpen(false);
  };

  const handleEdit = (expense: Expense) => {
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

  const handleTogglePaid = (id: string, isPaid: boolean) => {
    onTogglePaid(id, isPaid);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </div>

      <div className={styles.table}>
        <div className={`${styles.tableHeader} ${!showPaidCheckbox ? styles.noCheckbox : ''}`}>
          <div className={styles.detail}>{t('common.detail')}</div>
          <div className={styles.amount}>{t('common.amountARS')}</div>
          <div className={styles.amount}>{t('common.amountUSD')}</div>
          {showPaidCheckbox && <div className={styles.checkbox}>{t('common.paid')}</div>}
          {!isReadOnly && <div className={styles.actions}></div>}
        </div>

        <div className={styles.tableBody}>
          {expenses.length === 0 ? (
            <div className={styles.empty}>{t('common.loading')}</div>
          ) : (
            expenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                isReadOnly={isReadOnly}
                showPaidCheckbox={showPaidCheckbox}
                onTogglePaid={handleTogglePaid}
                onDelete={onDelete}
                onEdit={handleEdit}
              />
            ))
          )}
        </div>

        <TotalRow expenses={expenses} />
      </div>

      {!isReadOnly && (
        <div className={styles.footer}>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} />
            {addButtonText || t('common.add')}
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
