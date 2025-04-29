from flask import Blueprint, render_template, jsonify
from conexion import conectar  # Asegúrate de tener el archivo de conexión a MariaDB

bp = Blueprint('clientes', __name__)

@bp.route('/clientes')
def clientes():
    # Conectar a la base de datos
    conn = conectar()
    cursor = conn.cursor()

    # Obtener todos los clientes desde la base de datos
    cursor.execute('''
        SELECT id, nombre_solicitante AS nombre, correo AS email, telefono_solicitante AS telefono, cedula
        FROM clientes
    ''')

    # Obtener los resultados y convertirlos en un formato adecuado para la plantilla
    columnas = [desc[0] for desc in cursor.description]
    clientes = [dict(zip(columnas, fila)) for fila in cursor.fetchall()]

    conn.close()

    # Renderizar la plantilla con los datos de los clientes
    return render_template("clientes.html", clientes=clientes)

@bp.route('/api/clientes')
def api_clientes():
    # Conectar a la base de datos
    conn = conectar()
    cursor = conn.cursor()

    # Obtener todos los clientes desde la base de datos
    cursor.execute('''
        SELECT id, nombre_solicitante AS nombre, correo AS email, telefono_solicitante AS telefono, cedula
        FROM clientes
    ''')

    columnas = [desc[0] for desc in cursor.description]
    clientes = [dict(zip(columnas, fila)) for fila in cursor.fetchall()]

    conn.close()

    return jsonify(clientes)

@bp.route('/api/clientes/<int:id>')
def obtener_cliente(id):
    conn = conectar()
    cursor = conn.cursor()

    try:
        cursor.execute('''
            SELECT 
                id, nombre_solicitante AS nombre, correo AS email, telefono_solicitante AS telefono,
                cedula, direccion_solicitante AS direccion, lugar_trabajo, ingresos_mensuales, monto_solicitado, fecha_solicitud
            FROM clientes
            WHERE id = %s
        ''', (id,))
        cliente = cursor.fetchone()

        if not cliente:
            return jsonify({'error': 'Cliente no encontrado'}), 404

        columnas = [desc[0] for desc in cursor.description]
        return jsonify(dict(zip(columnas, cliente)))

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()
    

def contar_clientes():
    # Conectar a la base de datos
    conn = conectar()
    cursor = conn.cursor()

    # Contar el número de clientes
    cursor.execute('SELECT COUNT(*) FROM clientes')
    total_clientes = cursor.fetchone()[0]

    conn.close()

    return total_clientes
