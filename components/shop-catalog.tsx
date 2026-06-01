'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProductCard } from '@/components/product-card';
import { SedifexProduct } from '@/lib/types';

 type ShopCatalogProps = {
  products: SedifexProduct[];
};

const allCategoriesLabel = 'All Categories';
const RECENT_SEARCHES_STORAGE_KEY = 'timeless-recent-searches';
const MAX_RECENT_SEARCHES = 6;

const synonymMap: Record<string, string[]> = {
  adidas: ['adiddas', 'addidas', 'adi das'],
  moisturizer: ['moisturiser', 'moisture', 'hydrator', 'hydrating cream', 'cream', 'lotion'],
  lotion: ['body lotion', 'cream', 'moisturizer', 'moisturiser'],
  serum: ['essence', 'concentrate', 'ampoule'],
  cleanser: ['face wash', 'wash', 'cleanser', 'soap'],
  toner: ['toning', 'face toner'],
  sunscreen: ['spf', 'sunblock', 'sun screen'],
  exfoliator: ['scrub', 'peel', 'body scrub', 'exfoliating'],
  acne: ['pimple', 'breakout', 'spots'],
  brightening: ['glow', 'whitening', 'lightening', 'radiance'],
  'dark spot': ['dark spots', 'hyperpigmentation', 'black spot', 'marks'],
  body: ['bodycare', 'body care', 'body products'],
  skincare: ['skin care', 'skin-care', 'face care', 'facial'],
  oil: ['body oil', 'glow oil'],
  makeup: ['make up', 'cosmetics'],
  sensitive: ['sensitive skin', 'gentle', 'mild'],
  hair: ['hair care', 'wig', 'braid'],
  fragrance: ['perfume', 'body mist', 'spray']
};

function normalizeTerm(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function tokenize(value: string) {
  return normalizeTerm(value).split(' ').filter(Boolean);
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array(b.length + 1).fill(0).map((_, index) => index);
  const curr = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + substitutionCost
      );
    }

    for (let j = 0; j <= b.length; j += 1) {
      prev[j] = curr[j];
    }
  }

  return prev[b.length];
}

function getFuzzyDistance(term: string) {
  if (term.length <= 3) return 0;
  if (term.length <= 5) return 1;
  if (term.length <= 9) return 2;
  return 3;
}

function buildAliasMap() {
  const aliases = new Map<string, Set<string>>();

  Object.entries(synonymMap).forEach(([canonical, values]) => {
    const normalizedCanonical = normalizeTerm(canonical);
    const canonicalAliases = aliases.get(normalizedCanonical) ?? new Set<string>();
    canonicalAliases.add(normalizedCanonical);

    values.forEach((value) => {
      const normalizedAlias = normalizeTerm(value);
      canonicalAliases.add(normalizedAlias);

      const reverseAliasGroup = aliases.get(normalizedAlias) ?? new Set<string>();
      reverseAliasGroup.add(normalizedCanonical);
      reverseAliasGroup.add(normalizedAlias);
      aliases.set(normalizedAlias, reverseAliasGroup);
    });

    aliases.set(normalizedCanonical, canonicalAliases);
  });

  return aliases;
}

const aliasMap = buildAliasMap();

function collectSearchValues(value: unknown, values: string[] = []): string[] {
  if (value === null || value === undefined) return values;

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    values.push(String(value));
    return values;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectSearchValues(item, values));
    return values;
  }

  if (typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((item) => collectSearchValues(item, values));
  }

  return values;
}

function getProductSearchValues(product: SedifexProduct) {
  const values = collectSearchValues(product);
  if (typeof product.price === 'number') {
    values.push(`GHS ${product.price}`);
    values.push(`${product.price} cedis`);
  }

  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function expandSearchTerms(query: string) {
  const normalized = normalizeTerm(query);
  const terms = new Set<string>(normalized ? [normalized] : []);

  const directAliases = aliasMap.get(normalized);
  directAliases?.forEach((term) => terms.add(term));

  tokenize(normalized).forEach((token) => {
    if (!token) return;

    terms.add(token);
    aliasMap.get(token)?.forEach((term) => terms.add(term));

    Object.entries(synonymMap).forEach(([canonical, aliases]) => {
      const normalizedCanonical = normalizeTerm(canonical);
      if (levenshtein(token, normalizedCanonical) <= getFuzzyDistance(token)) {
        terms.add(normalizedCanonical);
      }

      aliases.forEach((alias) => {
        const normalizedAlias = normalizeTerm(alias);
        if (levenshtein(token, normalizedAlias) <= getFuzzyDistance(token)) {
          terms.add(normalizedCanonical);
          terms.add(normalizedAlias);
        }
      });
    });
  });

  return Array.from(terms).filter(Boolean);
}

function tokenMatches(term: string, combinedContent: string, contentTokens: string[]) {
  if (!term) return true;
  if (combinedContent.includes(term)) return true;

  return contentTokens.some((token) => {
    if (token === term) return true;
    if (term.length >= 3 && token.includes(term)) return true;
    if (token.length >= 3 && term.includes(token)) return true;
    return levenshtein(token, term) <= getFuzzyDistance(term);
  });
}

function matchesSearch(product: SedifexProduct, query: string) {
  const normalizedQuery = normalizeTerm(query);
  if (!normalizedQuery) return true;

  const searchableValues = getProductSearchValues(product).map(normalizeTerm).filter(Boolean);
  const combinedContent = searchableValues.join(' ');
  const contentTokens = tokenize(combinedContent);
  const queryTokens = tokenize(normalizedQuery);

  if (combinedContent.includes(normalizedQuery)) return true;

  return queryTokens.every((token) => {
    const expandedTokenTerms = expandSearchTerms(token);
    return expandedTokenTerms.some((term) => tokenMatches(term, combinedContent, contentTokens));
  });
}

function getSearchScore(product: SedifexProduct, query: string) {
  const normalizedQuery = normalizeTerm(query);
  if (!normalizedQuery) return 0;

  const name = normalizeTerm(product.name);
  const category = normalizeTerm(product.category ?? '');
  const description = normalizeTerm(product.description ?? '');
  const combinedContent = getProductSearchValues(product).map(normalizeTerm).join(' ');
  const queryTokens = tokenize(normalizedQuery);
  const contentTokens = tokenize(combinedContent);

  let score = 0;
  if (name === normalizedQuery) score += 200;
  if (name.includes(normalizedQuery)) score += 120;
  if (category.includes(normalizedQuery)) score += 80;
  if (description.includes(normalizedQuery)) score += 40;
  if (combinedContent.includes(normalizedQuery)) score += 30;

  queryTokens.forEach((token) => {
    const expandedTerms = expandSearchTerms(token);
    expandedTerms.forEach((term) => {
      if (name.includes(term)) score += 30;
      if (category.includes(term)) score += 20;
      if (description.includes(term)) score += 10;
      if (contentTokens.includes(term)) score += 8;
      if (tokenMatches(term, combinedContent, contentTokens)) score += 3;
    });
  });

  return score;
}

export function ShopCatalog({ products }: ShopCatalogProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(allCategoriesLabel);
  const [stockOnly, setStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'name-asc'>('featured');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const normalizedQuery = normalizeTerm(query);
  const isSearching = Boolean(normalizedQuery);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      products.map((product) => product.category?.trim() || 'Uncategorized')
    );

    return [allCategoriesLabel, ...Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((item): item is string => typeof item === 'string'));
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const searchSuggestions = useMemo(() => {
    const baseTerms = new Set<string>();

    products.forEach((product) => {
      getProductSearchValues(product).forEach((value) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        if (trimmed.length <= 48) baseTerms.add(trimmed);
        tokenize(trimmed).forEach((token) => {
          if (token.length >= 3) baseTerms.add(token);
        });
      });
    });

    Object.entries(synonymMap).forEach(([canonical, aliases]) => {
      baseTerms.add(canonical);
      aliases.forEach((alias) => baseTerms.add(alias));
    });

    recentSearches.forEach((term) => baseTerms.add(term));

    if (!normalizedQuery) {
      return recentSearches.slice(0, MAX_RECENT_SEARCHES);
    }

    return Array.from(baseTerms)
      .filter((term) => {
        const normalizedTerm = normalizeTerm(term);
        return (
          normalizedTerm.includes(normalizedQuery) ||
          normalizedQuery.includes(normalizedTerm) ||
          levenshtein(normalizedTerm, normalizedQuery) <= getFuzzyDistance(normalizedQuery)
        );
      })
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 8);
  }, [normalizedQuery, products, recentSearches]);

  const filteredProducts = useMemo(() => {
    const matchedProducts = products.filter((product) => {
      const category = product.category?.trim() || 'Uncategorized';
      const categoryMatch = isSearching || activeCategory === allCategoriesLabel || category === activeCategory;
      const queryMatch = matchesSearch(product, query.trim());
      const stockMatch = !stockOnly || (product.stockCount ?? 0) > 0;

      return categoryMatch && queryMatch && stockMatch;
    });

    return [...matchedProducts].sort((a, b) => {
      if (isSearching && sortBy === 'featured') return getSearchScore(b, query) - getSearchScore(a, query);
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'price-low') return (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY);
      if (sortBy === 'price-high') return (b.price ?? Number.NEGATIVE_INFINITY) - (a.price ?? Number.NEGATIVE_INFINITY);
      return 0;
    });
  }, [activeCategory, isSearching, products, query, sortBy, stockOnly]);

  const persistRecentSearch = (searchValue: string) => {
    const normalizedValue = normalizeTerm(searchValue);
    if (!normalizedValue) return;

    setRecentSearches((current) => {
      const updated = [searchValue.trim(), ...current.filter((item) => normalizeTerm(item) !== normalizedValue)].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className='space-y-8'>
      <div className='space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5'>
        <div className='grid gap-4 md:grid-cols-[2fr_1fr]'>
          <div className='space-y-2'>
            <label htmlFor='shop-search' className='block text-sm font-medium text-stone-700'>
              Smart search products
            </label>
            <div className='relative'>
              <input
                id='shop-search'
                type='search'
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onBlur={() => persistRecentSearch(query)}
                placeholder='Search product, brand, category, skin concern, price...'
                className='w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 pr-20 text-sm text-stone-900 outline-none ring-rose-200 transition focus:border-rose-400 focus:ring-2'
                list='shop-search-suggestions'
              />
              {query ? (
                <button
                  type='button'
                  onClick={() => setQuery('')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                >
                  Clear
                </button>
              ) : null}
            </div>
            <datalist id='shop-search-suggestions'>
              {searchSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
            <p className='text-xs text-stone-500'>
              Search checks all products and can understand related words like SPF, sunblock, lotion, cream, glow, acne, and dark spot.
            </p>
          </div>
          <div className='space-y-2'>
            <label htmlFor='shop-sort' className='block text-sm font-medium text-stone-700'>
              Sort
            </label>
            <select
              id='shop-sort'
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as 'featured' | 'price-low' | 'price-high' | 'name-asc')}
              className='w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none ring-rose-200 transition focus:border-rose-400 focus:ring-2'
            >
              <option value='featured'>Featured / Best match</option>
              <option value='price-low'>Price: Low to High</option>
              <option value='price-high'>Price: High to Low</option>
              <option value='name-asc'>Name: A to Z</option>
            </select>
          </div>
        </div>
        <label className='inline-flex items-center gap-2 text-sm text-stone-700'>
          <input
            type='checkbox'
            checked={stockOnly}
            onChange={(event) => setStockOnly(event.target.checked)}
            className='h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-rose-300'
          />
          In-stock only
        </label>
        <div className='flex flex-wrap gap-2'>
          {categories.map((category) => {
            const isActive = category === activeCategory;

            return (
              <button
                type='button'
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
        {isSearching && activeCategory !== allCategoriesLabel ? (
          <p className='text-xs text-stone-500'>Smart search is checking all categories. Clear search to use the selected category filter again.</p>
        ) : null}
      </div>

      <p className='text-sm text-stone-600'>
        Showing <span className='font-semibold text-stone-900'>{filteredProducts.length}</span> of{' '}
        <span className='font-semibold text-stone-900'>{products.length}</span> products.
      </p>

      {filteredProducts.length ? (
        <div className='grid gap-5 md:grid-cols-3'>
          {filteredProducts.map((product) => (
            <ProductCard key={`${product.id}-${product.name}`} product={product} />
          ))}
        </div>
      ) : (
        <div className='rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-600'>
          No products match your search right now. Try another product name, brand, category, skin concern, or price.
        </div>
      )}
    </div>
  );
}
