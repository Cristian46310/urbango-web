import type { BusinessPage, BusinessTablePagination, PaginationMeta } from "@/core/types/BusinessPage";

const MAX_PAGE_LIMIT = 100;

export function toBusinessPageableQuery(pageIndex: number, limit: number) {
  return { page: pageIndex + 1, limit: Math.min(limit, MAX_PAGE_LIMIT) };
}

export function toTablePagination(meta: PaginationMeta | null | undefined): BusinessTablePagination {
  if (!meta) {
    return { pageIndex: 0, pageCount: 1, totalItems: 0 };
  }
  return {
    pageIndex: meta.page - 1,
    pageCount: meta.totalPages,
    totalItems: meta.totalItems,
  };
}

export function getItemsFromPage<T>(page: BusinessPage<T> | null | undefined): T[] {
  return page?.items ?? [];
}
