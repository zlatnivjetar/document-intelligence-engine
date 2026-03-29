export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const;

export const ACCEPT_ATTRIBUTE = 'application/pdf,image/png,image/jpeg';

export function isSupportedDocument(file: File): boolean {
  return ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number]);
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Unable to read the selected file.'));
    };

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== 'string') {
        reject(new Error('Unable to convert the selected file.'));
        return;
      }

      const [, base64Payload = ''] = result.split(',', 2);
      resolve(base64Payload);
    };

    reader.readAsDataURL(file);
  });
}
