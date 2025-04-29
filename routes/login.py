from flask import Blueprint, render_template, redirect, jsonify

bp = Blueprint('login', __name__)


@bp.route('/login')
def login():
    return render_template("login.html")

