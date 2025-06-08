from flask import Blueprint, render_template, jsonify, session
from conexion import conectar
from datetime import datetime
import logging

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


        if not solicitud:
            return jsonify({'success': False, 'message': 'Solicitud no encontrada'})

        # Validar que se obtuvieron 45 columnas
        if len(solicitud) != 45:
            return jsonify({
                'success': False,
                'error': f"Error: Se esperaban 45 columnas, se obtuvieron {len(solicitud)}"
            }), 500

        # Eliminar el 'id' de la solicitud para tener solo 42 datos
        datos = solicitud[1:]  # Excluye el 'id', ya que es el primer elemento (índice 0)

        # Preparar valores para clientes (43 + 2 = 45)
        valores = datos + (
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),  # fecha_aprobacion (columna 44)
            'activo'  # estado (columna 45)
        )

        print(datos)  # Debugging: Verifica la longitud de los valores para asegurarte de que sea 45

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
                prestamos_activos, banco, firma_digital, fecha_aprobacion, estado
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s
            )
        ''', valores)

        # Eliminar la solicitud de la base de datos
        cursor.execute('DELETE FROM solicitudes WHERE id = %s', (id,))

        conn.commit()
        return jsonify({'success': True, 'message': 'Solicitud aprobada y datos insertados en clientes'})

    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)})
    finally:
        conn.close()
