import { Component } from '@angular/core';
import { EmployeeComponent } from './components/employee/employee.component';
import { DepartmentComponent } from './components/department/department.component';

@Component({ selector: 'app-root', standalone: true, imports: [EmployeeComponent, DepartmentComponent], template: `
  <header class="topbar">
    <button class="secondary back-button" type="button" (click)="goBack()" [disabled]="sectionHistory.length === 0" aria-label="Go to the previous page">← Back</button>
    <a class="brand" href="#" (click)="$event.preventDefault();navigate('employees')"><span class="brand-mark">E</span><span>People<span class="brand-light">Desk</span></span></a><div class="topbar-caption">EMPLOYEE MANAGEMENT</div><span class="topbar-dot"></span>
  </header>
  <main class="shell"><nav class="tabs" aria-label="Management sections"><button [class.active]="section==='employees'" (click)="navigate('employees')">Employees</button><button [class.active]="section==='departments'" (click)="navigate('departments')">Departments</button></nav>@if (section==='employees') { <app-employee/> } @else { <app-department/> }</main>
  <footer>Employee &amp; Department Management <span>•</span> Internal directory</footer>
` })
export class AppComponent {
  // The active tab is the current in-app page.
  section: 'employees' | 'departments' = 'employees';
  // Each section click records the page that was open immediately before it.
  sectionHistory: Array<'employees' | 'departments'> = [];

  // Called by the tabs and brand link to navigate and remember the previous page.
  navigate(next: 'employees' | 'departments'): void {
    if (next === this.section) return;
    this.sectionHistory.push(this.section);
    this.section = next;
  }

  // Called by Back to return to the most recently visited section.
  goBack(): void {
    const previous = this.sectionHistory.pop();
    if (previous) this.section = previous;
  }
}
