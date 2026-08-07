import Swal from 'sweetalert2';

function themed() {
  const isDark = document.documentElement.classList.contains('dark');
  // Tracks the same --color-wa-green custom property Settings -> Appearance
  // writes (via SettingsContext's applyTheme) so popups use the store's own
  // configured accent color instead of a hardcoded one.
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-wa-green').trim() || '#25D366';
  return Swal.mixin({
    background: isDark ? '#171717' : '#ffffff',
    color: isDark ? '#f5f5f5' : '#111827',
    confirmButtonColor: accent,
    cancelButtonColor: isDark ? '#404040' : '#e5e7eb',
    customClass: {
      cancelButton: isDark ? '' : '!text-gray-700',
    },
    buttonsStyling: true,
    reverseButtons: true,
  });
}

export async function confirmAction({
  title = 'Are you sure?',
  text,
  confirmText = 'Yes',
  cancelText = 'Cancel',
  icon = 'warning',
} = {}) {
  const result = await themed().fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
  return result.isConfirmed;
}

export function successAlert(title, text) {
  return themed().fire({
    title,
    text,
    icon: 'success',
    confirmButtonText: 'OK',
  });
}

export function errorAlert(title, text) {
  return themed().fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'OK',
  });
}

export function infoAlert(title, html) {
  return themed().fire({
    title,
    html,
    icon: 'info',
    confirmButtonText: 'Got it',
  });
}
