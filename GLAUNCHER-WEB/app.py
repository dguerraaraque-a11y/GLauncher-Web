from flask import Flask, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from authlib.integrations.flask_client import OAuth
import bcrypt
from datetime import datetime
import os 
import secrets 
import pusher # Librería para la solución del chat

# --- CONFIGURACIÓN DE REDIRECCIÓN ---
# ¡CRÍTICO! Reemplaza esta URL con la URL de tu Frontend (Netlify/Vercel)
FRONTEND_DASHBOARD_URL = 'https://glauncher.netlify.app/dashboard' 
FRONTEND_LOGIN_URL = 'https://glauncher.netlify.app/login'

# --- INICIALIZACIÓN DE LA APLICACIÓN ---

# Leer la DATABASE_URL de las variables de entorno de Render. 
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///fallback.db')

# Configuración de Pusher (Claves leídas de Render)
pusher_client = pusher.Pusher(
    app_id=os.environ.get('PUSHER_APP_ID', '2087094'),  
    key=os.environ.get('PUSHER_KEY', 'ae6d31e8c0f0e1661afa'),    
    secret=os.environ.get('PUSHER_SECRET', 'd6a2d6afcd17441de572'), 
    cluster=os.environ.get('PUSHER_CLUSTER', 'us2'),    
    ssl=True
)

# Inicialización de Flask: configurado para solo ser API
app = Flask(__name__) 
oauth = OAuth(app)

# Claves y DB
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(16))
# Render requiere 'postgresql' en lugar de 'postgresql://' si usas URL externa
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- MODELOS DE BASE DE DATOS ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=True)  
    security_code = db.Column(db.String(6), nullable=True)   
    provider = db.Column(db.String(50), nullable=True)       
    social_id = db.Column(db.String(200), nullable=True, unique=True)
    avatar_url = db.Column(db.String(512), nullable=True)    

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    content = db.Column(db.String(500), nullable=False)
    message_type = db.Column(db.String(10), nullable=False, default='text') 
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {'id': self.id, 'username': self.username, 'content': self.content, 'type': self.message_type, 'timestamp': self.timestamp.isoformat()}


# --- CONFIGURACIÓN DE OAUTH 2.0 (Usando Variables de Entorno) ---
# Se asume que GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc. están en Render.
oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID', '71330665801-6joq0752g7hhhp2hmld06hrfg67rhji0.apps.googleusercontent.com'),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET', 'GOCSPX-PbP6MmjFDHa3AhpRLF5dmP2atp-'),
    access_token_url='https://accounts.google.com/o/oauth2/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    userinfo_endpoint='https://openidconnect.googleapis.com/v1/userinfo',
    client_kwargs={'scope': 'openid email profile'},
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration'
)

oauth.register(
    name='microsoft',
    client_id=os.environ.get('MICROSOFT_CLIENT_ID', '4f73ba40-20f8-4625-aca8-dc876ae081c7'),
    client_secret=os.environ.get('MICROSOFT_CLIENT_SECRET', 'dbaef09f-d1c9-41c5-9417-3ec09c99583a'), 
    authorize_url='https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    access_token_url='https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userinfo_endpoint='https://graph.microsoft.com/v1.0/me',
    client_kwargs={'scope': 'User.Read'},
)


# --- RUTAS DE LA APLICACIÓN (SOLO LÓGICA Y API) ---

# Ruta de prueba para verificar que el servidor está activo
@app.route('/')
def api_root():
    """Ruta de salud para verificar que el API está en funcionamiento."""
    return jsonify({"status": "API del Backend de GLauncher Activa", "service": "Render"}), 200

# Ruta de registro (sigue siendo API)
@app.route('/register', methods=['POST'])
def register_api():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    security_code = data.get('security_code')
    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'El nombre de usuario ya existe.'}), 409
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    new_user = User(username=username, password_hash=hashed_password, security_code=security_code)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'success': True, 'message': '¡Registro exitoso!'})


# Ruta de login (solo el primer paso de verificación)
@app.route('/login', methods=['POST'])
def login_api():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    if user and bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        session['username_for_2fa'] = username
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Usuario o contraseña incorrectos.'}), 401

# Ruta de verificación de código 2FA (mantiene la sesión en el backend)
@app.route('/verify-code', methods=['POST'])
def verify_code_api():
    data = request.get_json()
    code = data.get('code')
    username = session.get('username_for_2fa')
    if not username:
        return jsonify({'success': False, 'message': 'Sesión expirada.'}), 400
    user = User.query.filter_by(username=username).first()
    if user and user.security_code == code:
        session['logged_in'] = True
        session['username'] = username
        session.pop('username_for_2fa', None) 
        # IMPORTANTE: Ya no redirigimos con url_for, el frontend lo hará.
        return jsonify({'success': True, 'redirect_url': FRONTEND_DASHBOARD_URL})
    else:
        return jsonify({'success': False, 'message': 'Código incorrecto o caducado.'}), 401


@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    session.pop('username_for_2fa', None)
    session.pop('username', None)
    # Redirigir al login del frontend
    return redirect(FRONTEND_LOGIN_URL) 

# --- API para Noticias (Mantenemos el contenido aquí) ---
@app.route('/api/news')
def get_news():
    news_data = [
        {
            "title": "¡La actualización 1.21 \"Tricky Trials\" ya está aquí!",
            "date": "13 JUN 2024",
            "category": "juego",
            "summary": "¡La aventura te espera! Adéntrate en las Cámaras de Desafío, enfréntate a nuevos enemigos como el Breeze y el Bogged, y fabrica la poderosa Maza. Esta actualización está llena de retos y recompensas.",
            "image": "URL_IMAGENES_FRONTEND/TRICKY_TRIALS.jpg", # Nota: Las imágenes deben estar en el frontend
            "link": "https://es.minecraft.wiki/w/Tricky_Trials",
            "icon": "fa-dungeon",
            "buttonText": "Leer más"
        },
        # ... [El resto de las noticias se mantienen] ...
    ]
    return jsonify(news_data)

# --- APIs de Usuario y Chat ---
@app.route('/api/user_info')
def user_info():
    if 'logged_in' in session and session.get('logged_in'):
        user = User.query.filter_by(username=session.get('username')).first()
        if user:
            return jsonify({
                'username': user.username, 
                'is_admin': False, 
                'avatar_url': user.avatar_url
            })
    return jsonify({'error': 'No autenticado'}), 401

@app.route('/api/chat_messages')
def get_chat_messages():
    # ... [Lógica de consulta de mensajes] ...
    query = ChatMessage.query.order_by(ChatMessage.timestamp.desc()).limit(50)
    messages = query.order_by(ChatMessage.timestamp.asc()).all()
    return jsonify([msg.to_dict() for msg in messages])

@app.route('/api/chat_messages/create', methods=['POST'])
def create_chat_message():
    data = request.get_json()
    new_message = ChatMessage(
        username=data.get('username', 'Anónimo'),
        content=data.get('content'),
        message_type=data.get('type', 'text')
    )
    db.session.add(new_message)
    db.session.commit()
    
    # LÓGICA DE PUSHER (Notifica a los clientes)
    try:
        pusher_client.trigger('chat_radio', 'new_message', new_message.to_dict())
    except Exception as e:
        print(f"Error al enviar mensaje por Pusher: {e}") 
        
    return jsonify(new_message.to_dict()), 201

# --- Rutas para OAuth (Google y Microsoft) ---
@app.route('/login/google')
def login_google():
    # Render te dará la URL de tu API. Usa la URL del request para el callback.
    redirect_uri = url_for('auth_google', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@app.route('/login/google/callback')
def auth_google():
    token = oauth.google.authorize_access_token()
    user_info = oauth.google.get('userinfo').json() 
    social_id = user_info.get('sub')
    avatar = user_info.get('picture') 
    
    # [Lógica de creación/búsqueda de usuario omitida por brevedad, es la misma]

    # ... (código que crea el usuario si no existe) ...
    
    # Usar código existente para buscar/crear usuario...
    user = User.query.filter_by(provider='google', social_id=social_id).first()
    if not user:
        username = user_info.get('name', f"user_{social_id[:8]}")
        if User.query.filter_by(username=username).first():
            username = f"{username}_{social_id[:4]}"
        new_user = User(username=username, provider='google', social_id=social_id, avatar_url=avatar)
        db.session.add(new_user)
        db.session.commit()
        user = new_user
    
    session['logged_in'] = True
    session['username'] = user.username
    
    # CRÍTICO: Redirige al dashboard del FRONTEND
    return redirect(FRONTEND_DASHBOARD_URL)


@app.route('/login/microsoft')
def login_microsoft():
    redirect_uri = url_for('auth_microsoft', _external=True)
    return oauth.microsoft.authorize_redirect(redirect_uri)

@app.route('/login/microsoft/callback')
def auth_microsoft():
    token = oauth.microsoft.authorize_access_token()
    user_info = oauth.microsoft.get('me').json()
    social_id = user_info.get('id')
    
    # ... (código que crea el usuario si no existe) ...
    
    user = User.query.filter_by(provider='microsoft', social_id=social_id).first()
    if not user:
        username = user_info.get('displayName', f"user_{social_id[:8]}")
        if User.query.filter_by(username=username).first():
            username = f"{username}_{social_id[:4]}"
        new_user = User(username=username, provider='microsoft', social_id=social_id)
        db.session.add(new_user)
        db.session.commit()
        user = new_user

    session['logged_in'] = True
    session['username'] = user.username
    # CRÍTICO: Redirige al dashboard del FRONTEND
    return redirect(FRONTEND_DASHBOARD_URL)


# Vercel ejecutaba esto, en Render no es necesario si usas gunicorn.
# with app.app_context():
#     db.create_all()

# NOTA: En Render, la aplicación se ejecuta con el Procfile, no con if __name__ == '__main__':