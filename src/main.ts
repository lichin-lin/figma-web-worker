import { loadFontsAsync, on, showUI } from "@create-figma-plugin/utilities";
import {
  SubmitNumberHandler,
  GetPreviewHandler,
  PaintImageHandler,
} from "./types";
import ImageFillData, {
  getImageBytes,
  filterNodesWithFills,
  getImageFillsFromNode,
  BytesToImagePaintHashImage,
} from "./lib/imageProcessingUtils";

let firstImagefillsDataOnPreview: ImageFillData;
let selectedImageNode: SceneNode;

export default function () {
  on<SubmitNumberHandler>("SUBMIT_NUM", async function (number: string) {
    const text = figma.createText();
    await loadFontsAsync([text]);
    text.characters = `${number}`;
    figma.currentPage.selection = [text];
    figma.viewport.scrollAndZoomIntoView([text]);
  });

  on<GetPreviewHandler>("GET_PREVIEW", async function () {
    // find the first image fill from the selected node
    const result = filterNodesWithFills(figma.currentPage.selection);
    if (result.length !== 1) {
      figma.notify("Figma: Please select single element with one image fill.", {
        timeout: 2000,
      });
      return;
    }
    selectedImageNode = figma.currentPage.selection[0];
    firstImagefillsDataOnPreview = getImageFillsFromNode(selectedImageNode)[0];

    // send the data to UI
    getImageBytes(firstImagefillsDataOnPreview.imageFill).then((bytes) => {
      figma.ui.postMessage({
        imageBytes: bytes,
        type: "get-node-image-bytes",
      });
    });
  });

  on<PaintImageHandler>("PAINT_IMAGE", async function (msg) {
    // clone the node
    const cloneImageNode = selectedImageNode.clone();

    let processDitherEffect = BytesToImagePaintHashImage(
      msg.imageBytes,
      firstImagefillsDataOnPreview.imageFill
    );

    cloneImageNode.name = "🖼️ Cloned Image";
    cloneImageNode.fills = [processDitherEffect];
    cloneImageNode.x = cloneImageNode.x + cloneImageNode.width + 40;
    figma.currentPage.selection = [cloneImageNode];
    return;
  });

  showUI({ height: 365, width: 210 });
}
