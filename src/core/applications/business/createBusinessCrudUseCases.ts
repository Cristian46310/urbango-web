import type { IBusinessCrudRepository } from "@/core/domain/interfaces/business/IBusinessCrudRepository";
import type { BusinessPage, BusinessPageableQuery } from "@/core/types/BusinessPage";

export function createBusinessCrudUseCases<T, CreateDto, UpdateDto>(
  repository: IBusinessCrudRepository<T, CreateDto, UpdateDto>,
) {
  return {
    getById: (id: string) => repository.getById(id),
    getAll: (pageable: BusinessPageableQuery) => repository.getAll(pageable),
    create: (data: CreateDto) => repository.create(data),
    update: (id: string, data: UpdateDto) => repository.update(id, data),
    delete: (id: string) => repository.delete(id),
  };
}

export interface BusinessCrudUseCases<T, CreateDto, UpdateDto> {
  getById: (id: string) => Promise<T>;
  getAll: (pageable: BusinessPageableQuery) => Promise<BusinessPage<T>>;
  create: (data: CreateDto) => Promise<T>;
  update: (id: string, data: UpdateDto) => Promise<T>;
  delete: (id: string) => Promise<void>;
}
