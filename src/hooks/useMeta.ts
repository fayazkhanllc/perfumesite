import { useEffect } from 'react';
import { absoluteUrl } from '../data/siteConfig';

interface Meta {
  title: string;
  description: string;
  path: string;
  image?: string | null;
}

function setTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

const metaByName = (name: string, value: string) =>
  setTag(`meta[name="${name}"]`, () => Object.assign(document.createElement('meta'), { name }), 'content', value);
const metaByProp = (property: string, value: string) =>
  setTag(
    `meta[property="${property}"]`,
    () => {
      const m = document.createElement('meta');
      m.setAttribute('property', property);
      return m;
    },
    'content',
    value,
  );

export function useMeta({ title, description, path, image }: Meta) {
  useEffect(() => {
    document.title = title;
    metaByName('description', description);
    metaByProp('og:title', title);
    metaByProp('og:description', description);
    const url = absoluteUrl(path);
    if (url) {
      metaByProp('og:url', url);
      setTag('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', url);
      if (image) metaByProp('og:image', image.startsWith('http') ? image : (absoluteUrl(image) ?? image));
    }
  }, [title, description, path, image]);
}
