from flask import Blueprint, render_template, request, jsonify, redirect, url_for
import base64
import os
from conexion import conectar  # Asegúrate de tener configurada la conexión a la base de datos

bp = Blueprint('contrato', __name__)

@bp.route('/contrato')
def home():
    return render_template("contrato.html")

@bp.route('/api/firmar', methods=['POST'])
def firmar():
    try:
        # Procesar los datos enviados
        data = request.get_json()
        firma = data.get('firma')
        estado = data.get('estado')
        metodo_pago = data.get('medio_entrega')
        garantia = data.get('garantia')  # Capturar el valor de la garantía
        cliente_id = data.get('cliente_id')

        
        # Validar que los datos requeridos estén presentes
        if not all([firma, estado, metodo_pago, garantia, cliente_id]):
            return jsonify({'success': False, 'error': 'Todos los campos son requeridos'})

        # Convertir cliente_id a entero
        try:
            cliente_id = int(cliente_id)
        except ValueError:
            return jsonify({'success': False, 'error': 'El cliente_id debe ser un número válido'})

        # Conectar a la base de datos
        conn = conectar()
        cursor = conn.cursor()

        # Actualizar los valores en la tabla clientes
        cursor.execute('''
            UPDATE clientes
            SET estado = %s, metodo_pago = %s, garantia = %s, firma_contrato = %s
            WHERE id = %s
        ''', (estado, metodo_pago, garantia, firma, cliente_id))

        # Confirmar los cambios y cerrar la conexión
        conn.commit()
        conn.close()

        # Redirigir a la página de confirmación en el blueprint "formulario"
        return redirect(url_for('formulario.contrato'))

    except Exception as e:
        # Manejar errores y devolver un mensaje de error
        print(f"Error: {e}")
        return jsonify({'success': False, 'error': str(e)})