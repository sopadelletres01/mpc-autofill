import { expect } from "@playwright/test";
import JSZip from "jszip";

import {
  cardDocument1,
  cardDocument2,
  cardDocument5,
} from "@/common/test-constants";
import { getCardImageFileName } from "@/features/download/downloadImages";
import { CARD_IMAGES_ZIP_FILENAME } from "@/features/download/downloadImagesZip";
import {
  cardbacksOneOtherResult,
  cardDocumentsSixResults,
  defaultHandlers,
  googleDriveImages,
  searchResultsSixResults,
  sourceDocumentsThreeResults,
} from "@/mocks/handlers";

import { test } from "../playwright.setup";
import {
  downloadImagesZip,
  expectCardbackSlotState,
  expectCardGridSlotState,
  importText,
  loadPageWithDefaultBackend,
} from "./test-utils";

test.describe("ExportImages", () => {
  test("downloads project images as a single zip", async ({
    page,
    network,
  }) => {
    network.use(
      cardDocumentsSixResults,
      cardbacksOneOtherResult,
      sourceDocumentsThreeResults,
      searchResultsSixResults,
      googleDriveImages,
      ...defaultHandlers
    );
    await loadPageWithDefaultBackend(page);

    await importText(page, "query 1\nquery 2");
    await expectCardGridSlotState(page, 1, "front", cardDocument1.name, 1, 1);
    await expectCardGridSlotState(page, 2, "front", cardDocument2.name, 1, 1);
    await expectCardbackSlotState(page, cardDocument5.name, 1, 1);

    const [content, filename] = await downloadImagesZip(page);

    expect(filename).toBe(CARD_IMAGES_ZIP_FILENAME);
    const zip = await JSZip.loadAsync(content);
    expect(Object.keys(zip.files).sort()).toEqual(
      [
        getCardImageFileName(cardDocument1),
        getCardImageFileName(cardDocument2),
        getCardImageFileName(cardDocument5),
      ].sort()
    );
  });
});
