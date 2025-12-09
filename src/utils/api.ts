// Новый API для работы с Supabase backend вместо GAS
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function postJSON<T = any>(url: string, body: any): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  console.log('API Request:', fullUrl, body);

  const res = await fetch(fullUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('API Error:', res.status, errorText);
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }

  const json = await res.json();
  console.log('API Response:', json);

  if (!json.ok) {
    throw new Error(json.error || 'API error');
  }

  return json;
}

export async function getJSON<T = any>(url: string): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  console.log('API GET Request:', fullUrl);

  const res = await fetch(fullUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('API Error:', res.status, errorText);
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }

  const json = await res.json();
  console.log('API Response:', json);

  if (!json.ok) {
    throw new Error(json.error || 'API error');
  }

  return json;
}

export function cartAdd(prev: Record<string, number>, id: string, n = 1): Record<string, number> {
  const next: Record<string, number> = { ...prev };
  const q = (next[id] || 0) + n;
  if (q <= 0) delete next[id];
  else next[id] = q;
  return next;
}
