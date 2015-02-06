"""
some handy functions - trig in degrees ("o")
"""
import math

def coso(angle):
    return math.cos(angle*math.pi/180.)

def sino(angle):
    return math.sin(angle*math.pi/180.)

def atan2o(y,x):
    return math.atan2(y,x)*180./math.pi
