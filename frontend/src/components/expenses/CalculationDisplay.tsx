import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './CalculationDisplay.module.css';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrencyARS, formatCurrencyUSD } from '../../utils/formatters';
import type { CalculationResult } from '../../types';

interface CalculationDisplayProps {
  calculation: CalculationResult;
  totalSystemUsers: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function CalculationDisplay({ calculation, totalSystemUsers, isExpanded, onToggle }: CalculationDisplayProps) {
  const { t } = useTranslation();

  // Build items array based on what has values
  const items = [
    { label: t('dashboard.calculation.wallet'), valueARS: calculation.walletAmount, valueUSD: 0 },
    { label: t('dashboard.calculation.thirdParty'), valueARS: calculation.thirdPartyTotalARS, valueUSD: calculation.thirdPartyTotalUSD },
    { label: t('dashboard.calculation.systemUser'), valueARS: calculation.systemUserExpensesTotalARS, valueUSD: calculation.systemUserExpensesTotalUSD },
    { label: t('dashboard.calculation.externalShared'), valueARS: calculation.externalSharedExpensesTotalARS / 2, valueUSD: calculation.externalSharedExpensesTotalUSD / 2 },
    { label: t('dashboard.calculation.fixedExpenses'), valueARS: -calculation.fixedExpensesTotalARS, valueUSD: -calculation.fixedExpensesTotalUSD },
    { label: t('dashboard.calculation.sharedSplit'), valueARS: (calculation.sharedByUserTotalARS + calculation.sharedByOthersTotalARS) / totalSystemUsers, valueUSD: (calculation.sharedByUserTotalUSD + calculation.sharedByOthersTotalUSD) / totalSystemUsers },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('dashboard.calculation.title')}</h3>
        <button
          className={styles.expandButton}
          onClick={onToggle}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      <div className={styles.amounts}>
        <span className={`${styles.amount} ${styles.ars} ${calculation.finalBalanceARS < 0 ? styles.negative : ''}`}>
          {formatCurrencyARS(calculation.finalBalanceARS)}
        </span>
        {calculation.finalBalanceUSD !== 0 && (
          <span className={`${styles.amount} ${styles.usd} ${calculation.finalBalanceUSD < 0 ? styles.negative : ''}`}>
            {formatCurrencyUSD(calculation.finalBalanceUSD)}
          </span>
        )}
      </div>

      {isExpanded && (
        <div className={styles.details}>
          <div className={styles.formula}>
            {t('dashboard.calculation.formula')}
          </div>

          <div className={styles.breakdown}>
            {items.map((item, index) => (
              <div key={index} className={styles.item}>
                <span className={styles.label}>{item.label}</span>
                <div className={styles.values}>
                  <span className={`${styles.value} ${styles.ars} ${item.valueARS < 0 ? styles.negative : ''}`}>
                    {item.valueARS >= 0 ? '+' : ''}{formatCurrencyARS(item.valueARS)}
                  </span>
                  {item.valueUSD !== 0 && (
                    <span className={`${styles.value} ${styles.usd} ${item.valueUSD < 0 ? styles.negative : ''}`}>
                      {item.valueUSD >= 0 ? '+' : ''}{formatCurrencyUSD(item.valueUSD)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.divider} />

          <div className={styles.total}>
            <span className={styles.totalLabel}>{t('common.total')}</span>
            <div className={styles.totalValues}>
              <span className={`${styles.totalValue} ${styles.ars} ${calculation.finalBalanceARS < 0 ? styles.negative : ''}`}>
                {formatCurrencyARS(calculation.finalBalanceARS)}
              </span>
              <span className={`${styles.totalValue} ${styles.usd} ${calculation.finalBalanceUSD < 0 ? styles.negative : ''}`}>
                {formatCurrencyUSD(calculation.finalBalanceUSD)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
