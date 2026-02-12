import React from 'react';
import styles from './IconButton.module.css';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'danger' | 'ghost';
  size?: 'small' | 'medium';
}

export function IconButton({
  children,
  variant = 'default',
  size = 'medium',
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
