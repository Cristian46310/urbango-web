export interface BusinessPageableQuery {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BusinessPage<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface BusinessTablePagination {
  pageIndex: number;
  pageCount: number;
  totalItems: number;
}
