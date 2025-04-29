// 项目类型
export interface ProjectDTO {
  id?: string;
  name: string;
  description?: string;
  apiKey?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 语言类型
export interface LocaleDTO {
  id?: string;
  code: string;
  name: string;
  nativeName: string;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  projectId?: string;
}

// 语言类型（别名，兼容旧代码）
export interface LanguageDTO extends LocaleDTO {}

// 命名空间类型
export interface NamespaceDTO {
  id?: string;
  name: string;
  description?: string;
  projectId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 翻译类型
export interface TranslationDTO {
  id?: string;
  key: string;
  value: string;
  locale: string;
  description?: string;
  namespaceId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 翻译请求类型
export interface TranslationRequest {
  key: string;
  value: string;
  locale: string;
  namespace: string;
  description?: string;
}

// 翻译响应类型
export interface TranslationResponse {
  [key: string]: string | TranslationResponse;
}

// 错误响应类型
export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
}

// 成功响应类型
export interface SuccessResponse<T> {
  statusCode: number;
  data: T;
}

// 分页请求类型
export interface PaginationRequest {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// 分页响应类型
export interface PaginationResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
