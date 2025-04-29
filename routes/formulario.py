from flask import Blueprint, render_template, request, jsonify, current_app, render_template_string, url_for
from flask_mail import Message
from weasyprint import HTML
import base64
from extensions import mail
from conexion import conectar
from datetime import datetime 

bp = Blueprint('formulario', __name__)

@bp.route('/formulario', methods=['GET', 'POST'])
def formulario():
    if request.method == 'POST':
        try:
            # Verificar si los datos vienen como JSON
            if not request.is_json:
                return jsonify({'success': False, 'error': 'El contenido no es JSON'}), 415

            datos = request.get_json()
            print(datos)  # Para depuración

            # Validar campos requeridos
            campos_requeridos = ['nombre_solicitante', 'telefono_solicitante', 'correo', 'monto_solicitado', 'firmaDigital']
            for campo in campos_requeridos:
                if campo not in datos or not str(datos[campo]).strip():
                    return jsonify({'success': False, 'error': f'El campo {campo} es obligatorio'}), 400

            # Decodificar la firma digital en Base64
            firma_base64 = datos['firmaDigital']
            if not firma_base64.startswith('data:image/png;base64,'):
                return jsonify({'success': False, 'error': 'Formato de firma inválido'}), 400

            # Eliminar el prefijo "data:image/png;base64," de la cadena Base64
            firma_base64 = firma_base64.split(',')[1]

            # Generar la URL completa del logo
            logo_url = url_for('static', filename='img/logo.jpg', _external=True)

            # Plantilla HTML para el PDF
            pdf_template = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Solicitud de Préstamo</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&display=swap');
                    
                    /* ESTILOS BASE */
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 15px;
                        font-size: 10px;
                        line-height: 1.2;
                    }

                    .documento-container {
                        max-width: 95%;
                        margin: 0 auto;
                        padding: 15px;
                    }

                    /* ENCABEZADO */
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 2px solid #119d85;
                        padding-bottom: 10px;
                        margin-bottom: 15px;
                    }

                    .header h1 {
                        color: #119d85;
                        font-size: 1.8em;
                        margin: 0;
                        text-align: center;
                        flex-grow: 1;
                    }

                    .logo {
                        max-width: 80px;
                        height: auto;
                    }

                    .fecha {
                        font-size: 0.75em;
                        color: #119d85;
                        text-align: right;
                    }

                    /* ESTRUCTURA DE 2 COLUMNAS CORREGIDA */
                    .seccion-info {
                        display: flex;
                        justify-content: space-between;
                        gap: 15px;
                        page-break-inside: avoid;
                        margin: 15px 0;
                        width: 100%;
                        box-sizing: border-box;
                    }

                    .info-prestamo, .info-cliente {
                        width: 48%; /* Ajusta según necesidad */
                        padding: 8px;
                        break-inside: avoid;
                        page-break-inside: avoid;
                        flex-shrink: 0; /* Evita que se encojan */
                    }

                    /* CAMPOS DE DATOS */
                    .campo {
                        margin-bottom: 6px;
                        page-break-inside: avoid;
                    }

                    .campo label {
                        display: block;
                        font-weight: bold;
                        color: #444;
                        font-size: 0.9em;
                    }

                    .campo span {
                        display: block;
                        font-size: 0.95em;
                        word-break: break-word;
                        padding: 3px 0;
                    }

                    /* FIRMAS */
                    .firmas {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-top: 25px;
                        padding-top: 15px;
                        border-top: 1px solid #119d85;
                    }

                    .firma-box {
                        text-align: center;
                        padding: 10px 0;
                    }

                    .firma-linea {
                        border-bottom: 1px solid #119d85;
                        width: 80%;
                        margin: 0 auto 8px;
                        height: 40px;
                    }

                    .handwritten-signature {
                        font-family: 'Dancing Script', cursive;
                        font-size: 1.6em;
                        color: #1a1a1a;
                        margin: 0 auto;
                    }

                    /* TÍTULOS */
                    h2, h3 {
                        color: #119d85;
                        font-size: 1.3em;
                        margin: 10px 0;
                        page-break-after: avoid;
                    }

                    /* AJUSTES ESPECÍFICOS PARA PDF */
                    @page {
                        size: A4;
                        margin: 1cm;
                    }

                    .campo.pareja {
                        background: #f8f8f8;
                        padding: 4px;
                        border-radius: 3px;
                    }
                </style>
            </head>
            <body>
                <div class="documento-container">
                    <div class="header">
                        <img src="{{ logo_url }}" alt="Logo" class="logo">
                        <h1>PRÉSTAMO DELGADO</h1>
                        <div class="fecha">Fecha: {{ datos['fecha_solicitud'] }}</div>
                    </div>

                    <h2>Datos del Solicitante</h2>
                    <div class="seccion-info">
                        <!-- Columna Izquierda -->
                        <div class="info-prestamo">
                            <div class="campo">
                                <label>Nombre del Solicitante:</label>
                                <span>{{ datos['nombre_solicitante'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Teléfono:</label>
                                <span>{{ datos['telefono_solicitante'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Tiene Whatsapp:</label>
                                <span>{{ datos['Whatsapp'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Dirección:</label>
                                <span>{{ datos['direccion_solicitante'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Lugar donde vive:</label>
                                <span>{{ datos['lugar_vivienda'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Tiempo en la vivienda:</label>
                                <span>{{ datos['tiempo_vivienda'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Tipo de vivienda:</label>
                                <span>{{ datos['tipo_vivienda'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Gasto de renta:</label>
                                <span>{{ datos['pago_renta'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Ocupación:</label>
                                <span>{{ datos['ocupacion'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Lugar de trabajo:</label>
                                <span>{{ datos['lugar_trabajo'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Dirección del trabajo:</label>
                                <span>{{ datos['ubicacion_trabajo'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Horario de trabajo:</label>
                                <span>{{ datos['horario_trabajo'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Teléfono trabajo:</label>
                                <span>{{ datos['telefono_trabajo'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Tiempo en la empresa:</label>
                                <span>{{ datos['tiempo_empresa'] }}</span>
                            </div>

                        </div>

                        <!-- Columna Derecha -->
                        <div class="info-cliente">
                            <div class="campo">
                                <label>Correo electrónico:</label>
                                <span>{{ datos['correo'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Cedula:</label>
                                <span>{{ datos['cedula'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Ingresos mensuales:</label>
                                <span>{{ datos['ingresos_mensuales'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Otros ingresos:</label>
                                <span>{{ datos['otros_ingresos'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Gastos mensuales:</label>
                                <span>{{ datos['gastos_mensuales'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Total ingresos:</label>
                                <span>{{ datos['total_ingresos'] }}</span>
                            </div>
                             <div class="campo">
                                <label>Estado civil:</label>
                                <span>{{ datos['estado_civil'] }}</span>
                            </div>
                             <div class="campo">
                                <label>Pareja Nombre:</label>
                                <span>{{ datos['conyuge'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Celular Pareja:</label>
                                <span>{{ datos['celular_conyuge'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Trabajo Pareja:</label>
                                <span>{{ datos['trabajo_conyuge'] }}</span>
                            </div> 
                            <div class="campo">
                                <label>Dirección trabajo Pareja:</label>
                                <span>{{ datos['direccion_trabajo_conyuge'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Teléfono trabajo Pareja:</label>
                                <span>{{ datos['telefono_trabajo_conyuge'] }}</span>
                            </div> 
                            <div class="campo">
                                <label>Dependientes:</label>
                                <span>{{ datos['dependientes'] }}</span>
                            </div> 
                            <div class="campo">
                                <label>Monto Solicitado (RD$):</label>
                                <span>{{ datos['monto_solicitado'] }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Sección de Referencias -->
                    <h3>Referencias Personales</h3>
                    <div class="seccion-info">
                        <div class="info-prestamo">
                            <div class="campo">
                                <label>Nombre 1:</label>
                                <span>{{ datos['nombre_referencia_personal_1'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Teléfono 1:</label>
                                <span>{{ datos['telefono_referencia_personal_1'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Nombre 2:</label>
                                <span>{{ datos['nombre_referencia_personal_2'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Teléfono 2:</label>
                                <span>{{ datos['telefono_referencia_personal_2'] }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Sección de Familiares -->
                    <h3>Referencias Familiares</h3>
                    <div class="seccion-info">
                        <div class="info-prestamo">
                            <div class="campo">
                                <label>Nombre:</label>
                                <span>{{ datos['nombre_referencia_familiar_1'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Teléfono:</label>
                                <span>{{ datos['telefono_referencia_familiar_1'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Nombre:</label>
                                <span>{{ datos['nombre_referencia_familiar_2'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Teléfono:</label>
                                <span>{{ datos['telefono_referencia_familiar_2'] }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Sección de Comerciales -->
                    <h3>Referencias Comerciales</h3>
                    <div class="seccion-info">
                        <div class="info-prestamo">
                            <div class="campo">
                                <label>Nombre:</label>
                                <span>{{ datos['nombre_referencia_comercial'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Teléfono:</label>
                                <span>{{ datos['telefono_referencia_comercial'] }}</span>
                            </div>
                        </div>
                    </div>
                    <!-- Otros datos -->
                    <h3>Otros datos</h3>
                    <div class="seccion-info">
                        <div class="info-prestamo">
                            <div class="campo">
                                <label>¿Para qué lo necesita?</label>
                                <span>{{ datos['para_que_necesita'] }}</span>
                            </div>
                            <div class="campo">
                                <label>Prestamos activos:</label>
                                <span>{{ datos['prestamos_activos'] }}</span>
                            </div>
                            <div class="campo">
                                <label>En que banco:</label>
                                <span>{{ datos['banco'] }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Firmas -->
                    <div class="firmas">
                        <div class="firma-box">
                            <img src="data:image/png;base64,{{ firma }}" alt="Firma" style="height: 50px;">
                            <div class="firma-linea"></div>
                            <p>Firma del Solicitante</p>
                        </div>
                        <div class="firma-box">
                            <div class="handwritten-signature">Elvis Delgado</div>
                            <div class="firma-linea"></div>
                            <p>Firma del Fiador</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """

            # Renderizar la plantilla con los datos
            html = render_template_string(pdf_template, datos=datos, firma=firma_base64, logo_url=logo_url)
            pdf = HTML(string=html).write_pdf()

            # Enviar correo usando Flask-Mail
            msg = Message(
                'Solicitud de Préstamo - Delgado',
                sender='wederick02@gmail.com',
                recipients=['wederick02@gmail.com']
            )
            msg.body = f"""
            Estimado administrador,

            Se ha recibido una nueva solicitud de préstamo. A continuación, los datos del solicitante:

            Nombre: {datos['nombre_solicitante']}
            Correo: {datos['correo']}
            Teléfono: {datos['telefono_solicitante']}

            Adjunto encontrará la solicitud en formato PDF.
            """
            # Adjuntar el PDF generado
            msg.attach('solicitud_prestamo.pdf', 'application/pdf', pdf)

            # Enviar el correo
            mail.send(msg)

            conn = conectar()
            try:
                with conn.cursor() as cursor:
                    # Convertir fecha de dd/mm/yyyy a yyyy-mm-dd
                    fecha_solicitud = datetime.strptime(datos['fecha_solicitud'], "%d/%m/%Y").strftime("%Y-%m-%d")  
                    # Consulta SQL con todos los campos
                    cursor.execute("""
                        INSERT INTO solicitudes (
                            fecha_solicitud,
                            nombre_solicitante,
                            telefono_solicitante,
                            whatsapp,
                            tiempo_vivienda,
                            lugar_trabajo,
                            tipo_vivienda,
                            correo,
                            ocupacion,
                            cedula,
                            tiempo_empresa,
                            otros_ingresos,
                            estado_civil,
                            celular_conyuge,
                            trabajo_conyuge,
                            dependientes,
                            direccion_solicitante,
                            lugar_vivienda,
                            ubicacion_trabajo,
                            telefono_trabajo,
                            pago_renta,
                            gastos_mensuales,
                            horario_trabajo,
                            ingresos_mensuales,
                            total_ingresos,
                            conyuge,
                            direccion_trabajo_conyuge,
                            telefono_trabajo_conyuge,
                            monto_solicitado,
                            ref_personal1_nombre,
                            ref_personal2_nombre,
                            ref_personal1_telefono,
                            ref_personal2_telefono,
                            ref_familiar1_nombre,
                            ref_familiar2_nombre,
                            ref_familiar1_telefono,
                            ref_familiar2_telefono,
                            ref_comercial_nombre,
                            ref_comercial_telefono,
                            para_que_necesita,
                            prestamos_activos,
                            banco,
                            firma_digital
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s
                        )
                    """, (
                        # Asegúrate de que hay 42 valores aquí:
                        fecha_solicitud,
                        datos.get('nombre_solicitante'),
                        datos.get('telefono_solicitante'),
                        datos.get('Whatsapp'),
                        datos.get('tiempo_vivienda'),
                        datos.get('lugar_trabajo'),
                        datos.get('tipo_vivienda'),
                        datos.get('correo'),
                        datos.get('ocupacion'),
                        datos.get('cedula'),
                        datos.get('tiempo_empresa'),
                        float(datos.get('pago_renta') or 0),
                        datos.get('estado_civil'),
                        datos.get('celular_conyuge'),
                        datos.get('trabajo_conyuge'),
                        datos.get('dependientes'),
                        datos.get('direccion_solicitante'),
                        datos.get('lugar_vivienda'),
                        datos.get('ubicacion_trabajo'),
                        datos.get('telefono_trabajo'),
                        float(datos.get('pago_renta') or 0),
                        float(datos.get('pago_renta') or 0),
                        datos.get('horario_trabajo'),
                        float(datos.get('pago_renta') or 0),
                        datos.get('total_ingresos'),
                        datos.get('conyuge'),
                        datos.get('direccion_trabajo_conyuge'),
                        datos.get('telefono_trabajo_conyuge'),
                        float(datos.get('monto_solicitado') or 0),
                        datos.get('nombre_referencia_personal_1'),
                        datos.get('nombre_referencia_personal_2'),
                        datos.get('telefono_referencia_personal_1'),
                        datos.get('telefono_referencia_personal_2'),
                        datos.get('nombre_referencia_familiar_1'),
                        datos.get('nombre_referencia_familiar_2'),
                        datos.get('telefono_referencia_familiar_1'),
                        datos.get('telefono_referencia_familiar_2'),
                        datos.get('nombre_referencia_comercial'),
                        datos.get('telefono_referencia_comercial'),
                        datos.get('para_que_necesita'),
                        datos.get('prestamos_activos'),
                        datos.get('banco'),
                        datos.get('firmaDigital')  # Campo 42
                    ))
                conn.commit()
            finally:
                conn.close()

            return jsonify({'success': True, 'redirect': '/envio'})

        except Exception as e:
            current_app.logger.error(f'Error: {str(e)}')
            return jsonify({'success': False, 'error': str(e)}), 500

    return render_template("formulario.html")

@bp.route('/envio')
def contrato():
    return render_template("envio.html")