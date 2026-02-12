import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import styles from './SortableExpenseList.module.css';

interface SortableExpenseListProps {
  id: string;
  children: React.ReactNode;
  isReadOnly?: boolean;
}

export function SortableExpenseList({ id, children, isReadOnly = false }: SortableExpenseListProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isReadOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.sortableItem} ${isDragging ? styles.dragging : ''}`}
    >
      {!isReadOnly && (
        <div
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
          title="Arrastrar para reordenar"
        >
          <GripVertical size={16} />
        </div>
      )}
      {children}
    </div>
  );
}

// Componente para el overlay cuando se está arrastrando
export function DragOverlayItem({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.dragOverlay}>
      {children}
    </div>
  );
}
