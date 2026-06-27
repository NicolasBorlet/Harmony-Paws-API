import { resolveS3Location } from './resolve-s3-location';

describe('resolveS3Location', () => {
  it('uses logical bucket and key in legacy multi-bucket mode', () => {
    expect(resolveS3Location('dogs', 'x.jpeg')).toEqual({
      bucket: 'dogs',
      key: 'x.jpeg',
    });
  });

  it('prefixes logical bucket in single-bucket mode', () => {
    expect(
      resolveS3Location('dogs', 'x.jpeg', 'harmony-paws-staging-media'),
    ).toEqual({
      bucket: 'harmony-paws-staging-media',
      key: 'dogs/x.jpeg',
    });
  });

  it('prefixes documents keys with nested paths', () => {
    const dogId = '948f66e0-935f-4daa-9b3a-5f9d005cae65';

    expect(
      resolveS3Location(
        'documents',
        `${dogId}/ordonnance.pdf`,
        'harmony-paws-staging-media',
      ),
    ).toEqual({
      bucket: 'harmony-paws-staging-media',
      key: `documents/${dogId}/ordonnance.pdf`,
    });
  });
});
