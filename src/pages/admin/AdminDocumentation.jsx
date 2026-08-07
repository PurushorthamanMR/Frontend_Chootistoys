import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera,
  faStore,
  faListCheck,
  faGear,
  faCircleInfo,
  faCopy,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { copyText } from '../../lib/clipboard';

const TABS = [
  { key: 'overview', label: 'Overview', icon: faCircleInfo },
  { key: 'pages', label: 'Page Guide', icon: faStore },
  { key: 'setup', label: 'Setup Guide', icon: faListCheck },
  { key: 'config', label: 'Configuration Guide', icon: faGear },
];

// Sidebar sub-nav (same shape as SETTINGS_SECTIONS).
export const DOCUMENTATION_TABS = TABS.map(({ key, label }) => ({ key, label }));

function Card({ title, children }) {
  return (
    <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-4">
      {title && <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>}
      {children}
    </div>
  );
}

// No tool available in this environment can capture a real screenshot and save
// it as a file in the repo, so every page entry below ships with this labeled
// placeholder instead. Drop a PNG at the path shown and swap it in for real.
function ScreenshotPlaceholder({ label, file }) {
  return (
    <div className="shrink-0 w-full sm:w-48 h-28 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg flex flex-col items-center justify-center gap-1 bg-gray-50 dark:bg-neutral-800/50 text-center px-2">
      <FontAwesomeIcon icon={faCamera} className="text-lg text-gray-400 dark:text-gray-500" />
      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono break-all">
        frontend/src/assets/docs/{file}
      </span>
    </div>
  );
}

function PageEntry({ title, file, children }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 py-4 border-b border-gray-100 dark:border-neutral-800 last:border-0 last:pb-0">
      <ScreenshotPlaceholder label={title} file={file} />
      <div className="min-w-0">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{title}</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function Step({ n, children }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-wa-green/10 text-wa-green dark:bg-wa-green/20 text-xs font-bold flex items-center justify-center">
        {n}
      </span>
      <div className="min-w-0 flex-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">{children}</div>
    </div>
  );
}

function Code({ children }) {
  return (
    <code className="bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-200 rounded px-1.5 py-0.5 text-xs font-mono">
      {children}
    </code>
  );
}

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyText(children);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative max-w-full">
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy'}
        className="absolute top-2 right-2 z-10 w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded-md bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-600 shadow-sm touch-manipulation"
      >
        <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={`text-xs ${copied ? 'text-wa-green' : ''}`} />
      </button>
      <pre className="bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-200 rounded-lg p-3 pr-12 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre max-w-full">
        {children}
      </pre>
    </div>
  );
}

function SubHeading({ children }) {
  return <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 pt-1">{children}</h4>;
}

function OverviewTab() {
  return (
    <div className="space-y-4">
      <Card title="What this project is">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          A full-stack online store with three sides: a public storefront where customers browse and buy, a seller
          application flow for new sellers to apply and get approved, and an admin panel where staff manage the
          catalog, orders, content, users, and site-wide settings.
        </p>
      </Card>
      <Card title="Tech stack">
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5 list-disc list-inside">
          <li><strong>Frontend:</strong> React + Vite, React Router, Tailwind CSS, Framer Motion</li>
          <li><strong>Backend:</strong> Node.js + Express, raw parameterized SQL (no ORM)</li>
          <li><strong>Database:</strong> MySQL — schema/migrations run automatically on every backend boot</li>
          <li><strong>Auth:</strong> JWT tokens, bcrypt password hashing, email OTP for signup/reset flows</li>
          <li><strong>Email:</strong> EmailJS from the backend (needs Private Key + non-browser API access — see Configuration Guide)</li>
          <li><strong>Image uploads:</strong> Google Drive via free Gmail OAuth, falling back to local disk when unconfigured (see Configuration Guide)</li>
        </ul>
      </Card>
      <Card title="User roles">
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5 list-disc list-inside">
          <li><strong>Customer:</strong> browses, orders, tracks orders, manages their own profile</li>
          <li><strong>Seller:</strong> applies via a public form, waits for admin approval (email sent both ways), then manages their own listings</li>
          <li><strong>Admin / SuperAdmin:</strong> full access to the admin panel — catalog, orders, content, users, and settings</li>
        </ul>
      </Card>
    </div>
  );
}

function PagesTab() {
  return (
    <div className="space-y-4">
      <Card title="Storefront (customer-facing)">
        <div>
          <PageEntry title="Home" file="home.png">
            Hero banners, featured categories and products — the entry point for browsing the store.
          </PageEntry>
          <PageEntry title="Product List" file="product-list.png">
            The full catalog with category/subcategory filters and search, used for browsing and finding products.
          </PageEntry>
          <PageEntry title="Product Detail" file="product-detail.png">
            Images, price, description, and actions to add a product to the cart or wishlist.
          </PageEntry>
          <PageEntry title="Cart &amp; Checkout" file="cart-checkout.png">
            Review cart contents, enter delivery details, and place the order.
          </PageEntry>
          <PageEntry title="Login / Register" file="auth.png">
            Customer sign-in and sign-up, with a 6-digit email code required to finish registering.
          </PageEntry>
          <PageEntry title="Apply as Seller" file="apply-seller.png">
            A public form to apply as a seller — email-verified via OTP, then the application sits pending until an
            admin approves it (see Users below).
          </PageEntry>
          <PageEntry title="My Orders / Wishlist / Profile" file="account.png">
            A signed-in customer's own order history, saved items, and account details (including changing their
            email or password).
          </PageEntry>
        </div>
      </Card>

      <Card title="Admin Panel">
        <div>
          <PageEntry title="Dashboard" file="admin-dashboard.png">
            At-a-glance KPIs: sales, pending orders, low-stock count, and other store health signals.
          </PageEntry>
          <PageEntry title="Products" file="admin-products.png">
            Full catalog CRUD — pricing, discounts, stock, images, and category/subcategory assignment.
          </PageEntry>
          <PageEntry title="Categories &amp; Subcategories" file="admin-categories.png">
            The taxonomy used to organize and filter the storefront's product list.
          </PageEntry>
          <PageEntry title="Orders" file="admin-orders.png">
            Manage the order lifecycle (pending → confirmed → shipped etc.); the sidebar badge shows the pending count.
          </PageEntry>
          <PageEntry title="Low Stock" file="admin-low-stock.png">
            A focused view of products under their stock threshold, for quick restocking.
          </PageEntry>
          <PageEntry title="Offers / Banners / Blogs" file="admin-content.png">
            Marketing content: time-bound discounts, homepage banner images, and blog posts.
          </PageEntry>
          <PageEntry title="Customers &amp; Users" file="admin-users.png">
            Customer accounts, plus staff/seller accounts — including approving or rejecting pending seller
            applications (triggers the seller-status email).
          </PageEntry>
          <PageEntry title="Settings" file="admin-settings.png">
            Store branding, contact info, theme colors/fonts, legal pages, and the Email (EmailJS) and Google Drive
            integrations — see the Configuration Guide tab for both.
          </PageEntry>
          <PageEntry title="Documentation" file="admin-documentation.png">
            This page — kept up to date as the project's setup and configuration steps change.
          </PageEntry>
        </div>
      </Card>
    </div>
  );
}

function SetupTab() {
  return (
    <div className="space-y-4">
      <Card title="What you'll fill in under Settings">
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
          After the first login, these are the sections the progress bar tracks — fill in all of them to reach 100%
          and unlock the full admin panel.
        </p>
        <div className="space-y-3 pt-1">
          <div>
            <SubHeading>General</SubHeading>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Store Name, Store Short Name (used on small screens), Store Logo (also the site favicon), and Store
              Icon (the rounded icon shown next to the store name in the navbar).
            </p>
          </div>
          <div>
            <SubHeading>Contact</SubHeading>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Admin WhatsApp Number (used for order alerts and seller-application notifications), Address, and
              Email (shown in the footer, and it's the address that receives the "setup complete" email).
            </p>
          </div>
          <div>
            <SubHeading>Appearance</SubHeading>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Light/Dark Theme Color (used for buttons, links, and the header/footer — also the color used inside
              email templates and popups) and Font Style (used site-wide).
            </p>
          </div>
          <div>
            <SubHeading>Legal Pages</SubHeading>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Terms &amp; Conditions, Return Policy, and Privacy Policy — shown on their own public pages, linked
              from the footer and mobile menu.
            </p>
          </div>
          <div>
            <SubHeading>Google Drive</SubHeading>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Where uploaded images (products, categories, banners, blogs, store logo, profile pictures) are
              stored. See the Configuration Guide tab for the full walkthrough.
            </p>
          </div>
          <div>
            <SubHeading>Email (EmailJS)</SubHeading>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Powers every outgoing email — verification codes, welcome, seller-status, and setup-complete. See the
              Configuration Guide tab for the full walkthrough.
            </p>
          </div>
          <div>
            <SubHeading>Wholesale Link (not part of the progress bar)</SubHeading>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              A no-login page showing every product's cost price, for trusted wholesale buyers/sellers only. Not
              required for initial setup — set it up whenever you actually need it.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

const CODE_TEMPLATE_HTML = `<div style="max-width:480px;margin:0 auto;font-family:system-ui,Arial,sans-serif;background:#ffffff;border:1px solid #eaeaea;border-radius:10px;overflow:hidden;">
  <div style="background:{{theme_color}};padding:24px;text-align:center;">
    <img src="{{store_logo}}" alt="{{store_name}}" style="height:36px;vertical-align:middle;">
  </div>
  <div style="padding:28px 24px;">
    <p style="font-size:14px;color:#111111;margin:0 0 16px;">Hi {{to_name}},</p>
    <p style="font-size:14px;color:#333333;margin:0 0 20px;line-height:1.6;">{{intro}}</p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;font-size:28px;font-weight:bold;letter-spacing:6px;color:{{theme_color}};background:#f5f7fa;border:1px solid {{theme_color}};padding:14px 22px;border-radius:8px;">{{code}}</span>
    </div>
    <p style="font-size:13px;color:#555555;text-align:center;margin:0 0 20px;">This code will be valid for <strong>{{expires_minutes}} minutes</strong>.</p>
    <p style="font-size:12px;color:#888888;line-height:1.6;margin:0;">Do not share this code with anyone. If you didn't make this request, you can safely ignore this email.<br>{{store_name}} will never contact you about this email or ask for any login codes or links. Beware of phishing scams.</p>
  </div>
  <div style="background:#f5f7fa;padding:16px 24px;text-align:center;border-top:1px solid #eaeaea;">
    <p style="font-size:12px;color:#999999;margin:0;">&copy; {{year}} {{store_name}}. All rights reserved.</p>
  </div>
</div>`;

const NOTIFY_TEMPLATE_HTML = `<div style="max-width:480px;margin:0 auto;font-family:system-ui,Arial,sans-serif;background:#ffffff;border:1px solid #eaeaea;border-radius:10px;overflow:hidden;">
  <div style="background:{{theme_color}};padding:24px;text-align:center;">
    <img src="{{store_logo}}" alt="{{store_name}}" style="height:36px;vertical-align:middle;">
  </div>
  <div style="padding:28px 24px;">
    <p style="font-size:14px;color:#111111;margin:0 0 16px;">Hi {{to_name}},</p>
    <p style="font-size:14px;color:#333333;line-height:1.6;margin:0 0 20px;">{{message}}</p>
    <p style="font-size:14px;color:#333333;margin:0;">Thanks for visiting <strong>{{store_name}}</strong>!</p>
  </div>
  <div style="background:#f5f7fa;padding:16px 24px;text-align:center;border-top:1px solid #eaeaea;">
    <p style="font-size:12px;color:#999999;margin:0;">&copy; {{year}} {{store_name}}. All rights reserved.</p>
  </div>
</div>`;

function ConfigTab() {
  return (
    <div className="space-y-4">
      <div id="config-drive">
      <Card title="Google Drive">
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
          Stores every image uploaded in the app (products, categories, banners, blogs, store logo, profile
          pictures) instead of this server's local disk. Configure in <strong>Settings → Google Drive</strong>.
          Uses <strong>OAuth with a free Gmail account</strong> (not a Service Account) so files use your normal
          Drive storage — no Google Workspace / Shared Drive required.
        </p>

        <SubHeading>1. Create a Google Cloud project</SubHeading>
        <div className="space-y-3 pt-1">
          <Step n={1}>Go to <Code>console.cloud.google.com</Code> → project dropdown (top left) → <strong>New Project</strong> → name it anything → <strong>Create</strong>, and make sure it's selected.</Step>
        </div>

        <SubHeading>2. Enable the Drive API</SubHeading>
        <div className="space-y-3 pt-1">
          <Step n={1}><strong>APIs &amp; Services → Library</strong> → search <strong>Google Drive API</strong> → <strong>Enable</strong>.</Step>
        </div>

        <SubHeading>3. Configure the OAuth consent screen</SubHeading>
        <div className="space-y-3 pt-1">
          <Step n={1}>
            <strong>APIs &amp; Services → OAuth consent screen</strong> → choose <strong>External</strong> → fill in
            App name, User support email, and Developer contact → Save. You can leave it in{' '}
            <strong>Testing</strong> mode (no Google verification needed for personal use).
          </Step>
          <Step n={2}>
            Under <strong>Test users</strong>, click <strong>Add users</strong> and add the{' '}
            <strong>exact Gmail</strong> you'll use for Connect. While the app is in Testing, anyone not on this
            list gets <em>"Access blocked… Error 403: access_denied"</em>.
          </Step>
          <Step n={3}>
            Under <strong>Scopes</strong>, you can skip adding any manually — the app requests Drive access when you
            click Connect.
          </Step>
        </div>

        <SubHeading>4. Create an OAuth Client ID</SubHeading>
        <div className="space-y-3 pt-1">
          <Step n={1}>
            <strong>APIs &amp; Services → Credentials</strong> → <strong>+ Create Credentials</strong> →{' '}
            <strong>OAuth client ID</strong> → Application type <strong>Web application</strong>.
          </Step>
          <Step n={2}>
            Under <strong>Authorized redirect URIs</strong>, paste the Redirect URI shown in{' '}
            <strong>Settings → Google Drive</strong> (it looks like{' '}
            <Code>http://localhost:5000/api/settings/drive/oauth/callback</Code>). If you deploy later, set{' '}
            <Code>BACKEND_URL</Code> in <Code>backend/.env</Code> and add that callback URL too.
          </Step>
          <Step n={3}>
            <strong>Create</strong>, then copy the <strong>Client ID</strong> and <strong>Client Secret</strong>.
          </Step>
        </div>

        <SubHeading>5. Create a Drive folder</SubHeading>
        <div className="space-y-3 pt-1">
          <Step n={1}>
            Go to <Code>drive.google.com</Code> signed in with the same free Gmail you'll connect →{' '}
            <strong>+ New</strong> → <strong>New folder</strong> → name it (e.g. "Store Uploads") →{' '}
            <strong>Create</strong>.
          </Step>
          <Step n={2}>
            Open the folder and copy its ID from the address bar (the part after <Code>/folders/</Code> in{' '}
            <Code>drive.google.com/drive/folders/&lt;ID&gt;</Code>).
          </Step>
        </div>

        <SubHeading>6. Save and connect in the admin panel</SubHeading>
        <div className="space-y-3 pt-1">
          <Step n={1}>
            <strong>Settings → Google Drive</strong>: paste Client ID, Client Secret, and Folder ID → Save.
          </Step>
          <Step n={2}>
            Click <strong>Connect Google Account</strong>, sign in with the <strong>same Gmail</strong> you added as
            a Test user, and allow access. On success you'll see a confirmation popup and the status{' '}
            <em>"Google account connected"</em>. On failure you'll see an error popup with the reason.
          </Step>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
          Leave the fields blank (or Disconnect) to keep saving uploads to this server's local disk instead.
          Uploaded images are stored as public Drive thumbnail links so they display in the admin preview and
          storefront.
        </p>
      </Card>
      </div>

      <div id="config-email">
      <Card title="Email (EmailJS)">
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
          Sends signup/reset verification codes, welcome emails, and seller-status emails. Configure in{' '}
          <strong>Settings → Email (EmailJS)</strong>. Free EmailJS plans allow only 2 templates, so everything
          funnels through a <strong>Code</strong> template (OTP + forgot-password) and a <strong>Notify</strong>{' '}
          template (welcome + seller applied/approved/rejected + setup-complete, subject and message sent dynamically).
          The backend sends from Node.js, so you must paste the <strong>Private Key</strong> and enable{' '}
          <strong>non-browser API access</strong> (step 3).
        </p>

        <SubHeading>1. Create your account</SubHeading>
        <div className="space-y-3 pt-1">
          <Step n={1}>Go to <Code>emailjs.com</Code> and click <strong>Sign Up</strong>. Verify your email if asked.</Step>
        </div>

        <SubHeading>2. Connect an email service</SubHeading>
        <div className="space-y-3 pt-1">
          <Step n={1}>Left sidebar → <strong>Email Services</strong> → <strong>Add New Email Service</strong> → choose <strong>Gmail</strong> → <strong>Connect Account</strong> → log in and grant access → <strong>Create Service</strong>.</Step>
          <Step n={2}>
            Copy the <strong>Service ID</strong> shown on the new service card.
            <br />
            <span className="text-gray-500 dark:text-gray-400">
              If Gmail connection fails with <em>"insufficient authentication scopes"</em>: go to{' '}
              <Code>myaccount.google.com/security</Code> → Third-party apps with account access → remove EmailJS →
              delete the broken service in EmailJS → reconnect, ticking every permission this time (try an incognito
              window if it still fails). As a fallback, use <strong>Other/SMTP</strong> instead of the Gmail option
              with an{' '}
              <Code>myaccount.google.com/apppasswords</Code> app password (host <Code>smtp.gmail.com</Code>, port{' '}
              <Code>587</Code>).
            </span>
          </Step>
        </div>

        <SubHeading>3. Get your keys + allow server sending</SubHeading>
        <div className="space-y-3 pt-1">
          <Step n={1}>
            Account (top right) → <strong>General</strong> tab → copy the <strong>Public Key</strong> and{' '}
            <strong>Private Key</strong>. The Private Key is required — without it, server-side sends fail.
          </Step>
          <Step n={2}>
            Open <Code>https://dashboard.emailjs.com/admin/account/security</Code> → enable{' '}
            <strong>Allow API requests from non-browser applications</strong> → Save.
            <br />
            <span className="text-gray-500 dark:text-gray-400">
              If this stays off, emails fail with:{' '}
              <em>"API access from non-browser environments is currently disabled"</em>.
            </span>
          </Step>
        </div>

        <SubHeading>4. Create the Code template</SubHeading>
        <div className="space-y-3 pt-1">
          <Step n={1}><strong>Email Templates</strong> → <strong>Create New Template</strong> → pick any starting design (e.g. "One-Time Password") from the popup, since there's no blank option — its placeholder text gets replaced below.</Step>
          <Step n={2}>Right side panel: set <strong>To Email</strong> to <Code>{'{{email}}'}</Code>.</Step>
          <Step n={3}>Subject field: <Code>{'{{subject}}'}</Code> (dynamic — the backend sends a different subject per purpose).</Step>
          <Step n={4}>
            Click the image icon in the toolbar and upload your store logo (optional — creates a <Code>cid:</Code>{' '}
            reference), or skip it and use the HTML below as-is, which already points at{' '}
            <Code>{'{{store_logo}}'}</Code> (pulled automatically from Settings → General).
          </Step>
          <Step n={5}>
            Click <strong>Edit Content</strong> (next to the Desktop/Mobile preview tabs) and paste this HTML,
            replacing whatever's there:
            <CodeBlock>{CODE_TEMPLATE_HTML}</CodeBlock>
          </Step>
          <Step n={6}>Save, then copy the <strong>Template ID</strong> it shows.</Step>
        </div>

        <SubHeading>5. Create the Notify template</SubHeading>
        <div className="space-y-3 pt-1">
          <Step n={1}>Repeat step 4, but this is your <strong>2nd and last</strong> template (free plans allow only 2).</Step>
          <Step n={2}>Same <strong>To Email</strong> (<Code>{'{{email}}'}</Code>) and <strong>Subject</strong> (<Code>{'{{subject}}'}</Code>) as above.</Step>
          <Step n={3}>
            Body HTML:
            <CodeBlock>{NOTIFY_TEMPLATE_HTML}</CodeBlock>
          </Step>
          <Step n={4}>Save, copy this <strong>Template ID</strong> too.</Step>
        </div>

        <SubHeading>6. Save into the admin panel</SubHeading>
        <div className="space-y-3 pt-1">
          <Step n={1}>
            <strong>Settings → Email (EmailJS)</strong>: paste the Service ID, Public Key, Private Key, and both
            Template IDs (Code Template ID, Notify Template ID) → Save.
          </Step>
          <Step n={2}>
            Confirm step 3 is done (Private Key saved + non-browser API access enabled), then test by triggering a
            signup OTP or password-reset email.
          </Step>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
          Leave a Template ID blank to skip that email — verification codes print to the server console instead,
          which is convenient for local testing. Both templates automatically receive{' '}
          <Code>{'{{store_name}}'}</Code>, <Code>{'{{store_logo}}'}</Code>, <Code>{'{{theme_color}}'}</Code>, and{' '}
          <Code>{'{{year}}'}</Code> — no extra setup needed for those four.
        </p>
      </Card>
      </div>
    </div>
  );
}

export default function AdminDocumentation() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const sectionParam = searchParams.get('section');
  const activeTab = TABS.some((t) => t.key === tabParam) ? tabParam : 'overview';

  useEffect(() => {
    if (activeTab !== 'config') return;
    if (sectionParam !== 'drive' && sectionParam !== 'email') return;
    const el = document.getElementById(`config-${sectionParam}`);
    if (el) {
      // Wait a tick so the config tab content is in the DOM.
      requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }, [activeTab, sectionParam]);

  return (
    <div className="max-w-5xl">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Documentation</h2>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'pages' && <PagesTab />}
      {activeTab === 'setup' && <SetupTab />}
      {activeTab === 'config' && <ConfigTab />}
    </div>
  );
}
