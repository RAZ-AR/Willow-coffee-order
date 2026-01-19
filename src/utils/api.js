// API для работы с Google Apps Script backend
import { BACKEND_URL } from '../constants';
export async function postJSON(url, body) {
    // For GAS backend, all requests go to BACKEND_URL with action parameter
    const fullUrl = url.startsWith('http') ? url : BACKEND_URL;
    console.log('API Request:', fullUrl, body);
    try {
        const res = await fetch(fullUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain" }, // GAS works better with text/plain
            body: JSON.stringify(body),
            redirect: 'follow', // Follow GAS redirects
        });
        console.log('API Response status:', res.status, res.statusText);
        const text = await res.text();
        console.log('API Response text:', text);
        let json;
        try {
            json = JSON.parse(text);
        }
        catch (parseError) {
            console.error('Failed to parse response as JSON:', parseError);
            throw new Error('Invalid JSON response from server');
        }
        console.log('API Response parsed:', json);
        if (!json.ok) {
            throw new Error(json.error || 'API error');
        }
        return json;
    }
    catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
    }
}
export async function getJSON(url) {
    const fullUrl = url.startsWith('http') ? url : BACKEND_URL;
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
export function cartAdd(prev, id, n = 1) {
    const next = { ...prev };
    const q = (next[id] || 0) + n;
    if (q <= 0)
        delete next[id];
    else
        next[id] = q;
    return next;
}
