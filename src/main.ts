import { loadFontsAsync, on, showUI } from '@create-figma-plugin/utilities'
import { SubmitNumberHandler } from './types'

export default function () {
  on<SubmitNumberHandler>('SUBMIT_NUM', async function (number: string) {
    const text = figma.createText()
    await loadFontsAsync([text])
    text.characters = `${number}`
    figma.currentPage.selection = [text]
    figma.viewport.scrollAndZoomIntoView([text])
  })
  showUI({ height: 120, width: 200 })
}
