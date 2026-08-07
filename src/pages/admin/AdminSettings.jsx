import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCopy,
  faRotate,
  faStore,
  faPhone,
  faPalette,
  faFileContract,
  faLink,
  faEnvelope,
  faBook,
  faDatabase,
} from '@fortawesome/free-solid-svg-icons';
import { faGoogleDrive } from '@fortawesome/free-brands-svg-icons';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useSetupStatus } from '../../context/SetupStatusContext';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';
import { successAlert, confirmAction, errorAlert } from '../../lib/alert';
import { copyText } from '../../lib/clipboard';
import ImageUploadBox from '../../components/ImageUploadBox';
import LoadingBlock from '../../components/LoadingBlock';

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const DEFAULT_LOGO = '/img/logo.jpg';

export const SETTINGS_SECTIONS = [
  { key: 'general', label: 'General', icon: faStore },
  { key: 'contact', label: 'Contact', icon: faPhone },
  { key: 'appearance', label: 'Appearance', icon: faPalette },
  { key: 'legal', label: 'Legal Pages', icon: faFileContract },
  { key: 'drive', label: 'Google Drive', icon: faGoogleDrive },
  { key: 'email', label: 'Email (EmailJS)', icon: faEnvelope },
  { key: 'wholesale', label: 'Wholesale Link', icon: faLink },
];

// Database Export is SuperAdmin-only, so it's appended conditionally rather
// than living in the static list - both this page and AdminSidebar's Settings
// sub-nav call this so they never fall out of sync with each other.
export function getSettingsSections(isSuperAdmin) {
  return isSuperAdmin
    ? [...SETTINGS_SECTIONS, { key: 'export', label: 'Database Export', icon: faDatabase }]
    : SETTINGS_SECTIONS;
}

// Axios responses come back as a blob with the response headers still
// attached - reads the real filename mysqldump/exportController set instead
// of hardcoding one, then triggers the browser's normal save-file flow.
function downloadBlob(response, fallbackName) {
  const disposition = response.headers?.['content-disposition'] || '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match ? match[1] : fallbackName;

  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function ConfigGuideLink({ section }) {
  return (
    <Link
      to={`/admin/documentation?tab=config&section=${section}`}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-wa-green hover:text-wa-green-dark dark:hover:text-wa-green"
      title="Open Configuration Guide"
    >
      <FontAwesomeIcon icon={faBook} className="text-[10px]" />
      Guide
    </Link>
  );
}

function Label({ children, hint }) {
  return (
    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
      {children} {hint && <span className="text-gray-400">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2';

function SectionCard({ title, description, headerAction, children }) {
  return (
    <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>
      {children}
    </div>
  );
}

function SaveButton({ saving, disabled, formId, children = 'Save' }) {
  return (
    <button
      type="submit"
      form={formId}
      disabled={saving || disabled}
      className="bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md"
    >
      {saving ? 'Saving...' : children}
    </button>
  );
}

// Sections start read-only; this sits in the SectionCard header (top-right)
// and unlocks the inputs when clicked.
function EditButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 font-semibold text-sm px-3.5 py-1.5 rounded-md"
    >
      Edit
    </button>
  );
}

// Shown once editing starts. Portaled straight to document.body (not the
// SectionCard's static flow) so it stays reachable while scrolling a long
// form on mobile - a `position: fixed` element inside AdminLayout's animated
// motion.div would be trapped by that ancestor's transform (it becomes the
// containing block for fixed descendants per the CSS spec), so portaling is
// the only way to actually pin this to the viewport. The Save button is
// visually outside the <form> now, so it targets it via the HTML `form`
// attribute (formId) instead of DOM nesting.
function FloatingSaveCancel({ saving, disabled, onCancel, formId }) {
  return createPortal(
    <div className="fixed top-16 lg:top-6 inset-x-0 z-30 px-4 pointer-events-none">
      <div className="max-w-6xl mx-auto flex justify-end pointer-events-auto">
        <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full shadow-lg px-3 py-2">
          <SaveButton saving={saving} disabled={disabled} formId={formId} />
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 font-semibold px-4 py-2 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminSettings() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const sections = getSettingsSections(isSuperAdmin);
  const { settings, refreshSettings } = useSettings();
  const { refreshSetupStatus } = useSetupStatus();
  const { setHasUnsavedChanges } = useUnsavedChanges();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSection = searchParams.get('tab');
  const activeSection = sections.some((s) => s.key === requestedSection) ? requestedSection : 'general';
  const [exporting, setExporting] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const editSnapshotRef = useRef(null);
  const driveOauthHandledRef = useRef(false);
  const [wholesaleToken, setWholesaleToken] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [emailForm, setEmailForm] = useState(null);
  const [driveForm, setDriveForm] = useState(null);
  const [fonts, setFonts] = useState([]);
  const [previewFont, setPreviewFont] = useState(null);
  const [fontSnippet, setFontSnippet] = useState('');
  const [addingFont, setAddingFont] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  useEffect(() => {
    api.get('/settings/wholesale-token').then((res) => setWholesaleToken(res.data.wholesale_token));
    api.get('/settings/email').then((res) => setEmailForm(res.data));
    api.get('/settings/drive').then((res) => setDriveForm(res.data));
    api.get('/fonts').then((res) => setFonts(res.data));
  }, []);

  // OAuth callback lands on /admin/settings?tab=drive&drive=connected|error
  useEffect(() => {
    const driveStatus = searchParams.get('drive');
    if (!driveStatus || driveOauthHandledRef.current) return;
    driveOauthHandledRef.current = true;

    const rawReason = searchParams.get('reason') || '';
    let reason = rawReason;
    try {
      reason = decodeURIComponent(rawReason);
    } catch {
      // keep raw
    }

    (async () => {
      if (driveStatus === 'connected') {
        await successAlert('Google Drive connected', 'Uploads will now go to your Google Drive folder.');
        try {
          const { data } = await api.get('/settings/drive');
          setDriveForm(data);
        } catch {
          // Status text will refresh on next visit.
        }
        await refreshSetupStatus();
      } else if (driveStatus === 'error') {
        const friendly =
          /access_denied/i.test(reason)
            ? 'Google blocked sign-in. Add this Gmail as a Test user under Google Cloud → OAuth consent screen, then try again.'
            : reason || 'Could not complete Google sign-in.';
        await errorAlert('Google Drive connection failed', friendly);
      }

      const next = new URLSearchParams(searchParams);
      next.delete('drive');
      next.delete('reason');
      if (!next.get('tab')) next.set('tab', 'drive');
      setSearchParams(next, { replace: true });
    })();
  }, [searchParams, refreshSetupStatus, setSearchParams]);

  // Only takes the saved value once, so the dropdown isn't yanked back to
  // the saved font while the admin is mid-preview of a different one.
  useEffect(() => {
    if (form?.active_font && previewFont === null) setPreviewFont(form.active_font);
  }, [form, previewFont]);

  // Loads every registered font's stylesheet while this page is open, so the
  // preview below can render whichever one is picked in the dropdown - not
  // just the site's currently active font.
  useEffect(() => {
    const links = fonts.map((f) => {
      let link = document.getElementById(`font-preview-${f.id}`);
      if (!link) {
        link = document.createElement('link');
        link.id = `font-preview-${f.id}`;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${f.family_param}&display=swap`;
        document.head.appendChild(link);
      }
      return link;
    });
    return () => links.forEach((link) => link.remove());
  }, [fonts]);

  useEffect(() => {
    setError('');
    setEditing(false);
  }, [activeSection]);

  // Mirrors local edit-mode into the shared context so AdminSidebar can warn
  // before navigating away mid-edit. Cleared on unmount too, so it can't leak
  // "true" into whatever page the admin lands on next.
  useEffect(() => {
    setHasUnsavedChanges(editing);
  }, [editing, setHasUnsavedChanges]);

  useEffect(() => () => setHasUnsavedChanges(false), [setHasUnsavedChanges]);

  function startEdit(snapshot) {
    editSnapshotRef.current = snapshot;
    setEditing(true);
  }

  function cancelEdit(...restoreFns) {
    if (editSnapshotRef.current) {
      restoreFns.forEach((restore) => restore(editSnapshotRef.current));
    }
    setError('');
    setEditing(false);
  }

  async function saveFields(fields) {
    setError('');
    const confirmed = await confirmAction({
      title: 'Save these changes?',
      text: 'This will update the settings live across the site.',
      confirmText: 'Save',
    });
    if (!confirmed) return false;

    setSaving(true);
    try {
      await api.put('/settings', fields);
      await refreshSettings();
      await refreshSetupStatus();
      setEditing(false);
      successAlert('Settings saved', 'The changes have been applied across the site.');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
      return false;
    } finally {
      setSaving(false);
    }
  }

  function handleGeneralSubmit(e) {
    e.preventDefault();
    saveFields({
      store_name: form.store_name,
      store_short_name: form.store_short_name,
      store_logo: form.store_logo,
      store_icon: form.store_icon,
    });
  }

  function handleContactSubmit(e) {
    e.preventDefault();
    saveFields({ whatsapp_number: form.whatsapp_number, address: form.address, email: form.email });
  }

  const lightColorInvalid = !!form && !HEX_COLOR_RE.test(form.theme_color_light);
  const darkColorInvalid = !!form && !HEX_COLOR_RE.test(form.theme_color_dark);

  function handleAppearanceSubmit(e) {
    e.preventDefault();
    if (lightColorInvalid || darkColorInvalid) {
      setError('Theme colors must be a valid hex code, e.g. #1DA851');
      return;
    }
    saveFields({
      theme_color_light: form.theme_color_light,
      theme_color_dark: form.theme_color_dark,
      active_font: previewFont,
    });
  }

  async function handleAddFont() {
    setError('');
    setAddingFont(true);
    try {
      const { data } = await api.post('/fonts', { snippet: fontSnippet });
      setFonts(data.fonts);
      setFontSnippet('');
      if (data.added.length > 0) {
        successAlert('Font added', `Added: ${data.added.join(', ')}`);
      } else {
        errorAlert('Nothing new', 'Every font in that snippet is already in the list.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add font');
    } finally {
      setAddingFont(false);
    }
  }

  function handleEmailSubmit(e) {
    e.preventDefault();
    saveFields({
      emailjs_service_id: emailForm.emailjs_service_id,
      emailjs_public_key: emailForm.emailjs_public_key,
      emailjs_private_key: emailForm.emailjs_private_key,
      emailjs_reply_to: emailForm.emailjs_reply_to,
      emailjs_template_otp: emailForm.emailjs_template_otp,
      emailjs_template_notify: emailForm.emailjs_template_notify,
    });
  }

  async function handleDriveSubmit(e) {
    e.preventDefault();
    const ok = await saveFields({
      drive_client_id: driveForm.drive_client_id,
      drive_client_secret: driveForm.drive_client_secret,
      drive_folder_id: driveForm.drive_folder_id,
    });
    if (ok) {
      const { data } = await api.get('/settings/drive');
      setDriveForm(data);
    }
  }

  async function connectDriveAccount() {
    setError('');
    try {
      // Persist Client ID / Secret / Folder ID first so OAuth can use them.
      if (editing) {
        const confirmed = await confirmAction({
          title: 'Save changes before connecting?',
          text: 'Client ID, Secret and Folder ID must be saved before Google sign-in can use them.',
          confirmText: 'Save & Connect',
        });
        if (!confirmed) return;
        await api.put('/settings', {
          drive_client_id: driveForm.drive_client_id,
          drive_client_secret: driveForm.drive_client_secret,
          drive_folder_id: driveForm.drive_folder_id,
        });
        await refreshSettings();
        await refreshSetupStatus();
        setEditing(false);
      }
      const { data } = await api.get('/settings/drive/oauth/start');
      window.location.href = data.url;
    } catch (err) {
      errorAlert('Connect failed', err.response?.data?.message || 'Could not start Google sign-in.');
    }
  }

  async function disconnectDriveAccount() {
    const confirmed = await confirmAction({
      title: 'Disconnect Google Drive?',
      text: "Uploads will fall back to this server's local disk until you connect again.",
      confirmText: 'Disconnect',
    });
    if (!confirmed) return;
    try {
      await api.put('/settings', { drive_refresh_token: '' });
      const { data } = await api.get('/settings/drive');
      setDriveForm(data);
      await refreshSetupStatus();
      successAlert('Disconnected', 'Google Drive is no longer connected.');
    } catch (err) {
      errorAlert('Failed', err.response?.data?.message || 'Could not disconnect Google Drive.');
    }
  }

  function handleLegalSubmit(e) {
    e.preventDefault();
    saveFields({
      terms_content: form.terms_content,
      return_policy_content: form.return_policy_content,
      privacy_policy_content: form.privacy_policy_content,
    });
  }

  const wholesaleLink = wholesaleToken ? `${window.location.origin}/wholesale-view/${wholesaleToken}` : '';

  async function copyWholesaleLink() {
    const ok = await copyText(wholesaleLink);
    if (ok) successAlert('Copied', 'The wholesale link has been copied to your clipboard.');
    else errorAlert('Copy failed', 'Could not copy to the clipboard on this device.');
  }

  async function regenerateWholesaleLink() {
    const confirmed = await confirmAction({
      title: 'Regenerate wholesale link?',
      text: 'The current link will stop working immediately. Anyone using the old link will need the new one.',
      confirmText: 'Regenerate',
    });
    if (!confirmed) return;
    setRegenerating(true);
    try {
      const { data } = await api.post('/settings/wholesale-token/regenerate');
      setWholesaleToken(data.wholesale_token);
      successAlert('Link regenerated', 'The old wholesale link no longer works.');
    } catch {
      errorAlert('Failed', 'Could not regenerate the wholesale link.');
    } finally {
      setRegenerating(false);
    }
  }

  async function handleExport() {
    const confirmed = await confirmAction({
      title: 'Export the database?',
      text: 'Downloads two .sql files: one with just the table structure, one with just the data.',
      confirmText: 'Export',
    });
    if (!confirmed) return;

    setExporting(true);
    try {
      const [structureRes, dataRes] = await Promise.all([
        api.get('/settings/export/structure', { responseType: 'blob' }),
        api.get('/settings/export/data', { responseType: 'blob' }),
      ]);
      downloadBlob(structureRes, 'structure.sql');
      downloadBlob(dataRes, 'data.sql');
      successAlert('Export ready', 'Both files have started downloading.');
    } catch (err) {
      errorAlert('Export failed', err.response?.data?.message || 'Failed to export the database.');
    } finally {
      setExporting(false);
    }
  }

  if (!form) return <LoadingBlock className="py-16" />;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Settings</h2>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          {activeSection === 'general' && (
            <form id="general-form" onSubmit={handleGeneralSubmit}>
              <SectionCard
                title="General"
                description="Your store's name and logo, as shown across the site."
                headerAction={!editing && <EditButton onClick={() => startEdit(form)} />}
              >
                <div>
                  <Label>Store Name</Label>
                  <input
                    required
                    disabled={!editing}
                    value={form.store_name}
                    onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                    className={`${inputClass} disabled:opacity-60`}
                  />
                </div>
                <div>
                  <Label hint="(shown on small screens)">Store Short Name</Label>
                  <input
                    required
                    maxLength={20}
                    disabled={!editing}
                    value={form.store_short_name}
                    onChange={(e) => setForm({ ...form, store_short_name: e.target.value })}
                    className={`${inputClass} disabled:opacity-60`}
                  />
                </div>
                <div>
                  <Label hint="(also used as the site favicon)">Store Logo</Label>
                  <ImageUploadBox
                    value={form.store_logo || DEFAULT_LOGO}
                    onChange={(url) => setForm({ ...form, store_logo: url })}
                    disabled={!editing}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave unset to use the default logo shown here.
                  </p>
                </div>
                <div>
                  <Label hint="(rounded icon shown next to the store name in the navbar)">Store Icon</Label>
                  <ImageUploadBox
                    value={form.store_icon}
                    onChange={(url) => setForm({ ...form, store_icon: url })}
                    disabled={!editing}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave unset to show just the store name with no icon.
                  </p>
                </div>
                {editing && <FloatingSaveCancel saving={saving} onCancel={() => cancelEdit(setForm)} formId="general-form" />}
              </SectionCard>
            </form>
          )}

          {activeSection === 'contact' && (
            <form id="contact-form" onSubmit={handleContactSubmit}>
              <SectionCard
                title="Contact"
                description="Used for order alerts, seller applications, and the footer contact info."
                headerAction={!editing && <EditButton onClick={() => startEdit(form)} />}
              >
                <div>
                  <Label hint="(digits only, country code, no +)">Admin WhatsApp Number</Label>
                  <input
                    placeholder="e.g. 94771234567"
                    disabled={!editing}
                    value={form.whatsapp_number || ''}
                    onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                    className={`${inputClass} disabled:opacity-60`}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave blank to disable WhatsApp order alerts (customers can still place orders).
                  </p>
                </div>
                <div>
                  <Label>Address</Label>
                  <input
                    placeholder="e.g. Colombo, Sri Lanka"
                    disabled={!editing}
                    value={form.address || ''}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className={`${inputClass} disabled:opacity-60`}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <input
                    type="email"
                    placeholder="e.g. info@yourstore.com"
                    disabled={!editing}
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`${inputClass} disabled:opacity-60`}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Address and email shown in the footer's Contact section.
                  </p>
                </div>
                {editing && <FloatingSaveCancel saving={saving} onCancel={() => cancelEdit(setForm)} formId="contact-form" />}
              </SectionCard>
            </form>
          )}

          {activeSection === 'appearance' && (
            <form id="appearance-form" onSubmit={handleAppearanceSubmit}>
              <SectionCard
                title="Appearance"
                description="Theme colors used for buttons, links, and the header/footer."
                headerAction={
                  !editing && (
                    <EditButton
                      onClick={() =>
                        startEdit({
                          theme_color_light: form.theme_color_light,
                          theme_color_dark: form.theme_color_dark,
                          previewFont,
                        })
                      }
                    />
                  )
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Light Theme Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        disabled={!editing}
                        value={HEX_COLOR_RE.test(form.theme_color_light) ? form.theme_color_light : '#000000'}
                        onChange={(e) => setForm({ ...form, theme_color_light: e.target.value })}
                        className="w-10 h-10 shrink-0 rounded border border-gray-300 dark:border-neutral-700 bg-transparent disabled:opacity-60"
                      />
                      <input
                        type="text"
                        disabled={!editing}
                        value={form.theme_color_light}
                        onChange={(e) => setForm({ ...form, theme_color_light: e.target.value })}
                        placeholder="#1DA851"
                        maxLength={7}
                        className={`flex-1 min-w-0 border rounded px-3 py-2 text-sm font-mono uppercase dark:bg-neutral-800 dark:text-gray-100 disabled:opacity-60 ${
                          lightColorInvalid ? 'border-red-400' : 'border-gray-300 dark:border-neutral-700'
                        }`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used in light mode.</p>
                  </div>
                  <div>
                    <Label>Dark Theme Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        disabled={!editing}
                        value={HEX_COLOR_RE.test(form.theme_color_dark) ? form.theme_color_dark : '#000000'}
                        onChange={(e) => setForm({ ...form, theme_color_dark: e.target.value })}
                        className="w-10 h-10 shrink-0 rounded border border-gray-300 dark:border-neutral-700 bg-transparent disabled:opacity-60"
                      />
                      <input
                        type="text"
                        disabled={!editing}
                        value={form.theme_color_dark}
                        onChange={(e) => setForm({ ...form, theme_color_dark: e.target.value })}
                        placeholder="#25D366"
                        maxLength={7}
                        className={`flex-1 min-w-0 border rounded px-3 py-2 text-sm font-mono uppercase dark:bg-neutral-800 dark:text-gray-100 disabled:opacity-60 ${
                          darkColorInvalid ? 'border-red-400' : 'border-gray-300 dark:border-neutral-700'
                        }`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used in dark mode.</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-neutral-800">
                  <Label hint="(used across the whole site)">Font Style</Label>
                  <select
                    disabled={!editing}
                    value={previewFont || ''}
                    onChange={(e) => setPreviewFont(e.target.value)}
                    className={`${inputClass} disabled:opacity-60`}
                  >
                    {fonts.map((f) => (
                      <option key={f.id} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 rounded-lg border border-gray-200 dark:border-neutral-700 p-5 text-center">
                    <p
                      className="text-2xl text-gray-900 dark:text-gray-100"
                      style={{ fontFamily: previewFont ? `"${previewFont}", sans-serif` : undefined }}
                    >
                      Here is the Font Style
                    </p>
                  </div>
                </div>

                <div>
                  <Label hint="(paste a Google Fonts <link> snippet to add more options above)">Add New Font</Label>
                  <textarea
                    rows={3}
                    value={fontSnippet}
                    onChange={(e) => setFontSnippet(e.target.value)}
                    placeholder='<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">'
                    className={`${inputClass} font-mono text-xs`}
                  />
                  <button
                    type="button"
                    onClick={handleAddFont}
                    disabled={addingFont || !fontSnippet.trim()}
                    className="mt-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 font-semibold text-sm px-3.5 py-2 rounded-md"
                  >
                    {addingFont ? 'Adding...' : 'Add Font'}
                  </button>
                </div>

                {editing && (
                  <FloatingSaveCancel
                    saving={saving}
                    disabled={lightColorInvalid || darkColorInvalid}
                    formId="appearance-form"
                    onCancel={() =>
                      cancelEdit(
                        (snap) => setForm({ ...form, theme_color_light: snap.theme_color_light, theme_color_dark: snap.theme_color_dark }),
                        (snap) => setPreviewFont(snap.previewFont)
                      )
                    }
                  />
                )}
              </SectionCard>
            </form>
          )}

          {activeSection === 'legal' && (
            <form id="legal-form" onSubmit={handleLegalSubmit}>
              <SectionCard
                title="Legal Pages"
                description="Shown on the public Terms & Conditions, Return Policy, and Privacy Policy pages (linked from the footer and mobile menu)."
                headerAction={!editing && <EditButton onClick={() => startEdit(form)} />}
              >
                <div>
                  <Label>Terms &amp; Conditions</Label>
                  <textarea
                    rows={8}
                    disabled={!editing}
                    value={form.terms_content || ''}
                    onChange={(e) => setForm({ ...form, terms_content: e.target.value })}
                    className={`${inputClass} font-normal text-sm leading-relaxed resize-y disabled:opacity-60`}
                  />
                </div>
                <div>
                  <Label>Return Policy</Label>
                  <textarea
                    rows={8}
                    disabled={!editing}
                    value={form.return_policy_content || ''}
                    onChange={(e) => setForm({ ...form, return_policy_content: e.target.value })}
                    className={`${inputClass} font-normal text-sm leading-relaxed resize-y disabled:opacity-60`}
                  />
                </div>
                <div>
                  <Label>Privacy Policy</Label>
                  <textarea
                    rows={8}
                    disabled={!editing}
                    value={form.privacy_policy_content || ''}
                    onChange={(e) => setForm({ ...form, privacy_policy_content: e.target.value })}
                    className={`${inputClass} font-normal text-sm leading-relaxed resize-y disabled:opacity-60`}
                  />
                </div>
                {editing && <FloatingSaveCancel saving={saving} onCancel={() => cancelEdit(setForm)} formId="legal-form" />}
              </SectionCard>
            </form>
          )}

          {activeSection === 'email' && (
            emailForm ? (
              <form id="email-form" onSubmit={handleEmailSubmit}>
                <SectionCard
                  title="Email (EmailJS)"
                  description="Used to send verification codes for signup, seller applications, and password resets, plus welcome and seller-status emails. Create a free account at emailjs.com, add an Email Service, enable Account → Security → “Allow API requests from non-browser applications”, then create 2 templates: a Code template (Subject {{subject}}, body {{to_name}}/{{code}}/{{expires_minutes}}/{{store_name}}) and a Notify template (Subject {{subject}}, body {{to_name}}/{{message}}/{{store_name}}) — both with To Email {{to_email}}. Paste Service ID, Public Key, Private Key, and both Template IDs below. Leave a Template ID blank to skip that email (OTP codes print to the server console instead)."
                  headerAction={
                    <div className="flex items-center gap-2">
                      <ConfigGuideLink section="email" />
                      {!editing && <EditButton onClick={() => startEdit(emailForm)} />}
                    </div>
                  }
                >
                  <div>
                    <Label hint="(EmailJS → Email Services)">Service ID</Label>
                    <input
                      disabled={!editing}
                      value={emailForm.emailjs_service_id || ''}
                      onChange={(e) => setEmailForm({ ...emailForm, emailjs_service_id: e.target.value })}
                      className={`${inputClass} disabled:opacity-60`}
                    />
                  </div>
                  <div>
                    <Label hint="(Account → General)">Public Key</Label>
                    <input
                      disabled={!editing}
                      value={emailForm.emailjs_public_key || ''}
                      onChange={(e) => setEmailForm({ ...emailForm, emailjs_public_key: e.target.value })}
                      className={`${inputClass} disabled:opacity-60`}
                    />
                  </div>
                  <div>
                    <Label hint="(Account → General — needed for server-side sending)">Private Key</Label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      disabled={!editing}
                      value={emailForm.emailjs_private_key || ''}
                      onChange={(e) => setEmailForm({ ...emailForm, emailjs_private_key: e.target.value })}
                      className={`${inputClass} disabled:opacity-60`}
                    />
                  </div>
                  <div>
                    <Label hint="(optional — where customer replies go)">Reply-To Email</Label>
                    <input
                      type="email"
                      placeholder="e.g. support@yourstore.com"
                      disabled={!editing}
                      value={emailForm.emailjs_reply_to || ''}
                      onChange={(e) => setEmailForm({ ...emailForm, emailjs_reply_to: e.target.value })}
                      className={`${inputClass} disabled:opacity-60`}
                    />
                  </div>
                  <div>
                    <Label hint="(verification codes + password reset codes)">Code Template ID</Label>
                    <input
                      disabled={!editing}
                      value={emailForm.emailjs_template_otp || ''}
                      onChange={(e) => setEmailForm({ ...emailForm, emailjs_template_otp: e.target.value })}
                      className={`${inputClass} disabled:opacity-60`}
                    />
                  </div>
                  <div>
                    <Label hint="(welcome + seller application + seller approved)">Notify Template ID</Label>
                    <input
                      disabled={!editing}
                      value={emailForm.emailjs_template_notify || ''}
                      onChange={(e) => setEmailForm({ ...emailForm, emailjs_template_notify: e.target.value })}
                      className={`${inputClass} disabled:opacity-60`}
                    />
                  </div>
                  {editing && <FloatingSaveCancel saving={saving} onCancel={() => cancelEdit(setEmailForm)} formId="email-form" />}
                </SectionCard>
              </form>
            ) : (
              <LoadingBlock className="py-10" />
            )
          )}

          {activeSection === 'drive' && (
            driveForm ? (
              <form id="drive-form" onSubmit={handleDriveSubmit}>
                <SectionCard
                  title="Google Drive"
                  description="Store uploaded images in your free Gmail Google Drive instead of this server's disk. Create an OAuth client in Google Cloud, add your Gmail as a Test user on the OAuth consent screen, paste Client ID / Secret / Folder ID below, then Connect Google Account. Leave blank to keep saving uploads locally."
                  headerAction={
                    <div className="flex items-center gap-2">
                      <ConfigGuideLink section="drive" />
                      {!editing && <EditButton onClick={() => startEdit(driveForm)} />}
                    </div>
                  }
                >
                  <div>
                    <Label hint="(copy this into Google Cloud → Authorized redirect URIs)">Redirect URI</Label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={driveForm.drive_redirect_uri || ''}
                        className={`${inputClass} opacity-60`}
                      />
                      <button
                        type="button"
                        title="Copy"
                        onClick={async () => {
                          const ok = await copyText(driveForm.drive_redirect_uri || '');
                          if (ok) successAlert('Copied', 'Redirect URI copied to clipboard.');
                          else errorAlert('Copy failed', 'Could not copy to the clipboard on this device.');
                        }}
                        className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 touch-manipulation"
                      >
                        <FontAwesomeIcon icon={faCopy} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label hint="(Google Cloud Console → APIs & Services → Credentials → OAuth client)">Client ID</Label>
                    <input
                      disabled={!editing}
                      value={driveForm.drive_client_id || ''}
                      onChange={(e) => setDriveForm({ ...driveForm, drive_client_id: e.target.value })}
                      className={`${inputClass} disabled:opacity-60`}
                    />
                  </div>
                  <div>
                    <Label hint="(from the same OAuth client)">Client Secret</Label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      disabled={!editing}
                      value={driveForm.drive_client_secret || ''}
                      onChange={(e) => setDriveForm({ ...driveForm, drive_client_secret: e.target.value })}
                      className={`${inputClass} disabled:opacity-60`}
                    />
                  </div>
                  <div>
                    <Label hint="(from drive.google.com/drive/folders/… — a folder you own)">Folder ID</Label>
                    <input
                      disabled={!editing}
                      value={driveForm.drive_folder_id || ''}
                      onChange={(e) => setDriveForm({ ...driveForm, drive_folder_id: e.target.value })}
                      className={`${inputClass} disabled:opacity-60`}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 min-w-[12rem]">
                      {driveForm.drive_connected
                        ? 'Google account connected — uploads will use Drive.'
                        : 'Not connected yet — save Client ID & Secret, then connect with Gmail.'}
                    </p>
                    {driveForm.drive_connected ? (
                      <button
                        type="button"
                        onClick={disconnectDriveAccount}
                        className="bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 font-semibold text-sm px-3.5 py-2 rounded-md"
                      >
                        Disconnect
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={connectDriveAccount}
                      className="bg-wa-green hover:bg-wa-green-dark text-white font-semibold text-sm px-3.5 py-2 rounded-md"
                    >
                      {driveForm.drive_connected ? 'Reconnect Google Account' : 'Connect Google Account'}
                    </button>
                  </div>
                  {editing && <FloatingSaveCancel saving={saving} onCancel={() => cancelEdit(setDriveForm)} formId="drive-form" />}
                </SectionCard>
              </form>
            ) : (
              <LoadingBlock className="py-10" />
            )
          )}

          {activeSection === 'wholesale' && (
            <SectionCard
              title="Wholesale Price List Link"
              description="A no-login page showing every product's cost price, for trusted sellers/buyers only. Anyone with this link can view it, so only share it with people you trust - if it ever leaks, regenerate it below to instantly kill the old link."
            >
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={wholesaleLink}
                  placeholder="Loading..."
                  className="flex-1 min-w-0 border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono truncate"
                />
                <button
                  type="button"
                  onClick={copyWholesaleLink}
                  disabled={!wholesaleLink}
                  title="Copy link"
                  className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faCopy} />
                </button>
              </div>
              <button
                type="button"
                onClick={regenerateWholesaleLink}
                disabled={regenerating || !wholesaleToken}
                className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faRotate} spin={regenerating} />
                {regenerating ? 'Regenerating...' : 'Regenerate Link'}
              </button>
            </SectionCard>
          )}

          {activeSection === 'export' && isSuperAdmin && (
            <SectionCard
              title="Database Export"
              description="Downloads two files: one with just the table structure (CREATE TABLE statements, no data) and one with just the data (INSERT statements, no schema) - the same split phpMyAdmin offers. Requires mysqldump to be installed on the backend server."
            >
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md"
              >
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </SectionCard>
          )}
    </div>
  );
}
