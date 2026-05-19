import { httpMsBussines } from "@/infra/api/builderHttp";
import type { IBusinessCrudRepository } from "@/core/domain/interfaces/business/IBusinessCrudRepository";
import type { BusinessPage, BusinessPageableQuery } from "@/core/types/BusinessPage";

export class BusinessCrudRepository<T, CreateDto, UpdateDto>
  implements IBusinessCrudRepository<T, CreateDto, UpdateDto>
{
  private readonly basePath: string;
  private readonly byIdFn: (id: string) => string;

  constructor(basePath: string, byId: (id: string) => string) {
    this.basePath = basePath;
    this.byIdFn = byId;
  }

  async getById(id: string): Promise<T> {
    return await httpMsBussines.get<T>(this.byIdFn(id));
  }

  async getAll(pageable: BusinessPageableQuery): Promise<BusinessPage<T>> {
    return await httpMsBussines.get<BusinessPage<T>>(this.basePath, {
      params: pageable,
    });
  }

  async create(data: CreateDto): Promise<T> {
    return await httpMsBussines.post<T>(this.basePath, data);
  }

  async update(id: string, data: UpdateDto): Promise<T> {
    return await httpMsBussines.patch<T>(this.byIdFn(id), data);
  }

  async delete(id: string): Promise<void> {
    await httpMsBussines.delete(this.byIdFn(id));
  }
}
