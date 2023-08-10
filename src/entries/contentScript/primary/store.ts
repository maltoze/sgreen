import { create } from 'zustand'
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware'

interface ISgreenState {
  audio: boolean
  dockVisible: boolean
  showKeyStrokes: boolean
  isRecording: boolean
  setAudio: (audio: boolean) => void
  setShowKeyStrokes: (showKeyStrokes: boolean) => void
}

const storage: StateStorage = {
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

const persistKeys = ['audio', 'showKeyStrokes']

export const useStore = create<ISgreenState>()(
  persist(
    (set, _get) => ({
      audio: false,
      dockVisible: false,
      showKeyStrokes: false,
      isRecording: false,
      setAudio: (audio: boolean) => set({ audio }),
      setShowKeyStrokes: (showKeyStrokes: boolean) => set({ showKeyStrokes }),
    }),
    {
      name: 'sgreen-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => persistKeys.includes(key)),
        ),
    },
  ),
)

export const setDockVisible = (visible: boolean) =>
  useStore.setState({ dockVisible: visible })
export const setIsRecording = (isRecording: boolean) =>
  useStore.setState({ isRecording })
