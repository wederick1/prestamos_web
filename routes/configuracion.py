from flask import Blueprint, render_template
from utils import login_required, requires_role

bp = Blueprint('configuracion', __name__)

@bp.route('/configuracion')
@login_required
@requires_role("admin")
def configuracion():
    return render_template("configuracion.html")
