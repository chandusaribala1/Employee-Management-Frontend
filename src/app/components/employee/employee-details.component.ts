import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Employee } from '../../models/employee.model';
import { EmployeeNamePipe } from '../../pipes/employee-name.pipe';

@Component({
  selector: 'app-employee-details', standalone: true,
  imports: [DecimalPipe, EmployeeNamePipe],
  template: `
    @if (employee) {
      <aside class="detail-card">
        <div><p class="eyebrow">SELECTED EMPLOYEE</p><h3>{{ employee.name | employeeName }}</h3><small>Employee ID: {{ employeeCode() }}</small></div>
        <dl><div><dt>Email</dt><dd>{{ employee.email }}</dd></div><div><dt>Salary</dt><dd>{{ employee.salary | number:'1.2-2' }}</dd></div><div><dt>Department</dt><dd>{{ employee.departmentName || 'Unassigned' }}</dd></div></dl>
        <button type="button" (click)="editRequested.emit(employee)">Edit Employee</button>
      </aside>
    } @else { <aside class="detail-card empty-detail">Select a row to view employee details.</aside> }
  `
})
export class EmployeeDetailsComponent {
  // Receives the row selected in the employee directory for display here.
  @Input() employee: Employee | null = null;

  // Sends the selected employee back to the parent when Edit Employee is clicked.
  @Output() editRequested = new EventEmitter<Employee>();

  // Formats the employee's numeric database ID for display in the details card.
  employeeCode(): string { return `emp-${String(this.employee?.id ?? 0).padStart(4, '0')}`; }
}
