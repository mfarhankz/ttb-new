export const SMARTY_CONFIG = {
  autocompleteUrl: 'https://us-autocomplete-pro.api.smarty.com/lookup',
  validationUrl: 'https://us-street.api.smarty.com/street-address',
  autocompleteCacheLimit: 50,
  validationCacheLimit: 25,
  /** Legacy fallback when vertical app_config.SMARTY_API_KEY is unset */
  defaultApiKey: '272462044703167981',
  debounceMs: 300,
  minSearchLength: 3
} as const;

export const SMARTY_VALIDATION_CACHE_KEY = 'cachedSmartyValidationResults';
