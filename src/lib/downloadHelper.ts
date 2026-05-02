import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

/**
 * Downloads a file from a Uint8Array.
 * Handles both web and mobile (Capacitor) environments.
 */
export async function savePdf(bytes: Uint8Array, fileName: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      // Save to temporary file first
      const base64Data = uint8ArrayToBase64(bytes);
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Share the file so the user can save it to their device or send it
      await Share.share({
        title: 'PrintSmart PDF',
        text: 'Your processed PDF is ready.',
        url: savedFile.uri,
        dialogTitle: 'Save or Share PDF',
      });
    } catch (error) {
      console.error('Error saving file in Capacitor:', error);
      // Fallback to basic web method just in case
      webDownload(bytes, fileName);
    }
  } else {
    webDownload(bytes, fileName);
  }
}

function webDownload(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
