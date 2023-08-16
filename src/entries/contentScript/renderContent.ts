import browser from 'webextension-polyfill'

export default async function renderContent(
  cssPaths: string[],
  render: (appRoot: ShadowRoot) => void,
) {
  const appContainer = document.createElement('div')
  const shadowRoot = appContainer.attachShadow({
    mode: import.meta.env.MODE === 'development' ? 'open' : 'closed',
  })
  const appRoot = document.createElement('div')

  if (import.meta.hot) {
    const { addViteStyleTarget } = await import(
      '@samrum/vite-plugin-web-extension/client'
    )

    await addViteStyleTarget(shadowRoot)
  } else {
    cssPaths.forEach((cssPath: string) => {
      const styleEl = document.createElement('link')
      styleEl.setAttribute('rel', 'stylesheet')
      styleEl.setAttribute('href', browser.runtime.getURL(cssPath))
      shadowRoot.appendChild(styleEl)
    })
  }

  shadowRoot.appendChild(appRoot)
  document.body.appendChild(appContainer)

  // Forward focusin event to document in order to close submenu when focus outside
  shadowRoot.addEventListener('focusin', () => {
    const focusInEvent = new FocusEvent('focusin')
    document.dispatchEvent(focusInEvent)
  })

  render(shadowRoot)
}
