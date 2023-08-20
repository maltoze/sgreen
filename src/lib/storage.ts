import { StateStorage } from 'zustand/middleware'

export const chromeSyncStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(name, (result) => {
        resolve(result[name] || null)
      })
    })
  },
  setItem: async (name: string, value: string | boolean): Promise<void> => {
    return chrome.storage.sync.set({ [name]: value })
  },
  removeItem: async (name: string): Promise<void> => {
    return chrome.storage.sync.remove(name)
  },
}

export const chromeLocalStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return new Promise((resolve) => {
      chrome.storage.local.get(name, (result) => {
        resolve(result[name] || null)
      })
    })
  },
  setItem: async (name: string, value: string | boolean): Promise<void> => {
    return chrome.storage.local.set({ [name]: value })
  },
  removeItem: async (name: string): Promise<void> => {
    return chrome.storage.local.remove(name)
  },
}
