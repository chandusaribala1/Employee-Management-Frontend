import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Employee, EmployeeRequest, PageResponse } from '../../models/employee.model';
import { Department } from '../../models/department.model';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../services/department.service';
import { EmployeeNamePipe } from '../../pipes/employee-name.pipe';
import { EmployeeDetailsComponent } from './employee-details.component';

type EmployeeSortField = 'id' | 'name' | 'email' | 'salary';

@Component({ selector: 'app-employee', standalone: true, imports: [FormsModule, DecimalPipe, EmployeeNamePipe, EmployeeDetailsComponent], templateUrl: './employee.component.html' })
export class EmployeeComponent implements OnInit {
  private readonly service = inject(EmployeeService);
  private readonly departmentService = inject(DepartmentService);
  employees: Employee[] = [];
  private searchResults: Employee[] | null = null;
  departments: Department[] = [];
  selected: Employee | null = null;
  editingId: number | null = null;
  page = 0; size = 10; totalPages = 0; totalElements = 0; sortBy: EmployeeSortField = 'id'; direction: 'asc' | 'desc' = 'asc';
  name = ''; email = ''; salary: number | null = null; departmentId: number | null = null;
  searchDepartment = ''; searchSalary: number | null = null; searchName = ''; rangeMin: number | null = null; rangeMax: number | null = null;
  error = ''; notice = ''; searchError = ''; busy = false; submitted = false;

  // Runs when the employee page is first displayed and fetches its initial data.
  ngOnInit(): void { this.load(); this.loadDepartments(); }

  // Converts the database's numeric key to the employee ID shown in the UI.
  employeeCode(id: number): string { return `emp-${String(id).padStart(4, '0')}`; }

  // Sorts the paginated directory through the backend and keeps active search results visible.
  changeSort(field: EmployeeSortField): void {
    this.direction = this.sortBy === field && this.direction === 'asc' ? 'desc' : 'asc';
    this.sortBy = field;
    this.page = 0;

    if (this.searchResults !== null) {
      this.searchResults = this.sortSearchResults(this.searchResults);
      this.showSearchPage();
      return;
    }

    this.load();
  }

  sortIndicator(field: EmployeeSortField): string {
    if (this.sortBy !== field) return '↕';
    return this.direction === 'asc' ? '↑' : '↓';
  }

  // Checks the requested Gmail address format before sending a create or update request.
  isValidEmail(email: string): boolean { return /^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(email.trim()); }

  // Checks that salary is a finite number greater than zero before accepting the form.
  isValidSalary(): boolean { return this.salary !== null && Number.isFinite(Number(this.salary)) && Number(this.salary) > 0; }

  load(): void {
    this.searchResults = null;
    this.busy = true; this.error = '';
    this.service.list(this.page, this.size, this.sortBy, this.direction).subscribe({
      next: (result: PageResponse<Employee>) => { this.employees = result.content; this.totalPages = result.totalPages; this.totalElements = result.totalElements; this.busy = false; },
      error: (err: Error) => { this.fail(err); this.busy = false; }
    });
  }
  loadDepartments(): void { this.departmentService.list().subscribe({ next: (items: Department[]) => this.departments = items, error: (err: Error) => this.fail(err) }); }
  save(): void {
    // Marks the form as submitted so missing or incorrect values display red messages under their labels.
    this.submitted = true;
    this.error = '';
    this.notice = '';
    // Stops the save when any required employee field is empty or invalid.
    if (!this.name.trim() || !this.email.trim() || !this.isValidEmail(this.email) ||
        this.salary === null || !Number.isFinite(Number(this.salary)) || Number(this.salary) <= 0) return;

    // Builds the API request only after all required fields have passed validation.
    const request: EmployeeRequest = { name: this.name.trim(), email: this.email.trim(), salary: Number(this.salary), departmentId: this.departmentId ? Number(this.departmentId) : null };
    // Uses POST for a new employee and PUT when an existing employee is being edited.
    const call = this.editingId === null ? this.service.create(request) : this.service.update(this.editingId, request);
    // Shows success after the API saves, then reloads both employee and department data.
    call.subscribe({ next: () => { this.notice = this.editingId === null ? 'Employee created.' : 'Employee updated.'; this.resetForm(); this.load(); this.loadDepartments(); }, error: (err: Error) => this.fail(err) });
  }
  edit(employee: Employee): void { this.editingId = employee.id; this.name = employee.name; this.email = employee.email; this.salary = employee.salary; this.departmentId = employee.departmentId; this.selected = employee; this.error = ''; }
  remove(employee: Employee): void {
    this.service.delete(employee.id).subscribe({ next: () => { this.notice = 'Employee deleted.'; if (this.selected?.id === employee.id) this.selected = null; this.load(); this.loadDepartments(); }, error: (err: Error) => this.fail(err) });
  }
  choose(employee: Employee): void { this.selected = employee; }
  changePage(delta: number): void {
    if (this.searchResults !== null) {
      this.page = Math.max(0, Math.min(this.totalPages - 1, this.page + delta));
      this.showSearchPage();
      return;
    }
    this.page = Math.max(0, Math.min(this.totalPages - 1, this.page + delta)); this.load();
  }
  // Applies every populated filter together, returning only employees that match all selected criteria.
  searchEmployees(): void {
    const hasMinimum = this.rangeMin !== null;
    const hasMaximum = this.rangeMax !== null;
    if (hasMinimum !== hasMaximum) { this.searchError = 'Enter both minimum and maximum salary values.'; return; }
    if (hasMinimum && hasMaximum && Number(this.rangeMin) > Number(this.rangeMax)) { this.searchError = 'Minimum salary cannot exceed maximum salary.'; return; }
    if (this.searchSalary !== null && Number(this.searchSalary) <= 0) { this.searchError = 'Salary must be greater than zero.'; return; }
    if (hasMinimum && (Number(this.rangeMin) <= 0 || Number(this.rangeMax) <= 0)) { this.searchError = 'Salary values must be greater than zero.'; return; }

    // Adds one API request for each filter that currently has a value.
    const filters: Observable<Employee[]>[] = [];
    if (this.searchName.trim()) filters.push(this.service.nameContains(this.searchName.trim()));
    if (this.searchDepartment) filters.push(this.service.byDepartment(Number(this.searchDepartment)));
    if (this.searchSalary !== null) filters.push(this.service.salaryAbove(Number(this.searchSalary)));
    if (hasMinimum && hasMaximum) filters.push(this.salaryRangeResults(Number(this.rangeMin), Number(this.rangeMax)));

    // Restores the regular directory when no search filter is active.
    if (filters.length === 0) { this.searchError = ''; this.page = 0; this.load(); return; }

    // Waits for all selected filters, intersects their employee IDs, and sorts results by ID ascending.
    this.busy = true;
    this.searchError = '';
    this.error = '';
    const results = forkJoin(filters) as Observable<Employee[][]>;
    results.subscribe({
      next: (groups) => {
        const matchingIds = groups.slice(1).reduce((ids, group) => {
          const groupIds = new Set(group.map((employee) => employee.id));
          return new Set([...ids].filter((id) => groupIds.has(id)));
        }, new Set(groups[0].map((employee) => employee.id)));
        const matchingEmployees = groups[0].filter((employee) => matchingIds.has(employee.id));
        this.showSearch(this.sortSearchResults(matchingEmployees));
        this.busy = false;
      },
      error: (err: Error) => { this.fail(err); this.busy = false; }
    });
  }

  // Retrieves every page returned by the salary-range API so a range filter does not drop later matches.
  private salaryRangeResults(minimum: number, maximum: number): Observable<Employee[]> {
    return this.service.salaryBetween(minimum, maximum, 0, 100).pipe(switchMap((firstPage) => {
      if (firstPage.totalPages <= 1) return of(firstPage.content);
      const remainingPages = Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
        this.service.salaryBetween(minimum, maximum, index + 1, 100));
      return (forkJoin(remainingPages) as Observable<PageResponse<Employee>[]>).pipe(
        map((pages) => [...firstPage.content, ...pages.flatMap((page) => page.content)])
      );
    }));
  }

  // Clears all selected filters and restores the first page of the full directory.
  clearSearch(): void { this.searchDepartment = ''; this.searchName = ''; this.searchSalary = null; this.rangeMin = null; this.rangeMax = null; this.searchError = ''; this.page = 0; this.load(); }

  // Displays the filtered results and updates the count and pagination state.
  private showSearch(items: Employee[]): void {
    this.searchResults = items;
    this.totalElements = items.length;
    this.totalPages = Math.ceil(items.length / this.size);
    this.page = 0;
    this.error = '';
    this.showSearchPage();
  }
  private showSearchPage(): void {
    if (this.searchResults === null) return;
    const start = this.page * this.size;
    this.employees = this.searchResults.slice(start, start + this.size);
  }
  // Search endpoints return complete filtered lists, so keep their order in the browser.
  private sortSearchResults(items: Employee[]): Employee[] {
    const direction = this.direction === 'asc' ? 1 : -1;
    return [...items].sort((first, second) => {
      if (this.sortBy === 'id' || this.sortBy === 'salary') {
        return (first[this.sortBy] - second[this.sortBy]) * direction;
      }
      return first[this.sortBy].localeCompare(second[this.sortBy]) * direction;
    });
  }
  // Clears the editor and restores Unassigned as the default for the next new record.
  resetForm(): void { this.editingId = null; this.name = ''; this.email = ''; this.salary = null; this.departmentId = null; this.submitted = false; }
  private fail(error: Error): void { this.error = error.message; this.notice = ''; }
}
