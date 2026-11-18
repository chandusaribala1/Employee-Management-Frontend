import { Routes } from "@angular/router";
import { LayoutComponent } from "./core/layout/layout.component";

export const appRoutes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        pathMatch: "full",
        redirectTo: "employees"
      },
      {
        path: "employees",
        loadChildren: () =>
          import("./features/employee/employee-routing")
              .then((routes) => routes.employeeRoutes,
          ),
      },
      {
        path: "departments",
        loadChildren: () =>
          import("./features/department/department-routing").then(
            (routes) => routes.departmentRoutes,
          ),
      },
        // wildcard fallback-->type url doesnt match it redirect to the employee page
      {
        path: "**",
        redirectTo: "employees"
      },
    ],
  },
];
