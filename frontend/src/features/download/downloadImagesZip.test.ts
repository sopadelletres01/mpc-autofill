import JSZip from "jszip";

import { cardDocument1, cardDocument2 } from "@/common/test-constants";
import { getCardImageFileName } from "@/features/download/cardImageFiles";
import { createCardImagesZip } from "@/features/download/downloadImagesZip";

const blobFromBytes = (bytes: number[]) => new Blob([new Uint8Array(bytes)]);

describe("createCardImagesZip", () => {
  it("rejects when there are no cards", async () => {
    await expect(createCardImagesZip([])).rejects.toThrow(
      "No downloadable card images"
    );
  });

  it("packs fetched images into a single zip", async () => {
    const fetchImage = jest.fn(async (cardDocument) => {
      if (cardDocument.identifier === cardDocument1.identifier) {
        return blobFromBytes([1, 2, 3]);
      }
      return blobFromBytes([4, 5, 6]);
    });

    const { blob, downloaded, failed } = await createCardImagesZip(
      [cardDocument1, cardDocument2],
      fetchImage
    );

    expect(downloaded).toBe(2);
    expect(failed).toEqual([]);
    expect(fetchImage).toHaveBeenCalledTimes(2);

    const zip = await JSZip.loadAsync(blob);
    expect(Object.keys(zip.files).sort()).toEqual(
      [
        getCardImageFileName(cardDocument1),
        getCardImageFileName(cardDocument2),
      ].sort()
    );
    expect(
      Array.from(
        await zip.file(getCardImageFileName(cardDocument1))!.async("uint8array")
      )
    ).toEqual([1, 2, 3]);
  });

  it("omits failed images and still returns a zip", async () => {
    const fetchImage = jest.fn(async (cardDocument) => {
      if (cardDocument.identifier === cardDocument2.identifier) {
        throw new Error("network");
      }
      return blobFromBytes([1]);
    });

    const { downloaded, failed, blob } = await createCardImagesZip(
      [cardDocument1, cardDocument2],
      fetchImage
    );

    expect(downloaded).toBe(1);
    expect(failed).toEqual([
      `${cardDocument2.name} (${cardDocument2.identifier})`,
    ]);
    const zip = await JSZip.loadAsync(blob);
    expect(Object.keys(zip.files)).toEqual([
      getCardImageFileName(cardDocument1),
    ]);
  });

  it("rejects when every image fails", async () => {
    await expect(
      createCardImagesZip([cardDocument1], async () => {
        throw new Error("network");
      })
    ).rejects.toThrow("Failed to download any card images");
  });
});
