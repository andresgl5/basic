export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp;
    if (!exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return exp < now;
  } catch (error) {
    console.error("Error verificando expiración del token:", error);
    return true; 
  }
}
