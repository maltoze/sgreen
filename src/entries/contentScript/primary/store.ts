import { create } from 'zustand'

interface ITranslatorState {
  dockVisible: boolean
}

export const useStore = create<ITranslatorState>()(() => ({
  dockVisible: false,
}))

export const setDockVisible = (visible: boolean) =>
  useStore.setState({ dockVisible: visible })
