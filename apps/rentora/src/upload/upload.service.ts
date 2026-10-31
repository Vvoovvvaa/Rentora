
import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  v2 as cloudinary,
  UploadApiResponse,
} from 'cloudinary';

import { Readable } from 'stream';

import { CloudinaryDestroyResult } from '@app/common-rentora/interfaces';

import {
  trace,
  SpanStatusCode,
} from '@opentelemetry/api';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  private readonly tracer = trace.getTracer('rentora-cloudinary');

  private readonly maxParallelUploads = 3;

  /**
   * Upload one image to Cloudinary.
   *
   * Creates an OpenTelemetry span for this operation.
   */
  async uploadImage(
    file: Express.Multer.File,
    index?: number,
  ): Promise<UploadApiResponse> {
    if (!file?.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Файл не передан или пустой');
    }

    return this.tracer.startActiveSpan(
      'cloudinary.uploadImage',
      {
        attributes: {
          'file.size': file.size,
          'file.mime_type': file.mimetype,
          'cloudinary.folder': 'rentora',
          ...(index !== undefined
            ? { 'upload.index': index + 1 }
            : {}),
        },
      },
      async (span) => {
        try {
          const result = await new Promise<UploadApiResponse>(
            (resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: 'rentora',
                  resource_type: 'image',
                },
                (error, result) => {
                  if (error) {
                    reject(
                      new Error(
                        error.message ?? 'Cloudinary upload failed',
                      ),
                    );
                    return;
                  }

                  if (!result) {
                    reject(
                      new Error('Cloudinary returned an empty response'),
                    );
                    return;
                  }

                  resolve(result);
                },
              );

              const source = Readable.from([file.buffer]);

              source.once('error', (error) => {
                uploadStream.destroy(error);
                reject(error);
              });

              uploadStream.once('error', reject);

              source.pipe(uploadStream);
            },
          );

          span.setAttribute(
            'cloudinary.upload.success',
            true,
          );

          return result;
        } catch (error: unknown) {
          const exception =
            error instanceof Error
              ? error
              : new Error(String(error));

          span.recordException(exception);

          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: exception.message,
          });

          throw exception;
        } finally {
          span.end();
        }
      },
    );
  }

  /**
   * Upload multiple images with limited concurrency.
   *
   * If one upload fails, already uploaded images are deleted.
   */
  async uploadImages(
    files: Express.Multer.File[],
  ): Promise<UploadApiResponse[]> {
    if (!files.length) {
      return [];
    }

    const uploaded: Array<UploadApiResponse | undefined> =
      new Array(files.length);

    let nextIndex = 0;
    let hasFailed = false;
    let firstError: unknown;

    const worker = async (): Promise<void> => {
      while (!hasFailed) {
        const currentIndex = nextIndex;
        nextIndex++;

        if (currentIndex >= files.length) {
          return;
        }

        try {
          uploaded[currentIndex] = await this.uploadImage(
            files[currentIndex],
            currentIndex,
          );
        } catch (error: unknown) {
          if (!hasFailed) {
            hasFailed = true;
            firstError = error;
          }
        }
      }
    };

    const workersCount = Math.min(
      this.maxParallelUploads,
      files.length,
    );

    await Promise.all(
      Array.from(
        { length: workersCount },
        () => worker(),
      ),
    );

    if (hasFailed) {
      const uploadedPublicIds = uploaded
        .filter(
          (item): item is UploadApiResponse => item !== undefined,
        )
        .map((item) => item.public_id);

      this.logger.warn(
        `Image upload failed. Cleaning up ${uploadedPublicIds.length} uploaded images.`,
      );

      await this.deleteImages(uploadedPublicIds);

      throw firstError instanceof Error
        ? firstError
        : new Error(String(firstError));
    }

    return uploaded as UploadApiResponse[];
  }

  /**
   * Delete one image from Cloudinary.
   */
  async deleteImage(
    publicId: string,
  ): Promise<CloudinaryDestroyResult> {
    return cloudinary.uploader.destroy(publicId);
  }

  /**
   * Delete multiple images.
   *
   * Uses Promise.allSettled so one failed deletion
   * does not prevent cleanup of the remaining images.
   */
  async deleteImages(publicIds: string[]): Promise<void> {
    if (!publicIds.length) {
      return;
    }

    const results = await Promise.allSettled(
      publicIds.map((publicId) => this.deleteImage(publicId)),
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const message =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);

        this.logger.error(
          `Failed to delete Cloudinary image ${publicIds[index]}: ${message}`,
        );
      }
    });
  }
}
