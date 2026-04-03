/**
 * API Client pour EducAIKids Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface GenerateVideoRequest {
  prompt: string;
  target_audience?: string;
  target_duration?: number;
}

export interface JobCreatedResponse {
  job_id: string;
  message: string;
  status: GenerationStatus;
}

export type GenerationStatus =
  | 'pending'
  | 'generating_script'
  | 'generating_narration'
  | 'generating_images'
  | 'generating_voice'
  | 'generating_music'
  | 'generating_video_clips'
  | 'assembling'
  | 'completed'
  | 'failed';

export interface GenerationStatusResponse {
  job_id: string;
  status: GenerationStatus;
  progress: number;
  current_step: string;
  error_message: string | null;
  video_url: string | null;
  title: string | null;
}

export interface VideoListItem {
  job_id: string;
  title: string | null;
  status: GenerationStatus;
  created_at: string;
  video_url: string | null;
  thumbnail_url: string | null;
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || 'Une erreur est survenue',
      response.status,
      JSON.stringify(errorData)
    );
  }
  return response.json();
}

export const api = {
  /**
   * Démarre la génération d'une vidéo éducative
   */
  async generateVideo(request: GenerateVideoRequest): Promise<JobCreatedResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        target_audience: request.target_audience || 'enfants 6-10 ans',
        target_duration: request.target_duration || 60,
      }),
    });

    return handleResponse<JobCreatedResponse>(response);
  },

  /**
   * Récupère le statut de génération
   */
  async getStatus(jobId: string): Promise<GenerationStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/status/${jobId}`);
    return handleResponse<GenerationStatusResponse>(response);
  },

  /**
   * Récupère l'URL de la vidéo
   */
  getVideoUrl(jobId: string): string {
    return `${API_BASE_URL}/api/v1/video/${jobId}`;
  },

  /**
   * Liste toutes les vidéos
   */
  async listVideos(): Promise<VideoListItem[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/videos`);
    return handleResponse<VideoListItem[]>(response);
  },

  /**
   * Supprime une vidéo
   */
  async deleteVideo(jobId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/video/${jobId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new ApiError('Erreur lors de la suppression', response.status);
    }
  },

  /**
   * Vérifie la santé de l'API
   */
  async healthCheck(): Promise<{ status: string; version: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`);
    return handleResponse(response);
  },
};

export { ApiError };

