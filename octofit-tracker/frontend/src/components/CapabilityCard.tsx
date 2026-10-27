import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  path: string;
  resource: string;
  emptyMessage: string;
  renderItems: (items: T[]) => ReactNode;
};

export function CapabilityCard<T>({ title, description, path, resource, emptyMessage, renderItems }: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    getJson<Record<string, unknown>>(path)
      .then((data) => {
        const resourceItems = data[resource];
        if (!Array.isArray(resourceItems)) throw new Error('Unexpected API response');
        if (active) setItems(resourceItems as T[]);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [path, resource]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {loading ? <p role="status">Loading {title.toLowerCase()}...</p>
      : failed ? <p role="alert">Unable to load {title.toLowerCase()}. Please try again.</p>
        : items.length === 0 ? <p>{emptyMessage}</p>
          : renderItems(items)}
  </div></section>;
}
