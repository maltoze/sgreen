import { DashboardIcon, DesktopIcon, PaddingIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Switch } from '~/components/ui/switch'
import { getCurrentTab } from '~/lib/utils'
import '~/style.css'
import { IPopupState, useStore } from './store'

type RecordingMode = 'tab' | 'desktop' | 'application'

async function getStreamId(tabId: number) {
  return new Promise<string | null>((resolve) => {
    chrome.tabCapture.getMediaStreamId(
      {
        targetTabId: tabId,
      },
      (streamId) => {
        resolve(streamId)
      },
    )
  })
}

interface IOptionsConfig {
  name: keyof IPopupState
  label: string
  disabled?: boolean
}

function App() {
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('tab')

  const options = useStore((state) => ({
    audio: state.audio,
    showKeystrokes: state.showKeystrokes,
    scrollbarHidden: state.scrollbarHidden,
  }))

  function startRecording() {
    switch (recordingMode) {
      case 'tab':
        return startRecordingTab()
      case 'desktop':
        return startRecordingDesktop()
      default:
        break
    }
  }

  async function startRecordingDesktop() {
    chrome.runtime.sendMessage({
      type: 'start-recording',
      target: 'background',
      data: {
        audio: options.audio,
        recordingMode: 'desktop',
      },
    })
  }

  async function startRecordingTab() {
    const tab = await getCurrentTab()
    if (!tab.id) return

    const streamId = await getStreamId(tab.id)
    chrome.tabs.sendMessage(tab.id, {
      type: 'start-recording',
      data: {
        streamId,
        audio: options.audio,
        showKeystrokes: options.showKeystrokes,
        recordingTabId: tab.id,
        scrollbarHidden: options.scrollbarHidden,
      },
    })
    window.close()
  }

  const recordingModes = [
    {
      name: 'tab',
      label: 'Current Tab',
      icon: <PaddingIcon className="h-6 w-6" />,
    },
    {
      name: 'desktop',
      label: 'Desktop',
      icon: <DesktopIcon className="h-6 w-6" />,
    },
    {
      name: 'application',
      label: 'Apps',
      icon: <DashboardIcon className="h-6 w-6" />,
    },
  ]

  const optionsConfigs: IOptionsConfig[] = [
    { name: 'audio', label: 'Enable Audio' },
    {
      name: 'showKeystrokes',
      label: 'Show Keystrokes',
      disabled: recordingMode !== 'tab',
    },
    {
      name: 'scrollbarHidden',
      label: 'Hide Scroll Bar',
      disabled: recordingMode !== 'tab',
    },
  ]

  return (
    <main className="w-80">
      <div className="space-y-6 p-4">
        <section>
          <RadioGroup
            className="grid grid-cols-3 gap-2"
            defaultValue="tab"
            onValueChange={(value) => setRecordingMode(value as RecordingMode)}
          >
            {recordingModes.map(({ name, label, icon }) => (
              <Label
                key={name}
                htmlFor={name}
                className="flex flex-col items-center justify-center gap-3 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
              >
                <RadioGroupItem className="sr-only" id={name} value={name} />
                {icon}
                <span className="inline-block whitespace-nowrap">{label}</span>
              </Label>
            ))}
          </RadioGroup>
        </section>

        <section className="space-y-3">
          {optionsConfigs.map(({ name, label, disabled }) => (
            <Label
              className="flex items-center justify-between [&:has([data-disabled])]:text-muted-foreground"
              key={name}
              htmlFor={name}
            >
              <span>{label}</span>
              <Switch
                id={name}
                disabled={disabled}
                checked={options[name]}
                onCheckedChange={(value) =>
                  useStore.setState({ [name]: value })
                }
              />
            </Label>
          ))}
        </section>

        <section>
          <Button
            variant="default"
            className="inline-flex w-full space-x-2"
            onClick={startRecording}
          >
            <span className="inline-block">Start</span>
          </Button>
        </section>
      </div>
    </main>
  )
}

export default App
