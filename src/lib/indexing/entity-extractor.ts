export interface ExtractedEntity {
  type: string;
  name?: string;
  description?: string;
  image?: string;
  rawJson?: any;
}

export function extractStructuredEntities(html: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  try {
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        const jsonText = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
        try {
          const parsed = JSON.parse(jsonText);
          const items = Array.isArray(parsed) ? parsed : [parsed];

          for (const item of items) {
            if (item && item['@type']) {
              entities.push({
                type: item['@type'],
                name: item.name || item.headline,
                description: item.description,
                image: typeof item.image === 'string' ? item.image : item.image?.url,
                rawJson: item,
              });
            }
          }
        } catch {
          // Ignore invalid JSON-LD blocks safely
        }
      }
    }
  } catch {
    // Ignore extraction errors safely
  }

  return entities;
}
