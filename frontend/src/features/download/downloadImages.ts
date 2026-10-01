import { getWorkerImageURL } from "@/common/image";
import { SourceType } from "@/common/schema_types";
import { CardDocument } from "@/common/types";
import { useClientSearchContext } from "@/features/clientSearch/clientSearchContext";
import { downloadFile, useDoFileDownload } from "@/features/download/download";

export function isCardImageDownloadable(
  cardDocument: CardDocument | undefined
): cardDocument is CardDocument {
  return cardDocument?.sourceType === SourceType.GoogleDrive;
}

export function getCardImageFileName(cardDocument: CardDocument): string {
  const safeName = cardDocument.name.replace(/[\\/:*?"<>|]+/g, "-");
  return `${safeName} (${cardDocument.identifier}).${cardDocument.extension}`;
}

export function getDownloadableCardDocuments(
  cardDocuments: Array<CardDocument | undefined>
): CardDocument[] {
  return cardDocuments.filter(isCardImageDownloadable);
}

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
