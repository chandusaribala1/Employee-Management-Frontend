import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Department } from '../../models/department.model';
import { Employee } from '../../models/employee.model';
import { DepartmentService } from '../../services/department.service';

@Component({ selector: 'app-department', standalone: true, imports: [FormsModule], templateUrl: './department.component.html' })
export class DepartmentComponent implements OnInit {
  private readonly service = inject(DepartmentService);
  departments: Department[] = []; selected: Department | null = null;
  name = ''; error = ''; notice = '';
  editingDepartmentId: number | null = null; editDepartmentName = '';
  // Runs when the department page opens and fetches the department data.
  ngOnInit(): void { this.load(); }
  // Displays numeric database keys as employee IDs in the interface.
  employeeCode(id: number): string { return `emp-${String(id).padStart(4, '0')}`; }
  load(): void { this.service.list().subscribe({ next: (items: Department[]) => this.departments = items, error: (err: Error) => this.fail(err) }); }
  // Creates a department after the required name has passed browser validation.
  create(): void { this.service.create({ name: this.name.trim() }).subscribe({ next: (item: Department) => { this.notice = `Department ${item.name} created.`; this.error = ''; this.name = ''; this.load(); }, error: (err: Error) => this.fail(err) }); }
  // Selects a department and loads the employees already assigned to it.
  view(department: Department): void { this.openDepartment(department); }
  private openDepartment(department: Department): void { this.selected = department; this.service.employees(department.id).subscribe({ next: (items: Employee[]) => this.employeesForSelected = items, error: (err: Error) => this.fail(err) }); }
  edit(department: Department): void { this.editingDepartmentId = department.id; this.editDepartmentName = department.name; this.error = ''; this.notice = ''; }
  cancelEdit(): void { this.editingDepartmentId = null; this.editDepartmentName = ''; }
  saveEdit(department: Department): void {
    const name = this.editDepartmentName.trim();
    if (!name) { this.error = 'Department name is required.'; this.notice = ''; return; }
    this.service.update(department.id, { name }).subscribe({
      next: (updated) => {
        this.notice = `Department renamed to ${updated.name}.`; this.error = ''; this.cancelEdit();
        if (this.selected?.id === updated.id) this.selected = updated;
        this.load();
        if (this.selected?.id === updated.id) this.openDepartment(updated);
      }, error: (err: Error) => this.fail(err)
    });
  }
  remove(department: Department): void {
    this.service.delete(department.id).subscribe({ next: () => {
      this.notice = `Department ${department.name} deleted. Its employees are now unassigned.`; this.error = '';
      if (this.selected?.id === department.id) { this.selected = null; this.employeesForSelected = []; }
      if (this.editingDepartmentId === department.id) this.cancelEdit();
      this.load();
    }, error: (err: Error) => this.fail(err) });
  }
  employeesForSelected: Employee[] = [];
  // Shows the API failure and clears any previous success message.
  private fail(error: Error): void { this.error = error.message; this.notice = ''; }
}
