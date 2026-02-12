import { useState } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import styles from './ExpenseItem.module.css';
import { Checkbox } from '../common/Checkbox';
import { IconButton } from '../common/IconButton';
import { formatCurrencyARS, formatCurrencyUSD } from '../../utils/formatters';
import type { Expense } from '../../types';

interface ExpenseItemProps {
  expense: Expense;
  isReadOnly?: boolean;
  showPaidCheckbox?: boolean;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

export function ExpenseItem({
  expense,
  isReadOnly = false,
  showPaidCheckbox = true,
  onTogglePaid,
  onDelete,
  onEdit
}: ExpenseItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      setIsDeleting(true);
      onDelete(expense.id);
    }
  };

  const ActionButtons = () => (
    <>
      <IconButton
        variant="ghost"
        size="small"
        onClick={() => onEdit(expense)}
        aria-label="Edit"
      >
        <Edit2 size={16} />
      </IconButton>
      <IconButton
        variant="danger"
        size="small"
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label="Delete"
      >
        <Trash2 size={16} />
      </IconButton>
    </>
  );

  return (
    <div className={`${styles.row} ${!showPaidCheckbox ? styles.noCheckbox : ''} ${expense.isPaid ? styles.paid : ''}`}>
      <div className={styles.detail}>
        {expense.detail}
        {/* Mobile-only actions */}
        {!isReadOnly && (
          <span className={styles.mobileActions}>
            <ActionButtons />
          </span>
        )}
      </div>
      <div className={`${styles.amount} ${styles.ars}`}>
        <span className={styles.currencyLabel}>AR$</span>
        {formatCurrencyARS(expense.amountARS)}
      </div>
      <div className={`${styles.amount} ${styles.usd}`}>
        <span className={styles.currencyLabel}>US$</span>
        {formatCurrencyUSD(expense.amountUSD)}
      </div>
      {showPaidCheckbox && (
        <div className={styles.checkbox}>
          <Checkbox
            checked={expense.isPaid}
            onChange={(e) => onTogglePaid(expense.id, e.target.checked)}
            disabled={isReadOnly}
          />
        </div>
      )}
      {/* Desktop/tablet actions */}
      {!isReadOnly && (
        <div className={styles.actions}>
          <ActionButtons />
        </div>
      )}
    </div>
  );
}
