import React, { useState, useEffect } from 'react';
import styles from './ExpenseModal.module.css';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useTranslation } from '../../hooks/useTranslation';
import type { Expense } from '../../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Omit<Expense, 'id'>) => void;
  initialData?: Partial<Expense>;
  title: string;
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title
}: ExpenseModalProps) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState('');
  const [amountARS, setAmountARS] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDetail(initialData.detail || '');
      setAmountARS(initialData.amountARS?.toString() || '');
      setAmountUSD(initialData.amountUSD?.toString() || '');
      setIsPaid(initialData.isPaid || false);
    } else {
      setDetail('');
      setAmountARS('');
      setAmountUSD('');
      setIsPaid(false);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      detail,
      amountARS: parseFloat(amountARS) || 0,
      amountUSD: parseFloat(amountUSD) || 0,
      isPaid
    });
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        {t('common.cancel')}
      </Button>
      <Button type="submit" form="expense-form">
        {t('common.save')}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <form id="expense-form" onSubmit={handleSubmit} className={styles.form}>
        <Input
          label={t('common.detail')}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={t('expenseModal.detailPlaceholder')}
          required
        />
        
        <div className={styles.row}>
          <Input
            label={t('common.amountARS')}
            type="number"
            step="0.01"
            value={amountARS}
            onChange={(e) => setAmountARS(e.target.value)}
            placeholder={t('expenseModal.amountARSPlaceholder')}
          />
          
          <Input
            label={t('common.amountUSD')}
            type="number"
            step="0.01"
            value={amountUSD}
            onChange={(e) => setAmountUSD(e.target.value)}
            placeholder={t('expenseModal.amountUSDPlaceholder')}
          />
        </div>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isPaid}
            onChange={(e) => setIsPaid(e.target.checked)}
          />
          <span>{t('common.paid')}</span>
        </label>
      </form>
    </Modal>
  );
}
