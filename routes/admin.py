from flask import Blueprint, render_template
from .solicitudes import obtener_solicitudes
from .clientes import contar_clientes
from conexion import conectar
from utils import login_required

bp = Blueprint('admin', __name__)

@bp.route('/admin')
@login_required
def admin():
    solicitudes = obtener_solicitudes()
    clientes = contar_clientes()

    conn = conectar()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT s.id, s.nombre_solicitante, s.correo, s.telefono_solicitante, s.monto_solicitado, c.nombre_solicitante AS nombre_cliente
        FROM solicitudes s
        LEFT JOIN clientes c ON s.id = c.id
    ''')

    # ✅ Haz esto antes de cerrar la conexión
    columnas = [desc[0] for desc in cursor.description]
    datos = cursor.fetchall()
    datos_dict = [dict(zip(columnas, fila)) for fila in datos]

    conn.close()

    total_solicitudes = len(solicitudes)
    total_clientes = clientes

    return render_template(
        "admin.html", 
        solicitudes=solicitudes, 
        total_solicitudes=total_solicitudes, 
        clientes=clientes, 
        total_clientes=total_clientes, 
        datos=datos_dict
    )
