import { useState } from 'react';
import { ChevronDown, CreditCard, Settings, LogOut, Globe, ListPlus } from 'lucide-react';
import styles from './Header.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../common/Button';
import { useNavigate } from 'react-router-dom';
import { formatMonthYear } from '../../utils/date';

interface HeaderProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onAddCreditCard?: () => void;
  onAddList?: () => void;
}

export function Header({ year, month, onPrevMonth, onNextMonth, onAddCreditCard, onAddList }: HeaderProps) {
  const { viewedUser, currentUser, logout, isViewingOwnData } = useAuth();
  const { t, locale, setLocale } = useTranslation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleLanguage = () => {
    setLocale(locale === 'es' ? 'en' : 'es');
    setMenuOpen(false);
  };

  const monthYearText = formatMonthYear(year, month, locale);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {onAddCreditCard && (
          <Button variant="secondary" size="small" onClick={onAddCreditCard}>
            <CreditCard size={16} />
            <span className={styles.hideOnMobile}>{t('header.addCreditCardShort')}</span>
          </Button>
        )}
        {onAddList && (
          <Button variant="primary" size="small" onClick={onAddList} className={styles.addListButton}>
            <ListPlus size={16} />
            <span className={styles.hideOnMobile}>{t('header.addListShort')}</span>
          </Button>
        )}
      </div>

      <div className={styles.center}>
        <button className={styles.monthNavButton} onClick={onPrevMonth} aria-label="Previous month">
          ‹
        </button>
        <span className={styles.monthYear}>{monthYearText}</span>
        <button className={styles.monthNavButton} onClick={onNextMonth} aria-label="Next month">
          ›
        </button>
      </div>

      <div className={styles.right}>
        <div className={styles.profileContainer}>
          <button
            className={styles.profileButton}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div
              className={styles.avatar}
              style={{ backgroundColor: viewedUser?.color || '#6366f1' }}
            >
              {viewedUser?.initial}
            </div>
            {!isViewingOwnData && currentUser && (
              <div
                className={styles.viewingIndicator}
                style={{ backgroundColor: currentUser.color }}
              >
                {currentUser.initial}
              </div>
            )}
            <ChevronDown size={16} className={styles.chevron} />
          </button>

          {menuOpen && (
            <>
              <div className={styles.backdrop} onClick={() => setMenuOpen(false)} />
              <div className={styles.menu}>
                <button className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                  <Settings size={16} />
                  {t('header.settings')}
                </button>
                <button className={styles.menuItem} onClick={toggleLanguage}>
                  <Globe size={16} />
                  {t('header.changeLanguage')}
                  <span className={styles.languageBadge}>
                    {locale === 'es' ? t('header.spanish') : t('header.english')}
                  </span>
                </button>
                <div className={styles.menuDivider} />
                <button className={`${styles.menuItem} ${styles.logout}`} onClick={handleLogout}>
                  <LogOut size={16} />
                  {t('header.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
