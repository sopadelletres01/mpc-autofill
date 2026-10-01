import { SourceType } from "@/common/schema_types";
import { cardDocument1, cardDocument2 } from "@/common/test-constants";
import {
  getCardImageFileName,
  getDownloadableCardDocuments,
} from "@/features/download/cardImageFiles";

describe("getCardImageFileName", () => {
  it("includes the card name, identifier, and extension", () => {
    expect(getCardImageFileName(cardDocument1)).toBe(
      `Card 1 (${cardDocument1.identifier}).png`
    );
  });

  it("replaces path-unsafe characters so zip entries stay flat files", () => {
    expect(
      getCardImageFileName({ ...cardDocument1, name: "Fire // Ice" })
    ).toBe(`Fire - Ice (${cardDocument1.identifier}).png`);
  });
});

describe("getDownloadableCardDocuments", () => {
  it("keeps Google Drive cards and drops other sources", () => {
    const localCard = {
      ...cardDocument2,
      sourceType: SourceType.LocalFile,
    };
    expect(
      getDownloadableCardDocuments([cardDocument1, localCard, undefined])
    ).toEqual([cardDocument1]);
  });
});
