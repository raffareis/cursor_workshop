export interface Project {
  id?: number;
  title: string;
  created_at?: string;
}

export interface Segment {
  id?: number;
  project_id: number;
  text: string;
  position: number;
}

export interface Image {
  id?: number;
  segment_id: number;
  prompt: string;
  image_url?: string;
  status?: 'pending' | 'completed' | 'failed';
  created_at?: string;
}

export interface Style {
  id?: number;
  project_id: number;
  style_name: string;
  style_description: string;
  ai_params: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
