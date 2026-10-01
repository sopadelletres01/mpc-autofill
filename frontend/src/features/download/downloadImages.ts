import { getWorkerImageURL } from "@/common/image";
import { CardDocument } from "@/common/types";
import { useClientSearchContext } from "@/features/clientSearch/clientSearchContext";
import { getCardImageFileName } from "@/features/download/cardImageFiles";
import { downloadFile, useDoFileDownload } from "@/features/download/download";

export function useDoImageDownload(): (
  cardDocument: CardDocument
) => Promise<void> {
  const doFileDownload = useDoFileDownload();
  const { clientSearchService } = useClientSearchContext();

  async function doImageDownload(cardDocument: CardDocument): Promise<boolean> {
    try {
      const imageURL = getWorkerImageURL(cardDocument, "full", 1500);
      if (!imageURL) {
        return Promise.reject(
          `Failed to formulate download URL for ${cardDocument.name} (${cardDocument.identifier})`
        );
      }
      try {
        await downloadFile(
          undefined,
          new URL(imageURL),
          getCardImageFileName(cardDocument),
          clientSearchService
        );
      } catch (err) {
        return Promise.reject(
          `Failed to download ${cardDocument.name} (${cardDocument.identifier})`
        );
      }
      return true;
    } catch (e) {
      return Promise.reject(
        `Failed to download ${cardDocument.name} (${cardDocument.identifier})`
      );
    }
  }

  return (cardDocument) =>
    doFileDownload("image", cardDocument.name, () =>
      doImageDownload(cardDocument)
    );
}
