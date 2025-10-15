export class ImageGenerationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: any,
    public featureType?: string
  ) {
    super(message);
    this.name = 'ImageGenerationError';
  }
}

export const handleApiError = (error: any, res: any) => {
  console.error('Image Generation API Error:', {
    message: error.message,
    statusCode: error.statusCode,
    featureType: error.featureType,
    details: error.details
  });

  // Handle specific error types
  if (error instanceof ImageGenerationError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: error.details,
      featureType: error.featureType,
      timestamp: new Date().toISOString()
    });
  }

  // Handle axios errors
  if (error.response) {
    const { status, data } = error.response;
    
    let userMessage = "Image generation service error";
    if (status === 429) userMessage = "Too many requests. Please try again later.";
    if (status === 413) userMessage = "File too large. Please use a smaller image.";
    if (status >= 500) userMessage = "Image generation service is temporarily unavailable.";

    return res.status(status).json({
      success: false,
      message: userMessage,
      error: data?.message || data?.error || "API Error",
      details: data,
      timestamp: new Date().toISOString()
    });
  } else if (error.request) {
    return res.status(503).json({
      success: false,
      message: "Image generation service is currently unavailable",
      error: "Service unreachable",
      timestamp: new Date().toISOString()
    });
  } else {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during image generation",
      timestamp: new Date().toISOString()
    });
  }
};

// Utility to wrap API calls with error handling
export const withErrorHandling = async (
  operation: () => Promise<any>,
  featureType: string = 'unknown'
) => {
  try {
    return await operation();
  } catch (error: any) {
    if (error instanceof ImageGenerationError) {
      throw error;
    }
    
    // Convert generic errors to ImageGenerationError
    throw new ImageGenerationError(
      error.message || `Error in ${featureType} generation`,
      500,
      error.details,
      featureType
    );
  }
};