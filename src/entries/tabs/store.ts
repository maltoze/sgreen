import { create } from 'zustand'

interface ITranslatorState {
  ffmpegLoaded: boolean
}

export const useStore = create<ITranslatorState>()(() => ({
  ffmpegLoaded: false,
}))

export const setFFmpegLoaded = (loaded: boolean) =>
  useStore.setState({ ffmpegLoaded: loaded })
