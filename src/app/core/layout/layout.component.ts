import { Component } from "@angular/core";
import { DatePipe } from "@angular/common";
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";

@Component({
  selector: "app-layout",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, DatePipe],
  templateUrl: "./layout.component.html",
})
export class LayoutComponent {
  previousPage = "";
  today = new Date();

  constructor(private router: Router) {}

  rememberCurrentPage(): void {
    const currentPage = this.router.url;
    if (currentPage !== "/" && currentPage !== this.previousPage) {
      this.previousPage = currentPage;
    }
  }

  goBack(): void {
    if (this.previousPage) {
      const page = this.previousPage;
      this.previousPage = "";
      this.router.navigateByUrl(page);
    }
  }
}
