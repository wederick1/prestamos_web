from flask import Blueprint, render_template, redirect, jsonify

bp = Blueprint('home', __name__)

@bp.route('/')
def inicio():
    return redirect('/home')

@bp.route('/home')
def home():
    return render_template("home.html")



