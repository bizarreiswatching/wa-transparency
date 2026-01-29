interface OrganizationSchemaProps {
  name: string;
  description?: string;
  url?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export function OrganizationSchema({
  name,
  description,
  url,
  address,
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    ...(description && { description }),
    ...(url && { url }),
    ...(address && {
      address: {
        '@type': 'PostalAddress',
        ...(address.street && { streetAddress: address.street }),
        ...(address.city && { addressLocality: address.city }),
        ...(address.state && { addressRegion: address.state }),
        ...(address.zip && { postalCode: address.zip }),
        addressCountry: 'US',
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface PersonSchemaProps {
  name: string;
  jobTitle?: string;
  description?: string;
  url?: string;
  affiliation?: string;
}

export function PersonSchema({
  name,
  jobTitle,
  description,
  url,
  affiliation,
}: PersonSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    ...(jobTitle && { jobTitle }),
    ...(description && { description }),
    ...(url && { url }),
    ...(affiliation && {
      affiliation: {
        '@type': 'Organization',
        name: affiliation,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface LegislationSchemaProps {
  name: string;
  legislationIdentifier: string;
  description?: string;
  dateCreated?: string;
  legislationLegalForce?: string;
  url?: string;
}

export function LegislationSchema({
  name,
  legislationIdentifier,
  description,
  dateCreated,
  legislationLegalForce,
  url,
}: LegislationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name,
    legislationIdentifier,
    ...(description && { description }),
    ...(dateCreated && { dateCreated }),
    ...(legislationLegalForce && { legislationLegalForce }),
    ...(url && { url }),
    legislationJurisdiction: 'Washington State, US',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface GovernmentServiceSchemaProps {
  name: string;
  description?: string;
  url?: string;
  provider?: string;
}

export function GovernmentServiceSchema({
  name,
  description,
  url,
  provider,
}: GovernmentServiceSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name,
    ...(description && { description }),
    ...(url && { url }),
    ...(provider && {
      provider: {
        '@type': 'GovernmentOrganization',
        name: provider,
      },
    }),
    areaServed: {
      '@type': 'State',
      name: 'Washington',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebSiteSchemaProps {
  name: string;
  description: string;
  url: string;
}

export function WebSiteSchema({ name, description, url }: WebSiteSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    description,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
