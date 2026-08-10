import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../../api/client';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';
import { successAlert, confirmAction, errorAlert } from '../../lib/alert';
import LoadingBlock from '../../components/LoadingBlock';

const SECTION_LABELS = {
  offer_banner: 'Offer Banner',
  hot_categories: 'Hot Categories',
  featured_products: 'Featured Products',
  featured_categories: 'Featured Categories',
  subcategory_spotlight: 'Explore Subcategories',
  best_selling: 'Best Selling',
  banner_carousel: 'Promo Banner Carousel',
  all_products: 'All Products',
};

function SortableRow({ section, onToggleVisible }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.section_key,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow-sm dark:shadow-none px-4 py-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
      >
        <FontAwesomeIcon icon={faGripVertical} />
      </button>
      <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
        {SECTION_LABELS[section.section_key] || section.section_key}
      </span>
      <button
        type="button"
        onClick={() => onToggleVisible(section.section_key)}
        aria-label={section.is_visible ? 'Hide section' : 'Show section'}
        title={section.is_visible ? 'Visible on home page' : 'Hidden from home page'}
        className={`w-8 h-8 flex items-center justify-center rounded-full ${
          section.is_visible
            ? 'bg-wa-green/10 text-wa-green-dark dark:text-wa-green hover:bg-wa-green/20'
            : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-700'
        }`}
      >
        <FontAwesomeIcon icon={section.is_visible ? faEye : faEyeSlash} size="sm" />
      </button>
    </div>
  );
}

export default function AdminHomeLayout() {
  const { setHasUnsavedChanges } = useUnsavedChanges();
  const [sections, setSections] = useState(null);
  const [savedSections, setSavedSections] = useState(null);
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    api.get('/home-sections').then((res) => {
      const ordered = [...res.data].sort((a, b) => a.position - b.position);
      setSections(ordered);
      setSavedSections(ordered);
    });
  }, []);

  const dirty = sections && savedSections && JSON.stringify(sections) !== JSON.stringify(savedSections);

  useEffect(() => {
    setHasUnsavedChanges(!!dirty);
  }, [dirty, setHasUnsavedChanges]);

  useEffect(() => () => setHasUnsavedChanges(false), [setHasUnsavedChanges]);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSections((current) => {
      const oldIndex = current.findIndex((s) => s.section_key === active.id);
      const newIndex = current.findIndex((s) => s.section_key === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  function toggleVisible(sectionKey) {
    setSections((current) =>
      current.map((s) => (s.section_key === sectionKey ? { ...s, is_visible: !s.is_visible } : s))
    );
  }

  async function handleSave() {
    const confirmed = await confirmAction({
      title: 'Save this layout?',
      text: 'This will change the section order and visibility on the live home page.',
      confirmText: 'Save',
    });
    if (!confirmed) return;

    setSaving(true);
    try {
      const payload = sections.map((s, i) => ({
        section_key: s.section_key,
        position: i,
        is_visible: s.is_visible,
      }));
      const { data } = await api.put('/home-sections', { sections: payload });
      const ordered = [...data].sort((a, b) => a.position - b.position);
      setSections(ordered);
      setSavedSections(ordered);
      successAlert('Layout saved', 'The home page now reflects this order.');
    } catch (err) {
      errorAlert('Failed to save', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  if (!sections) return <LoadingBlock className="py-16" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Home Layout</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Drag to reorder sections, or hide a section from the home page.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md"
        >
          {saving ? 'Saving...' : 'Save Layout'}
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.section_key)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableRow key={section.section_key} section={section} onToggleVisible={toggleVisible} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
