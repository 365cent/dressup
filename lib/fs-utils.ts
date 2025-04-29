import { v4 as uuidv4 } from 'uuid';

// We'll use dynamic imports for Node-specific modules
let fs: any;
let path: any;

// Store references to directory paths
let DATA_DIR: string | null = null;
let IMAGES_DIR: string | null = null;
let ANALYSIS_DIR: string | null = null;
let FEEDBACK_DIR: string | null = null;

// Check if we're on the server side
const isServer = typeof window === 'undefined';

// --- MODIFICATION START: Add promise for module loading ---
let modulesLoadedPromise: Promise<void> | null = null;
let resolveModulesLoaded: () => void;
let rejectModulesLoaded: (reason?: any) => void;

if (isServer) {
  modulesLoadedPromise = new Promise((resolve, reject) => {
    resolveModulesLoaded = resolve;
    rejectModulesLoaded = reject;
  });
}
// --- MODIFICATION END ---

// Initialize paths function to ensure consistent directory paths
function initializePaths() {
  if (!isServer || !path || DATA_DIR !== null) return; // Added !isServer check
  // Base directory for all data storage - use environment variable with consistent fallback
  DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), '.data');
  // Subdirectories for different types of data
  IMAGES_DIR = path.join(DATA_DIR, 'images');
  ANALYSIS_DIR = path.join(DATA_DIR, 'analysis');
  FEEDBACK_DIR = path.join(DATA_DIR, 'feedback');
  console.log('Data paths initialized:', { DATA_DIR, IMAGES_DIR, ANALYSIS_DIR, FEEDBACK_DIR });
}

// Initialize only on server side
if (isServer) {
  Promise.all([
    import('fs'),
    import('path')
  ]).then(([fsModule, pathModule]) => {
    fs = fsModule.promises;
    path = pathModule;
    initializePaths();
    resolveModulesLoaded(); // Resolve the promise once modules are loaded and paths initialized
  }).catch(err => {
    console.error("Failed to load server modules:", err);
    rejectModulesLoaded(err); // Reject the promise on error
  });
}

// Helper to ensure operation is run only on server side
// --- MODIFICATION START: Make ensureServer async and await promise ---
async function ensureServer(operation: string): Promise<void> {
  if (!isServer) {
    throw new Error(`${operation} can only be performed on the server side`);
  }
  // Wait for modules to load if the promise exists
  if (modulesLoadedPromise) {
    await modulesLoadedPromise;
  }
  // Check again after awaiting
  if (!fs || !path) {
     throw new Error(`Server modules (fs, path) not loaded for ${operation}.`);
  }
}
// --- MODIFICATION END ---


// Helper to ensure paths are initialized (server-side only)
// --- MODIFICATION START: Make ensurePathsInitialized async ---
async function ensurePathsInitialized(): Promise<void> {
  await ensureServer('ensurePathsInitialized'); // Ensures fs/path are loaded too via ensureServer
  // --- MODIFICATION END ---
  // No need to re-initialize if already done
  if (!DATA_DIR || !IMAGES_DIR || !ANALYSIS_DIR || !FEEDBACK_DIR) {
     console.error("Data directories not initialized!");
     // Attempt to initialize again just in case, though ensureServer should handle module loading
     initializePaths();
     if (!DATA_DIR || !IMAGES_DIR || !ANALYSIS_DIR || !FEEDBACK_DIR) {
       throw new Error("Data directories failed to initialize!");
     }
  }
  // Ensure directories exist
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    await fs.mkdir(ANALYSIS_DIR, { recursive: true });
    await fs.mkdir(FEEDBACK_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create data directories:", error);
    throw error;
  }
}


// Create necessary directories - Server-side only now
// --- MODIFICATION START: Make initDataDirectories async ---
export async function initDataDirectories(): Promise<{ success: boolean; message?: string }> {
  if (!isServer) {
     console.warn("initDataDirectories called on client, skipping FS operations.");
     return { success: true, message: "Skipped on client" };
  }
  try {
    await ensurePathsInitialized(); // This will create dirs if they don't exist
    
    // Verify the directories exist and are writable
    const testPath = path.join(IMAGES_DIR!, '.test');
    await fs.writeFile(testPath, 'test');
    await fs.unlink(testPath);
    
    console.log("Data directories verified writable:");
    console.log(`DATA_DIR: ${DATA_DIR}`);
    console.log(`IMAGES_DIR: ${IMAGES_DIR}`);
    console.log(`ANALYSIS_DIR: ${ANALYSIS_DIR}`);
    console.log(`FEEDBACK_DIR: ${FEEDBACK_DIR}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error ensuring data directories:", error);
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}
// --- MODIFICATION END ---

// Safe initialization check - remains the same
export function isInitialized(): boolean {
  // Consider modules loaded as part of initialization on server
  return isServer ? (DATA_DIR !== null && fs && path) : true; // Client doesn't need FS init
}

// Save an image file - Server-side only
// --- MODIFICATION START: Make saveImage async ---
export async function saveImage(imageData: string, imageId?: string): Promise<string> {
  await ensureServer('saveImage');
  await ensurePathsInitialized();

  // Generate ID if not provided
  const id = imageId || uuidv4();

  // Handle base64 data URLs
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');

  const filePath = path.join(IMAGES_DIR!, `${id}.jpg`); // Assume jpg for simplicity

  try {
    console.log(`DEBUG: Attempting to save image with ID ${id} to ${filePath}`);
    console.log(`DEBUG: IMAGES_DIR is set to ${IMAGES_DIR}`);
    await fs.writeFile(filePath, buffer);
    // Verify the file was actually created
    const stats = await fs.stat(filePath);
    console.log(`DEBUG: Image saved: ${filePath}, size: ${stats.size} bytes`);
    return id;
  } catch (error) {
    console.error(`Error saving image ${id}:`, error);
    throw new Error(`Failed to save image: ${error instanceof Error ? error.message : String(error)}`);
  }
}
// --- MODIFICATION END ---

// Save analysis data - Server-side only
// --- MODIFICATION START: Make saveAnalysisData async ---
export async function saveAnalysisData(
  analysisId: string, // Use analysisId as the primary key/filename
  data: any // Should be AnalysisResult without imageData
): Promise<void> {
  await ensureServer('saveAnalysisData');
  await ensurePathsInitialized();

  const filePath = path.join(ANALYSIS_DIR!, `${analysisId}.json`);
  try {
    // Ensure imageData is not present before saving
    if (data.imageData) {
       console.warn(`Attempting to save analysis ${analysisId} with imageData included. Removing.`);
       delete data.imageData;
    }
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Analysis data saved: ${filePath}`);
  } catch (error) {
    console.error(`Error saving analysis ${analysisId}:`, error);
    throw new Error(`Failed to save analysis: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Get analysis data by ID - Server-side only
// --- MODIFICATION START: Make getAnalysisData async ---
export async function getAnalysisData(id: string): Promise<any> {
  await ensureServer('getAnalysisData');
  await ensurePathsInitialized();

  const analysisPath = path.join(ANALYSIS_DIR!, `${id}.json`);
  try {
    const data = await fs.readFile(analysisPath, 'utf8');
    return JSON.parse(data);
  } catch (error: any) {
     if (error.code === 'ENOENT') {
        console.log(`Analysis data not found for ID: ${id}`);
        return null; // Return null if file not found
     }
    console.error(`Error getting analysis ${id}:`, error);
    throw new Error(`Failed to get analysis: ${error instanceof Error ? error.message : String(error)}`);
  }
}
// --- MODIFICATION END ---

// List all analysis data - Server-side only
// --- MODIFICATION START: Make listAnalysisData async ---
export async function listAnalysisData(): Promise<any[]> {
  await ensureServer('listAnalysisData');
  await ensurePathsInitialized();

  try {
    const files = await fs.readdir(ANALYSIS_DIR!);
    const jsonFiles = files.filter((f: string) => f.endsWith('.json'));

    const results = await Promise.all(
      jsonFiles.map(async (file: string) => {
        try {
          const data = await fs.readFile(path.join(ANALYSIS_DIR!, file), 'utf8');
          return JSON.parse(data);
        } catch (error) {
          console.error(`Error parsing analysis file ${file}:`, error);
          return null; // Skip corrupted files
        }
      })
    );

    // Filter out null results from failed reads/parses
    return results.filter(r => r !== null);
  } catch (error) {
    console.error('Error listing analysis data:', error);
    return []; // Return empty array on error
  }
}
// --- MODIFICATION END ---

// Delete analysis by ID - Server-side only
// --- MODIFICATION START: Make deleteAnalysis async ---
export async function deleteAnalysis(id: string): Promise<boolean> {
  await ensureServer('deleteAnalysis');
  await ensurePathsInitialized();

  const filePath = path.join(ANALYSIS_DIR!, `${id}.json`);
  try {
    await fs.unlink(filePath);
    console.log(`Analysis deleted: ${filePath}`);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`Analysis file not found for deletion: ${id}`);
      return true; // Consider not found as success for deletion
    }
    console.error(`Error deleting analysis ${id}:`, error);
    return false;
  }
}
// --- MODIFICATION END ---

// Clear all analysis data - Server-side only
// --- MODIFICATION START: Make clearAnalysisData async ---
export async function clearAnalysisData(): Promise<boolean> {
  await ensureServer('clearAnalysisData');
  await ensurePathsInitialized();

  try {
    const files = await fs.readdir(ANALYSIS_DIR!);
    await Promise.all(
      files.map((file: string) => fs.unlink(path.join(ANALYSIS_DIR!, file)))
    );
    console.log('All analysis data cleared.');
    return true;
  } catch (error) {
    console.error('Error clearing analysis data:', error);
    return false;
  }
}
// --- MODIFICATION END ---

// Load an image file - Server-side only (Used by image serving route)
// --- MODIFICATION START: Make getImage async ---
export async function getImage(imageId: string): Promise<Buffer> {
  await ensureServer('getImage');
  await ensurePathsInitialized();

  const imagePath = path.join(IMAGES_DIR!, `${imageId}.jpg`); // Assume jpg
  try {
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer;
  } catch (error: any) {
     if (error.code === 'ENOENT') {
        throw new Error(`Image not found: ${imageId}`); // Throw specific error for 404
     }
    console.error(`Error reading image ${imageId}:`, error);
    throw new Error(`Failed to read image: ${error instanceof Error ? error.message : String(error)}`);
  }
}
// --- MODIFICATION END ---

// Save feedback data - Server-side only
// --- MODIFICATION START: Make saveFeedbackData async ---
export async function saveFeedbackData(
  imageId: string,
  analysisId: string,
  data: { feedback: "upvote" | "downvote"; timestamp: number }
): Promise<void> {
  await ensureServer('saveFeedbackData');
  await ensurePathsInitialized();

  // Use analysisId as the filename for feedback to easily link/remove it
  const filePath = path.join(FEEDBACK_DIR!, `${analysisId}.json`);
  const feedbackEntry = {
    imageId,
    analysisId,
    ...data
  };

  try {
    await fs.writeFile(filePath, JSON.stringify(feedbackEntry, null, 2));
    console.log(`Feedback saved for analysis ${analysisId}: ${filePath}`);
  } catch (error) {
    console.error(`Error saving feedback for analysis ${analysisId}:`, error);
    throw new Error(`Failed to save feedback: ${error instanceof Error ? error.message : String(error)}`);
  }
}
// --- MODIFICATION END ---

// List all feedback data - Server-side only
// --- MODIFICATION START: Make listFeedbackData async ---
export async function listFeedbackData(): Promise<any[]> {
   await ensureServer('listFeedbackData');
   await ensurePathsInitialized();

   try {
     const files = await fs.readdir(FEEDBACK_DIR!);
     const jsonFiles = files.filter((f: string) => f.endsWith('.json'));

     const results = await Promise.all(
       jsonFiles.map(async (file: string) => {
         try {
           const data = await fs.readFile(path.join(FEEDBACK_DIR!, file), 'utf8');
           return JSON.parse(data);
         } catch (error) {
           console.error(`Error parsing feedback file ${file}:`, error);
           return null;
         }
       })
     );

     // Filter out nulls and sort by timestamp (newest first)
     return results.filter(r => r !== null).sort((a, b) => b.timestamp - a.timestamp);
   } catch (error) {
     console.error('Error listing feedback data:', error);
     return [];
   }
}
// --- MODIFICATION END ---

// Remove feedback for a specific analysis - Server-side only
// --- MODIFICATION START: Make removeFeedback async ---
export async function removeFeedback(analysisId: string): Promise<boolean> {
  await ensureServer('removeFeedback');
  await ensurePathsInitialized();

  const filePath = path.join(FEEDBACK_DIR!, `${analysisId}.json`);
  try {
    await fs.unlink(filePath);
    console.log(`Feedback removed for analysis: ${analysisId}`);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`Feedback file not found for removal: ${analysisId}`);
      return true; // Consider not found as success
    }
    console.error(`Error removing feedback for analysis ${analysisId}:`, error);
    return false;
  }
}
// --- MODIFICATION END ---

// Clear all feedback data - Server-side only
// --- MODIFICATION START: Make clearFeedbackData async ---
export async function clearFeedbackData(): Promise<boolean> {
  await ensureServer('clearFeedbackData');
  await ensurePathsInitialized();

  try {
    const files = await fs.readdir(FEEDBACK_DIR!);
    await Promise.all(
      files.map((file: string) => fs.unlink(path.join(FEEDBACK_DIR!, file)))
    );
    console.log('All feedback data cleared.');
    return true;
  } catch (error) {
    console.error('Error clearing feedback data:', error);
    return false;
  }
}
// --- MODIFICATION END ---