export const backendRequest = async (path: string, options?: RequestInit) => {
  const baseUrl = process.env.BACKEND_URL || "http://backend:3001";
  const token = process.env.ADMIN_PASSWORD || "";
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
      ...(options?.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
};
