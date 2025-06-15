export async function secureFetch(url, options = {}, onInvalidToken) {
  const token = localStorage.getItem("token");
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("token");
    if (onInvalidToken) onInvalidToken(); // notificar a App
    throw new Error("Token inválido");
  }

  return res;
}
