import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './CalculationDisplay.module.css';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrencyARS, formatCurrencyUSD } from '../../utils/formatters';
import type { CalculationResult } from '../../types';

interface CalculationDisplayProps {
  calculation: CalculationResult;
  totalSystemUsers?: number;
  isExpanded: boolean;
  onToggle: () => void;
  otherUserName?: string;
  coupleBalanceAmount?: number;
  coupleBalanceAmountUSD?: number;
}

export function CalculationDisplay({ 
  calculation, 
  totalSystemUsers: _totalSystemUsers, 
  isExpanded, 
  onToggle,
  otherUserName,
  coupleBalanceAmount = 0,
  coupleBalanceAmountUSD = 0
}: CalculationDisplayProps) {
  const { t } = useTranslation();

  const coupleBalanceLabel = otherUserName 
    ? t('dashboard.calculation.coupleBalanceWith', { name: otherUserName })
    : t('dashboard.calculation.coupleBalance');

  // Build items array based on what has values (coupleBalance is now included in finalBalance)
  const items = [
    { label: t('dashboard.calculation.wallet'), valueARS: calculation.walletAmount, valueUSD: calculation.walletAmountUSD },
    { label: t('dashboard.calculation.thirdParty'), valueARS: calculation.thirdPartyTotalARS, valueUSD: calculation.thirdPartyTotalUSD },
    { label: t('dashboard.calculation.systemUser'), valueARS: calculation.systemUserExpensesTotalARS, valueUSD: calculation.systemUserExpensesTotalUSD },
    { label: t('dashboard.calculation.externalShared'), valueARS: calculation.externalSharedExpensesTotalARS / 2, valueUSD: calculation.externalSharedExpensesTotalUSD / 2 },
    { label: t('dashboard.calculation.fixedExpenses'), valueARS: -calculation.fixedExpensesTotalARS, valueUSD: -calculation.fixedExpensesTotalUSD },
    { label: coupleBalanceLabel, valueARS: coupleBalanceAmount, valueUSD: coupleBalanceAmountUSD, isCoupleBalance: true },
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
              <div key={index} className={`${styles.item} ${item.isCoupleBalance ? styles.coupleBalance : ''}`}>
                <span className={styles.label}>{item.label}</span>
                <div className={styles.values}>
                  {item.isCoupleBalance ? (
                    <>
                      <span className={`${styles.value} ${styles.ars} ${item.valueARS < 0 ? styles.negative : styles.positive}`}>
                        {item.valueARS >= 0 ? '+' : ''}{formatCurrencyARS(item.valueARS)}
                      </span>
                      {item.valueUSD !== 0 && (
                        <span className={`${styles.value} ${styles.usd} ${item.valueUSD < 0 ? styles.negative : styles.positive}`}>
                          {item.valueUSD >= 0 ? '+' : ''}{formatCurrencyUSD(item.valueUSD)}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className={`${styles.value} ${styles.ars} ${item.valueARS < 0 ? styles.negative : ''}`}>
                        {item.valueARS >= 0 ? '+' : ''}{formatCurrencyARS(item.valueARS)}
                      </span>
                      {item.label === t('dashboard.calculation.wallet') && item.valueUSD !== 0 ? (
                        <span className={`${styles.value} ${styles.usd} ${styles.walletUSD}`}>
                          (+ {formatCurrencyUSD(item.valueUSD)})
                        </span>
                      ) : item.valueUSD !== 0 ? (
                        <span className={`${styles.value} ${styles.usd} ${item.valueUSD < 0 ? styles.negative : ''}`}>
                          {item.valueUSD >= 0 ? '+' : ''}{formatCurrencyUSD(item.valueUSD)}
                        </span>
                      ) : null}
                    </>
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
