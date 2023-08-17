import pkg from '../package.json'

const manifest: Partial<chrome.runtime.ManifestV3> = {
  action: {
    default_icon: 'icon.png',
    // default_popup: 'src/entries/popup/index.html',
  },
  background: {
    service_worker: 'src/entries/background/main.ts',
  },
  content_scripts: [
    {
      js: ['src/entries/contentScript/primary/main.tsx'],
      matches: ['*://*/*'],
    },
  ],
  host_permissions: ['*://*/*'],
  icons: {
    16: 'icon.png',
    32: 'icon.png',
    48: 'icon.png',
    128: 'icon.png',
  },
  options_ui: {
    page: 'src/entries/options/index.html',
    open_in_tab: true,
  },
  permissions: [
    'tabCapture',
    'activeTab',
    'offscreen',
    'storage',
    'desktopCapture',
    // chrome.windows
    'tabs',
  ],
}

export function getManifest(): chrome.runtime.ManifestV3 {
  return {
    author: pkg.author,
    description: pkg.description,
    name: pkg.displayName ?? pkg.name,
    version: pkg.version,
    manifest_version: 3,
    minimum_chrome_version: '116',
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval' ; object-src 'self';",
    },

    ...manifest,
  }
}
