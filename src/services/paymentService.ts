import { httpMsSecurity } from "@/infra/api/builderHttp";

export interface PaymentMethodItem {
  id: string;
  balance: number;
  type: string;
}

export async function getMyPaymentMethods(): Promise<PaymentMethodItem[]> {
  return httpMsSecurity.get<PaymentMethodItem[]>("/payment-methods/my-methods");
}
