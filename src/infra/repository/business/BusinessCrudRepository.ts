import { httpMsBussines } from "@/infra/api/builderHttp";
import type { IBusinessCrudRepository } from "@/core/domain/interfaces/business/IBusinessCrudRepository";
import type { BusinessPage, BusinessPageableQuery } from "@/core/types/BusinessPage";

export class BusinessCrudRepository<T, CreateDto, UpdateDto>
  implements IBusinessCrudRepository<T, CreateDto, UpdateDto>
{
  private readonly basePath: string;
  private readonly byIdFn: (id: string) => string;
  private readonly createPath: string;
  private readonly updateMethod: "patch" | "put";

  constructor(
    basePath: string,
    byId: (id: string) => string,
    createPath = basePath,
    updateMethod: "patch" | "put" = "patch",
  ) {
    this.basePath = basePath;
    this.byIdFn = byId;
    this.createPath = createPath;
    this.updateMethod = updateMethod;
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
    return await httpMsBussines.post<T>(this.createPath, data);
  }

  async update(id: string, data: UpdateDto): Promise<T> {
    if (this.updateMethod === "put") {
      return await httpMsBussines.put<T>(this.byIdFn(id), data);
    }
    return await httpMsBussines.patch<T>(this.byIdFn(id), data);
  }

  async delete(id: string): Promise<void> {
    await httpMsBussines.delete(this.byIdFn(id));
  }
}
