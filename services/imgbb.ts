
const IMGBB_API_KEY = "041ef46fbbddcd8d6ce23a4797538ae4";

export const uploadToImgbb = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (result.success) {
      return result.data.url;
    } else {
      throw new Error(result.error.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Error uploading to Imgbb:', error);
    throw error;
  }
};
