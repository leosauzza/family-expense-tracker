import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './TheyOweMe.module.css';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrencyARS, formatCurrencyUSD } from '../../utils/formatters';
import type { ThirdPartyExpenseList, SharedExpense, SharedExpenseView } from '../../types';

interface TheyOweMeCalculation {
  totalARS: number;
  totalUSD: number;
  thirdPartyTotalARS: number;
  thirdPartyTotalUSD: number;
  sharedSplitARS: number;
  sharedSplitUSD: number;
  sharedUserPortionARS: number;
  sharedUserPortionUSD: number;
  systemUserExpensesARS: number;
  systemUserExpensesUSD: number;
  externalSharedARS: number;
  externalSharedUSD: number;
  details: {
    thirdParty: { name: string; ars: number; usd: number }[];
    shared: { name: string; ars: number; usd: number };
    systemUserGroups: { name: string; ars: number; usd: number }[];
    externalSharedGroups: { parties: string; ars: number; usd: number }[];
  };
}

interface TheyOweMeProps {
  thirdPartyLists: ThirdPartyExpenseList[];
  sharedByUser: SharedExpense[];
  sharedByOthers: SharedExpenseView[];
  totalSystemUsers: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function calculateTheyOweMe(
  thirdPartyLists: ThirdPartyExpenseList[],
  sharedByUser: SharedExpense[],
  sharedByOthers: SharedExpenseView[],
  totalSystemUsers: number
): TheyOweMeCalculation {
  // Calculate third party totals by list
  const thirdPartyDetails = thirdPartyLists.map(list => {
    const ars = list.expenses
      .filter(e => !e.isPaid)
      .reduce((sum, e) => sum + e.amountARS, 0);
    const usd = list.expenses
      .filter(e => !e.isPaid)
      .reduce((sum, e) => sum + e.amountUSD, 0);
    return { name: list.name, ars, usd };
  });

  const thirdPartyTotalARS = thirdPartyDetails.reduce((sum, d) => sum + d.ars, 0);
  const thirdPartyTotalUSD = thirdPartyDetails.reduce((sum, d) => sum + d.usd, 0);

  // Split shared expenses by type
  const systemSharedExpenses = sharedByUser.filter(
    e => (e.expenseType || 'SplitWithAllSystemUsers') === 'SplitWithAllSystemUsers'
  );
  const systemUserExpenses = sharedByUser.filter(
    e => e.expenseType === 'ForSpecificSystemUser'
  );
  const externalSharedExpenses = sharedByUser.filter(
    e => e.expenseType === 'SplitWithExternalParties'
  );

  // Calculate system user expenses (100% owed by the target user)
  const systemUserGroupsMap = new Map<string, { ars: number; usd: number }>();
  systemUserExpenses.filter(e => !e.isPaid).forEach(expense => {
    const key = expense.targetUserId || 'unknown';
    const existing = systemUserGroupsMap.get(key) || { ars: 0, usd: 0 };
    existing.ars += expense.amountARS;
    existing.usd += expense.amountUSD;
    systemUserGroupsMap.set(key, existing);
  });

  const systemUserGroups = Array.from(systemUserGroupsMap.entries()).map(([userId, amounts]) => ({
    name: sharedByUser.find(e => e.targetUserId === userId)?.targetUserName || 'Unknown',
    ars: amounts.ars,
    usd: amounts.usd
  }));

  const systemUserExpensesARS = systemUserGroups.reduce((sum, g) => sum + g.ars, 0);
  const systemUserExpensesUSD = systemUserGroups.reduce((sum, g) => sum + g.usd, 0);

  // Calculate external shared (50% owed by external parties)
  const externalSharedGroupsMap = new Map<string, { ars: number; usd: number }>();
  externalSharedExpenses.filter(e => !e.isPaid).forEach(expense => {
    const key = (expense.externalParties || []).sort().join(', ') || 'External';
    const existing = externalSharedGroupsMap.get(key) || { ars: 0, usd: 0 };
    existing.ars += expense.amountARS / 2; // 50% owed by external
    existing.usd += expense.amountUSD / 2;
    externalSharedGroupsMap.set(key, existing);
  });

  const externalSharedGroups = Array.from(externalSharedGroupsMap.entries()).map(([parties, amounts]) => ({
    parties,
    ars: amounts.ars,
    usd: amounts.usd
  }));

  const externalSharedARS = externalSharedGroups.reduce((sum, g) => sum + g.ars, 0);
  const externalSharedUSD = externalSharedGroups.reduce((sum, g) => sum + g.usd, 0);

  // Calculate shared expenses totals (only SplitWithAllSystemUsers)
  const sharedUserARS = systemSharedExpenses
    .filter(e => !e.isPaid)
    .reduce((sum, e) => sum + e.amountARS, 0);
  const sharedUserUSD = systemSharedExpenses
    .filter(e => !e.isPaid)
    .reduce((sum, e) => sum + e.amountUSD, 0);

  const sharedOthersARS = sharedByOthers
    .filter(e => !e.isPaid && (e.expenseType || 'SplitWithAllSystemUsers') === 'SplitWithAllSystemUsers')
    .reduce((sum, e) => sum + e.amountARS, 0);
  const sharedOthersUSD = sharedByOthers
    .filter(e => !e.isPaid && (e.expenseType || 'SplitWithAllSystemUsers') === 'SplitWithAllSystemUsers')
    .reduce((sum, e) => sum + e.amountUSD, 0);

  // Formula: ((sharedByUser + sharedByOthers) / totalUsers) - sharedByUser
  const sharedSplitARS = (sharedUserARS + sharedOthersARS) / totalSystemUsers;
  const sharedSplitUSD = (sharedUserUSD + sharedOthersUSD) / totalSystemUsers;

  const sharedUserPortionARS = sharedSplitARS - sharedUserARS;
  const sharedUserPortionUSD = sharedSplitUSD - sharedUserUSD;

  // Total: third party + system user + external shared portion + shared portion
  const totalARS = thirdPartyTotalARS + systemUserExpensesARS + externalSharedARS + sharedUserPortionARS;
  const totalUSD = thirdPartyTotalUSD + systemUserExpensesUSD + externalSharedUSD + sharedUserPortionUSD;

  return {
    totalARS,
    totalUSD,
    thirdPartyTotalARS,
    thirdPartyTotalUSD,
    sharedSplitARS,
    sharedSplitUSD,
    sharedUserPortionARS,
    sharedUserPortionUSD,
    systemUserExpensesARS,
    systemUserExpensesUSD,
    externalSharedARS,
    externalSharedUSD,
    details: {
      thirdParty: thirdPartyDetails,
      shared: { name: 'Shared split', ars: sharedUserPortionARS, usd: sharedUserPortionUSD },
      systemUserGroups,
      externalSharedGroups
    }
  };
}

export function TheyOweMe({
  thirdPartyLists,
  sharedByUser,
  sharedByOthers,
  totalSystemUsers,
  isExpanded,
  onToggle
}: TheyOweMeProps) {
  const { t } = useTranslation();

  const calc = calculateTheyOweMe(thirdPartyLists, sharedByUser, sharedByOthers, totalSystemUsers);

  const hasThirdParty = calc.details.thirdParty.length > 0;
  const hasSystemUser = calc.details.systemUserGroups.length > 0;
  const hasExternalShared = calc.details.externalSharedGroups.length > 0;
  const hasSharedSplit = calc.sharedUserPortionARS !== 0 || calc.sharedUserPortionUSD !== 0;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('dashboard.theyOweMe.title')}</h3>
        <button
          className={styles.expandButton}
          onClick={onToggle}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      <div className={styles.amounts}>
        <span className={`${styles.amount} ${styles.ars}`}>
          {formatCurrencyARS(calc.totalARS)}
        </span>
        {calc.totalUSD !== 0 && (
          <span className={`${styles.amount} ${styles.usd}`}>
            {formatCurrencyUSD(calc.totalUSD)}
          </span>
        )}
      </div>

      {isExpanded && (
        <div className={styles.details}>
          {/* Third Party Section */}
          {hasThirdParty && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>{t('dashboard.theyOweMe.thirdParty')}</h4>
              {calc.details.thirdParty.map((detail, index) => (
                <div key={index} className={styles.detailRow}>
                  <span className={styles.detailName}>{detail.name}</span>
                  <div className={styles.detailAmounts}>
                    <span className={styles.ars}>{formatCurrencyARS(detail.ars)}</span>
                    {detail.usd !== 0 && (
                      <span className={styles.usd}>{formatCurrencyUSD(detail.usd)}</span>
                    )}
                  </div>
                </div>
              ))}
              {calc.thirdPartyTotalARS !== 0 && (
                <div className={styles.subtotal}>
                  <span>{t('common.subtotal')}</span>
                  <div>
                    <span className={styles.ars}>{formatCurrencyARS(calc.thirdPartyTotalARS)}</span>
                    {calc.thirdPartyTotalUSD !== 0 && (
                      <span className={styles.usd}>{formatCurrencyUSD(calc.thirdPartyTotalUSD)}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* System User Expenses Section */}
          {hasSystemUser && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>{t('dashboard.theyOweMe.systemUser')}</h4>
              {calc.details.systemUserGroups.map((group, index) => (
                <div key={index} className={styles.detailRow}>
                  <span className={styles.detailName}>{group.name}</span>
                  <div className={styles.detailAmounts}>
                    <span className={styles.ars}>{formatCurrencyARS(group.ars)}</span>
                    {group.usd !== 0 && (
                      <span className={styles.usd}>{formatCurrencyUSD(group.usd)}</span>
                    )}
                  </div>
                </div>
              ))}
              {calc.systemUserExpensesARS !== 0 && (
                <div className={styles.subtotal}>
                  <span>{t('common.subtotal')}</span>
                  <div>
                    <span className={styles.ars}>{formatCurrencyARS(calc.systemUserExpensesARS)}</span>
                    {calc.systemUserExpensesUSD !== 0 && (
                      <span className={styles.usd}>{formatCurrencyUSD(calc.systemUserExpensesUSD)}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* External Shared Section */}
          {hasExternalShared && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>{t('dashboard.theyOweMe.externalShared')}</h4>
              {calc.details.externalSharedGroups.map((group, index) => (
                <div key={index} className={styles.detailRow}>
                  <span className={styles.detailName}>{group.parties}</span>
                  <div className={styles.detailAmounts}>
                    <span className={styles.ars}>{formatCurrencyARS(group.ars)}</span>
                    {group.usd !== 0 && (
                      <span className={styles.usd}>{formatCurrencyUSD(group.usd)}</span>
                    )}
                  </div>
                </div>
              ))}
              {calc.externalSharedARS !== 0 && (
                <div className={styles.subtotal}>
                  <span>{t('common.subtotal')}</span>
                  <div>
                    <span className={styles.ars}>{formatCurrencyARS(calc.externalSharedARS)}</span>
                    {calc.externalSharedUSD !== 0 && (
                      <span className={styles.usd}>{formatCurrencyUSD(calc.externalSharedUSD)}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shared Split Section */}
          {hasSharedSplit && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>{t('dashboard.theyOweMe.shared')}</h4>
              <div className={styles.formula}>
                {t('dashboard.theyOweMe.formula', { count: totalSystemUsers })}
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailName}>{t('dashboard.theyOweMe.sharedSplit')}</span>
                <div className={styles.detailAmounts}>
                  <span className={calc.sharedUserPortionARS >= 0 ? styles.positive : styles.negative}>
                    {calc.sharedUserPortionARS >= 0 ? '+' : ''}{formatCurrencyARS(calc.sharedUserPortionARS)}
                  </span>
                  {calc.sharedUserPortionUSD !== 0 && (
                    <span className={calc.sharedUserPortionUSD >= 0 ? styles.positive : styles.negative}>
                      {calc.sharedUserPortionUSD >= 0 ? '+' : ''}{formatCurrencyUSD(calc.sharedUserPortionUSD)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {!hasThirdParty && !hasSystemUser && !hasExternalShared && !hasSharedSplit && (
            <div className={styles.empty}>
              {t('dashboard.theyOweMe.noThirdParty')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
