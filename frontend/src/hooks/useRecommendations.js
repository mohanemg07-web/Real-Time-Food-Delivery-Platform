'use client';
import { useEffect, useState } from 'react';
import { orderApi } from '../lib/axios';

export function useRecommendations(userId) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    orderApi
      .get(`/recommendations/${userId}`)
      .then((res) => {
        if (cancelled) return;
        setRecommendations(res.data.recommendations || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.error || err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { recommendations, loading, error };
}
