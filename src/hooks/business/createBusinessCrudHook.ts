import { useMemo } from "react";
import type { BusinessPage, BusinessPageableQuery } from "@/core/types/BusinessPage";
import { toBusinessPageableQuery } from "@/infra/repository/business/businessPageAdapter";
import { BUSINESS_PAGE_SIZE } from "@/app/components/business/constants";

interface CrudStore<T, CreateDto, UpdateDto> {
  items: T[];
  page: BusinessPage<T> | null;
  loading: boolean;
  error: string | null;
  fetchById: (id: string) => Promise<T>;
  fetchAll: (pageable?: BusinessPageableQuery) => Promise<BusinessPage<T>>;
  create: (data: CreateDto) => Promise<T>;
  update: (id: string, data: UpdateDto) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

export function createBusinessCrudHook<T extends { id: string }, CreateDto, UpdateDto>(
  useStore: () => CrudStore<T, CreateDto, UpdateDto>,
) {
  return function useBusinessCrud() {
    const store = useStore();
    return useMemo(
      () => ({
        items: store.items,
        page: store.page,
        loading: store.loading,
        error: store.error,
        loadItems: (pageIndex = 0, limit = BUSINESS_PAGE_SIZE) =>
          store.fetchAll(toBusinessPageableQuery(pageIndex, limit)),
        getById: store.fetchById,
        addItem: store.create,
        editItem: store.update,
        removeItem: store.remove,
      }),
      [store],
    );
  };
}
