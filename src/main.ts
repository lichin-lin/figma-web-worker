import { loadFontsAsync, on, showUI } from "@create-figma-plugin/utilities";
import {
  SubmitNumberHandler,
  GetPreviewHandler,
  PaintImageHandler,
} from "./types";
import ImageFillData, {
  applyProcessResults,
  filterNodesWithFills,
  getImageBytes,
  getImageFillsFromNode,
} from "./lib/imageProcessingUtils";

let firstImagefillsDataOnPreview: ImageFillData;
let previewNodes: SceneNode[] = [];

/**
 * Adds a new PreviewNode to the existing ones.
 * @param  {} callback? Called after a successsfull addition
 */

function addNewPreviewNode(callback?: any) {
  const result = filterNodesWithFills(figma.currentPage.selection);
  if (result.length !== 1) {
    figma.notify("Figma: Please select single element with one image fill.", {
      timeout: 1000,
    });
    return;
  }
  previewNodes.push(figma.currentPage.selection[0].clone());
  if (callback) callback();
}

/**
 * Sets up the preview node and sends it image bytes to the ui
 * @param  {SceneNode} previewNode
 * @param  {ImageFillData} firstImagefillsDataOnPreview
 */
function setupPreview(previewNode: SceneNode) {
  // send preview image bytes to the ui
  firstImagefillsDataOnPreview = getImageFillsFromNode(previewNode)[0];
  getImageBytes(firstImagefillsDataOnPreview.imageFill).then((bytes) => {
    figma.ui.postMessage({
      imageBytes: bytes,
      type: "get-node-image-bytes",
    });
  });
}

/**
 * Gets the last created PreviewNode
 * @returns SceneNode
 */
function getPreview(): SceneNode {
  return previewNodes[previewNodes.length - 1];
}

export default function () {
  on<SubmitNumberHandler>("SUBMIT_NUM", async function (number: string) {
    const text = figma.createText();
    await loadFontsAsync([text]);
    text.characters = `${number}`;
    figma.currentPage.selection = [text];
    figma.viewport.scrollAndZoomIntoView([text]);
  });

  on<GetPreviewHandler>("GET_PREVIEW", async function () {
    addNewPreviewNode();
    const preview = getPreview();
    setupPreview(preview);
  });

  on<PaintImageHandler>("PAINT_IMAGE", async function (msg) {
    const result = {
      fillData: firstImagefillsDataOnPreview,
      imageBytes: msg.imageBytes,
    };

    try {
      applyProcessResults(
        [result],
        [firstImagefillsDataOnPreview],
        false,
        () => {
          console.log("preview result applied!");
        }
      );
    } catch (e) {}

    return;
  });

  showUI({ height: 340, width: 210 });
}
