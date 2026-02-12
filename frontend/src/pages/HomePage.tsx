import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { userService } from '../services/userService';
import type { User } from '../types';

export function HomePage() {
  const navigate = useNavigate();
  const { login, checkStoredUser } = useAuth();
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Check if user is already logged in
      const storedUser = await checkStoredUser();
      if (storedUser) {
        navigate(`/${storedUser.slug}/dashboard`);
        return;
      }

      // Load users
      const allUsers = await userService.getAll();
      setUsers(allUsers);
      setIsLoading(false);
    };

    init();
  }, [checkStoredUser, navigate]);

  const handleSelectUser = (user: User) => {
    login(user);
    navigate(`/${user.slug}/dashboard`);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>{t('home.selectUser')}</h1>
        <p className={styles.subtitle}>{t('home.selectUserSubtitle')}</p>

        <div className={styles.usersGrid}>
          {users.map((user) => (
            <button
              key={user.id}
              className={styles.userCard}
              onClick={() => handleSelectUser(user)}
              style={{ '--user-color': user.color } as React.CSSProperties}
            >
              <div
                className={styles.avatar}
                style={{ backgroundColor: user.color }}
              >
                {user.initial}
              </div>
              <span className={styles.userName}>{user.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
