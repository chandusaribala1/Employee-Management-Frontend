export interface Employee {
  id: number;
  name: string;
  email: string;
  salary: number;
  departmentId: number | null;
  departmentName: string | null;
}

export interface EmployeeRequest {
  name: string;
  email: string;
  salary: number;
  departmentId: number | null;
}

export interface EmployeeSummary { id: number; name: string; email: string; }
export interface PageResponse<T> {
  content: T[]; page: number; size: number; totalElements: number; totalPages: number;
  last: boolean; sortBy: string; direction: string;
}
