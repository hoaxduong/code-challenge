export interface Resource {
  id?: number;
  name: string;
  description?: string;
  category?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResourceFilter {
  name?: string;
  category?: string;
  status?: string;
}
