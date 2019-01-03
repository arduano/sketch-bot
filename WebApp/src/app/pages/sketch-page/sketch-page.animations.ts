import {
    trigger,
    animate,
    transition,
    style,
    query,
    group,
    state
} from '@angular/animations';
import { delay } from 'rxjs/operators';

export const paletteTransition = trigger('paletteTransition', [
    state('false', style({
        display: 'none',
        opacity: 0,
    })),
    state('true', style({
        display: 'flex',
        opacity: 1,
    })),
    transition('false => true', [
        style({ display: 'flex', opacity: 0 }),
        query('.expand', style({transform: 'scale(0.5)'})),
        group([
            animate('0.1s', style({opacity: 1})),
            query('.expand', animate('0.2s cubic-bezier(0,1.30,.2,1.1)', style({transform: 'scale(1)'})),),
        ])
    ]),
    transition('true => false', [
        animate('0.2s', style({})),
        animate('0.1s', style({opacity: 0})),
        style({ display: 'none', opacity: 0 }),
    ])
])