/**
 * Download card images as a single ZIP so the browser only prompts once.
 */

import { Queue } from "async-await-queue";
import JSZip from "jszip";

import { getWorkerImageURL } from "@/common/image";
import { CardDocument, useAppDispatch } from "@/common/types";
import { useClientSearchContext } from "@/features/clientSearch/clientSearchContext";
import { useLocalFilesDirectoryHandle } from "@/features/clientSearch/clientSearchHooks";
import {
  CARD_IMAGES_ZIP_FILENAME,
  getCardImageFileName,
} from "@/features/download/cardImageFiles";
import { downloadFile, useDoFileDownload } from "@/features/download/download";
import { setNotification } from "@/store/slices/toastsSlice";

const IMAGE_FETCH_CONCURRENCY = 6;

export interface CardImagesZipResult {
  blob: Blob;
  downloaded: number;
  failed: string[];
}

async function fetchCardImageBlob(cardDocument: CardDocument): Promise<Blob> {
  const imageURL = getWorkerImageURL(cardDocument, "full", 1500);
  if (!imageURL) {
    throw new Error(
      `Failed to formulate download URL for ${cardDocument.name} (${cardDocument.identifier})`
    );
  }
  const response = await fetch(imageURL);
  if (!response.ok) {
    throw new Error(
      `Failed to download ${cardDocument.name} (${cardDocument.identifier})`
    );
  }
  return response.blob();
}

export async function createCardImagesZip(
  cardDocuments: CardDocument[],
  fetchImage: (cardDocument: CardDocument) => Promise<Blob> = fetchCardImageBlob
): Promise<CardImagesZipResult> {
  if (cardDocuments.length === 0) {
    throw new Error("No downloadable card images");
  }

  const queue = new Queue(IMAGE_FETCH_CONCURRENCY);
  const failed: string[] = [];
  const files: Array<{ name: string; contents: Blob }> = [];

  await Promise.all(
    cardDocuments.map(async (cardDocument) => {
      const token = Symbol();
      await queue.wait(token, -1);
      try {
        const contents = await fetchImage(cardDocument);
        files.push({
          name: getCardImageFileName(cardDocument),
          contents,
        });
      } catch {
        failed.push(`${cardDocument.name} (${cardDocument.identifier})`);
      } finally {
        queue.end(token);
      }
    })
  );

  if (files.length === 0) {
    throw new Error("Failed to download any card images");
  }

  const zip = new JSZip();
  for (const { name, contents } of files) {
    zip.file(name, contents);
  }

  return {
    blob: await zip.generateAsync({ type: "blob", compression: "STORE" }),
    downloaded: files.length,
    failed,
  };
}

function zipCompleteMessage(
  downloaded: number,
  failed: string[],
  directoryHandleName?: string
): string {
  const destination = directoryHandleName ?? "Downloads folder";
  if (failed.length === 0) {
    return `Successfully downloaded ${downloaded} image${
      downloaded !== 1 ? "s" : ""
    } as a ZIP to ${destination}!`;
  }
  return `Downloaded ${downloaded} image${
    downloaded !== 1 ? "s" : ""
  } as a ZIP to ${destination}. Failed: ${failed.join(", ")}`;
}

export function useDownloadCardImagesZip(): (
  cardDocuments: CardDocument[]
) => Promise<void> {
  const dispatch = useAppDispatch();
  const doFileDownload = useDoFileDownload();
  const { clientSearchService } = useClientSearchContext();
  const directoryHandle = useLocalFilesDirectoryHandle();

  return (cardDocuments) => {
    const notificationId = Math.random().toString();
    dispatch(
      setNotification([
        notificationId,
        {
          name: "Download Started",
          message: `Downloading ${cardDocuments.length} image${
            cardDocuments.length !== 1 ? "s" : ""
          } into a ZIP...`,
          level: "info",
        },
      ])
    );
    return doFileDownload("zip", CARD_IMAGES_ZIP_FILENAME, async () => {
      const { blob, downloaded, failed } = await createCardImagesZip(
        cardDocuments
      );
      await downloadFile(
        blob,
        undefined,
        CARD_IMAGES_ZIP_FILENAME,
        clientSearchService
      );
      dispatch(
        setNotification([
          notificationId,
          {
            name:
              failed.length === 0 ? "Download Complete" : "Download Incomplete",
            message: zipCompleteMessage(
              downloaded,
              failed,
              directoryHandle?.name
            ),
            level: failed.length === 0 ? "info" : "warning",
          },
        ])
      );
      return true;
    });
  };
}
