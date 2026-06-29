'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check, X } from 'lucide-react';

interface DragOrderExerciseProps {
  /** Items in their initial display order (already shuffled by the generator). */
  items: string[];
  /** Called whenever the user reorders items. The string is a comma-separated
   *  list of items in their current order. */
  onOrderChange: (orderedItems: string[]) => void;
  /** Optional: disable interaction once the answer has been checked. */
  disabled?: boolean;
  /** Optional: reveal the correct order (green) vs the user's wrong items (rose). */
  checkedCorrectOrder?: string[];
}

interface SortableItemProps {
  id: string;
  label: string;
  disabled: boolean;
  position: number;
  status: 'idle' | 'correct' | 'wrong';
}

/**
 * Parse a single "English / German" label into its two parts for the card UI.
 * Returns `null` if the label doesn't contain the " / " separator — in that
 * case the card falls back to a single-line display.
 */
function splitLabel(label: string): { english: string; german: string } | null {
  const slashIdx = label.indexOf(' / ');
  if (slashIdx === -1) return null;
  return {
    english: label.slice(0, slashIdx),
    german: label.slice(slashIdx + ' / '.length),
  };
}

function SortableItem({ id, label, disabled, position, status }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // While dragging, lift the item above siblings so the drop target is visible.
    zIndex: isDragging ? 10 : undefined,
  };

  const split = splitLabel(label);

  const statusRing =
    status === 'correct'
      ? 'border-emerald-500/60 bg-emerald-950/20'
      : status === 'wrong'
        ? 'border-rose-500/60 bg-rose-950/20'
        : 'border-slate-700 bg-slate-900/60';

  const statusIcon =
    status === 'correct' ? (
      <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
    ) : status === 'wrong' ? (
      <X className="w-4 h-4 text-rose-400" aria-hidden="true" />
    ) : null;

  // Screen-reader-only status text. Color + the aria-hidden icon above are
  // not enough on their own (WCAG 1.4.1). Each item carries its own verdict
  // in the AT tree, and when wrong we also tell the user the correct slot
  // index (1-based) so they can fix it without seeing the screen.
  const statusSrText =
    status === 'correct'
      ? 'Korrekt platziert.'
      : status === 'wrong'
        ? `Falsch platziert.`
        : null;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${statusRing} ${
        isDragging ? 'shadow-lg shadow-black/40' : ''
      }`}
      data-testid={`drag-order-item-${position}`}
    >
      {/* Grip handle — the only element that receives pointer/keyboard listeners
          so clicking the label or icon area doesn't accidentally start a drag.
          Hit target is padded to ~44x44 (WCAG 2.5.5) for touch users. */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label={`Element verschieben: ${label}. Aktuelle Position ${position + 1}.`}
        className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 disabled:cursor-default disabled:text-slate-700 p-2.5 -ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
        data-testid={`drag-order-handle-${position}`}
      >
        <GripVertical className="w-4 h-4" aria-hidden="true" />
      </button>

      <span
        className="font-mono text-xs w-6 text-center text-slate-500 select-none"
        aria-hidden="true"
      >
        {position + 1}
      </span>

      <div className="flex-1 min-w-0">
        {split ? (
          // whitespace-nowrap keeps "English / German" together as a single
          // wrapping unit — without it the "/" separator can land on its
          // own line on narrow viewports.
          <div className="text-sm whitespace-nowrap">
            <span className="font-medium text-slate-100">{split.english}</span>
            <span className="text-slate-500 mx-1.5" aria-hidden="true">
              /
            </span>
            <span className="text-slate-300">{split.german}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-100">{label}</span>
        )}
      </div>

      {statusSrText && <span className="sr-only">{statusSrText}</span>}
      {statusIcon}
    </li>
  );
}

/**
 * Accessible drag-to-reorder list for ordering exercises (e.g. "order the 7
 * OSI layers from top to bottom").
 *
 * Pointer + keyboard sensors out of the box (Space picks up/drops, arrows move,
 * Escape cancels). Status feedback after check is announced via aria-live so
 * screen readers convey both the per-item verdicts and the overall summary.
 */
export default function DragOrderExercise({
  items,
  onOrderChange,
  disabled = false,
  checkedCorrectOrder,
}: DragOrderExerciseProps) {
  const [order, setOrder] = useState<string[]>(items);
  const instructionsId = useId();

  // If the parent swaps to a new question (different items), reset the order.
  useEffect(() => {
    setOrder(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Don't start a drag on a simple click — require 8px of movement.
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemStatus = useMemo<Map<string, 'correct' | 'wrong'>>(() => {
    const map = new Map<string, 'correct' | 'wrong'>();
    if (!checkedCorrectOrder) return map;
    order.forEach((item, i) => {
      map.set(item, item === checkedCorrectOrder[i] ? 'correct' : 'wrong');
    });
    return map;
  }, [order, checkedCorrectOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const nextOrder = arrayMove(order, oldIndex, newIndex);
    setOrder(nextOrder);
    // Notify the parent directly here (not via useEffect) to avoid redundant
    // mount-time renders and the risk of an infinite loop if the parent's
    // callback isn't perfectly memoized.
    onOrderChange(nextOrder);
  };

  // Overall summary for the post-check announcement. Only meaningful once the
  // user has actually submitted (checkedCorrectOrder provided).
  const checkedSummary = useMemo<string | null>(() => {
    if (!checkedCorrectOrder) return null;
    let correctCount = 0;
    order.forEach((item, i) => {
      if (item === checkedCorrectOrder[i]) correctCount++;
    });
    const total = order.length;
    if (correctCount === total) {
      return `Alle ${total} Elemente stehen richtig.`;
    }
    return `${correctCount} von ${total} Elementen stehen richtig.`;
  }, [order, checkedCorrectOrder]);

  return (
    <div className="space-y-2">
      <p
        id={instructionsId}
        className="text-xs text-slate-400"
      >
        Ziehe die Elemente mit der Maus oder per Tastatur (Leertaste zum Aufnehmen,
        Pfeile zum Verschieben, Leertaste zum Ablegen) in die richtige Reihenfolge.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ol
            className="flex flex-col gap-2"
            aria-label="Sortierbare Liste"
            aria-describedby={instructionsId}
          >
            {order.map((item, idx) => (
              <SortableItem
                key={item}
                id={item}
                label={item}
                disabled={disabled}
                position={idx}
                status={itemStatus.get(item) ?? 'idle'}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {/* Post-check summary announced once after submit. role=status lets
          ATs re-announce when the text changes (vs. polite which only announces
          initial content). */}
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
      >
        {checkedSummary ?? ''}
      </p>
    </div>
  );
}