export function getServicePath(slug: string) {
  return `/${slug}`;
}

export function getSubservicePath(slug: string, subserviceId: string) {
  return `${getServicePath(slug)}?subservice=${encodeURIComponent(subserviceId)}`;
}
