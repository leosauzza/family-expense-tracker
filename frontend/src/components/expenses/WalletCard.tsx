import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import styles from './WalletCard.module.css';
import { IconButton } from '../common/IconButton';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrencyARS, formatCurrencyUSD } from '../../utils/formatters';

interface WalletCardProps {
  amount: number;
  amountUSD: number;
  isReadOnly?: boolean;
  onUpdate: (amount: number, amountUSD: number) => void;
}

export function WalletCard({ amount, amountUSD = 0, isReadOnly = false, onUpdate }: WalletCardProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAmount, setNewAmount] = useState(amount.toString());
  const [newAmountUSD, setNewAmountUSD] = useState(amountUSD.toString());

  const handleOpenModal = () => {
    setNewAmount(amount.toString());
    setNewAmountUSD(amountUSD.toString());
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const parsed = parseFloat(newAmount);
    const parsedUSD = parseFloat(newAmountUSD);
    if (!isNaN(parsed) && !isNaN(parsedUSD)) {
      onUpdate(parsed, parsedUSD);
      setIsModalOpen(false);
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
        {t('common.cancel')}
      </Button>
      <Button onClick={handleSave}>
        {t('common.save')}
      </Button>
    </>
  );

  return (
    <>
      <div className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.title}>{t('dashboard.wallet.title')}</h3>
          {!isReadOnly && (
            <IconButton variant="ghost" size="small" onClick={handleOpenModal}>
              <Edit2 size={16} />
            </IconButton>
          )}
        </div>
        <div className={styles.amounts}>
          <div className={styles.amountARS}>
            {formatCurrencyARS(amount)}
          </div>
          <div className={styles.amountUSD}>
            {formatCurrencyUSD(amountUSD)}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('dashboard.wallet.editTitle')}
        footer={footer}
      >
        <div className={styles.walletInputs}>
          <div className={styles.inputGroup}>
            <label>{t('dashboard.wallet.ars')}</label>
            <Input label={t('dashboard.wallet.ars')} type="number" step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label>{t('dashboard.wallet.usd')}</label>
            <Input label={t('dashboard.wallet.usd')} type="number" step="0.01" value={newAmountUSD} onChange={(e) => setNewAmountUSD(e.target.value)} />
          </div>
        </div>
      </Modal>
    </>
  );
}
