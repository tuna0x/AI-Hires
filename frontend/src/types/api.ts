export interface RestResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}
