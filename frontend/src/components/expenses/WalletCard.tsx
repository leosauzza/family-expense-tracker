import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import styles from './WalletCard.module.css';
import { IconButton } from '../common/IconButton';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrencyARS } from '../../utils/formatters';

interface WalletCardProps {
  amount: number;
  isReadOnly?: boolean;
  onUpdate: (amount: number) => void;
}

export function WalletCard({ amount, isReadOnly = false, onUpdate }: WalletCardProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAmount, setNewAmount] = useState(amount.toString());

  const handleOpenModal = () => {
    setNewAmount(amount.toString());
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const parsed = parseFloat(newAmount);
    if (!isNaN(parsed)) {
      onUpdate(parsed);
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
        <div className={styles.amount}>
          {formatCurrencyARS(amount)}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('dashboard.wallet.editTitle')}
        footer={footer}
      >
        <Input
          label={t('dashboard.wallet.title')}
          type="number"
          step="0.01"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          autoFocus
        />
      </Modal>
    </>
  );
}
