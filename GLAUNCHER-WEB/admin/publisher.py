import os
import subprocess
import sys
import tkinter as tk
from tkinter import scrolledtext, messagebox, simpledialog
import threading
import webbrowser

class GitPublisher(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("🚀 Publicador de GLauncher")
        self.geometry("800x600")
        self.configure(bg="#0d1117")

        self.setup_styles()
        self.create_widgets()

        self.check_git_repo()

    def setup_styles(self):
        self.style = {
            "bg": "#0d1117",
            "fg": "#f0f8ff",
            "widget_bg": "#161b22",
            "border": "#ff00ff",
            "button_bg": "#00ffff",
            "button_fg": "#0d1117",
            "button_active_bg": "#ff00ff",
            "font_main": ("Consolas", 10),
            "font_title": ("Consolas", 14, "bold")
        }

    def create_widgets(self):
        main_frame = tk.Frame(self, bg=self.style["bg"], padx=15, pady=15)
        main_frame.pack(fill=tk.BOTH, expand=True)
        main_frame.grid_columnconfigure(0, weight=1)
        main_frame.grid_rowconfigure(2, weight=1)

        title_label = tk.Label(main_frame, text="Publicador GLauncher para GitHub", font=self.style["font_title"], bg=self.style["bg"], fg=self.style["border"])
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 10))

        # --- Columna Izquierda: Controles y Archivos ---
        left_frame = tk.Frame(main_frame, bg=self.style["bg"])
        left_frame.grid(row=1, column=0, rowspan=2, sticky="nsew", padx=(0, 10))
        left_frame.grid_rowconfigure(2, weight=1)

        # --- Controles de Archivos ---
        files_header_frame = tk.Frame(left_frame, bg=self.style["bg"])
        files_header_frame.grid(row=0, column=0, sticky="ew", pady=(10, 5))
        
        tk.Label(files_header_frame, text="Archivos Modificados:", font=self.style["font_main"], bg=self.style["bg"], fg=self.style["fg"]).pack(side=tk.LEFT)
        self.refresh_button = tk.Button(files_header_frame, text="Refrescar", font=("Consolas", 8), bg=self.style["widget_bg"], fg=self.style["fg"], command=self.populate_changed_files, relief="flat")
        self.refresh_button.pack(side=tk.RIGHT)

        # --- Lista de Archivos ---
        self.files_frame = tk.Frame(left_frame, bg=self.style["widget_bg"], borderwidth=1, relief="solid")
        self.files_frame.grid(row=1, column=0, sticky="nsew")
        
        canvas = tk.Canvas(self.files_frame, bg=self.style["widget_bg"], highlightthickness=0)
        scrollbar = tk.Scrollbar(self.files_frame, orient="vertical", command=canvas.yview)
        self.scrollable_frame = tk.Frame(canvas, bg=self.style["widget_bg"])

        self.scrollable_frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        self.file_vars = {}

        # --- Botones de Staging ---
        staging_buttons_frame = tk.Frame(left_frame, bg=self.style["bg"])
        staging_buttons_frame.grid(row=2, column=0, sticky="ew", pady=5)
        tk.Button(staging_buttons_frame, text="Preparar todo", font=("Consolas", 8), command=lambda: self.toggle_all_files(True)).pack(side=tk.LEFT, expand=True, fill=tk.X)
        tk.Button(staging_buttons_frame, text="Limpiar selección", font=("Consolas", 8), command=lambda: self.toggle_all_files(False)).pack(side=tk.LEFT, expand=True, fill=tk.X)

        # --- Columna Derecha: Commit y Consola ---
        right_frame = tk.Frame(main_frame, bg=self.style["bg"])
        right_frame.grid(row=1, column=1, rowspan=2, sticky="nsew")
        right_frame.grid_rowconfigure(3, weight=1)

        tk.Label(right_frame, text="📝 Mensaje para el commit:", font=self.style["font_main"], bg=self.style["bg"], fg=self.style["fg"]).grid(row=0, column=0, sticky="w")
        self.commit_message_entry = tk.Text(right_frame, bg=self.style["widget_bg"], fg=self.style["fg"], insertbackground=self.style["fg"], borderwidth=1, relief="solid", height=3, font=self.style["font_main"])
        self.commit_message_entry.grid(row=1, column=0, sticky="ew", pady=5)

        self.publish_button = tk.Button(main_frame, text="☁️ Publicar Cambios", font=self.style["font_main"], bg=self.style["button_bg"], fg=self.style["button_fg"], activebackground=self.style["button_active_bg"], command=self.start_publish_thread, relief="flat", borderwidth=0, padx=10, pady=5)
        self.publish_button.grid(row=3, column=1, sticky="ew", pady=10)

        # --- Controles de la Consola ---
        console_header_frame = tk.Frame(right_frame, bg=self.style["bg"])
        console_header_frame.grid(row=2, column=0, sticky="ew", pady=(10,5))
        tk.Label(console_header_frame, text="Consola de Salida:", font=self.style["font_main"], bg=self.style["bg"], fg=self.style["fg"]).pack(side=tk.LEFT)
        tk.Button(console_header_frame, text="Copiar", font=("Consolas", 8), command=self.copy_log).pack(side=tk.RIGHT, padx=(0, 5))
        tk.Button(console_header_frame, text="Limpiar", font=("Consolas", 8), command=self.clear_log).pack(side=tk.RIGHT, padx=(0, 5))
        self.open_repo_button = tk.Button(console_header_frame, text="Abrir Repo", font=("Consolas", 8), command=self.open_repo_url, state=tk.DISABLED)
        self.open_repo_button.pack(side=tk.RIGHT)

        self.console_output = scrolledtext.ScrolledText(main_frame, height=10, bg=self.style["widget_bg"], fg=self.style["fg"], font=self.style["font_main"], relief="solid", borderwidth=1)
        self.console_output.grid(row=4, column=1, sticky="nsew")
        self.console_output.configure(state='disabled')

    def log_to_console(self, message):
        self.console_output.configure(state='normal')
        self.console_output.insert(tk.END, message + "\n")
        self.console_output.see(tk.END) # Auto-scroll
        self.console_output.configure(state='disabled')
        self.update_idletasks()

    def run_command(self, command):
        """Ejecuta un comando y opcionalmente redirige su salida a la consola."""
        self.log_to_console(f"▶️ > {command}")
        try:
            process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8', errors='ignore')
            stdout, stderr = process.communicate()
            
            if stdout:
                self.log_to_console(stdout)
            if stderr:
                self.log_to_console(f"ERROR: {stderr}")

            if process.returncode != 0:
                raise subprocess.CalledProcessError(process.returncode, command)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            self.log_to_console(f"❌ El comando falló con código de salida {e.returncode}")
            return False

    def copy_log(self):
        """Copia el contenido de la consola al portapapeles."""
        self.clipboard_clear()
        self.clipboard_append(self.console_output.get("1.0", tk.END))
        self.log_to_console("✅ Log copiado al portapapeles.")
        messagebox.showinfo("Copiado", "El contenido de la consola se ha copiado.")

    def clear_log(self):
        """Limpia la consola de salida."""
        self.console_output.configure(state='normal')
        self.console_output.delete('1.0', tk.END)
        self.console_output.configure(state='disabled')

    def get_git_status(self):
        """Obtiene y parsea el estado de los archivos de Git."""
        try:
            result = subprocess.run("git status --porcelain", shell=True, check=True, text=True, capture_output=True, encoding='utf-8')
            files = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    # La salida de --porcelain es "XY PATH". El número de espacios puede variar.
                    # Este método es más robusto que cortar por un índice fijo.
                    status = line[:2]
                    path_part = line[3:].strip() # Usamos strip() para eliminar espacios al inicio/final
                    
                    # Manejar archivos renombrados (ej: 'R  viejo.txt -> nuevo.txt')
                    if ' -> ' in path_part:
                        path = path_part.split(' -> ')[1]
                    else:
                        path = path_part

                    files.append({'status': status.strip(), 'path': path})
            return files
        except subprocess.CalledProcessError:
            return []

    def populate_changed_files(self):
        """Rellena la lista de archivos modificados en la GUI."""
        for widget in self.scrollable_frame.winfo_children():
            widget.destroy()
        
        self.file_vars = {}
        changed_files = self.get_git_status()

        if not changed_files:
            tk.Label(self.scrollable_frame, text="✅ No hay cambios detectados. ¡Todo al día!", bg=self.style["widget_bg"], fg=self.style["fg"]).pack(padx=10, pady=10)
            return

        for file_info in changed_files:
            var = tk.BooleanVar(value=True)
            self.file_vars[file_info['path']] = var
            
            file_entry_frame = tk.Frame(self.scrollable_frame, bg=self.style["widget_bg"])
            chk = tk.Checkbutton(file_entry_frame, variable=var, bg=self.style["widget_bg"], activebackground=self.style["widget_bg"], highlightthickness=0, selectcolor=self.style["widget_bg"])
            chk.pack(side=tk.LEFT)
            
            status_color = "#ffab70" if file_info['status'] == 'M' else "#70d6ff" if file_info['status'] == '??' else "#ff70a6"
            tk.Label(file_entry_frame, text=f"[{file_info['status']}]", fg=status_color, bg=self.style["widget_bg"]).pack(side=tk.LEFT)
            tk.Label(file_entry_frame, text=file_info['path'], fg=self.style["fg"], bg=self.style["widget_bg"], anchor="w").pack(side=tk.LEFT, fill=tk.X, expand=True)
            file_entry_frame.pack(fill=tk.X, padx=5)

    def check_git_repo(self):
        """Comprueba si existe un repositorio Git y lo configura si es necesario."""
        if not os.path.exists('.git'):
            self.log_to_console("ℹ️ Directorio .git no encontrado. Se necesita configuración inicial.")
            self.publish_button.config(state=tk.DISABLED)
            
            if messagebox.askyesno("Configuración Inicial", "No se encontró un repositorio Git. ¿Deseas configurar uno ahora?"):
                if messagebox.askyesno("Recomendación de SSH", "Se recomienda usar una URL SSH (ej: git@github.com:...) para no tener que escribir tu contraseña. ¿Quieres abrir una guía para configurar claves SSH?", parent=self):
                    webbrowser.open("https://docs.github.com/es/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account")

                remote_url = simpledialog.askstring("URL del Repositorio", "Pega la URL de tu repositorio remoto de GitHub:", parent=self)
                if remote_url:
                    self.initial_setup(remote_url)
                else:
                    self.log_to_console("❌ Configuración cancelada.")
                    self.destroy()
            else:
                self.destroy()
        else:
            # Si .git existe, verificar que el remoto 'origin' también exista.
            try:
                subprocess.run("git config --get remote.origin.url", shell=True, check=True, capture_output=True)
                self.log_to_console("✅ Repositorio Git y remoto 'origin' encontrados.")
                self.open_repo_button.config(state=tk.NORMAL)
                self.populate_changed_files()
            except subprocess.CalledProcessError:
                # El remoto no está configurado.
                self.log_to_console("❌ Error: El repositorio local existe, pero no tiene una URL remota ('origin') configurada.")
                if messagebox.askyesno("Reparar Repositorio", "El repositorio local no está conectado a GitHub. ¿Quieres conectarlo ahora?"):
                    remote_url = simpledialog.askstring("URL del Repositorio", "Pega la URL de tu repositorio remoto de GitHub:", parent=self)
                    if remote_url:
                        self.run_command(f'git remote add origin "{remote_url}"')
                        self.log_to_console("✅ Conexión con GitHub reparada. Ya puedes publicar tus cambios.")
                        self.open_repo_button.config(state=tk.NORMAL)
                        self.populate_changed_files()
                    else:
                        self.destroy()
                else:
                    self.destroy()

    def initial_setup(self, remote_url):
        """Realiza la configuración inicial del repositorio Git."""
        def setup_thread():
            if not self.run_command("git init"): return
            if not self.run_command(f'git remote add origin "{remote_url}"'): return
            if not self.run_command("git add ."): return
            if not self.run_command('git commit -m "Initial commit: Proyecto GLauncher"'): return
            if not self.run_command("git branch -M main"): return
            self.log_to_console("\nSubiendo el proyecto a GitHub por primera vez...")
            if self.run_command("git push -u origin main"):
                self.log_to_console("\n¡Configuración inicial completada y proyecto subido!")
                messagebox.showinfo("Éxito", "✅ El repositorio se ha configurado y subido a GitHub correctamente.")
                self.after(0, self.populate_changed_files)
                self.open_repo_button.config(state=tk.NORMAL)
                self.publish_button.config(state=tk.NORMAL)
            else:
                messagebox.showerror("Error", "Falló la subida inicial. Revisa la consola para más detalles.")
        
        threading.Thread(target=setup_thread, daemon=True).start()

    def start_publish_thread(self):
        """Inicia el proceso de publicación en un hilo separado para no bloquear la GUI."""
        commit_message = self.commit_message_entry.get("1.0", tk.END).strip()
        if not commit_message:
            messagebox.showwarning("Advertencia", "El mensaje del commit no puede estar vacío.")
            return

        self.publish_button.config(state=tk.DISABLED, text="Publicando...")
        
        thread = threading.Thread(target=self.publish_changes, args=(commit_message,), daemon=True)
        thread.start()

    def publish_changes(self, commit_message):
        """Función que ejecuta los comandos de Git."""
        try:
            self.log_to_console("\n" + "="*20)
            self.log_to_console("🚀 Iniciando publicación...")

            # 1. Preparar (stage) los archivos seleccionados
            staged_files = [path for path, var in self.file_vars.items() if var.get()]
            if not staged_files:
                raise Exception("❌ No hay archivos seleccionados para publicar.")

            self.log_to_console("📦 Preparando archivos seleccionados...")
            # Añadir archivos uno por uno para mayor robustez y mejor registro de errores.
            for file_path in staged_files:
                # Las comillas dobles protegen las rutas con espacios.
                if not self.run_command(f'git add -A -- "{file_path}"'):
                    raise Exception(f"❌ Fallo al preparar el archivo: {file_path}")

            # 2. Hacer commit
            self.log_to_console("📝 Creando commit...")
            # Usamos subprocess.run para capturar la salida de forma diferente
            commit_process = subprocess.run(f'git commit -m "{commit_message}"', shell=True, text=True, capture_output=True, encoding='utf-8')
            self.log_to_console(commit_process.stdout)
            if commit_process.stderr:
                self.log_to_console(commit_process.stderr)
            
            if commit_process.returncode != 0:
                if "nothing to commit" in commit_process.stdout:
                    self.log_to_console("ℹ️ No había nuevos cambios que commitear. Sincronizando con el remoto...")
                else:
                    raise Exception("❌ Fallo al hacer commit.")

            # 3. Hacer push
            self.log_to_console("☁️ Subiendo cambios a GitHub...")
            if not self.run_command("git push origin main"):
                raise Exception("❌ Fallo al subir los cambios (git push).")

            self.log_to_console("\n✅ ¡Cambios subidos a GitHub con éxito!")
            messagebox.showinfo("Éxito", "✅ Los cambios se han publicado en GitHub correctamente.")

        except Exception as e:
            self.log_to_console(f"ERROR DURANTE LA PUBLICACIÓN: {e}")
            messagebox.showerror("Error de Publicación", str(e))
        finally:
            # Reactivar el botón en el hilo principal de la GUI
            self.after(0, self.reset_ui_after_publish)

    def reset_ui_after_publish(self):
        self.publish_button.config(state=tk.NORMAL, text="☁️ Publicar Cambios")
        self.populate_changed_files()

    def toggle_all_files(self, select):
        """Selecciona o deselecciona todos los checkboxes de archivos."""
        for var in self.file_vars.values():
            var.set(select)

    def open_repo_url(self):
        """Abre la URL del repositorio remoto en el navegador."""
        try:
            result = subprocess.run("git config --get remote.origin.url", shell=True, check=True, text=True, capture_output=True)
            url = result.stdout.strip()
            if url.startswith("git@"): # Convertir URL SSH a HTTPS
                url = url.replace(":", "/").replace("git@", "https://")
            if url.endswith(".git"):
                url = url[:-4]
            webbrowser.open(url)
        except subprocess.CalledProcessError:
            messagebox.showerror("Error", "No se pudo obtener la URL del repositorio remoto.")

if __name__ == "__main__":
    try:
        app = GitPublisher()
        app.mainloop()
    except Exception as e:
        messagebox.showerror("Error Crítico", f"Ocurrió un error al iniciar la aplicación:\n{e}")