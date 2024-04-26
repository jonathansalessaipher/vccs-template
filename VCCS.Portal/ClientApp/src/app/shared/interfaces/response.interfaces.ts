export interface IResponse<Type> {
  success: boolean;
  data?: Type;
  errors?: string[];
}
