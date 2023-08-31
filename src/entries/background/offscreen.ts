import Recorder from '~/lib/recording'

const recorder = new Recorder()

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target === 'offscreen') {
    switch (message.type) {
      case 'start-recording':
        recorder.start(message.data)
        break
      case 'stop-recording':
        recorder.stop()
        break
      default:
        throw new Error('Unrecognized message:', message.type)
    }
  }
})
