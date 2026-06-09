import Konva from 'konva';

import { DEFAULT_STANDARD_FONT_SIZE } from '../../constants/pdf';
import type { TImageAnnotationFieldMeta } from '../../types/field-meta';
import {
  createFieldHoverInteraction,
  konvaTextFill,
  konvaTextFontFamily,
  upsertFieldGroup,
  upsertFieldRect,
} from './field-generic-items';
import type { FieldToRender, RenderFieldElementOptions } from './field-renderer';
import { calculateFieldPosition } from './field-renderer';

export const renderImageAnnotationFieldElement = (field: FieldToRender, options: RenderFieldElementOptions) => {
  const { pageWidth, pageHeight, pageLayer, mode, color, translations } = options;

  const { fieldWidth, fieldHeight } = calculateFieldPosition(field, pageWidth, pageHeight);

  const fieldMeta: TImageAnnotationFieldMeta | null = (field.fieldMeta as TImageAnnotationFieldMeta) || null;

  const isFirstRender = !pageLayer.findOne(`#${field.renderId}`);

  const fieldGroup = upsertFieldGroup(field, options);
  fieldGroup.removeChildren();
  fieldGroup.off('transform');

  if (isFirstRender) {
    pageLayer.add(fieldGroup);
  }

  const fieldRect = upsertFieldRect(field, options);
  fieldGroup.add(fieldRect);

  const fontSize = fieldMeta?.fontSize || DEFAULT_STANDARD_FONT_SIZE;

  if (field.inserted && field.customText) {
    const image = new Konva.Image({
      name: 'annotation-image',
      width: fieldWidth - 4,
      height: fieldHeight - 4,
      x: 2,
      y: 2,
    });

    const imgElement = new window.Image();
    imgElement.src = field.customText;
    imgElement.onload = () => {
      image.image(imgElement);
      image.getLayer()?.batchDraw();
    };

    fieldGroup.add(image);

    const checkMark = new Konva.Text({
      x: fieldWidth - 20,
      y: fieldHeight - 20,
      text: '\u2713',
      fontSize: 16,
      fill: '#22c55e',
      visible: mode !== 'export',
    });

    fieldGroup.add(checkMark);
  } else if (mode === 'sign' && !field.inserted) {
    const placeholderText = new Konva.Text({
      x: 0,
      y: 0,
      width: fieldWidth,
      height: fieldHeight,
      text: translations?.[field.type] || 'Mark on Picture',
      fontSize: Math.min(fontSize, 14),
      fontFamily: konvaTextFontFamily,
      fill: konvaTextFill,
      align: 'center',
      verticalAlign: 'middle',
      listening: false,
    });

    fieldGroup.add(placeholderText);
  }

  if (mode !== 'export') {
    createFieldHoverInteraction({
      options,
      fieldGroup,
      fieldRect,
    });
  }

  return { fieldGroup };
};
