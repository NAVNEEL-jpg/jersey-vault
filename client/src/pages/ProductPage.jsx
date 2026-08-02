import React from 'react';
import { useParams } from 'react-router-dom';
import Home from './Home';

export default function ProductPage() {
  const { slug } = useParams();
  return <Home productSlug={slug} isStandaloneProductPage={true} />;
}
