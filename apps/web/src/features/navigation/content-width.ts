/**
 * The app's content width, in one place so a page cannot widen its body and
 * leave the header behind it.
 *
 * Search opts into the wide one. It spends 240px of every row on the filter
 * rail, so at the standard width its three kos cards come out a third narrower
 * than the same card anywhere else in the app.
 */
export const contentWidth = "max-w-7xl";

export const wideContentWidth = "max-w-[97.5rem]";

export function widthClass(wide: boolean | undefined): string {
  return wide ? wideContentWidth : contentWidth;
}
