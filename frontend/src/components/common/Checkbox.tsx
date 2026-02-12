import React from 'react';
import { Check } from 'lucide-react';
import styles from './Checkbox.module.css';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label className={`${styles.container} ${className}`}>
      <input type="checkbox" className={styles.input} {...props} />
      <span className={styles.checkbox}>
        <Check size={14} className={styles.checkIcon} />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
