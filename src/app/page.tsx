import React from 'react';
import HomepageClient from './components/HomepageClient';
import {
  getFeaturedCoursesSchema,
  getProductPricingSchema,
  getTestimonialsReviewsSchema,
  getHomepageFAQSchema,
} from '@/lib/seo/structuredData';

export default function HomePage() {
  const schemas = [
    getFeaturedCoursesSchema(),
    getProductPricingSchema(),
    getTestimonialsReviewsSchema(),
    getHomepageFAQSchema(),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemas),
        }}
      />
      <HomepageClient />
    </>
  );
}