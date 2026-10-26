export type Role = 'CUSTOMER' | 'TRAINER' | 'ADMIN';

export type SessionUser = {
  id: string;
  name: string;
  role: Role;
};

export type Branch = {
  id: string;
  name: string;
  location?: string;
  phone?: string;
  is_active?: boolean;
};

export type Slot = {
  id: string;
  start: string;
  end: string;
  status: 'OPEN' | 'LOCKED' | 'FULL' | 'BLOCKED' | 'CLOSED';
  booked: number;
  capacity: number;
  trainerId?: string;
  trainerName?: string;
};

export type DocAudience = 'ALL' | 'TRAINER' | 'ADMIN';

export type DocumentMeta = {
  id: string;
  title: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  audience: DocAudience;
  created_at: string;
  uploaded_by_name?: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function readError(res: Response) {
  const json = await res.json().catch(() => null);
  return new Error(json?.error?.message || '요청 처리 중 오류가 발생했습니다');
}

async function request<T>(path: string, init?: RequestInit, raw = false): Promise<T> {
  const res = await fetch(`${API_BASE}/v1${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (raw) return (res as unknown) as T;

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.error?.message || '요청 처리 중 오류가 발생했습니다');
  }
  return json.data as T;
}

export const api = {
  baseUrl: API_BASE,
  getMe: () => request<{ user: SessionUser | null }>('/auth/me'),
  sendPhoneCode: (phone: string) => request<{ code?: string; expiresIn: number }>('/auth/phone/send', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  }),
  verifyPhone: (phone: string, code: string, name?: string) =>
    request<{ user: SessionUser }>('/auth/phone/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, name }),
    }),
  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  switchRole: (role: Role) =>
    request<{ user: SessionUser }>('/auth/dev/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
  getBranches: () => request<Branch[]>('/branches'),
  getBranchSlots: (branchId: string, date: string) => request<Slot[]>(`/branches/${branchId}/slots?date=${date}`),
  lockSlot: (slotId: string) => request<{ lockExpiresIn: number }>(`/slots/${slotId}/lock`, { method: 'POST' }),
  createReservation: (slotId: string) =>
    request('/reservations', { method: 'POST', body: JSON.stringify({ slotId }) }),
  getMyReservations: () => request<any[]>('/reservations/me'),
  cancelReservation: (reservationId: string) => request<{ cancelled: boolean; penalty: boolean }>(`/reservations/${reservationId}`, { method: 'DELETE' }),
  getTrainerSchedule: (date: string) => request<any[]>(`/trainer/schedule?date=${date}`),
  approveReservation: (reservationId: string) => request(`/trainer/reservations/${reservationId}/approve`, { method: 'PATCH' }),
  rejectReservation: (reservationId: string, reason: string) =>
    request(`/trainer/reservations/${reservationId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
  createMemo: (customerId: string, content: string) =>
    request(`/trainer/customers/${customerId}/memo`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  getMemos: (customerId: string) => request<any[]>(`/trainer/customers/${customerId}/memos`),
  getAdminDashboard: () => request<any>('/admin/dashboard'),
  getAdminTrainers: () => request<any[]>('/admin/trainers'),
  createAdminTrainer: (payload: { name: string; phone: string; branchId: string; bio?: string }) =>
    request('/admin/trainers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAdminTrainer: (trainerId: string, payload: { bio?: string; isActive?: boolean; branchId?: string }) =>
    request(`/admin/trainers/${trainerId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getAdminStats: (month: string) => request<any>(`/admin/stats?month=${month}`),
  setSlotLocked: (slotId: string, locked: boolean) =>
    request(`/admin/slots/${slotId}/lock`, {
      method: 'PATCH',
      body: JSON.stringify({ locked }),
    }),
  getDocuments: () => request<DocumentMeta[]>('/documents'),
  getDocument: (id: string) => request<DocumentMeta>(`/documents/${id}`),
  getDocumentFile: async (id: string) => {
    const res = await fetch(`${API_BASE}/v1/documents/${id}/file`, { credentials: 'include' });
    if (!res.ok) throw await readError(res);
    return res.blob();
  },
  uploadDocument: async (file: File, title: string, audience: DocAudience) => {
    const form = new FormData();
    form.append('title', title);
    form.append('audience', audience);
    form.append('file', file);
    const res = await fetch(`${API_BASE}/v1/documents`, { method: 'POST', credentials: 'include', body: form });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) throw new Error(json?.error?.message || '업로드에 실패했습니다');
    return json.data as DocumentMeta;
  },
  deleteDocument: (id: string) => request<{ deleted: boolean }>(`/documents/${id}`, { method: 'DELETE' }),
};

export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function rolePath(role: Role) {
  if (role === 'TRAINER') return '/trainer';
  if (role === 'ADMIN') return '/admin';
  return '/customer';
}
