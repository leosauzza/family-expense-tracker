import { useState, useCallback } from 'react';
import { Upload, File } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './FileUploadModal.module.css';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  isUploading: boolean;
  error?: string | null;
}

export function FileUploadModal({
  isOpen,
  onClose,
  onUpload,
  isUploading,
  error
}: FileUploadModalProps) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
      }
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('creditCardImport.uploadTitle')}
      size="medium"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isUploading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            isLoading={isUploading}
          >
            {t('common.upload')}
          </Button>
        </>
      }
    >
      <div className={styles.container}>
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${selectedFile ? styles.hasFile : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileInputChange}
            className={styles.fileInput}
            id="pdf-upload"
            disabled={isUploading}
          />
          <label htmlFor="pdf-upload" className={styles.dropZoneLabel}>
            {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        {selectedFile ? (
              <div className={styles.fileInfo}>
                <File size={32} className={styles.fileIcon} />
                <span className={styles.fileName}>{selectedFile.name}</span>
                <span className={styles.fileSize}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ) : (
              <div className={styles.dropZoneContent}>
                <Upload size={40} className={styles.uploadIcon} />
                <span className={styles.dropZoneText}>
                  {t('creditCardImport.dragDrop')}
                </span>
                <span className={styles.dropZoneHint}>
                  {t('creditCardImport.pdfOnly')}
                </span>
              </div>
            )}
          </label>
        </div>
      </div>
    </Modal>
  );
}
