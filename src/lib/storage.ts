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

export const chromeSessionStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return new Promise((resolve) => {
      chrome.storage.session.get(name, (result) => {
        resolve(result[name] || null)
      })
    })
  },
  setItem: async (name: string, value: string | boolean): Promise<void> => {
    return chrome.storage.session.set({ [name]: value })
  },
  removeItem: async (name: string): Promise<void> => {
    return chrome.storage.session.remove(name)
  },
}