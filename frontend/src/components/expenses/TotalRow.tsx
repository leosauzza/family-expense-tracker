import type { FC } from 'react';
import styles from './TotalRow.module.css';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrencyARS, formatCurrencyUSD } from '../../utils/formatters';
import { calculateTotals } from '../../utils/calculations';
import type { Expense } from '../../types';

interface TotalRowProps {
  expenses: Expense[];
}

export const TotalRow: FC<TotalRowProps> = ({ expenses }) => {
  const { t } = useTranslation();
  const totals = calculateTotals(expenses);

  const hasExpenses = expenses.length > 0;

  return (
    <div className={styles.row}>
      <div className={styles.label}>{t('common.total')}</div>
      <div className={`${styles.amount} ${styles.ars}`}>
        {hasExpenses ? formatCurrencyARS(totals.ars) : '-'}
      </div>
      <div className={`${styles.amount} ${styles.usd}`}>
        {hasExpenses ? formatCurrencyUSD(totals.usd) : '-'}
      </div>
      <div className={styles.spacer}></div>
      <div className={styles.spacer}></div>
    </div>
  );
}
