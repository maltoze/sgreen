import { VideoIcon } from '@radix-ui/react-icons'
import clsx from 'clsx'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from '~/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Switch } from '~/components/ui/switch'
import { useStore } from '~/entries/store'

type BackgroundPopoverProps = {
  container?: ShadowRoot
}

const backgrounds = [
  {
    type: 'color',
    from: '#16a34a',
    to: '#059669',
  },
  {
    type: 'color',
    from: '#7c3aed',
    to: '#6d28d9',
  },
  {
    type: 'color',
    from: '#f472b6',
    to: '#ec4899',
  },
]

export default function BackgroundPopover({
  container,
}: BackgroundPopoverProps) {
  const { enableBackground, selectedBackground } = useStore((state) => ({
    enableBackground: state.enableBackground,
    selectedBackground: state.selectedBackground,
  }))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          Background
        </Button>
      </PopoverTrigger>
      <PopoverPortal
        // @ts-ignore
        container={container}
      >
        <PopoverContent
          sideOffset={10}
          side="top"
          className="z-[2147483647] space-y-4 bg-background/50 backdrop-blur"
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="enable-background">Enable</Label>
              <Switch
                id="enable-background"
                checked={enableBackground}
                onCheckedChange={(value) => {
                  useStore.setState({ enableBackground: value })
                }}
              />
            </div>
            {enableBackground && (
              <div className="flex space-x-4">
                <RadioGroup
                  className="grid grid-cols-3 gap-2"
                  defaultValue="tab"
                  onValueChange={(value) =>
                    useStore.setState({ selectedBackground: parseInt(value) })
                  }
                >
                  {backgrounds.map((bg, idx) => (
                    <Label
                      htmlFor={`bg-${idx}`}
                      className="border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                      key={`bg-${idx}`}
                    >
                      <RadioGroupItem
                        className="sr-only"
                        id={`bg-${idx}`}
                        value={idx.toString()}
                      />
                      <div
                        className={clsx('h-8 w-8 shadow')}
                        style={{
                          backgroundImage: `linear-gradient(to right, ${bg.from}, ${bg.to})`,
                        }}
                      ></div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex justify-center">
              <div
                className={clsx(
                  'relative flex items-center justify-center rounded-md shadow',
                  {
                    'px-6 py-[15px]': enableBackground,
                  }
                )}
                style={{
                  backgroundImage: `linear-gradient(to bottom right, ${backgrounds[selectedBackground].from}, ${backgrounds[selectedBackground].to})`,
                }}
              >
                <VideoIcon className="absolute h-5 w-5" />
                <div className="flex flex-col space-y-0.5 rounded bg-blue-200 px-2 py-1.5 shadow">
                  <div className="h-1 w-10 rounded bg-background/50"></div>
                  <div className="h-1 w-5 rounded bg-background/50"></div>
                  <div className="h-1 w-12 rounded bg-background/50"></div>
                  <div className="h-1 w-8 rounded bg-background/50"></div>
                  <div className="h-1 w-16 rounded bg-background/50"></div>
                  <div className="h-1 w-10 rounded bg-background/50"></div>
                  <div className="h-1 w-8 rounded bg-background/50"></div>
                  <div className="h-1 w-14 rounded bg-background/50"></div>
                  <div className="h-1 w-10 rounded bg-background/50"></div>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  )
}
