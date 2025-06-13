# filepath: c:\Users\Anyelis\Desktop\Datos Febr 2025\Prestamo web\app.py
from flask import Flask
from routes import home
from routes import formulario
from routes import contrato
from routes import admin
from routes import login
from routes import clientes
from routes import solicitudes
from routes import versiones
from routes import configuracion
from routes import usuario
from extensions import mail  # Importa mail desde extensions.py

app = Flask(__name__)
app.secret_key = "December"

# Configuración de Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587  # Usualmente 587 para TLS
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'prestamosdelgadof@gmail.com'
app.config['MAIL_PASSWORD'] = 'bzyz uzha idyj uuvb'
app.config['MAIL_DEFAULT_SENDER'] = 'prestamosdelgadof@gmail.com'  # Remitente predeterminado

# Inicializar Flask-Mail
mail.init_app(app)

# Registro de Blueprints
app.register_blueprint(home.bp)
app.register_blueprint(formulario.bp)
app.register_blueprint(contrato.bp)
app.register_blueprint(admin.bp)
app.register_blueprint(login.bp)
app.register_blueprint(clientes.bp)
app.register_blueprint(solicitudes.bp)
app.register_blueprint(versiones.bp)
app.register_blueprint(configuracion.bp)
app.register_blueprint(usuario.bp)

if __name__ == "__main__":
    app.run(debug=True)