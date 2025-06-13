from flask import Blueprint, render_template, jsonify, session
from conexion import conectar
from datetime import datetime
import logging
import mariadb

bp = Blueprint('solicitudes', __name__)
logger = logging.getLogger(__name__)

@bp.route('/solicitudes')
def solicitudes():
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT 
            s.id,
            s.nombre_solicitante AS nombre,
            s.correo AS email,
            s.telefono_solicitante AS telefono,
            s.monto_solicitado AS monto
        FROM solicitudes s
    ''')
    
    columnas = [desc[0] for desc in cursor.description]
    datos = [dict(zip(columnas, fila)) for fila in cursor.fetchall()]

    conn.close()

    session['solicitudes'] = datos  # opcional
    return render_template("solicitudes.html", solicitudes=datos)

@bp.route('/api/solicitudes')
def api_clientes():
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT 
            s.id,
            s.nombre_solicitante AS nombre,
            s.correo AS email,
            s.telefono_solicitante AS telefono,
            s.monto_solicitado AS monto
        FROM solicitudes s
    ''')

    columnas = [desc[0] for desc in cursor.description]
    datos = [dict(zip(columnas, fila)) for fila in cursor.fetchall()]

    conn.close()
    return jsonify(datos)

def obtener_solicitudes():
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT 
            s.id,
            s.nombre_solicitante AS nombre,
            s.correo AS email,
            s.telefono_solicitante AS telefono,
            s.monto_solicitado AS monto
        FROM solicitudes s
    ''')

    columnas = [desc[0] for desc in cursor.description]
    datos = [dict(zip(columnas, fila)) for fila in cursor.fetchall()]

    conn.close()
    return datos

@bp.route('/aprobar_solicitud/<int:id>', methods=['POST'])
def aprobar_solicitud(id):
    try:
        conn = conectar()
        cursor = conn.cursor()

        # Obtener los datos de la solicitud (sin incluir el 'id')
        cursor.execute('SELECT * FROM solicitudes WHERE id = %s', (id,))
        solicitud = cursor.fetchone()
        print(f"Solicitud obtenida: {len(solicitud)}")  # Debugging line


        if not solicitud:
            return jsonify({'success': False, 'message': 'Solicitud no encontrada'})

        # Validar que se obtuvieron 47 columnas
        if len(solicitud) != 47:
            return jsonify({
                'success': False,
                'error': f"Error: Se esperaban 47 columnas, se obtuvieron {len(solicitud)}"
            }), 500

        # Eliminar el 'id' de la solicitud para tener solo 46 datos
        datos = solicitud[1:]  # Excluye el 'id', ya que es el primer elemento (índice 0)

        # Preparar valores para clientes (46 + 2 = 48)
        valores = datos + (
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),  # fecha_aprobacion (columna 47)
            'activo'  # estado (columna 48)
        )


        print(f"Datos sin ID: {datos}")
        print(f"Fecha aprobación: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Total de valores: {len(valores)}")

        # Insertar en clientes (45 columnas explícitas)
        cursor.execute('''
            INSERT INTO clientes (
                fecha_solicitud, nombre_solicitante, telefono_solicitante, 
                whatsapp, tiempo_vivienda, lugar_trabajo, tipo_vivienda, 
                correo, ocupacion, cedula, tiempo_empresa, otros_ingresos, estado_civil,
                celular_conyuge, trabajo_conyuge, dependientes, direccion_solicitante,
                lugar_vivienda, ubicacion_trabajo, telefono_trabajo, pago_renta,
                gastos_mensuales, horario_trabajo, ingresos_mensuales, garantia, total_ingresos,
                conyuge, direccion_trabajo_conyuge, telefono_trabajo_conyuge,
                monto_solicitado, ref_personal1_nombre, ref_personal2_nombre,
                ref_personal1_telefono, ref_personal2_telefono, ref_familiar1_nombre,
                ref_familiar2_nombre, ref_familiar1_telefono, ref_familiar2_telefono,
                ref_comercial_nombre, ref_comercial_telefono, para_que_necesita,
                prestamos_activos, banco, firma_digital, trabajo_coordenadas, casa_coordenadas,
                fecha_aprobacion, estado
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s
            )
        ''', valores)

        # Eliminar la solicitud de la base de datos
        cursor.execute('DELETE FROM solicitudes WHERE id = %s', (id,))

        conn.commit()
        return jsonify({'success': True, 'message': 'Solicitud aprobada y datos insertados en clientes'})

    except mariadb.IntegrityError as err:
        # Error de integridad (p.ej. duplicados)
        conn.rollback()
        msg = str(err)
        # MariaDB lanza algo como:
        # (1062, "Duplicate entry 'Carolina-402-206-1599-5' for key 'nombre_solicitante'")
        if err.errno == 1062:
            if 'nombre_solicitante' in msg:
                return jsonify({
                    'success': False,
                    'message': 'Cliente ya existente'
                }), 400
            elif 'cedula' in msg:
                return jsonify({
                    'success': False,
                    'message': 'Este documento de identidad ya existe'
                }), 400
        # otro duplicado o integridad distinto
        return jsonify({'success': False, 'message': msg}), 400

    except mariadb.Error as err:
        # Cualquier otro error de MariaDB
        conn.rollback()
        return jsonify({'success': False, 'message': str(err)}), 500

    except Exception as e:
        # Errores inesperados de Python/Flask
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()



@bp.route('/eliminar_solicitud/<int:id>', methods=['DELETE'])
def eliminar_solicitud(id):
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM solicitudes WHERE id = %s", (id,))
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'message': 'Solicitud no encontrada'}), 404
        conn.commit()
        return jsonify({'success': True, 'message': 'Solicitud eliminada correctamente'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
