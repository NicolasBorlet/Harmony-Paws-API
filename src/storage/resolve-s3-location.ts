export type S3Location = { bucket: string; key: string };

export function resolveS3Location(
  logicalBucket: string,
  key: string,
  physicalBucketName?: string,
): S3Location {
  if (!physicalBucketName) {
    return { bucket: logicalBucket, key };
  }

  return { bucket: physicalBucketName, key: `${logicalBucket}/${key}` };
}
