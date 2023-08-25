const chromePolyfill = {
  storage: {
    local: {
      get: (key: string, callback: (items: string) => void) => {
        const item = { [key]: localStorage.getItem(key) }
        callback(JSON.stringify(item))
      },

      set: (items: { [key: string]: string }) => {
        Object.keys(items).forEach((key) =>
          localStorage.setItem(key, items[key])
        )
      },
      remove: (key: string, callback: () => void) => {
        localStorage.removeItem(key)
        callback()
      },
    },
  },
  runtime: {
    sendMessage: () => {},
  },
}
// @ts-ignore
window.chrome.storage = chromePolyfill.storage
// @ts-ignore
window.chrome.runtime = chromePolyfill.runtime
