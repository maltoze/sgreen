import pkg from '../package.json'

const manifest: Partial<chrome.runtime.ManifestV3> = {
  action: {
    default_icon: 'icon.png',
    default_title:
      process.env.NODE_ENV === 'development'
        ? 'Sgreen - dev'
        : 'Sgreen: Record Screen',
  },
  background: {
    service_worker: 'src/entries/background/main.ts',
  },
  icons: {
    16: 'icon.png',
    32: 'icon.png',
    48: 'icon.png',
    128: 'icon.png',
  },
  permissions: [
    'tabCapture',
    'activeTab',
    'offscreen',
    'storage',
    'desktopCapture',
    // chrome.windows
    'scripting',
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
    ...manifest,
  }
}
