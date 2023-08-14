/* eslint-disable @typescript-eslint/ban-ts-comment */

import { start, stop } from '~/lib/recording'

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target === 'offscreen') {
    switch (message.type) {
      case 'start-recording':
        start(message.data)
        break
      case 'stop-recording':
        stop()
        break
      default:
        throw new Error('Unrecognized message:', message.type)
    }
  }
})
