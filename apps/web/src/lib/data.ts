// Contenido PROVISIONAL. Lo marcado "ejemplo" o "por confirmar" debe sustituirse por datos reales de Elena.

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
export const INSTAGRAM_URL = "https://www.instagram.com/eleniitaafit";
export const WHATSAPP_URL = "https://wa.me/34600000000?text=Hola%20Elena%2C%20quiero%20informaci%C3%B3n"; // número por confirmar

export const nav = [
  { id: "servicios", label: "Servicios" },
  { id: "metodo", label: "Método" },
  { id: "app", label: "App" },
  { id: "planes", label: "Planes" },
  { id: "galeria", label: "Galería" },
  { id: "faq", label: "Dudas" },
  { id: "contacto", label: "Contacto" },
];

/** Todas las secciones observadas por el menú (las que no están en `nav` no resaltan nada). */
export const spyIds = ["inicio", "por-que", "servicios", "metodo", "app", "planes", "galeria", "sobre-elena", "opiniones", "faq", "contacto"];

export const marquee = ["Entreno personal", "Online", "Nutrición", "Combo", "Constancia", "Seguimiento"];

export const why = [
  { n: "01", title: "Un plan hecho para ti", text: "Rutina y comidas según tu objetivo, tu nivel y tu día a día." },
  { n: "02", title: "Seguimiento real", text: "Peso, medidas y entrenos en la app. Ajusto tu plan con datos, no a ojo." },
  { n: "03", title: "Presencial u online", text: "Entrena conmigo en sala o desde donde estés, con el mismo plan." },
  { n: "04", title: "Nutrición sencilla", text: "Menús y lista de la compra que se pueden cumplir. Sin dietas milagro." },
];

export const services = [
  {
    id: "presencial",
    title: "Entreno personal",
    tag: "En el gym",
    photo: "/photos/trainer.jpg",
    alt: "Entrenador guiando a una mujer en una máquina de remo",
    blurb: "Sesiones en sala con corrección técnica en directo y alguien que marca el ritmo a tu lado.",
    points: ["Sesiones 1:1 o en grupo reducido", "Técnica corregida al momento", "Valoración física inicial", "Rutina a tu medida"],
  },
  {
    id: "online",
    title: "Entreno online",
    tag: "Desde donde estés",
    photo: "/photos/online.jpg",
    alt: "Mujer consultando su móvil en un gimnasio",
    blurb: "Tu rutina y tu progreso en una app. Ajusto tu plan cada semana según tus datos.",
    points: ["Rutina guiada paso a paso", "Vídeos de cada ejercicio", "Seguimiento semanal personalizado", "Contacto directo con Elena"],
  },
  {
    id: "nutricion",
    title: "Nutrición",
    tag: "Tu alimentación",
    photo: null,
    alt: "",
    blurb: "Un plan de comidas realista, con calorías y macros, que puedas cumplir sin pasar hambre ni contar cada gramo.",
    points: ["Plan de comidas a tu medida", "Calorías y macros calculados", "Lista de la compra semanal", "Ajustes según tu progreso"],
  },
  {
    id: "combo",
    title: "Combo completo",
    tag: "Lo más completo",
    photo: "/photos/mirror.jpg",
    alt: "Dos mujeres levantando mancuernas frente al espejo",
    blurb: "Entrenamiento y nutrición en un solo plan, coordinados entre sí y con un único seguimiento.",
    points: ["Entreno + nutrición coordinados", "Un solo plan y un solo seguimiento", "Presencial u online", "Todo en tu app"],
  },
];

export const steps = [
  { n: "01", title: "Cuéntame tu objetivo", text: "Un cuestionario rápido: meta, horarios, lesiones y lo que te gusta comer." },
  { n: "02", title: "Recibe tu plan", text: "Rutina y alimentación diseñadas para ti, listas en tu app." },
  { n: "03", title: "Entrena y registra", text: "Marca series, anota comidas y sube tu peso. Todo en un par de toques." },
  { n: "04", title: "Ajustamos juntas", text: "Reviso tus datos y adapto el plan para que no te estanques." },
];

export const appPoints = [
  { title: "Tu entreno del día", text: "Marca cada serie y usa el temporizador de descanso entre ejercicios." },
  { title: "Comidas y calorías", text: "Tu plan de comidas con calorías y macros. Añade lo que comas fuera de plan." },
  { title: "Progreso a la vista", text: "Registra tu peso y mira tu evolución en una gráfica clara." },
  { title: "Elena te acompaña", text: "Ella ve tu progreso y ajusta tu plan cuando lo necesitas." },
];

/** Instalar la app = añadirla a la pantalla de inicio desde el navegador (PWA), sin tiendas. */
export const installSteps = [
  { os: "Android", how: "En Chrome: menú ⋮ → «Instalar app»." },
  { os: "iPhone", how: "En Safari: botón Compartir → «Añadir a pantalla de inicio»." },
  { os: "Ordenador", how: "En Chrome o Edge: icono de instalar en la barra de direcciones." },
];

export type Plan = {
  name: string;
  price: number;
  unit: string;
  badge?: string;
  features: string[];
  featured?: boolean;
};

/** Precios de EJEMPLO: por confirmar con Elena. */
export const plans: Record<"online" | "presencial" | "nutricion" | "combo", Plan[]> = {
  online: [
    { name: "Esencial", price: 29, unit: "/mes", features: ["Rutina personalizada", "Plan de comidas", "App de seguimiento", "Soporte por email"] },
    {
      name: "Pro",
      price: 59,
      unit: "/mes",
      badge: "Más elegido",
      featured: true,
      features: ["Todo lo de Esencial", "Ajustes semanales", "Contacto directo con Elena", "Revisión de técnica por vídeo", "Lista de la compra"],
    },
    { name: "Trimestral", price: 149, unit: "/3 meses", features: ["Todo lo de Pro", "Ahorro frente al mensual", "Sesión por videollamada", "Prioridad en respuestas"] },
  ],
  presencial: [
    { name: "Bono 4", price: 70, unit: "/mes", features: ["4 sesiones al mes", "Valoración inicial", "Plan de nutrición base"] },
    {
      name: "Bono 8",
      price: 120,
      unit: "/mes",
      badge: "Más elegido",
      featured: true,
      features: ["8 sesiones al mes", "Valoración y medidas", "Plan de nutrición completo", "Acceso a la app", "Contacto directo con Elena"],
    },
    { name: "Híbrido", price: 160, unit: "/mes", features: ["8 sesiones + online", "Ajustes semanales", "App y mensajes sin límite", "Prioridad de agenda"] },
  ],
  nutricion: [
    { name: "Plan base", price: 25, unit: "/mes", features: ["Plan de comidas personalizado", "Calorías y macros", "Lista de la compra", "Soporte por email"] },
    {
      name: "Seguimiento",
      price: 45,
      unit: "/mes",
      badge: "Más elegido",
      featured: true,
      features: ["Todo lo del plan base", "Ajustes semanales", "Contacto directo con Elena", "Revisión de tus registros"],
    },
    { name: "Trimestral", price: 120, unit: "/3 meses", features: ["Todo lo de Seguimiento", "Ahorro frente al mensual", "Videollamada de inicio", "Prioridad en respuestas"] },
  ],
  combo: [
    { name: "Combo online", price: 69, unit: "/mes", features: ["Rutina + plan de comidas", "App de seguimiento", "Ajustes semanales", "Soporte por email"] },
    {
      name: "Combo presencial",
      price: 150,
      unit: "/mes",
      badge: "Más elegido",
      featured: true,
      features: ["8 sesiones al mes", "Plan de nutrición completo", "Valoración y medidas", "Acceso a la app", "Contacto directo con Elena"],
    },
    { name: "Combo total", price: 190, unit: "/mes", features: ["8 sesiones + online", "Nutrición con seguimiento", "Ajustes semanales", "Prioridad de agenda"] },
  ],
};

export const gallery = [
  { src: "/photos/group.jpg", alt: "Grupo de mujeres haciendo sentadillas en un estudio con ventanales", label: "Clases en grupo", cls: "col-span-2 row-span-2" },
  { src: "/photos/legs.jpg", alt: "Piernas de una mujer subiendo en una máquina de cardio", label: "Cardio", cls: "row-span-2" },
  { src: "/photos/mirror.jpg", alt: "Dos mujeres levantando mancuernas frente al espejo", label: "Fuerza", cls: "row-span-2" },
  { src: "/photos/class.jpg", alt: "Mujer sonriendo con una mancuerna en alto durante una clase", label: "Energía", cls: "col-span-2" },
  { src: "/photos/strong.jpg", alt: "Mujer estirando los brazos en un estudio de entrenamiento", label: "Movilidad", cls: "" },
  { src: "/photos/coach.jpg", alt: "Entrenador corrigiendo la postura de una mujer sentada", label: "Técnica", cls: "" },
];

/** Testimonios de EJEMPLO: sustituir por opiniones reales con permiso. */
export const testimonials = [
  { name: "Clienta online", text: "Texto de ejemplo: aquí irá la opinión real de una clienta sobre el plan y la app.", mode: "Online" },
  { name: "Clienta presencial", text: "Texto de ejemplo: aquí irá la opinión real de una clienta sobre las sesiones en sala.", mode: "Presencial" },
  { name: "Clienta híbrida", text: "Texto de ejemplo: aquí irá la opinión real de una clienta sobre combinar ambas modalidades.", mode: "Híbrido" },
];

export const faqs = [
  { q: "¿Necesito experiencia previa?", a: "No. Adapto todo a tu nivel, desde cero hasta avanzado, con explicaciones de cada ejercicio." },
  { q: "¿Puedo entrenar en casa?", a: "Sí. Si eliges online, tu rutina se diseña con el material que tengas: gimnasio, casa o mancuernas." },
  { q: "¿Cómo recibo mi plan?", a: "Rellenas el cuestionario y recibes en tu app la rutina, las comidas y la lista de la compra." },
  { q: "¿Puedo contratar solo nutrición?", a: "Sí. La nutrición se puede contratar sola o combinada con el entrenamiento en el combo completo." },
  { q: "¿Se puede cancelar?", a: "Sí, sin permanencia. Avisas con unos días de antelación y no se renueva." },
  { q: "¿Qué pasa si tengo una lesión?", a: "Me lo cuentas en el cuestionario y adapto los ejercicios. Si hace falta, te recomiendo consultar antes con tu médico." },
];
