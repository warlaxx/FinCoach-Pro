import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app/app.routes';
import { jwtInterceptor } from './app/interceptors/jwt.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    // withInterceptors registers the JWT interceptor globally — it runs on every HTTP request
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimations()
  ]
}).catch(err => console.error(err));
