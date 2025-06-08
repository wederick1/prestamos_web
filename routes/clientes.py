from flask import Blueprint, render_template, jsonify, request
from conexion import conectar  # Asegúrate de tener el archivo de conexión a MariaDB
from utils import login_required  # Asegúrate de tener el decorador para verificar sesión

bp = Blueprint('clientes', __name__)

@bp.route('/clientes')
@login_required
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
                cedula, direccion_solicitante AS direccion, lugar_trabajo, ingresos_mensuales, monto_solicitado, fecha_solicitud,
                garantia, frecuencia
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


@bp.route('/clientes/<int:id>', methods=['PUT'])
def actualizar_cliente(id):
    data = request.get_json() or {}
    monto = data.get('monto_solicitado')
    frecuencia = data.get('frecuencia')
    apodo = data.get('apodo')  # <-- Extraer 'apodo'
    garantia = data.get('garantia')

    set_clauses = []
    params = []

    if monto is not None:
        set_clauses.append("monto_solicitado = %s")
        params.append(monto)
    if frecuencia is not None:
        set_clauses.append("frecuencia = %s")
        params.append(frecuencia)
    if apodo is not None:
        set_clauses.append("apodo = %s")  # <-- Agregar al UPDATE
        params.append(apodo)
    if garantia is not None:
        set_clauses.append("garantia = %s")  # <-- Agregar al UPDATE
        params.append(garantia)

    if not set_clauses:
        return jsonify({'success': False, 'message': 'No hay campos válidos para actualizar'}), 400

    params.append(id)
    sql = f"UPDATE clientes SET {', '.join(set_clauses)} WHERE id = %s"

    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute(sql, params)
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'message': 'Cliente no encontrado'}), 404
        conn.commit()
        return jsonify({'success': True, 'message': 'Cliente actualizado correctamente'}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        cursor.close()
        conn.close()
