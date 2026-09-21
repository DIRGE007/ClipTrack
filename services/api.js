const API_BASE_URL = "http://192.168.1.70:5000/api";

export async function apiRequest(
  endpoint,
  method = "GET",
  body = null,
  token = null,
) {
  try {
    // ==========================================
    // AUTOMATICALLY GET TOKEN FROM LOCAL STORAGE
    // ==========================================

    const savedToken = token || localStorage.getItem("cliptrack_token");

    const headers = {
      "Content-Type": "application/json",
    };

    // ==========================================
    // ADD AUTHORIZATION HEADER
    // ==========================================

    if (savedToken) {
      headers.Authorization = `Bearer ${savedToken}`;
    }

    const options = {
      method,
      headers,
    };

    if (body !== null) {
      options.body = JSON.stringify(body);
    }

    console.log(`${method} ${API_BASE_URL}${endpoint}`);

    console.log("TOKEN EXISTS:", !!savedToken);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    const data = await response.json();

    console.log("API Response:", data);

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`,
      );
    }

    return data;
  } catch (error) {
    console.error("API Request Error:", error);

    throw error;
  }
}
