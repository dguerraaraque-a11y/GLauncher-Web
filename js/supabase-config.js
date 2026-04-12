// Configuración centralizada de Supabase para GLauncher
const SUPABASE_URL = 'https://ouqpeojilykkrmatijxp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Xq5tXNmuTSSGlry49JEDIQ_pgBxBJoci';

// Inicializar el cliente (Asegúrate de incluir el script de Supabase en tu HTML)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.glauncherSupabase = supabaseClient;