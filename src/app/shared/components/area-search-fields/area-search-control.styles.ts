/** 38px — legacy Query Tool control height. */
const height = 'h-[2.375rem] min-h-[2.375rem]';

const fieldLabel =
  'min-h-5 text-body-sm font-medium leading-snug text-pretty text-foreground';

export const AreaSearchControlStyles = {
  fieldLabel,
  input: `box-border w-full text-body-sm leading-5 ${height}`,
  select: [
    'w-full min-w-0 text-body-sm',
    height,
    '[&_.p-select-label]:flex [&_.p-select-label]:items-center',
    '[&_.p-select-label]:min-h-[calc(2.375rem-2px)] [&_.p-select-label]:px-2.5',
    '[&_.p-select-dropdown]:w-8'
  ].join(' '),
  multiSelect: [
    'w-full text-body-sm',
    height,
    '[&_.p-multiselect-label]:flex [&_.p-multiselect-label]:items-center',
    '[&_.p-multiselect-label]:min-h-[calc(2.375rem-2px)]',
    '[&_.p-multiselect-label-container]:min-h-[calc(2.375rem-2px)]',
    '[&_.p-multiselect-dropdown]:w-8',
    '[&_.p-multiselect-chip]:hidden [&_.p-multiselect-chip-item]:hidden'
  ].join(' '),
  selectPanel: [
    '[&_.p-select-option]:text-body-sm [&_.p-select-option]:px-2.5 [&_.p-select-option]:py-1.5',
    '[&_.p-select-option.p-select-option-selected]:bg-primary/10 [&_.p-select-option.p-select-option-selected]:text-primary'
  ].join(' '),
  multiSelectPanel: [
    '[&_.p-multiselect-option>.p-checkbox]:!hidden [&_.p-multiselect-option>p-checkbox]:!hidden',
    '[&_.p-multiselect-option]:gap-0 [&_.p-multiselect-option]:text-body-sm',
    '[&_.p-multiselect-option]:px-2.5 [&_.p-multiselect-option]:py-1.5',
    '[&_.p-multiselect-option.p-multiselect-option-selected]:bg-primary/10',
    '[&_.p-multiselect-option.p-multiselect-option-selected]:text-primary',
    '[&_.p-multiselect-option[data-p-highlight=true]]:bg-primary/10',
    '[&_.p-multiselect-option[data-p-highlight=true]]:text-primary'
  ].join(' '),
  treeMultiSelect: [
    'w-full text-body-sm',
    'min-h-[2.375rem]',
    '[&_.p-multiselect-label-container]:flex [&_.p-multiselect-label-container]:min-h-[calc(2.375rem-2px)]',
    '[&_.p-multiselect-label-container]:flex-wrap [&_.p-multiselect-label-container]:items-center [&_.p-multiselect-label-container]:gap-1',
    '[&_.p-multiselect-label-container]:py-1 [&_.p-multiselect-label-container]:pl-2',
    '[&_.p-multiselect-label]:flex [&_.p-multiselect-label]:min-h-[calc(2.375rem-2px)]',
    '[&_.p-multiselect-label]:flex-wrap [&_.p-multiselect-label]:items-center [&_.p-multiselect-label]:gap-1',
    '[&_.p-multiselect-dropdown]:w-8 [&_.p-multiselect-dropdown]:self-start [&_.p-multiselect-dropdown]:mt-2',
    '[&_.p-multiselect-chip-item]:inline-flex',
    '[&_.p-multiselect-chip]:rounded-md [&_.p-multiselect-chip]:border [&_.p-multiselect-chip]:border-border',
    '[&_.p-multiselect-chip]:bg-surface [&_.p-multiselect-chip]:text-caption [&_.p-multiselect-chip]:text-foreground',
    '[&_.p-multiselect-chip-icon]:text-subtle [&_.p-multiselect-chip-icon]:hover:text-foreground'
  ].join(' '),
  treeMultiSelectPanel: [
    '[&_.p-multiselect-option>.p-checkbox]:!hidden [&_.p-multiselect-option>p-checkbox]:!hidden',
    '[&_.p-multiselect-option]:gap-0 [&_.p-multiselect-option]:text-body-sm',
    '[&_.p-multiselect-option]:px-2.5 [&_.p-multiselect-option]:py-1.5',
    '[&_.p-multiselect-option.p-multiselect-option-selected]:bg-primary/10',
    '[&_.p-multiselect-option.p-multiselect-option-selected]:text-primary',
    '[&_.p-multiselect-option[data-p-highlight=true]]:bg-primary/10',
    '[&_.p-multiselect-option[data-p-highlight=true]]:text-primary',
    '[&_.p-multiselect-option-group]:px-2.5 [&_.p-multiselect-option-group]:pt-2',
    '[&_.p-multiselect-option-group-label]:text-xs [&_.p-multiselect-option-group-label]:font-semibold',
    '[&_.p-multiselect-option-group-label]:uppercase [&_.p-multiselect-option-group-label]:text-subtle'
  ].join(' '),
  oafAccordion: [
    '[&_.p-accordionpanel]:overflow-hidden [&_.p-accordionpanel]:rounded-md',
    '[&_.p-accordionpanel]:border [&_.p-accordionpanel]:border-border',
    '[&_.p-accordionheader]:flex [&_.p-accordionheader]:h-[2.375rem]',
    '[&_.p-accordionheader]:min-h-[2.375rem] [&_.p-accordionheader]:items-center',
    '[&_.p-accordionheader]:px-3 [&_.p-accordionheader]:text-body-sm',
    '[&_.p-accordionheader]:font-medium [&_.p-accordionheader]:leading-5'
  ].join(' '),
  /** Legacy bootstrap `.alert-warning` / `.premium-fields-note` palette. */
  premierNoteAccordion: [
    '[&_.p-accordionpanel]:overflow-hidden [&_.p-accordionpanel]:rounded',
    '[&_.p-accordionpanel]:border [&_.p-accordionpanel]:border-[#faebcc]',
    '[&_.p-accordionpanel]:!bg-[#fcf8e3]',
    '[&_.p-accordionpanel[data-p-active="true"]_.p-accordionheader]:border-b',
    '[&_.p-accordionpanel[data-p-active="true"]_.p-accordionheader]:border-[#faebcc]',
    '[&_.p-accordionpanel:not([data-p-active="true"])_.p-accordionheader]:!border-b-0',
    '[&_.p-accordionpanel:not([data-p-active="true"])_.p-accordionheader]:rounded-b',
    '[&_.p-accordionheader]:!bg-[#fcf8e3] [&_.p-accordionheader]:px-3',
    '[&_.p-accordionheader]:py-2 [&_.p-accordionheader]:text-body-sm',
    '[&_.p-accordionheader]:font-semibold [&_.p-accordionheader]:!text-[#8a6d3b]',
    '[&_.p-accordionheader_.p-accordionheader-toggle-icon]:!text-[#8a6d3b]',
    '[&_.p-accordioncontent]:!bg-[#fcf8e3] [&_.p-accordioncontent]:px-3',
    '[&_.p-accordioncontent[data-p-active="true"]]:pt-3 [&_.p-accordioncontent[data-p-active="true"]]:pb-4',
    '[&_.p-accordioncontent]:!text-[#8a6d3b]',
    '[&_.p-accordioncontent:not([data-p-active="true"])]:!h-0',
    '[&_.p-accordioncontent:not([data-p-active="true"])]:!min-h-0',
    '[&_.p-accordioncontent:not([data-p-active="true"])]:!overflow-hidden',
    '[&_.p-accordioncontent:not([data-p-active="true"])]:!p-0',
    '[&_.p-accordioncontent:not([data-p-active="true"])]:!m-0',
    '[&_.p-accordioncontent:not([data-p-active="true"])_.p-motion]:!hidden',
    '[&_[class*="accordioncontent-content-wrapper"]]:!bg-[#fcf8e3]',
    '[&_[class*="accordioncontent-content"]]:!bg-[#fcf8e3]',
    '[&_[class*="accordioncontent-content"]]:!p-0',
    '[&_[class*="accordioncontent-content"]]:!text-[#8a6d3b]',
    '[&_[class*="accordioncontent-content"]]:!shadow-none'
  ].join(' '),
  /** Legacy bootstrap `.alert-danger` palette — single solid fill avoids nested tint blocks. */
  dangerNoteAccordion: [
    '[&_.p-accordionpanel]:overflow-hidden [&_.p-accordionpanel]:rounded',
    '[&_.p-accordionpanel]:border [&_.p-accordionpanel]:border-[#ebccd1]',
    '[&_.p-accordionpanel]:!bg-[#f2dede]',
    '[&_.p-accordionpanel[data-p-active="true"]_.p-accordionheader]:border-b',
    '[&_.p-accordionpanel[data-p-active="true"]_.p-accordionheader]:border-[#ebccd1]',
    '[&_.p-accordionpanel:not([data-p-active="true"])_.p-accordionheader]:!border-b-0',
    '[&_.p-accordionpanel:not([data-p-active="true"])_.p-accordionheader]:rounded-b',
    '[&_.p-accordionheader]:!bg-[#f2dede] [&_.p-accordionheader]:px-3',
    '[&_.p-accordionheader]:py-2 [&_.p-accordionheader]:text-body-sm',
    '[&_.p-accordionheader]:font-semibold [&_.p-accordionheader]:!text-[#a94442]',
    '[&_.p-accordionheader_.p-accordionheader-toggle-icon]:!text-[#a94442]',
    '[&_.p-accordioncontent]:!bg-[#f2dede] [&_.p-accordioncontent]:px-3',
    '[&_.p-accordioncontent[data-p-active="true"]]:pt-3 [&_.p-accordioncontent[data-p-active="true"]]:pb-4',
    '[&_.p-accordioncontent]:!text-[#a94442]',
    '[&_.p-accordioncontent:not([data-p-active="true"])]:!h-0',
    '[&_.p-accordioncontent:not([data-p-active="true"])]:!min-h-0',
    '[&_.p-accordioncontent:not([data-p-active="true"])]:!overflow-hidden',
    '[&_.p-accordioncontent:not([data-p-active="true"])]:!p-0',
    '[&_.p-accordioncontent:not([data-p-active="true"])]:!m-0',
    '[&_.p-accordioncontent:not([data-p-active="true"])_.p-motion]:!hidden',
    '[&_[class*="accordioncontent-content-wrapper"]]:!bg-[#f2dede]',
    '[&_[class*="accordioncontent-content"]]:!bg-[#f2dede]',
    '[&_[class*="accordioncontent-content"]]:!p-0',
    '[&_[class*="accordioncontent-content"]]:!text-[#a94442]',
    '[&_[class*="accordioncontent-content"]]:!shadow-none'
  ].join(' ')
} as const;
