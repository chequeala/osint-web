// Solo lo que usa la barra de navegación para cerrar el menú móvil
declare module 'bootstrap' {
  export class Collapse {
    static getInstance(element: Element): Collapse | null;
    hide(): void;
  }
}
