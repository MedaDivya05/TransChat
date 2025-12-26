import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export const uploadMedia = async (
  file: File,
  userId: string,
  chatId: string
): Promise<string> => {
  const timestamp = Date.now();
  const fileName = `${userId}/${chatId}/${timestamp}_${file.name}`;
  const storageRef = ref(storage, fileName);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
};

export const validateMediaFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024;
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  const isImage = allowedImageTypes.includes(file.type);
  const isVideo = allowedVideoTypes.includes(file.type);

  if (!isImage && !isVideo) {
    return { valid: false, error: 'File must be an image or video' };
  }

  return { valid: true };
};
