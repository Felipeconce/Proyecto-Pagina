import { useState, useEffect } from 'react';

export function useFetchList(url) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar datos');
        return res.json();
      })
      .then(data => {
        if (isMounted) setData(data);
      })
      .catch(err => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [url]);

  return { data, loading, error };
}
