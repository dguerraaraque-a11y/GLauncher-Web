import customtkinter as ctk
from datetime import datetime
from tkinter import filedialog
import pyperclip

# --- Configuración de Estilo Neón ---
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("dark-blue")

NEON_BLUE = "#00ffff"
NEON_PINK = "#ff00ff"
NEON_GREEN = "#39ff14"
MAIN_BG = "#0d1117"
SECONDARY_BG = "#161b22"
TEXT_LIGHT = "#f0f8ff"
TEXT_DARK = "#8b949e"

app = ctk.CTk()
app.title("GLauncher News Creator")
app.geometry("850x750")
app.configure(fg_color=MAIN_BG)

# --- Funciones del Asistente y Ayuda ---
def show_help_window():
    help_win = ctk.CTkToplevel(app)
    help_win.title("Asistente de Creación de Noticias")
    help_win.geometry("600x450")
    help_win.transient(app) # Mantener por encima de la ventana principal
    help_win.configure(fg_color=SECONDARY_BG)

    help_text = """
    **Asistente del Creador de Noticias de GLauncher**

    Esta herramienta te ayuda a generar el código HTML para una nueva noticia en tu sitio web.

    **Pestaña 'Contenido':**
    - **Título:** El titular principal de tu noticia.
    - **Icono (Opcional):** El nombre de un icono de Font Awesome (ej: `fa-rocket`, `fa-gamepad`) que aparecerá antes del título.
    - **Resumen:** El cuerpo del texto de la noticia.

    **Pestaña 'Detalles y Botón':**
    - **Imagen:** Puedes pegar una URL de una imagen o usar "Buscar Archivo" para seleccionar una de tu PC.
    - **Categoría:** Elige si la noticia es 'Oficial' (del launcher) o 'Juego' (de Minecraft). Esto afecta el color de la etiqueta.
    - **Texto del Botón:** El texto que aparecerá en el botón de acción (ej: "Leer Más", "Ver Video").
    - **Link del Botón:** La URL a la que dirigirá el botón.

    **Flujo de Trabajo:**
    1. Rellena todos los campos.
    2. Haz clic en "Generar HTML".
    3. Haz clic en "Copiar al Portapapeles".
    4. Pega el código dentro del `<div class="news-feed">` en tu archivo `noticias.html`.
    """
    
    textbox = ctk.CTkTextbox(help_win, wrap="word", fg_color=MAIN_BG, border_color=NEON_BLUE, border_width=1)
    textbox.pack(expand=True, fill="both", padx=15, pady=15)
    textbox.insert("1.0", help_text)
    textbox.configure(state="disabled") # Hacerlo de solo lectura

# --- Funciones Auxiliares ---
def select_image_file():
    """Abre un diálogo para seleccionar un archivo de imagen local."""
    filepath = filedialog.askopenfilename(
        title="Seleccionar Imagen",
        filetypes=(("Archivos de Imagen", "*.png *.jpg *.jpeg *.gif *.webp"), ("Todos los archivos", "*.*"))
    )
    if filepath:
        entry_image_url.delete(0, "end")
        entry_image_url.insert(0, filepath)
        update_status("Ruta de imagen local seleccionada.", "green")

def copy_to_clipboard():
    """Copia el contenido del cuadro de salida al portapapeles."""
    code = output_textbox.get("1.0", "end-1c")
    if code and "Error" not in code:
        pyperclip.copy(code)
        update_status("¡Copiado al portapapeles!", "green")
    else:
        update_status("Nada que copiar.", "orange")

def clear_fields():
    """Limpia todos los campos de entrada."""
    entry_title.delete(0, "end")
    entry_icon.delete(0, "end")
    entry_summary.delete("1.0", "end")
    entry_image_url.delete(0, "end")
    category_var.set("Oficial")
    entry_button_text.delete(0, "end")
    entry_button_link.delete(0, "end")
    output_textbox.delete("1.0", "end")
    update_status("Campos limpiados. Listo para una nueva noticia.", "default")

def update_status(message, color="default"):
    """Actualiza la barra de estado."""
    colors = {
        "red": "#E95454",
        "green": "#50C878",
        "orange": "#FFA500",
        "default": "#8B949E"
    }
    status_label.configure(text=message, text_color=colors.get(color, colors["default"]))

# --- Función para Generar el HTML ---
def generate_html():
    title = entry_title.get()
    icon = entry_icon.get()
    summary = entry_summary.get("1.0", "end-1c")
    image_url = entry_image_url.get()
    category = category_var.get().lower()
    button_text = entry_button_text.get()
    button_link = entry_button_link.get()

    if not all([title, summary, image_url, button_text, button_link]):
        output_textbox.delete("1.0", "end")
        output_textbox.insert("1.0", "Error: Todos los campos son obligatorios.")
        update_status("Error: Faltan campos obligatorios.", "red")
        return

    current_date = datetime.now().strftime("%d %b %Y").upper()
    icon_html = f'<i class="fas {icon}"></i> ' if icon else ""
    category_color_class = "text-neon-pink" if category == "oficial" else "text-neon-blue"
    button_color_class = "button-pink" if category == "oficial" else "button-blue"

    html_code = f"""
            <!-- Noticia Generada: {current_date} -->
            <div class="news-card" data-category="{category}">
                <img src="{image_url.replace('\\', '/')}" alt="Imagen de la noticia: {title}" class="news-card-image">
                <div class="news-card-content">
                    <div class="news-header">
                        <span class="news-category {category_color_class}">{category.capitalize()}</span>
                        <span class="news-date">{current_date}</span>
                    </div>
                    <h3 class="news-title">{icon_html}{title}</h3>
                    <p class="news-summary">{summary}</p>
                    <a href="{button_link}" target="_blank" class="news-button neon-button-glow {button_color_class}">{button_text}</a>
                </div>
            </div>
"""
    output_textbox.delete("1.0", "end")
    output_textbox.insert("1.0", html_code.strip())
    update_status("¡HTML Generado con éxito!", "green")

# --- Creación de los Widgets de la GUI ---

title_frame = ctk.CTkFrame(app, fg_color="transparent")
title_frame.pack(pady=(10, 0), padx=20, fill="x")

app_title_label = ctk.CTkLabel(title_frame, text="GLauncher News Creator", font=("Consolas", 28, "bold"))
app_title_label.pack(side="left")

help_button = ctk.CTkButton(title_frame, text="?", font=("Consolas", 18, "bold"), width=40, height=40, command=show_help_window, fg_color=SECONDARY_BG, border_color=NEON_BLUE, border_width=1)
help_button.pack(side="right")

main_frame = ctk.CTkFrame(app, fg_color=SECONDARY_BG, border_color=NEON_BLUE, border_width=2)
main_frame.pack(pady=20, padx=20, fill="both", expand=True)

tab_view = ctk.CTkTabview(main_frame, 
                          fg_color=SECONDARY_BG, 
                          segmented_button_selected_color=NEON_PINK,
                          segmented_button_selected_hover_color="#D400D4",
                          segmented_button_unselected_color=MAIN_BG)
tab_view.pack(fill="both", expand=True, padx=10, pady=10)

tab_content = tab_view.add("Contenido")
tab_details = tab_view.add("Detalles y Botón")
tab_content.configure(fg_color=SECONDARY_BG)
tab_details.configure(fg_color=SECONDARY_BG)

# --- Pestaña de Contenido ---
tab_content.grid_columnconfigure(1, weight=1)

ctk.CTkLabel(tab_content, text="Título:", text_color=TEXT_LIGHT).grid(row=0, column=0, padx=10, pady=10, sticky="w")
entry_title = ctk.CTkEntry(tab_content, placeholder_text="¡Nueva Actualización Disponible!", border_color=TEXT_DARK, fg_color=MAIN_BG)
entry_title.grid(row=0, column=1, padx=10, pady=10, sticky="ew")

ctk.CTkLabel(tab_content, text="Icono (Opcional):", text_color=TEXT_LIGHT).grid(row=1, column=0, padx=10, pady=10, sticky="w")
entry_icon = ctk.CTkEntry(tab_content, placeholder_text="Ej: fa-rocket (Clase de Font Awesome)", border_color=TEXT_DARK, fg_color=MAIN_BG)
entry_icon.grid(row=1, column=1, padx=10, pady=10, sticky="ew")

ctk.CTkLabel(tab_content, text="Resumen:", text_color=TEXT_LIGHT).grid(row=2, column=0, padx=10, pady=10, sticky="nw")
entry_summary = ctk.CTkTextbox(tab_content, height=120, border_color=TEXT_DARK, fg_color=MAIN_BG, border_width=1)
entry_summary.grid(row=2, column=1, padx=10, pady=10, sticky="ew")

# --- Pestaña de Detalles y Botón ---
tab_details.grid_columnconfigure(1, weight=1)

ctk.CTkLabel(tab_details, text="Imagen (URL o Local):", text_color=TEXT_LIGHT).grid(row=0, column=0, padx=10, pady=10, sticky="w")
image_frame = ctk.CTkFrame(tab_details, fg_color="transparent")
image_frame.grid(row=0, column=1, padx=10, pady=10, sticky="ew")
image_frame.grid_columnconfigure(0, weight=1)
entry_image_url = ctk.CTkEntry(image_frame, placeholder_text="https://i.imgur.com/... o ruta local", border_color=TEXT_DARK, fg_color=MAIN_BG)
entry_image_url.grid(row=0, column=0, sticky="ew")
browse_button = ctk.CTkButton(image_frame, text="Buscar Archivo", width=120, command=select_image_file, fg_color=NEON_BLUE, text_color=MAIN_BG, hover_color="#00C0C0")
browse_button.grid(row=0, column=1, padx=(10, 0))

ctk.CTkLabel(tab_details, text="Categoría:", text_color=TEXT_LIGHT).grid(row=1, column=0, padx=10, pady=10, sticky="w")
category_var = ctk.StringVar(value="Oficial")
category_menu = ctk.CTkOptionMenu(tab_details, values=["Oficial", "Juego"], variable=category_var, fg_color=NEON_BLUE, button_color=NEON_BLUE, button_hover_color="#00C0C0", dropdown_fg_color=SECONDARY_BG)
category_menu.grid(row=1, column=1, padx=10, pady=10, sticky="w")

ctk.CTkLabel(tab_details, text="Texto del Botón:", text_color=TEXT_LIGHT).grid(row=2, column=0, padx=10, pady=10, sticky="w")
entry_button_text = ctk.CTkEntry(tab_details, placeholder_text="Leer Más", border_color=TEXT_DARK, fg_color=MAIN_BG)
entry_button_text.grid(row=2, column=1, padx=10, pady=10, sticky="ew")

ctk.CTkLabel(tab_details, text="Link del Botón:", text_color=TEXT_LIGHT).grid(row=3, column=0, padx=10, pady=10, sticky="w")
entry_button_link = ctk.CTkEntry(tab_details, placeholder_text="https://...", border_color=TEXT_DARK, fg_color=MAIN_BG)
entry_button_link.grid(row=3, column=1, padx=10, pady=10, sticky="ew")

# --- Botones de Acción ---
action_frame = ctk.CTkFrame(app, fg_color="transparent")
action_frame.pack(pady=10, padx=20, fill="x")
action_frame.grid_columnconfigure((0, 1, 2), weight=1)

generate_button = ctk.CTkButton(action_frame, text="Generar HTML", command=generate_html, height=40, fg_color=NEON_GREEN, text_color=MAIN_BG, hover_color="#33DD14")
generate_button.grid(row=0, column=0, padx=5, sticky="ew")

copy_button = ctk.CTkButton(action_frame, text="Copiar al Portapapeles", command=copy_to_clipboard, height=40, fg_color=NEON_BLUE, text_color=MAIN_BG, hover_color="#00C0C0")
copy_button.grid(row=0, column=1, padx=5, sticky="ew")

clear_button = ctk.CTkButton(action_frame, text="Limpiar Campos", command=clear_fields, height=40, fg_color=NEON_PINK, text_color=MAIN_BG, hover_color="#D400D4")
clear_button.grid(row=0, column=2, padx=5, sticky="ew")

# --- Cuadro de Salida ---
output_frame = ctk.CTkFrame(app, fg_color=SECONDARY_BG, border_color=NEON_BLUE, border_width=1)
output_frame.pack(pady=10, padx=20, fill="both", expand=True)

ctk.CTkLabel(output_frame, text="Código HTML Generado:", text_color=TEXT_LIGHT).pack(pady=(10, 5), padx=10, anchor="w")
output_textbox = ctk.CTkTextbox(output_frame, wrap="word", fg_color=MAIN_BG, border_color=SECONDARY_BG, border_width=1)
output_textbox.pack(pady=10, padx=10, fill="both", expand=True)

# --- Barra de Estado ---
status_label = ctk.CTkLabel(app, text="Listo.", text_color=TEXT_DARK, anchor="w")
status_label.pack(side="bottom", fill="x", padx=20, pady=5)

# --- Animación RGB para el Título ---
rgb_colors = [NEON_BLUE, NEON_GREEN, NEON_PINK]
color_index = 0

def cycle_title_color():
    global color_index
    color_index = (color_index + 1) % len(rgb_colors)
    new_color = rgb_colors[color_index]
    app_title_label.configure(text_color=new_color)
    app.after(1000, cycle_title_color) # Cambia de color cada segundo

# --- Iniciar la Aplicación ---
cycle_title_color()
app.mainloop()