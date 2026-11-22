const API_BASE_URL = '/api';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(API_BASE_URL + url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Terjadi kesalahan');
  }

  return response.json();
}



export interface Reminder {
  _id: string;
  documentNumber: string;
  title: string;
  vendorName: string;
  vendorEmail: string;
  deadline: string;
  message?: string;
  sendMode: 'immediate' | 'scheduled';
  scheduledAt?: string;
  recurrence: {
    type: 'none' | 'daily' | 'weekly' | 'days';
    daysOfWeek?: number[];
    time?: string;
  };
  nextRunAt?: string;
  status: 'menunggu' | 'terjadwal' | 'terkirim' | 'gagal';
  lastSentAt?: string;
  sentCount: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderInput {
  documentNumber: string;
  title: string;
  vendorName: string;
  vendorEmail: string;
  deadline: string;
  message?: string;
  sendMode: 'immediate' | 'scheduled';
  scheduledAt?: string;
  recurrence?: {
    type: 'none' | 'daily' | 'weekly' | 'days';
    daysOfWeek?: number[];
    time?: string;
  };
}

export interface SearchParams {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const reminderApi = {
  list: async (params: SearchParams = {}): Promise<PaginatedResponse<Reminder>> => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.status) searchParams.set('status', params.status);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    const url = `/reminders${queryString ? `?${queryString}` : ''}`;
    
    return fetchApi<PaginatedResponse<Reminder>>(url);
  },

  create: async (data: CreateReminderInput): Promise<{ data: Reminder; message: string; emailResult?: { success: boolean; error?: string } }> => {
    return fetchApi('/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return fetchApi(`/reminders/${id}`, {
      method: 'DELETE',
    });
  },
};

export const emailApi = {
  test: async (email: string): Promise<{ success: boolean; message: string }> => {
    return fetchApi('/test-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};
