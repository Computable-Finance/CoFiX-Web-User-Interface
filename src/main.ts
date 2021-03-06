import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableAkitaProdMode, persistState } from '@datorama/akita';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

let storage;

if (environment.production) {
  enableProdMode();
  storage = persistState({
    include: ['permissions', 'token-info', 'settings', 'metadata', 'my-tokens'],
  });
} else {
  // pls uncomment the following for debugging
  // storage = persistState();

  // comment this if above codeline is uncommented
  storage = persistState({
    include: ['permissions', 'token-info', 'settings', 'metadata', 'my-tokens'],
  });
}

enableAkitaProdMode();

const providers = [{ provide: 'persistStorage', useValue: storage }];

platformBrowserDynamic(providers)
  .bootstrapModule(AppModule)
  .catch((err) => console.log(err));
