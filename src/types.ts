import { EventHandler } from "@create-figma-plugin/utilities";

export interface SubmitNumberHandler extends EventHandler {
  name: "SUBMIT_NUM";
  handler: (input: string) => void;
}

export interface GetPreviewHandler extends EventHandler {
  name: "GET_PREVIEW";
  handler: () => void;
}

export interface PaintImageHandler extends EventHandler {
  name: "PAINT_IMAGE";
  handler: (imageData: any) => void;
}
