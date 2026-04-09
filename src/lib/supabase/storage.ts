import { createClient } from "@/lib/supabase/client";

const STORAGE_BUCKET = "poi-images";

/**
 * Upload an image to Supabase Storage
 * @param file - The image file to upload
 * @param poiId - The POI ID (used as folder)
 * @returns The public URL of the uploaded image
 */
export async function uploadPoiImage(
  file: File,
  poiId: string
): Promise<string> {
  const supabase = createClient();
  const timestamp = Date.now();
  const fileExt = file.name.split(".").pop();
  const fileName = `poi_${poiId}_${timestamp}.${fileExt}`;
  const filePath = `pois/${poiId}/${fileName}`;

  try {
    // First, delete old images for this POI
    const { data: existingFiles } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(`pois/${poiId}`);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(
        (f) => `pois/${poiId}/${f.name}`
      );
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(filesToDelete);
    }

    // Upload new image
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

/**
 * Delete a POI image from storage
 * @param poiId - The POI ID
 */
export async function deletePoiImage(poiId: string): Promise<void> {
  const supabase = createClient();

  try {
    const { data: existingFiles } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(`pois/${poiId}`);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(
        (f) => `pois/${poiId}/${f.name}`
      );
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(filesToDelete);
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
}

/**
 * Get the public URL for a POI image
 * @param poiId - The POI ID
 * @param fileName - The file name (optional, uses the first image if not provided)
 */
export async function getPoiImageUrl(
  poiId: string,
  fileName?: string
): Promise<string | null> {
  const supabase = createClient();

  try {
    if (fileName) {
      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(`pois/${poiId}/${fileName}`);
      return data.publicUrl;
    }

    // Get the first image if no specific file is provided
    const { data: files } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(`pois/${poiId}`);

    if (files && files.length > 0) {
      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(`pois/${poiId}/${files[0].name}`);
      return data.publicUrl;
    }

    return null;
  } catch (error) {
    console.error("Error getting image URL:", error);
    return null;
  }
}
