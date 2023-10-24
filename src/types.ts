import { EventHandler } from '@create-figma-plugin/utilities'

export interface SubmitNumberHandler extends EventHandler {
  name: 'SUBMIT_NUM'
  handler: (input: string) => void
}
