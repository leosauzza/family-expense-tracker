import { useState } from 'react';
import { X, Users, User, UserPlus } from 'lucide-react';
import styles from './ListTypeSelectorModal.module.css';
import { Button } from '../common/Button';
import { useTranslation } from '../../hooks/useTranslation';

export type ListType = 'externalThirdParty' | 'systemUser' | 'externalShared';

interface ListTypeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: ListType, config: { targetUserId?: string; externalParties?: string[] }) => void;
  systemUsers: { id: string; name: string }[];
  currentUserId: string;
}

interface ListOption {
  type: ListType;
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
}

export function ListTypeSelectorModal({
  isOpen,
  onClose,
  onConfirm,
  systemUsers,
  currentUserId
}: ListTypeSelectorModalProps) {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<ListType>('externalThirdParty');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [externalPartyNames, setExternalPartyNames] = useState<string>('');

  if (!isOpen) return null;

  const otherUsers = systemUsers.filter(u => u.id !== currentUserId);

  const options: ListOption[] = [
    {
      type: 'externalThirdParty',
      icon: <UserPlus size={20} />,
      titleKey: 'dashboard.listSelector.externalThirdParty.title',
      descriptionKey: 'dashboard.listSelector.externalThirdParty.description'
    },
    {
      type: 'systemUser',
      icon: <User size={20} />,
      titleKey: 'dashboard.listSelector.systemUser.title',
      descriptionKey: 'dashboard.listSelector.systemUser.description'
    },
    {
      type: 'externalShared',
      icon: <Users size={20} />,
      titleKey: 'dashboard.listSelector.externalShared.title',
      descriptionKey: 'dashboard.listSelector.externalShared.description'
    }
  ];

  const handleConfirm = () => {
    const config: { targetUserId?: string; externalParties?: string[] } = {};

    if (selectedType === 'systemUser' && selectedUserId) {
      config.targetUserId = selectedUserId;
    }

    if (selectedType === 'externalShared' && externalPartyNames.trim()) {
      config.externalParties = externalPartyNames.split(',').map(p => p.trim()).filter(p => p);
    }

    onConfirm(selectedType, config);
    
    // Reset state
    setSelectedType('externalThirdParty');
    setSelectedUserId('');
    setExternalPartyNames('');
  };

  const handleClose = () => {
    onClose();
    // Reset state
    setSelectedType('externalThirdParty');
    setSelectedUserId('');
    setExternalPartyNames('');
  };

  const canConfirm = () => {
    if (selectedType === 'systemUser') {
      return !!selectedUserId;
    }
    if (selectedType === 'externalShared') {
      return externalPartyNames.trim().length > 0;
    }
    return true;
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('dashboard.listSelector.title')}</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>{t('dashboard.listSelector.description')}</p>

          <div className={styles.options}>
            {options.map((option) => (
              <div
                key={option.type}
                className={`${styles.option} ${selectedType === option.type ? styles.selected : ''}`}
                onClick={() => setSelectedType(option.type)}
              >
                <div className={styles.radio}>
                  <div className={styles.radioInner} />
                </div>
                <div className={styles.optionContent}>
                  <div className={styles.optionTitle}>
                    {t(option.titleKey)}
                  </div>
                  <div className={styles.optionDescription}>
                    {t(option.descriptionKey)}
                  </div>

                  {/* Configuration for System User */}
                  {selectedType === 'systemUser' && option.type === 'systemUser' && (
                    <div className={styles.configSection}>
                      <label className={styles.configLabel}>
                        {t('dashboard.listSelector.systemUser.selectUser')}
                      </label>
                      <select
                        className={styles.selectTrigger}
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">{t('dashboard.listSelector.systemUser.selectPlaceholder')}</option>
                        {otherUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Configuration for External Shared */}
                  {selectedType === 'externalShared' && option.type === 'externalShared' && (
                    <div className={styles.configSection}>
                      <label className={styles.configLabel}>
                        {t('dashboard.listSelector.externalShared.partyNames')}
                      </label>
                      <input
                        type="text"
                        className={styles.externalInput}
                        value={externalPartyNames}
                        onChange={(e) => setExternalPartyNames(e.target.value)}
                        placeholder={t('dashboard.listSelector.externalShared.partyPlaceholder')}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <Button variant="secondary" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm()}>
            {t('common.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
