import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { AdminComponent } from './admin.component';
import { CandidatesComponent } from './candidates.component';
import { DashboardComponent } from './dashboard.component';
import { HomeComponent } from './home.component';
import { LoginComponent } from './login.component';
import { ReceiptComponent } from './receipt.component';
import { RegisterComponent } from './register.component';
import { ResultsComponent } from './results.component';
import { SuccessComponent } from './success.component';
import { VoterCardComponent } from './voter-card.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'candidates', component: CandidatesComponent, canActivate: [authGuard] },
  { path: 'results', component: ResultsComponent, canActivate: [authGuard] },
  { path: 'receipt', component: ReceiptComponent, canActivate: [authGuard] },
  { path: 'success', component: SuccessComponent, canActivate: [authGuard] },
  { path: 'voter-card', component: VoterCardComponent, canActivate: [authGuard] }
];
