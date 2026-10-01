import React from "react";
import Dropdown from "react-bootstrap/Dropdown";

import { useAppSelector } from "@/common/types";
import { RightPaddedIcon } from "@/components/icon";
import { getDownloadableCardDocuments } from "@/features/download/cardImageFiles";
import { useDownloadCardImagesZip } from "@/features/download/downloadImagesZip";
import { useCardDocumentsByIdentifier } from "@/store/slices/cardDocumentsSlice";
import { selectAnyImagesDownloadable } from "@/store/slices/projectSlice";

export function ExportImages() {
  const anyImagesDownloadable = useAppSelector(selectAnyImagesDownloadable);
  const downloadImagesZip = useDownloadCardImagesZip();
  const cardDocumentsByIdentifier = useCardDocumentsByIdentifier();
  const downloadImages = () => {
    downloadImagesZip(
      getDownloadableCardDocuments(Object.values(cardDocumentsByIdentifier))
    );
  };

  return (
    <Dropdown.Item
      disabled={!anyImagesDownloadable}
      onClick={downloadImages}
      data-testid="export-images-button"
    >
      <RightPaddedIcon bootstrapIconName="file-zip" /> Card Images (ZIP)
    </Dropdown.Item>
  );
}
