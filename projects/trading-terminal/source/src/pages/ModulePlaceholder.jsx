import React from 'react';
import { useLocation } from 'react-router-dom';
import PlaceholderPage from '@/components/PlaceholderPage';
import { getModuleMeta } from '@/components/terminal/navConfig';

export default function ModulePlaceholder() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get('module') || '';
  const meta = getModuleMeta(id);
  return <PlaceholderPage moduleName={meta.label} description={meta.description} />;
}