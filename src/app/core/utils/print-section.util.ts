/** Print a section of the page (mirrors legacy utilFactory.printSection). */
export function printSectionElement(root: HTMLElement): void {
  root.classList.add('print-element');
  document.body.classList.add('is-printing');

  const cleanup = (): void => {
    document.body.classList.remove('is-printing');
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);
  window.print();
}
