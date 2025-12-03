from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from authlib.integrations.flask_client import OAuth
import bcrypt
from datetime import datetime

# Inicializa la aplicación Flask, especificando que los archivos estáticos (CSS, JS, imágenes)
# se encuentran en la carpeta 'static' y las plantillas en 'templates'.
app = Flask(__name__, static_folder='../static', static_url_path='/static', template_folder='..') # Ruta estática explícita para Vercel
oauth = OAuth(app)

# Clave secreta para manejar sesiones de forma segura. ¡Cámbiala por algo aleatorio y secreto!
app.secret_key = 'tu_clave_secreta_super_aleatoria_aqui'
# Configuración de la base de datos SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///glauncher.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializa SQLAlchemy
db = SQLAlchemy(app)

# --- Modelo de Base de Datos ---
class User(db.Model):
    """Modelo de usuario para la base de datos."""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=True)  # Permite nulos para login social
    security_code = db.Column(db.String(6), nullable=True)   # Permite nulos para login social
    provider = db.Column(db.String(50), nullable=True)       # Ej: 'google', 'microsoft'
    social_id = db.Column(db.String(200), nullable=True, unique=True) # ID del proveedor social
    avatar_url = db.Column(db.String(512), nullable=True)    # URL del avatar del usuario

    def __repr__(self):
        return f'<User {self.username}>'

class ChatMessage(db.Model):
    """Modelo para los mensajes del chat de la radio."""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    content = db.Column(db.String(500), nullable=False)
    message_type = db.Column(db.String(10), nullable=False, default='text') # 'text' o 'gif'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {'id': self.id, 'username': self.username, 'content': self.content, 'type': self.message_type, 'timestamp': self.timestamp.isoformat()}

# --- Configuración de OAuth 2.0 ---

# Configuración para Google (Platzhalter)
oauth.register(
    name='google',
    client_id='71330665801-6joq0752g7hhhp2hmld06hrfg67rhji0.apps.googleusercontent.com',
    client_secret='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',
    access_token_url='https://accounts.google.com/o/oauth2/token',
    access_token_params=None,
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    userinfo_endpoint='https://openidconnect.googleapis.com/v1/userinfo',
    client_kwargs={'scope': 'openid email profile'},
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration'
)

# Configuración para Microsoft con tus credenciales
oauth.register(
    name='microsoft',
    client_id='4f73ba40-20f8-4625-aca8-dc876ae081c7',
    client_secret='dbaef09f-d1c9-41c5-9417-3ec09c99583a', # <-- ¡RECUERDA CAMBIAR ESTO POR UN NUEVO SECRETO!
    authorize_url='https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    access_token_url='https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userinfo_endpoint='https://graph.microsoft.com/v1.0/me',
    client_kwargs={'scope': 'User.Read'},
)


# Definición de las Rutas (URLs)

@app.route('/')
def index():
    """Ruta para la página de Inicio (index.html)."""
    # Flask buscará 'index.html' dentro de la carpeta 'templates/' por defecto.
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Ruta para la página de Login. Maneja tanto la carga de la página (GET) como el envío del formulario (POST)."""
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        user = User.query.filter_by(username=username).first()
        
        # Verificar si el usuario existe y la contraseña es correcta
        if user and bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            # Guardar el nombre de usuario en la sesión para el siguiente paso
            session['username_for_2fa'] = username
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Usuario o contraseña incorrectos.'}), 401

    return render_template('login.html')

@app.route('/verify-code', methods=['POST'])
def verify_code():
    """Ruta para verificar el código de seguridad personal."""
    data = request.get_json()
    code = data.get('code')
    username = session.get('username_for_2fa')

    if not username:
        return jsonify({'success': False, 'message': 'Sesión expirada. Vuelve a intentarlo.'}), 400

    user = User.query.filter_by(username=username).first()
    # Verificar si el código coincide con el guardado para ese usuario
    if user and user.security_code == code:
        session['logged_in'] = True
        session['username'] = username
        session.pop('username_for_2fa', None) # Limpiar el usuario temporal de la sesión
        return jsonify({'success': True, 'redirect_url': url_for('dashboard')})
    else:
        return jsonify({'success': False, 'message': 'Código incorrecto o caducado.'}), 401

@app.route('/register', methods=['GET', 'POST'])
def register():
    """Ruta para la página de Registro (register.html)"""
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        security_code = data.get('security_code')

        if User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'message': 'El nombre de usuario ya existe.'}), 409
        
        # Hashear la contraseña antes de guardarla
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Crear un nuevo usuario y guardarlo en la base de datos
        new_user = User(username=username, password_hash=hashed_password, security_code=security_code)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({'success': True, 'message': '¡Registro exitoso! Ahora puedes iniciar sesión.'})

    return render_template('register.html')

@app.route('/noticias')
def noticias():
    """Ruta para la página de Noticias (noticias.html)"""
    # En el futuro, aquí es donde pasaríamos datos dinámicos a la plantilla
    return render_template('noticias.html')

@app.route('/download')
def download():
    """Ruta para la página de Descargas (download.html)"""
    return render_template('download.html')

@app.route('/radio')
def radio():
    """Ruta para la página de Radio (radio.html)"""
    return render_template('radio.html')

@app.route('/dashboard')
def dashboard():
    """Ruta para la página del Dashboard (dashboard.html)"""
    # Proteger la ruta: si el usuario no está logueado, lo redirige al login.
    if 'logged_in' in session and session['logged_in']:
        # Pasa el nombre de usuario a la plantilla del dashboard
        return render_template('dashboard.html', username=session.get('username'))
    else:
        # Si no está logueado, lo mandamos a la página de login
        return redirect(url_for('login'))

@app.route('/logout')
def logout():
    """Ruta para cerrar la sesión del usuario."""
    # Elimina los datos de la sesión
    session.pop('logged_in', None)
    session.pop('username', None)
    # Redirige a la página de inicio
    return redirect(url_for('index'))

# --- API para Noticias ---
@app.route('/api/news')
def get_news():
    """Endpoint para obtener las noticias de forma dinámica."""
    news_data = [
        {
            "title": "¡La actualización 1.21 \"Tricky Trials\" ya está aquí!",
            "date": "13 JUN 2024",
            "category": "juego",
            "summary": "¡La aventura te espera! Adéntrate en las Cámaras de Desafío, enfréntate a nuevos enemigos como el Breeze y el Bogged, y fabrica la poderosa Maza. Esta actualización está llena de retos y recompensas.",
            "image": "static/noticias/TRICKY_TRIALS.jpg",
            "link": "https://es.minecraft.wiki/w/Tricky_Trials",
            "icon": "fa-dungeon",
            "buttonText": "Leer más"
        },
        {
            "title": "Explora el mundo de \"Trails & Tales\" (1.20)",
            "date": "07 JUN 2023",
            "category": "juego",
            "summary": "La actualización 1.20 trajo la arqueología, los sniffers, camellos, y los hermosos biomas de cerezos. ¡Es hora de crear tus propias historias mientras exploras un mundo más vivo que nunca!",
            "image": "static/noticias/Trails and Tales.jpg",
            "link": "https://minecraft.wiki/w/Trails_%26_Tales",
            "icon": "fa-map-signs",
            "buttonText": "Leer más"
        },
        {
            "title": "¡GLauncher se asocia con TropiRumba!",
            "date": "20 OCT 2025",
            "category": "oficial",
            "summary": "¡Ahora puedes escuchar la mejor música mientras juegas! Nos hemos asociado con la radio TropiRumba Stereo 89.7 FM. Accede directamente desde el botón \"Radio\" en el launcher.",
            "image": "static/images/news/GLauncher_X_TropiRumba.png",
            "link": "radio.html",
            "icon": "fa-broadcast-tower",
            "buttonText": "Escuchar Ahora"
        },
        # Puedes añadir más noticias aquí siguiendo el mismo formato
        # {
        #     "title": "Nueva Característica: Servidores Privados",
        #     "date": "01 NOV 2025",
        #     "category": "oficial",
        #     "summary": "¡Lanzamos la opción de crear y gestionar tus propios servidores privados directamente desde GLauncher!",
        #     "image": "static/images/news/private_servers.png",
        #     "link": "#",
        #     "icon": "fa-server",
        #     "buttonText": "Ver Detalles"
        # }
    ]
    return jsonify(news_data)

# --- API para Información de Usuario ---
@app.route('/api/user_info')
def user_info():
    """Endpoint para obtener la información del usuario logueado."""
    if 'logged_in' in session and session.get('logged_in'):
        user = User.query.filter_by(username=session.get('username')).first()
        if user:
            # Aquí puedes añadir más datos si los necesitas, como el avatar, etc.
            return jsonify({
                'username': user.username, 
                'is_admin': False, # 'is_admin' es un placeholder
                'avatar_url': user.avatar_url
            })
    
    # Si no está logueado o no se encuentra, devuelve un error 401
    return jsonify({'error': 'No autenticado'}), 401

@app.route('/api/chat_messages')
def get_chat_messages():
    """Endpoint para obtener los últimos mensajes del chat."""
    # Obtener el timestamp del último mensaje conocido por el cliente
    since_timestamp_str = request.args.get('since')
    
    query = ChatMessage.query
    
    if since_timestamp_str:
        # Si se proporciona un timestamp, buscar mensajes más nuevos que ese
        try:
            # Asegurarse de que el timestamp del cliente se maneje correctamente
            since_timestamp = datetime.fromisoformat(since_timestamp_str.replace('Z', '+00:00'))
            query = query.filter(ChatMessage.timestamp > since_timestamp)
        except ValueError:
            # Si el formato del timestamp es inválido, devolver un error
            return jsonify({"error": "Formato de fecha inválido"}), 400
    else:
        # Si no se proporciona, obtener los últimos 50 mensajes
        query = query.order_by(ChatMessage.timestamp.desc()).limit(50)

    # Ordenar siempre por fecha ascendente para mostrarlos en orden
    messages = query.order_by(ChatMessage.timestamp.asc()).all()
    
    return jsonify([msg.to_dict() for msg in messages])

@app.route('/api/chat_messages/create', methods=['POST'])
def create_chat_message():
    """Endpoint para crear un nuevo mensaje en el chat."""
    data = request.get_json()
    if not data or not data.get('content'):
        return jsonify({'error': 'El contenido no puede estar vacío'}), 400

    new_message = ChatMessage(
        username=data.get('username', 'Anónimo'),
        content=data.get('content'),
        message_type=data.get('type', 'text')
    )
    db.session.add(new_message)
    db.session.commit()

    return jsonify(new_message.to_dict()), 201

# --- Rutas para OAuth ---

@app.route('/login/google')
def login_google():
    redirect_uri = url_for('auth_google', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@app.route('/login/google/callback')
def auth_google():
    token = oauth.google.authorize_access_token()
    # El endpoint 'userinfo' es estándar para OpenID Connect
    user_info = oauth.google.get('userinfo').json() 

    # El ID único del usuario de Google está en 'sub' (subject)
    social_id = user_info.get('sub')
    avatar = user_info.get('picture') # Obtenemos la URL del avatar
    if not social_id:
        return 'Error: No se pudo obtener el ID de usuario de Google.', 400

    # 1. Buscar si el usuario ya existe por su ID de Google
    user = User.query.filter_by(provider='google', social_id=social_id).first()

    if not user:
        # 2. Si no existe, crear un nuevo usuario
        # Usamos 'name' o 'given_name' para el nombre de usuario
        username = user_info.get('name', user_info.get('given_name', f"user_{social_id[:8]}"))
        # Asegurarse de que el nombre de usuario sea único
        if User.query.filter_by(username=username).first():
            username = f"{username}_{social_id[:4]}"

        new_user = User(username=username, provider='google', social_id=social_id, avatar_url=avatar)
        db.session.add(new_user)
        db.session.commit()
        user = new_user

    # 3. Iniciar sesión para el usuario (existente o nuevo)
    session['logged_in'] = True
    session['username'] = user.username
    return redirect(url_for('dashboard'))

@app.route('/login/microsoft')
def login_microsoft():
    # Esta es la URL que debes registrar en Azure
    redirect_uri = url_for('auth_microsoft', _external=True)
    return oauth.microsoft.authorize_redirect(redirect_uri)

@app.route('/login/microsoft/callback')
def auth_microsoft():
    token = oauth.microsoft.authorize_access_token()
    user_info = oauth.microsoft.get('me').json()
    
    # El ID único del usuario de Microsoft está en 'id'
    social_id = user_info.get('id')
    # Microsoft no proporciona el avatar directamente en este endpoint, se necesitaría otra llamada a Graph API.
    if not social_id:
        return 'Error: No se pudo obtener el ID de usuario de Microsoft.', 400

    # 1. Buscar si el usuario ya existe por su ID de Microsoft
    user = User.query.filter_by(provider='microsoft', social_id=social_id).first()

    if not user:
        # 2. Si no existe, crear un nuevo usuario
        username = user_info.get('displayName', f"user_{social_id[:8]}")
        # Asegurarse de que el nombre de usuario sea único
        if User.query.filter_by(username=username).first():
            username = f"{username}_{social_id[:4]}"

        new_user = User(username=username, provider='microsoft', social_id=social_id)
        db.session.add(new_user)
        db.session.commit()
        user = new_user

    # 3. Iniciar sesión para el usuario (existente o nuevo)
    session['logged_in'] = True
    session['username'] = user.username
    return redirect(url_for('dashboard'))


# Ejecutar la aplicación
if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Crea las tablas si no existen.
    app.run(debug=True, port=5000)