export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem('token');
  if (token) {
    if (init) {
      init.headers = {
        ...init.headers,
        'Authorization': `Bearer ${token}`
      };
    } else {
      init = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
    }
  }
  return fetch(input, init);
};
