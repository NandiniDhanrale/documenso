import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { TFieldImageAnnotation } from '@documenso/lib/types/field';
import type { TSignEnvelopeFieldValue } from '@documenso/trpc/server/envelope-router/sign-envelope-field.types';
import { FieldType } from '@prisma/client';

import { SignFieldImageAnnotationDialog } from '~/components/dialogs/sign-field-image-annotation-dialog';

type HandleImageAnnotationFieldClickOptions = {
  field: TFieldImageAnnotation;
};

export const handleImageAnnotationFieldClick = async (
  options: HandleImageAnnotationFieldClickOptions,
): Promise<Extract<TSignEnvelopeFieldValue, { type: typeof FieldType.IMAGE_ANNOTATION }> | null> => {
  const { field } = options;

  if (field.type !== FieldType.IMAGE_ANNOTATION) {
    throw new AppError(AppErrorCode.INVALID_REQUEST, {
      message: 'Invalid field type',
    });
  }

  if (field.inserted) {
    return {
      type: FieldType.IMAGE_ANNOTATION,
      value: null,
    };
  }

  const annotatedImage = await SignFieldImageAnnotationDialog.call({
    fieldMeta: field.fieldMeta,
  });

  if (!annotatedImage) {
    return null;
  }

  return {
    type: FieldType.IMAGE_ANNOTATION,
    value: annotatedImage,
  };
};
