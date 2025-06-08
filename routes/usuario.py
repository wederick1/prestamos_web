from flask import Blueprint, render_template, redirect, jsonify, request
from conexion import conectar  # Función para conectar a la base de datos
from werkzeug.security import generate_password_hash  # Importar generate_password_hash
from utils import login_required

bp = Blueprint('usuarios', __name__)

@bp.route('/usuarios')
@login_required
def usuarios():
    try:
        conn = conectar()
        cursor = conn.cursor()
        query = "SELECT id, username, rol FROM usuarios"
        cursor.execute(query)
        usuarios = cursor.fetchall()
        cursor.close()
        conn.close()
        return render_template('usuarios.html', usuarios=usuarios)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/usuarios/verificar')
@login_required
def verificar_usuario():
    username = request.args.get('username')
    if not username:
        return jsonify({'existe': False})
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM usuarios WHERE username = %s", (username,))
        existe = cursor.fetchone() is not None
        return jsonify({'existe': existe})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@bp.route('/usuarios/agregar', methods=['POST'])
@login_required
def agregar_usuario():
    try:
        username = request.form['username']
        password = request.form['password']
        rol = request.form['rol']

        if not username or not password or not rol:
            return jsonify({'success': False, 'message': 'Todos los campos son obligatorios'}), 400

        conn = conectar()
        cursor = conn.cursor()

        # Verificar si el usuario ya existe
        cursor.execute("SELECT id FROM usuarios WHERE username = %s", (username,))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'El nombre de usuario ya está en uso'}), 400

        # Hash de la contraseña
        hashed_password = generate_password_hash(password)  # Generar hash de la contraseña

        # Insertar nuevo usuario con la contraseña hasheada
        query = "INSERT INTO usuarios (username, password, rol) VALUES (%s, %s, %s)"
        cursor.execute(query, (username, hashed_password, rol))  # Guardar el hash de la contraseña
        conn.commit()

        return redirect('/usuarios')  # Redirigir al listado de usuarios
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
