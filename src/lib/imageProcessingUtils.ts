export default interface ImageFillData {
  imageFill: ImagePaint;
  index: number;
  node: SceneNode;
}

export default interface JobResult {
  imageBytes: Uint8Array;
  fillData: ImageFillData;
}

/**
 * Filters nodes that have Image fills.
 * @param  {readonlySceneNode[]} nodes
 * @returns SceneNode
 */
export function filterNodesWithFills(nodes: readonly SceneNode[]): SceneNode[] {
  const nodeWithFills = nodes.filter((node) => {
    if ("fills" in node) {
      for (const fill of node.fills as Array<any>) {
        if (fill.type == "IMAGE") return true;
      }
      return false;
    } else {
      return false;
    }
  });
  return nodeWithFills.length == 0 ? [] : nodeWithFills;
}

/**
 * Checks if a object is iteratable
 * @param obj
 */
function _isIterable(obj: any) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === "function";
}
/**
 * Converts ImageBytes to ImageHash and adds to ImagePaint
 * @param  {Uint8Array} bytes  Imagebytes to convert
 * @param  {ImagePaint} paint ImagePaint to add the converted ImageHash
 * @returns ImagePaint Returns a new ImagePaint with the converted ImageHash added to it
 */
export function BytesToImagePaintHashImage(
  bytes: Uint8Array,
  paint: ImagePaint
): ImagePaint {
  // Create a new paint for the new image.
  const newPaint = JSON.parse(JSON.stringify(paint));
  newPaint.imageHash = figma.createImage(bytes).hash;
  return newPaint;
}

/**
 * Applies the processed dither effect to appropriate nodes
 * @param  {JobResult[]} results
 * @param  {ImageFillData[]} nodeFills
 * @param  {keep} keepImageFills Keeps the original image fill instead of replacing it..
 * @param  {any} resolve
 */
export function applyProcessResults(
  results: JobResult[],
  nodeFills: ImageFillData[],
  keepImageFills: boolean = false,
  resolve: any
) {
  results.forEach((result, index) => {
    let processDitherEffect = BytesToImagePaintHashImage(
      result.imageBytes,
      result.fillData.imageFill
    );
    // clone the node fills
    const copyNodeFills = [
      ...((nodeFills[index].node as GeometryMixin).fills as Array<ImagePaint>),
    ];

    if (!keepImageFills) {
      // replace the image filter
      copyNodeFills.splice(result.fillData.index, 1, processDitherEffect);
    } else {
      // the new image filter to the top..
      copyNodeFills.push(processDitherEffect);
    }

    (nodeFills[index].node as GeometryMixin).fills = copyNodeFills;
  });

  // resolve thre promise after applying dithering effect.
  resolve();
}

/**
 * Gets all Image fills from a node.
 * @param  {SceneNode} node Node to extract the image fills
 * @returns ImageFillData[] An array of image fills of the node as ImageFillData
 */
export function getImageFillsFromNode(node: SceneNode): ImageFillData[] {
  const resultingImageFills: ImageFillData[] = [];
  let fills = (node as GeometryMixin).fills;
  if (_isIterable(fills)) {
    fills = fills as Array<Paint>;
    fills.forEach((fill, index) => {
      if (fill.type == "IMAGE")
        resultingImageFills.push({ imageFill: fill, index, node });
    });
  }
  return resultingImageFills;
}

/**
 * Gets the ImageBytes from a ImagePaint fill
 * @param  {ImagePaint} fill
 * @returns Promise<Uint8Array>
 */
export async function getImageBytes(fill: ImagePaint): Promise<Uint8Array> {
  const image = figma.getImageByHash(fill.imageHash!);
  if (image !== null) {
    const bytes = await image.getBytesAsync();
    return bytes;
  }
  throw new Error("Image not found");
}

// Encoding an image is also done by sticking pixels in an
// HTML canvas and by asking the canvas to serialize it into
// an actual PNG file via canvas.toBlob().
export async function encode(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  imageData: ImageData
): Promise<Uint8Array> {
  ctx.putImageData(imageData, 0, 0);
  return await new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = () => reject(new Error("Could not read from blob"));
      reader.readAsArrayBuffer(blob as Blob);
    });
  });
}

// Decoding an image can be done by sticking it in an HTML
// canvas, as we can read individual pixels off the canvas.
export async function decode(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  bytes: Uint8Array
): Promise<{
  imageData: ImageData;
  width: number;
  height: number;
}> {
  const url = URL.createObjectURL(new Blob([bytes]));
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject();
    img.src = url;
  });
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  return {
    imageData: imageData,
    width: image.width,
    height: image.height,
  };
}
