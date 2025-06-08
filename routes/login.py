from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session
from conexion import conectar  # Conexión a la base de datos
from werkzeug.security import check_password_hash  # Importar check_password_hash      

bp = Blueprint('login', __name__)

@bp.route('/login', methods=['GET'])
def login():
    return render_template("login.html")

@bp.route('/login', methods=['POST'])
def login_post():
    # Obtener los datos del formulario
    username = request.form.get('username')
    password = request.form.get('password')

    # Conectar a la base de datos
    conn = conectar()
    cursor = conn.cursor()

    # Buscar el usuario en la base de datos
    cursor.execute("SELECT * FROM usuarios WHERE username = %s", (username,))
    user = cursor.fetchone()

    # Verificar si el usuario existe y comparar la contraseña con el hash almacenado
    if user and check_password_hash(user[2], password):  # user[2] es la contraseña hasheada
        session['user_id'] = user[0]  # Guarda el ID del usuario en la sesión
        session['username'] = user[1]  # Guarda el nombre de usuario en la sesión
        session['role'] = user[3]  # Guarda el rol del usuario
        session['logged_in'] = True  # Marca como logueado
        return jsonify({'message': 'Inicio de sesión exitoso'}), 200
    else:
        return jsonify({'error': 'Usuario o contraseña incorrectos'}), 400

@bp.route('/logout')
def logout():
    session.clear()  # Limpia la sesión
    return redirect(url_for('login.login'))  # Redirige al login
