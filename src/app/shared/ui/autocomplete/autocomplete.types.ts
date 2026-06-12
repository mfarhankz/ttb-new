export interface AutocompleteItem<T = unknown> {
  id: string;
  label: string;
  value: T;
  hint?: string;
}
