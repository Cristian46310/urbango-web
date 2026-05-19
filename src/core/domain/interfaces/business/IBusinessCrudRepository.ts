import type { BusinessPage, BusinessPageableQuery } from "@/core/types/BusinessPage";

export interface IBusinessCrudRepository<T, CreateDto, UpdateDto> {
  getById(id: string): Promise<T>;
  getAll(pageable: BusinessPageableQuery): Promise<BusinessPage<T>>;
  create(data: CreateDto): Promise<T>;
  update(id: string, data: UpdateDto): Promise<T>;
  delete(id: string): Promise<void>;
}
