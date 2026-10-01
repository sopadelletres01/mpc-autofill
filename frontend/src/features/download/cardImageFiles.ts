import { SourceType } from "@/common/schema_types";
import { CardDocument } from "@/common/types";

export const CARD_IMAGES_ZIP_FILENAME = "card-images.zip";

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
