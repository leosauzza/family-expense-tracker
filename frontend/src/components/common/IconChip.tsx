import { Check, X } from 'lucide-react';
import styles from './IconChip.module.css';

interface IconChipProps {
  type: 'paid' | 'unpaid';
  onClick?: () => void;
}

export function IconChip({ type, onClick }: IconChipProps) {
  return (
    <div
      className={`${styles.chip} ${styles[type]}`}
      onClick={onClick}
      title={onClick ? (type === 'paid' ? 'Marcar como pendiente' : 'Marcar como pagado') : undefined}
    >
      {type === 'paid' ? <Check size={12} /> : <X size={12} />}
    </div>
  );
}
