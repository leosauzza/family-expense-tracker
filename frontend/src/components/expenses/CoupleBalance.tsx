import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './CoupleBalance.module.css';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrencyARS } from '../../utils/formatters';
import type { SharedExpense } from '../../types';

export function CoupleBalance({
  userAShared,
  userBShared,
  userAPaidForB,
  userBPaidForA,
  userA,
  userB,
  isExpanded,
  onToggle
}: {
  userAShared: SharedExpense[];
  userBShared: SharedExpense[];
  userAPaidForB: SharedExpense[];
  userBPaidForA: SharedExpense[];
  userA: { id: string; name: string; initial: string; color: string };
  userB: { id: string; name: string; initial: string; color: string };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();

  if (!userB) {
    return null;
  }

  const userASharedTotal = userAShared
    .filter(e => !e.isPaid)
    .reduce((sum, e) => sum + e.amountARS, 0);
  const userBSharedTotal = userBShared
    .filter(e => !e.isPaid)
    .reduce((sum, e) => sum + e.amountARS, 0);

  const userAPaidForBTotal = userAPaidForB
    .filter(e => !e.isPaid)
    .reduce((sum, e) => sum + e.amountARS, 0);
  const userBPaidForATotal = userBPaidForA
    .filter(e => !e.isPaid)
    .reduce((sum, e) => sum + e.amountARS, 0);

  const userAOwesFromShared = userASharedTotal / 2;
  const userBOwesFromShared = userBSharedTotal / 2;

  const balanceARS = (userAOwesFromShared - userBOwesFromShared) + (userAPaidForBTotal - userBPaidForATotal);
  const userAOwes = balanceARS < 0;

  const isBalanced = balanceARS === 0;

  const getOwnerAvatar = (user: { initial: string; color: string }) => (
    <div className={styles.avatar} style={{ backgroundColor: user.color }}>
      {user.initial}
    </div>
  );

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('dashboard.coupleBalance.title')}</h3>
        <button
          className={styles.expandButton}
          onClick={onToggle}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isBalanced ? (
        <div className={styles.amounts}>
          <span className={styles.balanced}>{t('dashboard.coupleBalance.balanced')}</span>
        </div>
      ) : userAOwes ? (
        <div className={styles.amounts}>
          <div className={styles.avatarContainer}>
            {getOwnerAvatar(userA)}
            <span className={styles.owesText}>{t('dashboard.coupleBalance.userOwesUser', { nameA: userA.name, nameB: userB.name })}</span>
            {getOwnerAvatar(userB)}
          </div>
          <div className={`${styles.amount} ${styles.negative}`}>
            {formatCurrencyARS(Math.abs(balanceARS))}
          </div>
        </div>
      ) : (
        <div className={styles.amounts}>
          <div className={styles.avatarContainer}>
            {getOwnerAvatar(userB)}
            <span className={styles.owesText}>{t('dashboard.coupleBalance.userOwesUser', { nameA: userB.name, nameB: userA.name })}</span>
            {getOwnerAvatar(userA)}
          </div>
          <div className={`${styles.amount} ${styles.positive}`}>
            {formatCurrencyARS(Math.abs(balanceARS))}
          </div>
        </div>
      )}

      {isExpanded && (
        <div className={styles.details}>
          {userASharedTotal > 0 || userBSharedTotal > 0 ? (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>{t('dashboard.coupleBalance.sharedExpensesSplit')}</h4>
              <div className={styles.detailRow}>
                <span className={styles.detailName}>{userA.name}</span>
                <span className={styles.ars}>{formatCurrencyARS(userASharedTotal / 2)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailName}>{userB.name}</span>
                <span className={styles.ars}>{formatCurrencyARS(userBSharedTotal / 2)}</span>
              </div>
            </div>
          ) : null}

          {userAPaidForBTotal > 0 || userBPaidForATotal > 0 ? (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>{t('dashboard.coupleBalance.personalExpenses')}</h4>
              {userAPaidForBTotal > 0 ? (
                <div className={styles.detailRow}>
                  <span className={styles.detailName}>
                    {userA.name} → {userB.name}
                  </span>
                  <span className={styles.ars}>{formatCurrencyARS(userAPaidForBTotal)}</span>
                </div>
              ) : null}
              {userBPaidForATotal > 0 ? (
                <div className={styles.detailRow}>
                  <span className={styles.detailName}>
                    {userB.name} → {userA.name}
                  </span>
                  <span className={styles.ars}>{formatCurrencyARS(userBPaidForATotal)}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
