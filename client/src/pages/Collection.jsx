import React from 'react';
import { useParams } from 'react-router-dom';
import Home from './Home';

export default function Collection() {
  const { slug } = useParams();
  
  // Reuse the entire Home architecture but pass the slug
  // The Home component will handle SEO generation, querying, and hiding the Home Hero.
  return <Home collectionSlug={slug} />;
}
