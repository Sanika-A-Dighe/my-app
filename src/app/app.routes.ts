import { Routes } from '@angular/router';
import { CandidatesComponent } from './candidates.component';
import { DashboardComponent } from './dashboard.component';
import { HomeComponent } from './home.component';
import { LoginComponent } from './login.component';
import { ReceiptComponent } from './receipt.component';
import { RegisterComponent } from './register.component';
import { ResultsComponent } from './results.component';
import { SuccessComponent } from './success.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'candidates', component: CandidatesComponent },
  { path: 'results', component: ResultsComponent },
  { path: 'receipt', component: ReceiptComponent },
  { path: 'success', component: SuccessComponent }
];
